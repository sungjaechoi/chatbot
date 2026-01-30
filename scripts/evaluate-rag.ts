/**
 * RAG 시스템 배치 평가 스크립트 (개선된 버전)
 *
 * 개선 사항:
 * - MRR (Mean Reciprocal Rank) 메트릭 추가
 * - 질문 타입별 분석 지원
 * - best_rank null 체크 개선
 * - 질문 타입별 통계 출력
 *
 * 사용법:
 *   npx tsx scripts/evaluate-rag.ts [test-cases.json] [--output results.json]
 *
 * 예시:
 *   npx tsx scripts/evaluate-rag.ts
 *   npx tsx scripts/evaluate-rag.ts scripts/test-cases.json
 *   npx tsx scripts/evaluate-rag.ts scripts/test-cases.json --output my-results.json
 */

import fs from 'fs';
import path from 'path';

// ============================================================================
// 타입 정의
// ============================================================================

type QuestionType = 'FACT' | 'COMPOSITE' | 'INFERENCE' | 'NOT_IN_DOC' | 'AMBIGUOUS';

interface TestCase {
  pdfId: string;
  question: string;
  expectedAnswer?: string;
  topK?: number;
  questionType?: QuestionType;
}

interface EvaluationResult {
  questionType: QuestionType;
  retrieval: {
    supporting_chunks: Array<{ chunk_id: string; rank: number }>;
    hit_at_k: 0 | 1;
    best_rank: number | null;
  };
  answer: {
    claims: Array<{
      claim: string;
      label: 'supported' | 'unsupported' | 'contradicted';
      evidence_chunk_id: string | null;
    }>;
    scores: {
      correctness: number;
      groundedness: number;
      completeness: number;
    };
  };
  root_cause: 'OK' | 'RETRIEVAL_FAIL' | 'GENERATION_FAIL' | 'BOTH_FAIL';
  fix_suggestions: string[];
}

interface SingleEvaluationResponse {
  question: string;
  answer: string;
  expectedAnswer?: string;
  retrievedChunks: Array<{
    chunkId: string;
    rank: number;
    score: number;
    pageNumber: number;
    fileName: string;
    content: string;
    snippet: string;
  }>;
  sources: Array<{
    pageNumber: number;
    fileName: string;
    snippet: string;
    score?: number;
    chunkId: string;
    rank: number;
  }>;
  evaluation: EvaluationResult;
}

interface QuestionTypeStats {
  count: number;
  okCount: number;
  retrievalFailCount: number;
  generationFailCount: number;
  bothFailCount: number;
  avgCorrectness: number;
  avgGroundedness: number;
  avgCompleteness: number;
}

interface BatchResult {
  timestamp: string;
  totalCases: number;
  successfulCases: number;
  failedCases: number;
  summary: {
    OK: number;
    RETRIEVAL_FAIL: number;
    GENERATION_FAIL: number;
    BOTH_FAIL: number;
  };
  avgScores: {
    correctness: number;
    groundedness: number;
    completeness: number;
  };
  retrievalMetrics: {
    hitAtK: number;
    avgBestRank: number | null;
    mrr: number;
  };
  questionTypeStats: Record<QuestionType, QuestionTypeStats>;
  details: SingleEvaluationResponse[];
  errors: Array<{ testCase: TestCase; error: string }>;
}

// ============================================================================
// 설정
// ============================================================================

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';
const DEFAULT_TEST_CASES_PATH = 'scripts/test-cases.json';

// ============================================================================
// 유틸리티 함수
// ============================================================================

function printHeader() {
  console.log('\n' + '='.repeat(60));
  console.log('  RAG 시스템 배치 평가 (v2.0)');
  console.log('='.repeat(60) + '\n');
}

function printProgress(current: number, total: number, question: string, status?: string) {
  const percent = Math.round((current / total) * 100);
  const truncatedQuestion = question.length > 35 ? question.substring(0, 35) + '...' : question;
  const statusText = status ? ` [${status}]` : '';
  console.log(`[${current}/${total}] (${percent}%) ${truncatedQuestion}${statusText}`);
}

