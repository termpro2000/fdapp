# 코드 문서화 가이드라인

## 개요
이 문서는 배송 웹 애플리케이션 프로젝트의 일관된 코드 문서화를 위한 가이드라인입니다.

## 문서화 원칙

### 1. 명확성 (Clarity)
- 코드의 목적과 기능을 명확하게 설명
- 전문용어는 최소화하고 이해하기 쉬운 용어 사용
- 한국어로 작성 (프로젝트 특성상)

### 2. 완전성 (Completeness)
- 모든 public 함수와 클래스는 문서화 필수
- 매개변수, 반환값, 예외 상황 모두 명시
- 복잡한 비즈니스 로직은 인라인 주석으로 보완

### 3. 일관성 (Consistency)
- 정해진 형식과 스타일 준수
- 용어 통일 (배송접수, 운송장번호 등)
- 동일한 문서화 도구 사용 (JSDoc/TSDoc)

## 백엔드 문서화 (Node.js/JavaScript)

### JSDoc 사용 규칙

#### 함수 문서화
```javascript
/**
 * 함수의 간단한 설명 (한 문장으로)
 * 필요시 추가 설명을 여러 줄에 걸쳐 작성
 * 
 * @param {타입} 매개변수명 - 매개변수 설명
 * @param {타입} [선택적매개변수] - 선택적 매개변수는 대괄호로 표시
 * @returns {Promise<타입>} 반환값 설명
 * @throws {Error} 발생 가능한 예외 설명
 */
async function exampleFunction(param1, param2) {
  // 구현
}
```

#### 실제 예제
```javascript
/**
 * 새 사용자를 등록하는 함수
 * @param {Object} req - Express 요청 객체
 * @param {Object} req.body - 요청 본문
 * @param {string} req.body.username - 사용자 아이디
 * @param {string} req.body.password - 비밀번호
 * @param {string} req.body.name - 사용자 실명
 * @param {string} [req.body.phone] - 전화번호 (선택사항)
 * @param {Object} res - Express 응답 객체
 * @returns {Promise<void>} JSON 응답 (성공 시 201, 오류 시 400/409/500)
 */
async function register(req, res) {
  // 함수 구현
}
```

### 인라인 주석 가이드
```javascript
async function complexFunction() {
  // 비밀번호 해싱 (보안을 위해 bcrypt 사용, salt rounds: 10)
  const hashedPassword = await bcrypt.hash(password, 10);
  
  // 데이터베이스에 사용자 정보 저장
  const [result] = await pool.execute(
    'INSERT INTO users (username, password, name) VALUES (?, ?, ?)',
    [username, hashedPassword, name]
  );
}
```

## 프론트엔드 문서화 (React/TypeScript)

### TSDoc 사용 규칙

#### 컴포넌트 문서화
```typescript
/**
 * 컴포넌트의 목적과 기능 설명
 * 
 * @param props - 컴포넌트 props
 * @returns 컴포넌트 JSX 엘리먼트
 */
const MyComponent: React.FC<MyComponentProps> = ({ prop1, prop2 }) => {
  // 컴포넌트 구현
};
```

#### 인터페이스 문서화
```typescript
/**
 * 대시보드 컴포넌트 props 인터페이스
 */
interface DashboardProps {
  /** 주문 상태 변경 시 호출되는 콜백 함수 */
  onOrderStatusChange?: (orderInfo: {
    orderId: number;
    status: string;
  }) => void;
}
```

#### Hook 문서화
```typescript
/**
 * 사용자 인증 상태를 관리하는 커스텀 훅
 * 로그인, 로그아웃, 회원가입 기능 제공
 * 
 * @returns 인증 관련 상태와 함수들
 */
export const useAuth = () => {
  // Hook 구현
};
```

### 복잡한 로직 주석
```typescript
// 페이지 가시성 변화를 감지하여 비활성 상태에서 자동 새로고침을 중지하고,
// 다시 활성화될 때 즉시 데이터를 업데이트
useEffect(() => {
  const handleVisibilityChange = () => {
    visibilityRef.current = !document.hidden;
    
    if (!document.hidden && isAutoRefreshEnabled) {
      fetchOrders(true);
    }
  };
  
  document.addEventListener('visibilitychange', handleVisibilityChange);
  return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
}, [isAutoRefreshEnabled]);
```

## API 문서화

