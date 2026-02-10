-- ============================================================================
-- PDF RAG 챗봇 — Supabase DB 스키마
-- 실행 순서: 위에서 아래로 순차 실행
-- ============================================================================

-- 1. pgvector 확장 활성화
CREATE EXTENSION IF NOT EXISTS vector;

-- ============================================================================
-- 2. profiles 테이블 (auth.users 연계)
-- ============================================================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  display_name TEXT,
  avatar_url TEXT,
  total_credits_used NUMERIC(10, 6) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  deleted_at TIMESTAMPTZ DEFAULT NULL,
  deletion_scheduled_at TIMESTAMPTZ DEFAULT NULL
);

-- 소프트 딜리트를 위한 인덱스 (cleanup_deleted_users() RPC에서 사용)
-- WHERE deletion_scheduled_at <= NOW() 쿼리 성능 최적화
CREATE INDEX IF NOT EXISTS idx_profiles_deletion_scheduled
  ON profiles(deletion_scheduled_at);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- 프로필 자동 생성 트리거
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- ============================================================================
-- 4. chat_sessions 테이블
-- ============================================================================
CREATE TABLE IF NOT EXISTS chat_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  pdf_id TEXT NOT NULL,
  title TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  last_message_at TIMESTAMPTZ DEFAULT now()
);

-- 다중 세션 지원을 위한 인덱스 (UNIQUE 제약 제거됨)
CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_pdf
  ON chat_sessions(user_id, pdf_id);

ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own sessions"
  ON chat_sessions FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- 마이그레이션: 기존 테이블에 다중 세션 지원 추가
-- ============================================================================
-- 기존 DB에 적용할 경우 아래 SQL을 순차 실행:
--
-- ALTER TABLE chat_sessions ADD COLUMN IF NOT EXISTS title TEXT;
-- ALTER TABLE chat_sessions ADD COLUMN IF NOT EXISTS last_message_at TIMESTAMPTZ DEFAULT now();
-- ALTER TABLE chat_sessions DROP CONSTRAINT IF EXISTS chat_sessions_user_id_pdf_id_key;
-- CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_pdf ON chat_sessions(user_id, pdf_id);

-- ============================================================================
-- 5. chat_messages 테이블
-- ============================================================================
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  sources JSONB,
  usage JSONB,
  is_error BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own messages"
  ON chat_messages FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM chat_sessions
      WHERE chat_sessions.id = chat_messages.session_id
        AND chat_sessions.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM chat_sessions
      WHERE chat_sessions.id = chat_messages.session_id
        AND chat_sessions.user_id = auth.uid()
    )
  );