function printSummary(result: BatchResult) {
  console.log('\n' + '='.repeat(60));
  console.log('  평가 결과 요약');
  console.log('='.repeat(60) + '\n');

  console.log(`평가 시간: ${result.timestamp}`);
  console.log(`총 테스트 케이스: ${result.totalCases}`);
  console.log(`  - 성공: ${result.successfulCases}`);
  console.log(`  - 실패 (API 오류): ${result.failedCases}\n`);

  const total = result.successfulCases || 1;
  const { OK, RETRIEVAL_FAIL, GENERATION_FAIL, BOTH_FAIL } = result.summary;

  console.log('근본 원인 분포:');
  console.log(`  OK:              ${OK} (${((OK / total) * 100).toFixed(1)}%) ${'█'.repeat(Math.round((OK / total) * 20))}`);
  console.log(`  RETRIEVAL_FAIL:  ${RETRIEVAL_FAIL} (${((RETRIEVAL_FAIL / total) * 100).toFixed(1)}%) ${'█'.repeat(Math.round((RETRIEVAL_FAIL / total) * 20))}`);
  console.log(`  GENERATION_FAIL: ${GENERATION_FAIL} (${((GENERATION_FAIL / total) * 100).toFixed(1)}%) ${'█'.repeat(Math.round((GENERATION_FAIL / total) * 20))}`);
  console.log(`  BOTH_FAIL:       ${BOTH_FAIL} (${((BOTH_FAIL / total) * 100).toFixed(1)}%) ${'█'.repeat(Math.round((BOTH_FAIL / total) * 20))}`);

  console.log('\n평균 점수 (0-5):');
  console.log(`  Correctness:  ${result.avgScores.correctness.toFixed(2)} / 5.00`);
  console.log(`  Groundedness: ${result.avgScores.groundedness.toFixed(2)} / 5.00`);
  console.log(`  Completeness: ${result.avgScores.completeness.toFixed(2)} / 5.00`);

  console.log('\nRetrieval 메트릭:');
  console.log(`  Hit@K:         ${(result.retrievalMetrics.hitAtK * 100).toFixed(1)}%`);
  console.log(`  Avg Best Rank: ${result.retrievalMetrics.avgBestRank?.toFixed(2) || 'N/A'}`);
  console.log(`  MRR:           ${result.retrievalMetrics.mrr.toFixed(4)}`);
}

function printQuestionTypeStats(result: BatchResult) {
  console.log('\n' + '-'.repeat(60));
  console.log('  질문 타입별 통계');
  console.log('-'.repeat(60) + '\n');

  const types: QuestionType[] = ['FACT', 'COMPOSITE', 'INFERENCE', 'NOT_IN_DOC', 'AMBIGUOUS'];

  for (const type of types) {
    const stats = result.questionTypeStats[type];
    if (stats.count === 0) continue;

    const okRate = ((stats.okCount / stats.count) * 100).toFixed(1);
    console.log(`[${type}] (${stats.count}건)`);
    console.log(`  성공률: ${okRate}% | 정확성: ${stats.avgCorrectness.toFixed(2)} | 근거성: ${stats.avgGroundedness.toFixed(2)} | 완전성: ${stats.avgCompleteness.toFixed(2)}`);
  }
}

function printFailures(result: BatchResult) {
  const failures = result.details.filter((d) => d.evaluation.root_cause !== 'OK');

  console.log('\n' + '-'.repeat(60));
  console.log(`  실패 케이스 분석 (${failures.length}건)`);
  console.log('-'.repeat(60) + '\n');

  if (failures.length === 0) {
    console.log('모든 테스트 케이스가 통과했습니다!\n');
    return;
  }

  // 원인별로 그룹화
  const byRootCause: Record<string, SingleEvaluationResponse[]> = {
    RETRIEVAL_FAIL: [],
    GENERATION_FAIL: [],
    BOTH_FAIL: [],
  };

  failures.forEach((f) => {
    if (f.evaluation.root_cause !== 'OK') {
      byRootCause[f.evaluation.root_cause].push(f);
    }
  });

  for (const [cause, items] of Object.entries(byRootCause)) {
    if (items.length === 0) continue;

    console.log(`\n[${cause}] (${items.length}건)`);
    items.slice(0, 3).forEach((failure, index) => {
      console.log(`  ${index + 1}. Q: ${failure.question.substring(0, 50)}${failure.question.length > 50 ? '...' : ''}`);
      if (failure.evaluation.fix_suggestions.length > 0) {
        console.log(`     제안: ${failure.evaluation.fix_suggestions[0]}`);
      }
    });
    if (items.length > 3) {
      console.log(`  ... 외 ${items.length - 3}건`);
    }
  }
}

