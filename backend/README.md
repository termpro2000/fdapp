# 배송접수 웹앱 백엔드

한국 물류 업체를 위한 배송 접수 관리 시스템의 백엔드 API 서버입니다.

## 🚀 배포 정보

- **배포 URL**: https://fdapp-production.up.railway.app
- **배포 플랫폼**: Railway
- **상태**: ✅ 운영 중

## 🔧 기술 스택

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MySQL
- **Authentication**: JWT + Session (하이브리드)
- **Password Hashing**: bcryptjs
- **Rate Limiting**: express-rate-limit
- **CORS**: cors

## 📁 프로젝트 구조

```
backend/
├── controllers/           # 비즈니스 로직 컨트롤러
│   ├── authController.js     # 사용자 인증 (JWT + 세션)
│   ├── shippingController.js # 배송 접수 관리
│   ├── userController.js     # 사용자 관리 (관리자)
│   └── exportController.js   # 데이터 내보내기
├── middleware/           # 미들웨어
│   └── auth.js              # JWT/세션 인증 미들웨어
├── routes/              # API 라우터
│   ├── auth.js             # 인증 라우트
│   ├── shipping.js         # 배송 라우트
│   ├── users.js            # 사용자 관리 라우트
│   └── exports.js          # 내보내기 라우트
├── config/              # 설정 파일
│   └── database.js         # 데이터베이스 설정
├── scripts/             # 스크립트
│   └── setupDatabase.js    # DB 초기화 스크립트
└── server.js            # 메인 서버 파일
```

## 🔐 인증 시스템

### JWT + Session 하이브리드 인증
- **JWT 토큰**: 크로스도메인 API 인증용 (Vercel ↔ Railway)
- **세션**: 기존 호환성 유지용
- **자동 전환**: 토큰 우선, 세션 fallback

### 인증 플로우
1. 로그인 시 JWT 토큰과 세션 동시 생성
2. API 요청 시 JWT 토큰으로 인증
3. JWT 실패 시 세션으로 fallback
4. 로그아웃 시 토큰과 세션 모두 정리

## 🌐 API 엔드포인트

### 인증 API
- `POST /api/auth/login` - 로그인 (JWT 토큰 발급)
- `POST /api/auth/logout` - 로그아웃
- `POST /api/auth/register` - 회원가입
- `GET /api/auth/me` - 현재 사용자 정보
- `GET /api/auth/check-username/:username` - 아이디 중복 확인

### 배송 관리 API
- `POST /api/shipping/orders` - 배송 접수 생성 🔐
- `GET /api/shipping/orders` - 배송 접수 목록 🔐
- `GET /api/shipping/orders/:id` - 배송 접수 상세 🔐
- `PATCH /api/shipping/orders/:id/status` - 배송 상태 업데이트 🔐
- `GET /api/shipping/tracking/:trackingNumber` - 운송장 추적 (공개)

### 사용자 관리 API (관리자 전용)
- `GET /api/users` - 사용자 목록 🔐👑
- `POST /api/users` - 사용자 생성 🔐👑
- `PUT /api/users/:id` - 사용자 정보 수정 🔐👑
- `DELETE /api/users/:id` - 사용자 삭제 🔐👑

### 데이터 내보내기 API
- `GET /api/exports/orders` - 배송 데이터 내보내기 🔐
- `GET /api/exports/statistics` - 통계 데이터 내보내기 🔐

> 🔐 = 인증 필요, 👑 = 관리자 권한 필요

## 🛠 설치 및 실행

### 로컬 개발 환경

```bash
# 의존성 설치
npm install

# 환경변수 설정 (.env 파일 생성)
cp .env.example .env

# 데이터베이스 초기화
npm run setup-db

# 개발 서버 실행
npm run dev
```

### 환경변수

```env
# 데이터베이스 설정
DB_HOST=localhost
DB_USER=your_username
DB_PASSWORD=your_password
DB_NAME=shipping_webapp

# 서버 설정
PORT=3000
NODE_ENV=development

# 인증 설정
SESSION_SECRET=your-session-secret-key
JWT_SECRET=shipping-webapp-jwt-secret-2024

# CORS 설정
FRONTEND_URL=http://localhost:5173
```

## 🚀 배포 가이드

### Railway 배포
1. Railway 프로젝트 생성
2. GitHub 저장소 연결
3. 환경변수 설정
4. MySQL 데이터베이스 연결
5. 자동 배포 실행

### 환경변수 설정 (프로덕션)
```env
NODE_ENV=production
DATABASE_URL=mysql://user:password@host:port/database
SESSION_SECRET=your-production-session-secret
JWT_SECRET=shipping-webapp-jwt-secret-2024
FRONTEND_URL=https://your-frontend-domain.vercel.app
```

## 🔒 보안 기능

- **Rate Limiting**: IP당 15분에 100회 요청 제한
- **CORS Protection**: 허용된 도메인만 접근 가능
- **Password Hashing**: bcryptjs로 비밀번호 암호화
- **JWT Security**: 24시간 토큰 만료
- **Session Security**: httpOnly, secure 쿠키
- **SQL Injection Prevention**: Prepared statements 사용

## 🐛 디버깅 및 모니터링

### 로그 확인
- **Railway Console**: 실시간 로그 확인
- **Error Tracking**: 상세한 에러 스택 추적
- **JWT Debugging**: 토큰 생성/검증 로그

### Health Check
```bash
curl https://fdapp-production.up.railway.app/health
```

## 📝 개발 이력

### v1.0.0 (2024-08-28)
- ✅ 기본 배송 접수 시스템 구현
- ✅ 사용자 인증 및 권한 관리
- ✅ JWT + Session 하이브리드 인증 구현
- ✅ Railway 프로덕션 배포
- ✅ Vercel-Railway 크로스도메인 인증 해결
- ✅ 실시간 배송 추적 시스템
- ✅ 데이터 내보내기 기능

## 🤝 기여 방법

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 라이센스

이 프로젝트는 ISC 라이센스를 따릅니다.

## 🆘 문제 해결

### 일반적인 문제들

**Q: 401 Unauthorized 에러**
- JWT 토큰 만료 확인
- 로그인 상태 재확인
- 브라우저 localStorage 확인

**Q: CORS 에러**
- FRONTEND_URL 환경변수 확인
- 허용된 도메인 목록 확인

**Q: 데이터베이스 연결 실패**
- DATABASE_URL 환경변수 확인
- MySQL 서버 상태 확인

---

🤖 **Generated with Claude Code** - 지속적인 업데이트와 개선이 진행 중입니다.