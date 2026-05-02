# 🌸 우리가족 스케줄 앱

은결, 나겸, 엄마, 아빠를 위한 가족 공유 스케줄 PWA 앱이에요!

## ✨ 주요 기능

- 📢 **전달사항** — 가족 모두에게 메시지 전달, 알림+소리
- ⏰ **오늘 할 일** — 시간별로 정하고 알림 받기
- 📚 **숙제 체크리스트** — 은결/나겸이만 추가 가능 (아빠/엄마는 보기만)
- 🎒 **준비물 목록** — 날짜별로 챙길 물건 관리
- 📅 **달력** — 큰 달력 화면, 날짜 누르면 일정 추가
- 🔄 **실시간 공유** — 가족 누구든 추가하면 다른 사람 폰에도 바로 나타남
- 🔔 **푸시 알림** — 앱 꺼져있어도 알림+소리

---

## 📦 시작하기 — 3단계만 따라하면 됩니다

### 1️⃣ Supabase 무료 가입 (데이터 저장소)

1. [supabase.com](https://supabase.com) 접속 → 회원가입 (Google 로그인 가능)
2. **New Project** 클릭
3. 프로젝트 이름: `family-schedule` (아무거나 OK)
4. **Database Password**: 아무거나 정하고 적어두기 (안 까먹게)
5. **Region**: `Northeast Asia (Seoul)` 선택
6. **Create new project** → 2분 정도 기다리기

### 2️⃣ 데이터베이스 만들기

1. 프로젝트 들어가면 왼쪽 메뉴에서 **SQL Editor** 클릭
2. `+ New query` 클릭
3. 이 폴더에 있는 **`supabase-setup.sql`** 파일을 열어서 **전체 복사**
4. SQL Editor에 붙여넣기 → 오른쪽 위 **RUN** 클릭
5. "Success" 메시지 뜨면 완료 ✅

### 3️⃣ 앱과 연결하기

1. Supabase 왼쪽 메뉴에서 **Settings** (톱니바퀴) → **API** 클릭
2. 두 개의 정보를 복사해두기:
   - **Project URL** (예: https://abcdefg.supabase.co)
   - **anon / public** 키 (긴 문자열)
3. 이 폴더의 **`.env.example`** 파일을 복사해서 **`.env`** 라는 이름으로 바꾸기
4. `.env` 파일 열어서 두 줄에 위에서 복사한 값 붙여넣기:
   ```
   VITE_SUPABASE_URL=https://abcdefg.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGc.....
   ```

---

## 🚀 앱 실행하기

터미널 열고 이 폴더에서:

```bash
# 처음 한 번만 - 필요한 도구 설치
npm install

# 앱 실행 (개발용)
npm run dev
```

화면에 나오는 주소 (예: http://localhost:5173) 를 핸드폰이나 컴퓨터 브라우저에서 열면 끝!

---

## 📱 핸드폰에 앱처럼 설치하기 (PWA)

이 앱은 **PWA**라서 진짜 앱처럼 핸드폰 홈화면에 깔 수 있어요.

### 배포 방법 (Vercel 무료):

```bash
# 빌드
npm run build

# Vercel 배포 (성록님이 익숙하신 방식)
# Vercel에 깃허브 연결하거나 npx vercel 명령어 사용
```

### 핸드폰에 설치:
- **iPhone (Safari)**: 공유 버튼 → "홈 화면에 추가"
- **Android (Chrome)**: 메뉴 → "앱 설치" 또는 "홈 화면에 추가"

---

## 👨‍👩‍👧‍👦 사용법

1. 앱 열기 → 본인 캐릭터 선택 (은결🦁 / 나겸🐰 / 엄마🌸 / 아빠🌳)
2. 한 번 선택하면 다음에는 자동으로 들어가요
3. 캐릭터 바꾸려면 오른쪽 위 본인 이름 누르기

---

## 🔧 기술 정보

- **React 18** + **Vite** (빠른 빌드)
- **Tailwind CSS** (파스텔 디자인)
- **Supabase** (PostgreSQL 데이터베이스 + 실시간 동기화)
- **PWA** (오프라인 지원, 홈화면 설치)
- **Web Audio API** (예쁜 알림음)
- **Notification API** (푸시 알림)

## ❓ 문제 생겼을 때

**알림이 안 와요**
- 브라우저에서 알림 권한을 허용했는지 확인
- iPhone은 PWA로 설치한 후 iOS 16.4 이상에서만 푸시 알림 작동

**다른 가족 폰에 안 나타나요**
- 같은 `.env` 파일 (같은 Supabase 프로젝트)을 써야 함
- 인터넷 연결 확인

**Supabase에서 에러 나요**
- SQL Editor에서 `supabase-setup.sql` 다시 실행
- 이미 테이블이 있다는 에러는 무시해도 됨
