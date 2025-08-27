# 배송접수 웹앱

26개 필드를 가진 완전한 배송접수 시스템입니다.

## 🚀 빠른 시작

### 1. 백엔드 실행
```bash
cd backend
npm run dev
```

### 2. 프론트엔드 실행 (새 터미널)
```bash
cd frontend
npm run dev
```

### 3. 브라우저에서 확인
- 프론트엔드: http://localhost:5173
- 백엔드 API: http://localhost:3000

## ⚙️ 환경 설정

### Gabia MySQL 연결 설정
`backend/.env` 파일에서 다음 정보를 수정하세요:
```env
DB_HOST=mysql17.gabia.com
DB_USER=실제_gabia_사용자명
DB_PASSWORD=실제_gabia_비밀번호
DB_NAME=실제_데이터베이스명
```

### 데이터베이스 초기화
```bash
cd backend
npm run setup-db
```

## 📋 기능

- ✅ 사용자 인증 (회원가입/로그인)
- ✅ 26개 필드 배송접수 폼
- ✅ 4단계 진행 UI
- ✅ 실시간 유효성 검증
- ✅ 세션 기반 인증
- ✅ MySQL 데이터 저장

## 🛠️ 기술 스택

**프론트엔드:**
- React 18 + TypeScript
- TailwindCSS
- React Hook Form
- Lucide React Icons
- Axios

**백엔드:**
- Node.js + Express
- MySQL2
- Express Session
- CORS
- Rate Limiting

## 📁 프로젝트 구조

```
shipping-webapp/
├── frontend/                 # React 프론트엔드
│   ├── src/
│   │   ├── components/      # 컴포넌트
│   │   ├── hooks/          # 커스텀 훅
│   │   ├── services/       # API 서비스
│   │   └── types/          # TypeScript 타입
│   └── package.json
└── backend/                 # Node.js 백엔드
    ├── config/             # 설정 파일
    ├── controllers/        # 컨트롤러
    ├── middleware/         # 미들웨어
    ├── routes/            # 라우트
    ├── scripts/           # 유틸리티 스크립트
    └── package.json
```

## 🔧 개발 명령어

### 백엔드
```bash
npm run dev        # 개발 서버 시작
npm start          # 프로덕션 서버 시작
npm run setup-db   # 데이터베이스 초기화
```

### 프론트엔드
```bash
npm run dev        # 개발 서버 시작
npm run build      # 프로덕션 빌드
npm run preview    # 빌드 미리보기
```

## 🧪 테스트 계정

로컬에서 테스트할 수 있도록 다음 계정으로 시작하세요:
1. 회원가입으로 새 계정 생성
2. 로그인 후 배송접수 테스트

## 📚 문서

### API 문서
- **[API_DOCUMENTATION.md](./API_DOCUMENTATION.md)** - 전체 API 엔드포인트 상세 문서
  - 인증 API (회원가입, 로그인, 로그아웃)
  - 배송 API (접수, 조회, 추적, 상태 업데이트)
  - 요청/응답 스키마 및 예제

### 코드 문서화
- **[CODE_DOCUMENTATION_GUIDELINES.md](./CODE_DOCUMENTATION_GUIDELINES.md)** - 코드 문서화 가이드라인
  - JSDoc/TSDoc 작성 규칙
  - 주석 작성 모범사례
  - 용어 통일 및 스타일 가이드

### 주요 API 엔드포인트 (요약)
- `POST /api/auth/register` - 회원가입
- `POST /api/auth/login` - 로그인
- `POST /api/shipping/orders` - 배송접수 생성
- `GET /api/shipping/orders` - 배송접수 목록
- `GET /api/shipping/tracking/:number` - 운송장 추적

## 🎯 다음 단계

1. **Gabia MySQL 연결**: `.env` 파일 수정
2. **데이터베이스 초기화**: `npm run setup-db` 실행  
3. **테스트**: 회원가입 → 로그인 → 배송접수
4. **배포**: Vercel + Railway/Heroku