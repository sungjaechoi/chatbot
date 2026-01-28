# Workflow: Standard Dev Pipeline

입력: 사용자 프롬프트({{prompt}})

목표: 단일 커맨드로 표준 파이프라인을 시작한다.

규칙:

- 이 커맨드는 구현을 수행하지 않는다.
- 사용자 프롬프트를 수정하지 않고 그대로 전달한다.

실행:

1. orchestrator 에이전트를 호출한다.
2. 아래 정보를 그대로 전달한다.
   - user_prompt: "{{prompt}}"
