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
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

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