### OpenAPI/Swagger 스타일 문서
별도의 `API_DOCUMENTATION.md` 파일에서 관리:

```markdown
### 배송 접수 생성
새로운 배송 접수를 생성합니다.

```http
POST /shipping/orders
```

**인증 필요**: 예

**Request Body:**
```json
{
  "sender_name": "string",      // 필수: 발송인 이름
  "receiver_name": "string",    // 필수: 수취인 이름
  // ... 기타 필드
}
```
```

## 주석 작성 시 주의사항

### Do's ✅
- **목적 설명**: 코드가 "무엇을" 하는지 설명
- **이유 설명**: 복잡한 로직의 경우 "왜" 그렇게 했는지 설명
- **예외 상황**: 에러 처리나 특별한 케이스 명시
- **외부 의존성**: 사용하는 라이브러리나 API 설명
- **비즈니스 로직**: 도메인 특화 규칙이나 제약사항 설명

### Don'ts ❌
- **코드 중복**: 코드가 명확하게 보여주는 것을 다시 설명하지 않기
- **잘못된 정보**: 코드 변경 시 주석도 함께 업데이트
- **과도한 주석**: 모든 줄에 주석을 달 필요 없음
- **주관적 표현**: "쉽다", "어렵다" 같은 주관적 판단 피하기

### 예시: 좋은 주석 vs 나쁜 주석

**❌ 나쁜 주석:**
```javascript
// i를 1 증가시킨다
i++;

// 사용자 이름을 가져온다
const username = req.body.username;
```

**✅ 좋은 주석:**
```javascript
// 운송장 번호 형식: SH + YYYYMMDD + 6자리 랜덤 문자열
// 예시: SH20240101ABC123
const trackingNumber = generateTrackingNumber();

// 보안을 위해 세션 기반 인증 사용 (JWT 대신 선택한 이유: 브라우저 호환성)
if (!req.session.user) {
  return res.status(401).json({ error: 'Unauthorized' });
}
```

## 용어 통일

### 비즈니스 도메인 용어
- **배송접수** / **배송 접수**: Shipping Order
- **운송장번호** / **운송장 번호**: Tracking Number
- **발송인**: Sender
- **수취인**: Receiver
- **배송상태** / **배송 상태**: Shipping Status

### 기술 용어
- **API 엔드포인트**: API Endpoint
- **세션**: Session
- **인증**: Authentication
- **권한**: Authorization

## 문서 업데이트 규칙

### 코드 변경 시
1. 함수 시그니처 변경 → JSDoc/TSDoc 즉시 업데이트
2. 비즈니스 로직 변경 → 관련 주석 검토 및 수정
3. API 변경 → API 문서 업데이트

### 정기 검토
- 월 1회 문서화 상태 점검
- 불필요하거나 잘못된 주석 제거
- 새로 추가된 기능의 문서화 확인

## 도구 및 설정

### VSCode Extensions
- **JSDoc Generator**: 함수에서 `/**` 입력 시 자동 생성
- **TypeScript Importer**: TypeScript 타입 정보 활용
- **Comment Anchors**: TODO, FIXME 등 특수 주석 하이라이트

### Lint 규칙
```javascript
// .eslintrc.js
rules: {
  'valid-jsdoc': 'error',
  'require-jsdoc': ['error', {
    require: {
      FunctionDeclaration: true,
      MethodDefinition: true,
      ClassDeclaration: true
    }
  }]
}
```

### TypeScript 설정
```json
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitReturns": true,
    "noImplicitAny": true
  }
}
```

## 문서화 체크리스트

### 새로운 함수 추가 시
- [ ] JSDoc/TSDoc 주석 추가
- [ ] 모든 매개변수 설명
- [ ] 반환값 설명
- [ ] 예외 상황 명시
- [ ] 복잡한 로직에 인라인 주석

### API 변경 시
- [ ] API 문서 업데이트
- [ ] 요청/응답 스키마 확인
- [ ] 상태 코드 정의
- [ ] 예제 데이터 최신화

### 컴포넌트 추가 시
- [ ] 컴포넌트 목적 설명
- [ ] Props 인터페이스 문서화
- [ ] 사용 예제 작성 (필요시)
- [ ] 의존성 명시

이 가이드라인을 따라 일관되고 유지보수하기 쉬운 코드 문서화를 유지해주세요.