-- ============================================================================
-- 6. pdf_documents 테이블 (벡터 데이터)
-- ============================================================================
CREATE TABLE IF NOT EXISTS pdf_documents (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  pdf_id TEXT NOT NULL,
  file_name TEXT NOT NULL,
  page_number INTEGER NOT NULL,
  content TEXT NOT NULL,
  snippet TEXT,
  embedding vector(3072),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- HNSW 인덱스 (코사인 유사도)
CREATE INDEX IF NOT EXISTS pdf_documents_embedding_idx
  ON pdf_documents
  USING hnsw (embedding vector_cosine_ops);

CREATE INDEX IF NOT EXISTS pdf_documents_pdf_id_idx
  ON pdf_documents (pdf_id);

CREATE INDEX IF NOT EXISTS pdf_documents_user_id_idx
  ON pdf_documents (user_id);

ALTER TABLE pdf_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own pdf documents"
  ON pdf_documents FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- 7. RPC 함수: match_documents (코사인 유사도 검색)
-- ============================================================================
CREATE OR REPLACE FUNCTION match_documents(
  query_embedding vector(3072),
  match_pdf_id TEXT,
  match_count INT DEFAULT 6
)
RETURNS TABLE (
  id TEXT,
  pdf_id TEXT,
  file_name TEXT,
  page_number INTEGER,
  content TEXT,
  snippet TEXT,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    pd.id,
    pd.pdf_id,
    pd.file_name,
    pd.page_number,
    pd.content,
    pd.snippet,
    1 - (pd.embedding <=> query_embedding) AS similarity
  FROM pdf_documents pd
  WHERE pd.pdf_id = match_pdf_id
  ORDER BY pd.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- ============================================================================
-- 8. RPC 함수: get_user_collections (사용자별 PDF 목록 집계)
-- ============================================================================
CREATE OR REPLACE FUNCTION get_user_collections()
RETURNS TABLE (
  pdf_id TEXT,
  file_name TEXT,
  document_count BIGINT,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    pd.pdf_id,
    (array_agg(pd.file_name))[1] AS file_name,
    COUNT(*)::BIGINT AS document_count,
    MIN(pd.created_at) AS created_at
  FROM pdf_documents pd
  WHERE pd.user_id = auth.uid()
  GROUP BY pd.pdf_id
  ORDER BY MIN(pd.created_at) DESC;
END;
$$;

-- ============================================================================
-- 9. Storage 버킷: pdfs
-- ============================================================================
-- Supabase 대시보드에서 생성하거나 아래 SQL 실행:
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('pdfs', 'pdfs', false, 10485760)  -- 10MB
ON CONFLICT (id) DO NOTHING;

-- Storage RLS: 사용자별 폴더 격리
CREATE POLICY "Users can upload own PDFs"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'pdfs'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can read own PDFs"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'pdfs'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can delete own PDFs"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'pdfs'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- ============================================================================
-- 10. credit_usage_logs 테이블 (유저별 크레딧 사용량 추적)
--
-- 설계 원칙:
--   - Immutable 로그: 한번 기록된 데이터는 수정/삭제하지 않음
--   - 서버 전용 INSERT: Admin Client(service_role)로만 INSERT하며,
--     RLS가 활성화된 상태에서 INSERT 정책이 없으므로 일반 유저의 INSERT는 기본 거부됨
--   - 유저 조회 가능: 자신의 로그만 SELECT 가능 (RLS 정책)
--
-- 컬럼 설계 의도:
--   - session_id (nullable): action_type='chat' 시 보통 존재하나,
--     세션 삭제 시 ON DELETE SET NULL로 로그 보존. action_type='embedding' 시 null.
--   - pdf_id (nullable): action_type='embedding' 시 보통 존재.
--     action_type='chat' 시에도 관련 PDF ID 저장 가능. 양쪽 모두 optional.
--   - CHECK 제약조건을 추가하지 않은 이유: 향후 action_type 확장 시 유연성 확보,
--     데이터 누락보다 기록 자체가 중요
-- ============================================================================
CREATE TABLE IF NOT EXISTS credit_usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL CHECK (action_type IN ('chat', 'embedding')),
  model_name TEXT,
  prompt_tokens INTEGER DEFAULT 0,                -- 임베딩 시 input tokens를 여기에 매핑
  completion_tokens INTEGER DEFAULT 0,             -- 임베딩 시 0
  total_tokens INTEGER GENERATED ALWAYS AS (prompt_tokens + completion_tokens) STORED,
  total_cost NUMERIC(10, 6) DEFAULT 0,
  session_id UUID REFERENCES chat_sessions(id) ON DELETE SET NULL,
  pdf_id TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_credit_usage_logs_user_id
  ON credit_usage_logs(user_id);

CREATE INDEX IF NOT EXISTS idx_credit_usage_logs_user_created
  ON credit_usage_logs(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_credit_usage_logs_action_type
  ON credit_usage_logs(action_type);

ALTER TABLE credit_usage_logs ENABLE ROW LEVEL SECURITY;

-- RLS 정책 설계:
--   - SELECT: 유저 자신의 로그만 조회 가능
--   - INSERT: 정책 없음 → 기본 거부. 서버(Admin Client, service_role)가 RLS를 우회하여 INSERT
--   - UPDATE/DELETE: 정책 없음 → 기본 거부. 로그는 immutable (수정/삭제 불가)
CREATE POLICY "Users can view own credit usage logs"
  ON credit_usage_logs FOR SELECT
  USING (auth.uid() = user_id);

-- ============================================================================
-- 11. RPC 함수: get_user_credit_usage_summary (유저별 사용량 집계)
-- ============================================================================
CREATE OR REPLACE FUNCTION get_user_credit_usage_summary()
RETURNS TABLE (
  total_prompt_tokens BIGINT,
  total_completion_tokens BIGINT,
  total_tokens BIGINT,
  total_cost NUMERIC,
  chat_count BIGINT,
  embedding_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(SUM(cul.prompt_tokens)::BIGINT, 0) AS total_prompt_tokens,
    COALESCE(SUM(cul.completion_tokens)::BIGINT, 0) AS total_completion_tokens,
    COALESCE(SUM(cul.prompt_tokens + cul.completion_tokens)::BIGINT, 0) AS total_tokens,
    COALESCE(SUM(cul.total_cost), 0) AS total_cost,
    COUNT(*) FILTER (WHERE cul.action_type = 'chat') AS chat_count,
    COUNT(*) FILTER (WHERE cul.action_type = 'embedding') AS embedding_count
  FROM credit_usage_logs cul
  WHERE cul.user_id = auth.uid();
END;
$$;

-- ============================================================================
-- 11-1. 트리거: credit_usage_logs INSERT 시 profiles.total_credits_used 자동 누적
-- ============================================================================
CREATE OR REPLACE FUNCTION update_profile_credits_on_log()
RETURNS trigger AS $$
BEGIN
  UPDATE profiles
  SET total_credits_used = total_credits_used + NEW.total_cost,
      updated_at = now()
  WHERE id = NEW.user_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_credit_usage_log_insert
  AFTER INSERT ON credit_usage_logs
  FOR EACH ROW
  EXECUTE FUNCTION update_profile_credits_on_log();

-- ============================================================================
-- 마이그레이션: credit_usage_logs 테이블 추가
-- ============================================================================
-- 기존 DB에 적용할 경우 아래 SQL을 순차 실행:
--
-- CREATE TABLE IF NOT EXISTS credit_usage_logs (
--   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
--   user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
--   action_type TEXT NOT NULL CHECK (action_type IN ('chat', 'embedding')),
--   model_name TEXT,
--   prompt_tokens INTEGER DEFAULT 0,
--   completion_tokens INTEGER DEFAULT 0,
--   total_tokens INTEGER GENERATED ALWAYS AS (prompt_tokens + completion_tokens) STORED,
--   total_cost NUMERIC(10, 6) DEFAULT 0,
--   session_id UUID REFERENCES chat_sessions(id) ON DELETE SET NULL,
--   pdf_id TEXT,
--   metadata JSONB DEFAULT '{}',
--   created_at TIMESTAMPTZ DEFAULT now()
-- );
-- CREATE INDEX IF NOT EXISTS idx_credit_usage_logs_user_id ON credit_usage_logs(user_id);
-- CREATE INDEX IF NOT EXISTS idx_credit_usage_logs_user_created ON credit_usage_logs(user_id, created_at DESC);
-- CREATE INDEX IF NOT EXISTS idx_credit_usage_logs_action_type ON credit_usage_logs(action_type);
-- ALTER TABLE credit_usage_logs ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Users can view own credit usage logs" ON credit_usage_logs FOR SELECT USING (auth.uid() = user_id);
--
-- CREATE OR REPLACE FUNCTION get_user_credit_usage_summary()
-- RETURNS TABLE (total_prompt_tokens BIGINT, total_completion_tokens BIGINT, total_tokens BIGINT, total_cost NUMERIC, chat_count BIGINT, embedding_count BIGINT)
-- LANGUAGE plpgsql SECURITY DEFINER AS $$
-- BEGIN
--   RETURN QUERY SELECT COALESCE(SUM(cul.prompt_tokens)::BIGINT, 0), COALESCE(SUM(cul.completion_tokens)::BIGINT, 0), COALESCE(SUM(cul.prompt_tokens + cul.completion_tokens)::BIGINT, 0), COALESCE(SUM(cul.total_cost), 0), COUNT(*) FILTER (WHERE cul.action_type = 'chat'), COUNT(*) FILTER (WHERE cul.action_type = 'embedding') FROM credit_usage_logs cul WHERE cul.user_id = auth.uid();
-- END;
-- $$;
--
-- ALTER TABLE profiles ADD COLUMN IF NOT EXISTS total_credits_used NUMERIC(10, 6) DEFAULT 0;
--
-- CREATE OR REPLACE FUNCTION update_profile_credits_on_log()
-- RETURNS trigger AS $$
-- BEGIN
--   UPDATE profiles SET total_credits_used = total_credits_used + NEW.total_cost, updated_at = now() WHERE id = NEW.user_id;
--   RETURN NEW;
-- END;
-- $$ LANGUAGE plpgsql SECURITY DEFINER;
--
-- CREATE OR REPLACE TRIGGER on_credit_usage_log_insert
--   AFTER INSERT ON credit_usage_logs FOR EACH ROW EXECUTE FUNCTION update_profile_credits_on_log();
--
-- 롤백:
-- DROP TRIGGER IF EXISTS on_credit_usage_log_insert ON credit_usage_logs;
-- DROP FUNCTION IF EXISTS update_profile_credits_on_log();
-- DROP FUNCTION IF EXISTS get_user_credit_usage_summary();
-- ALTER TABLE profiles DROP COLUMN IF EXISTS total_credits_used;
-- DROP TABLE IF EXISTS credit_usage_logs;

-- ============================================================================
-- 12. RPC 함수: cleanup_deleted_users (소프트 딜리트된 사용자 정리)
--
-- 목적:
--   - deletion_scheduled_at이 현재 시각보다 이전인 사용자들의 데이터 정리
--   - Storage 파일 삭제 및 삭제 대상 user_id 목록 반환
--
-- 호출 주체:
--   - Vercel Cron Job (서버 API 경유) 또는 Supabase Cron (pg_cron)
--
-- 반환값:
--   - 삭제 대상 user_id 배열 (UUID[])
--   - auth.users 삭제는 Supabase Admin API로 처리해야 하므로 Backend에서 수행
--
-- 주의사항:
--   - SECURITY DEFINER로 실행 (Storage RLS 우회 필요)
--   - pdf_documents, chat_sessions, chat_messages, credit_usage_logs는
--     ON DELETE CASCADE로 자동 삭제됨
-- ============================================================================
CREATE OR REPLACE FUNCTION cleanup_deleted_users()
RETURNS UUID[]
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  target_user_ids UUID[];
  user_record RECORD;
  storage_file_count INTEGER;
BEGIN
  -- 1. 삭제 대상 user_id 목록 조회
  SELECT array_agg(id)
  INTO target_user_ids
  FROM profiles
  WHERE deletion_scheduled_at IS NOT NULL
    AND deletion_scheduled_at <= NOW();

  -- 대상이 없으면 조기 반환
  IF target_user_ids IS NULL OR array_length(target_user_ids, 1) = 0 THEN
    RETURN ARRAY[]::UUID[];
  END IF;

  -- 2. 각 사용자별 Storage 파일 삭제
  FOR user_record IN
    SELECT id FROM unnest(target_user_ids) AS id
  LOOP
    -- Storage 파일 삭제 (bucket_id='pdfs' AND name LIKE 'user_id/%')
    DELETE FROM storage.objects
    WHERE bucket_id = 'pdfs'
      AND name LIKE (user_record.id::text || '/%');

    GET DIAGNOSTICS storage_file_count = ROW_COUNT;

    -- 로깅 (선택사항, 디버깅용)
    RAISE NOTICE 'Deleted % storage files for user %', storage_file_count, user_record.id;
  END LOOP;

  -- 3. 삭제 대상 user_id 배열 반환 (auth.users 삭제는 Backend에서 수행)
  RETURN target_user_ids;
END;
$$;

-- ============================================================================
-- 마이그레이션: 소프트 딜리트 컬럼 및 RPC 함수 추가
-- ============================================================================
-- 기존 DB에 적용할 경우 아래 SQL을 순차 실행:
--
-- ALTER TABLE profiles ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;
-- ALTER TABLE profiles ADD COLUMN IF NOT EXISTS deletion_scheduled_at TIMESTAMPTZ DEFAULT NULL;
-- CREATE INDEX IF NOT EXISTS idx_profiles_deletion_scheduled ON profiles(deletion_scheduled_at);
--
-- CREATE OR REPLACE FUNCTION cleanup_deleted_users()
-- RETURNS UUID[]
-- LANGUAGE plpgsql
-- SECURITY DEFINER
-- AS $$
-- DECLARE
--   target_user_ids UUID[];
--   user_record RECORD;
--   storage_file_count INTEGER;
-- BEGIN
--   SELECT array_agg(id) INTO target_user_ids FROM profiles WHERE deletion_scheduled_at IS NOT NULL AND deletion_scheduled_at <= NOW();
--   IF target_user_ids IS NULL OR array_length(target_user_ids, 1) = 0 THEN RETURN ARRAY[]::UUID[]; END IF;
--   FOR user_record IN SELECT id FROM unnest(target_user_ids) AS id LOOP
--     DELETE FROM storage.objects WHERE bucket_id = 'pdfs' AND name LIKE (user_record.id::text || '/%');
--     GET DIAGNOSTICS storage_file_count = ROW_COUNT;
--     RAISE NOTICE 'Deleted % storage files for user %', storage_file_count, user_record.id;
--   END LOOP;
--   RETURN target_user_ids;
-- END;
-- $$;
--
-- 롤백:
-- DROP FUNCTION IF EXISTS cleanup_deleted_users();
-- DROP INDEX IF EXISTS idx_profiles_deletion_scheduled;
-- ALTER TABLE profiles DROP COLUMN IF EXISTS deletion_scheduled_at;
-- ALTER TABLE profiles DROP COLUMN IF EXISTS deleted_at;
