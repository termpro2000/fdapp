# 🚀 배포 가이드

이 가이드는 배송 웹 애플리케이션을 프로덕션 환경에 배포하는 방법을 설명합니다.

## 배포 아키텍처

```
[사용자] → [Vercel - 프론트엔드] → [Railway - 백엔드 API] → [Gabia MySQL]
```

## 📋 사전 준비사항

### 1. 필요한 계정
- [Vercel](https://vercel.com) 계정 (프론트엔드 배포)
- [Railway](https://railway.app) 계정 (백엔드 배포)
- GitHub 계정 (코드 저장소)
- Gabia MySQL 데이터베이스 (이미 있음)

### 2. 로컬 테스트 완료
```bash
# 백엔드 테스트
cd backend
npm run dev

# 프론트엔드 테스트 (새 터미널)
cd frontend  
npm run dev
```

## 🗄️ 1단계: 데이터베이스 준비

### Gabia MySQL 설정 확인
```sql
-- 프로덕션용 사용자 생성 (보안 강화)
CREATE USER 'prod_user'@'%' IDENTIFIED BY 'secure_password_here';
GRANT SELECT, INSERT, UPDATE, DELETE ON miraeapp.* TO 'prod_user'@'%';
FLUSH PRIVILEGES;
```

## 🔧 2단계: 백엔드 배포 (Railway)

### 2.1 GitHub 저장소 준비
```bash
# 프로젝트를 GitHub에 푸시 (아직 안 했다면)
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/your-username/shipping-webapp.git
git push -u origin main
```

### 2.2 Railway 배포
1. [Railway.app](https://railway.app) 로그인
2. "New Project" → "Deploy from GitHub repo" 선택
3. 저장소 선택 → `backend` 폴더 선택
4. 환경변수 설정:

```env
NODE_ENV=production
PORT=3000
DB_HOST=my8003.gabiadb.com
DB_PORT=3306
DB_USER=your_gabia_username
DB_PASSWORD=your_gabia_password
DB_NAME=your_database_name
DB_CHARSET=utf8mb4
DB_TIMEZONE=+09:00
SESSION_SECRET=super_secure_random_string_for_production
FRONTEND_URL=https://your-app.vercel.app
```

### 2.3 백엔드 프로덕션 최적화

Railway 배포용 설정 추가:

```javascript
// backend/server.js 수정 (이미 적용됨)
const PORT = process.env.PORT || 3000;

// CORS 설정 (이미 적용됨)
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));

// 세션 보안 설정 (이미 적용됨)
app.use(session({
  secret: process.env.SESSION_SECRET || 'fallback-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production', // HTTPS에서만 쿠키 전송
    maxAge: 24 * 60 * 60 * 1000 // 24시간
  }
}));
```

### 2.4 데이터베이스 초기화
Railway 배포 완료 후 데이터베이스 테이블 생성:

```bash
# Railway 콘솔에서 실행 또는 로컬에서 프로덕션 DB에 연결하여 실행
npm run setup-db
```

## 🎨 3단계: 프론트엔드 배포 (Vercel)

### 3.1 환경변수 설정
```bash
# frontend/.env.production 생성
echo "VITE_API_URL=https://your-railway-app.railway.app/api" > .env.production
```

### 3.2 프로덕션 빌드 테스트
```bash
cd frontend
npm run build
npm run preview  # 로컬에서 프로덕션 빌드 테스트
```

### 3.3 Vercel 배포
1. [Vercel.com](https://vercel.com) 로그인
2. "New Project" 클릭
3. GitHub 저장소 선택
4. **Root Directory를 `frontend`로 설정**
5. 환경변수 추가:
   - `VITE_API_URL`: `https://your-railway-app.railway.app/api`
6. "Deploy" 클릭

### 3.4 CORS 설정 업데이트
Vercel 배포 완료 후 Railway의 환경변수 업데이트:
```env
FRONTEND_URL=https://your-app.vercel.app
```

## 🔐 4단계: 보안 설정

### 4.1 환경변수 보안
```bash
# 강력한 세션 시크릿 생성
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 4.2 Railway 보안 헤더 추가
```javascript
// backend/server.js에 추가
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});
```

## 🌐 5단계: 도메인 설정 (선택사항)

### 5.1 커스텀 도메인
- **Vercel**: 프로젝트 설정 → Domains → 도메인 추가
- **Railway**: 프로젝트 설정 → Networking → Custom Domain

### 5.2 SSL 인증서
- Vercel과 Railway는 자동으로 Let's Encrypt SSL 제공
- 커스텀 도메인 설정 시 자동 활성화

## 📊 6단계: 배포 확인

### 6.1 기능 테스트
1. 프론트엔드 접속: `https://your-app.vercel.app`
2. 회원가입/로그인 테스트
3. 배송 접수 생성 테스트
4. API 엔드포인트 확인: `https://your-railway-app.railway.app/api`

### 6.2 성능 체크
```bash
# Lighthouse 성능 테스트 (Chrome DevTools)
# API 응답 시간 확인
curl -w "@curl-format.txt" -s -o /dev/null https://your-railway-app.railway.app/api
```

## 🔄 7단계: 자동 배포 설정

### GitHub Actions 설정 (선택사항)
```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      # 프론트엔드 테스트
      - name: Test Frontend
        run: |
          cd frontend
          npm ci
          npm run build
      
      # 백엔드 테스트
      - name: Test Backend  
        run: |
          cd backend
          npm ci
          # npm test (테스트 코드 추가 시)
```

## 🚨 트러블슈팅

### 자주 발생하는 문제

#### 1. CORS 오류
```javascript
// Railway 환경변수 확인
FRONTEND_URL=https://your-exact-vercel-domain.vercel.app
```

#### 2. 세션 쿠키 문제
```javascript
// 프로덕션에서 secure: true 설정 필요
cookie: {
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
}
```

#### 3. 데이터베이스 연결 오류
```bash
# Gabia MySQL 방화벽 설정 확인
# Railway IP 허용 목록에 추가
```

#### 4. API 응답 느림
```javascript
// Railway에서 리전 설정 (아시아 리전 선택)
// 데이터베이스 인덱스 추가
```

## 📈 모니터링

### 1. Railway 모니터링
- CPU, 메모리 사용량 확인
- 로그 모니터링
- 응답 시간 체크

### 2. Vercel 모니터링
- 빌드 상태 확인
- CDN 캐시 상태
- Core Web Vitals 점수

### 3. 외부 모니터링 (권장)
```bash
# UptimeRobot 또는 Pingdom으로 가용성 모니터링
# New Relic 또는 DataDog으로 성능 모니터링
```

## 💰 예상 비용

### 무료 플랜 (개발/테스트용)
- **Vercel**: 무료 (Hobby 플랜)
- **Railway**: $5/월 (Starter 플랜)
- **총 비용**: 월 $5

### 유료 플랜 (운영용)
- **Vercel Pro**: $20/월
- **Railway Pro**: $20/월  
- **총 비용**: 월 $40

## 🔄 업데이트 배포

### 코드 업데이트 시
```bash
git add .
git commit -m "Update: 새로운 기능 추가"
git push origin main

# Vercel과 Railway가 자동으로 재배포
```

### 환경변수 변경 시
1. Railway/Vercel 콘솔에서 환경변수 수정
2. 수동 재배포 또는 새 커밋 푸시

## ✅ 배포 체크리스트

- [ ] GitHub 저장소 생성 및 코드 푸시
- [ ] Railway 계정 생성 및 백엔드 배포
- [ ] 환경변수 설정 (DB, SESSION_SECRET 등)
- [ ] 데이터베이스 테이블 초기화
- [ ] Vercel 계정 생성 및 프론트엔드 배포
- [ ] CORS 설정 업데이트
- [ ] 기능 테스트 (회원가입, 로그인, 배송접수)
- [ ] 성능 테스트
- [ ] 모니터링 설정
- [ ] 백업 계획 수립

배포 과정에서 문제가 발생하면 언제든 도움을 요청하세요!