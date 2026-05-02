-- =====================================================
-- 우리가족 스케줄 앱 - Supabase 데이터베이스 설정
-- =====================================================
-- 사용법:
-- 1. supabase.com 에서 새 프로젝트 만들기
-- 2. 왼쪽 메뉴에서 "SQL Editor" 클릭
-- 3. 아래 코드 전체를 복사해서 붙여넣고 RUN 버튼 클릭
-- =====================================================

-- 1. 전달사항 테이블 (가족 모두 공유)
CREATE TABLE IF NOT EXISTS announcements (
  id BIGSERIAL PRIMARY KEY,
  content TEXT NOT NULL,
  author_id TEXT NOT NULL,
  is_important BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  notify_at TIMESTAMPTZ
);

-- 2. 오늘의 할 일 테이블 (개인별, 시간별)
CREATE TABLE IF NOT EXISTS todos (
  id BIGSERIAL PRIMARY KEY,
  member_id TEXT NOT NULL,
  title TEXT NOT NULL,
  scheduled_time TIME,
  date DATE DEFAULT CURRENT_DATE,
  is_done BOOLEAN DEFAULT false,
  notify_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. 숙제 체크리스트 테이블 (은결, 나겸 전용)
CREATE TABLE IF NOT EXISTS homework (
  id BIGSERIAL PRIMARY KEY,
  member_id TEXT NOT NULL CHECK (member_id IN ('eungyeol', 'nagyeom')),
  subject TEXT NOT NULL,
  content TEXT NOT NULL,
  due_date DATE DEFAULT CURRENT_DATE,
  is_done BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. 준비물 목록 테이블 (개인별)
CREATE TABLE IF NOT EXISTS supplies (
  id BIGSERIAL PRIMARY KEY,
  member_id TEXT NOT NULL,
  item_name TEXT NOT NULL,
  for_date DATE DEFAULT CURRENT_DATE,
  is_packed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. 달력 일정 테이블 (가족 모두 공유)
CREATE TABLE IF NOT EXISTS calendar_events (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  event_date DATE NOT NULL,
  event_time TIME,
  member_id TEXT,
  notify_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 실시간(Realtime) 활성화 - 가족끼리 자동 동기화
-- =====================================================
ALTER PUBLICATION supabase_realtime ADD TABLE announcements;
ALTER PUBLICATION supabase_realtime ADD TABLE todos;
ALTER PUBLICATION supabase_realtime ADD TABLE homework;
ALTER PUBLICATION supabase_realtime ADD TABLE supplies;
ALTER PUBLICATION supabase_realtime ADD TABLE calendar_events;

-- =====================================================
-- 보안 정책 (RLS) - 가족 앱이라 모두 읽기/쓰기 허용
-- =====================================================
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE todos ENABLE ROW LEVEL SECURITY;
ALTER TABLE homework ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplies ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;

-- 모든 사용자가 읽고 쓸 수 있도록 (가족 앱이므로)
CREATE POLICY "Allow all on announcements" ON announcements FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on todos" ON todos FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on homework" ON homework FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on supplies" ON supplies FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on calendar_events" ON calendar_events FOR ALL USING (true) WITH CHECK (true);

-- =====================================================
-- 완료! 이제 앱을 실행하시면 됩니다 🎉
-- =====================================================