function printErrors(result: BatchResult) {
  if (result.errors.length === 0) return;

  console.log('\n' + '-'.repeat(60));
  console.log(`  API 오류 (${result.errors.length}건)`);
  console.log('-'.repeat(60) + '\n');

  result.errors.slice(0, 5).forEach((err, index) => {
    console.log(`  ${index + 1}. Q: ${err.testCase.question.substring(0, 40)}...`);
    console.log(`     오류: ${err.error.substring(0, 80)}`);
  });

  if (result.errors.length > 5) {
    console.log(`  ... 외 ${result.errors.length - 5}건`);
  }
}

// ============================================================================
// 평가 로직
// ============================================================================

async function evaluateSingleCase(testCase: TestCase): Promise<SingleEvaluationResponse> {
  const response = await fetch(`${API_BASE_URL}/api/evaluate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(testCase),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || response.statusText);
  }

  return response.json();
}

function initQuestionTypeStats(): Record<QuestionType, QuestionTypeStats> {
  const types: QuestionType[] = ['FACT', 'COMPOSITE', 'INFERENCE', 'NOT_IN_DOC', 'AMBIGUOUS'];
  const stats: Record<string, QuestionTypeStats> = {};

  for (const type of types) {
    stats[type] = {
      count: 0,
      okCount: 0,
      retrievalFailCount: 0,
      generationFailCount: 0,
      bothFailCount: 0,
      avgCorrectness: 0,
      avgGroundedness: 0,
      avgCompleteness: 0,
    };
  }

  return stats as Record<QuestionType, QuestionTypeStats>;
}

async function runBatchEvaluation(testCases: TestCase[]): Promise<BatchResult> {
  const results: SingleEvaluationResponse[] = [];
  const errors: Array<{ testCase: TestCase; error: string }> = [];
  const summary = { OK: 0, RETRIEVAL_FAIL: 0, GENERATION_FAIL: 0, BOTH_FAIL: 0 };

  let totalCorrectness = 0;
  let totalGroundedness = 0;
  let totalCompleteness = 0;
  let totalHitAtK = 0;

  const bestRanks: number[] = [];
  const reciprocalRanks: number[] = [];

  const questionTypeStats = initQuestionTypeStats();
  const questionTypeScores: Record<QuestionType, { correctness: number; groundedness: number; completeness: number }> = {
    FACT: { correctness: 0, groundedness: 0, completeness: 0 },
    COMPOSITE: { correctness: 0, groundedness: 0, completeness: 0 },
    INFERENCE: { correctness: 0, groundedness: 0, completeness: 0 },
    NOT_IN_DOC: { correctness: 0, groundedness: 0, completeness: 0 },
    AMBIGUOUS: { correctness: 0, groundedness: 0, completeness: 0 },
  };

  for (let i = 0; i < testCases.length; i++) {
    const testCase = testCases[i];

    try {
      const result = await evaluateSingleCase(testCase);
      results.push(result);

      const evaluation = result.evaluation;
      const rootCause = evaluation.root_cause;

      // root_cause 집계
      summary[rootCause]++;

      // 점수 집계
      totalCorrectness += evaluation.answer.scores.correctness;
      totalGroundedness += evaluation.answer.scores.groundedness;
      totalCompleteness += evaluation.answer.scores.completeness;
      totalHitAtK += evaluation.retrieval.hit_at_k;

      // best_rank 집계 (개선된 null 체크)
      const bestRank = evaluation.retrieval.best_rank;
      if (bestRank !== null && bestRank !== undefined) {
        bestRanks.push(bestRank);
        reciprocalRanks.push(1 / bestRank);
      } else {
        reciprocalRanks.push(0);
      }

      // 질문 타입별 집계
      const qType = evaluation.questionType;
      if (qType) {
        questionTypeStats[qType].count++;
        if (rootCause === 'OK') questionTypeStats[qType].okCount++;
        else if (rootCause === 'RETRIEVAL_FAIL') questionTypeStats[qType].retrievalFailCount++;
        else if (rootCause === 'GENERATION_FAIL') questionTypeStats[qType].generationFailCount++;
        else if (rootCause === 'BOTH_FAIL') questionTypeStats[qType].bothFailCount++;

        questionTypeScores[qType].correctness += evaluation.answer.scores.correctness;
        questionTypeScores[qType].groundedness += evaluation.answer.scores.groundedness;
        questionTypeScores[qType].completeness += evaluation.answer.scores.completeness;
      }

      printProgress(i + 1, testCases.length, testCase.question, rootCause);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      errors.push({ testCase, error: errorMessage });
      reciprocalRanks.push(0);
      printProgress(i + 1, testCases.length, testCase.question, 'ERROR');
    }
  }

  // 질문 타입별 평균 점수 계산
  for (const type of Object.keys(questionTypeStats) as QuestionType[]) {
    const count = questionTypeStats[type].count;
    if (count > 0) {
      questionTypeStats[type].avgCorrectness = questionTypeScores[type].correctness / count;
      questionTypeStats[type].avgGroundedness = questionTypeScores[type].groundedness / count;
      questionTypeStats[type].avgCompleteness = questionTypeScores[type].completeness / count;
    }
  }

  const successfulCases = results.length;
  const n = successfulCases || 1;

  return {
    timestamp: new Date().toISOString(),
    totalCases: testCases.length,
    successfulCases,
    failedCases: errors.length,
    summary,
    avgScores: {
      correctness: totalCorrectness / n,
      groundedness: totalGroundedness / n,
      completeness: totalCompleteness / n,
    },
    retrievalMetrics: {
      hitAtK: totalHitAtK / n,
      avgBestRank: bestRanks.length > 0 ? bestRanks.reduce((a, b) => a + b, 0) / bestRanks.length : null,
      mrr: reciprocalRanks.length > 0 ? reciprocalRanks.reduce((a, b) => a + b, 0) / reciprocalRanks.length : 0,
    },
    questionTypeStats,
    details: results,
    errors,
  };
}

// ============================================================================
// 메인 함수
// ============================================================================

async function main() {
  printHeader();

  // 명령줄 인자 파싱
  const args = process.argv.slice(2);
  let testCasesPath = DEFAULT_TEST_CASES_PATH;
  let outputPath: string | null = null;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--output' && args[i + 1]) {
      outputPath = args[i + 1];
      i++;
    } else if (!args[i].startsWith('--')) {
      testCasesPath = args[i];
    }
  }

  // 테스트 케이스 파일 읽기
  const absolutePath = path.isAbsolute(testCasesPath)
    ? testCasesPath
    : path.join(process.cwd(), testCasesPath);

  if (!fs.existsSync(absolutePath)) {
    console.error(`오류: 테스트 케이스 파일을 찾을 수 없습니다: ${absolutePath}`);
    console.log('\n테스트 케이스 파일 예시 (test-cases.json):');
    console.log(
      JSON.stringify(
        [
          {
            pdfId: 'your-pdf-id',
            question: '이 문서의 주요 내용은?',
            expectedAnswer: '예상 답변 (선택)',
            questionType: 'FACT',
          },
        ],
        null,
        2
      )
    );
    process.exit(1);
  }

  const testCases: TestCase[] = JSON.parse(fs.readFileSync(absolutePath, 'utf-8'));

  console.log(`테스트 케이스 파일: ${absolutePath}`);
  console.log(`테스트 케이스 수: ${testCases.length}`);
  console.log(`API 서버: ${API_BASE_URL}\n`);

  // 배치 평가 실행
  const startTime = Date.now();
  const result = await runBatchEvaluation(testCases);
  const elapsedTime = ((Date.now() - startTime) / 1000).toFixed(1);

  // 결과 출력
  printSummary(result);
  printQuestionTypeStats(result);
  printFailures(result);
  printErrors(result);

  console.log('\n' + '='.repeat(60));
  console.log(`  총 소요 시간: ${elapsedTime}초`);
  console.log('='.repeat(60) + '\n');

  // 결과 파일 저장
  const finalOutputPath = outputPath || `evaluation-results-${Date.now()}.json`;
  const absoluteOutputPath = path.isAbsolute(finalOutputPath)
    ? finalOutputPath
    : path.join(process.cwd(), finalOutputPath);

  fs.writeFileSync(absoluteOutputPath, JSON.stringify(result, null, 2));
  console.log(`결과 저장됨: ${absoluteOutputPath}\n`);
}

main().catch((error) => {
  console.error('평가 실행 중 오류:', error);
  process.exit(1);
});
