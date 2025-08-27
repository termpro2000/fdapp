# API 문서

## 개요
배송 웹 애플리케이션의 RESTful API 문서입니다. 모든 API는 세션 기반 인증을 사용하며, JSON 형식으로 데이터를 주고받습니다.

## 기본 정보
- **Base URL**: `http://localhost:3000/api`
- **인증 방식**: 세션 기반 (쿠키)
- **Content-Type**: `application/json`

## 인증 API

### 회원가입
사용자 계정을 생성합니다.

```http
POST /auth/register
```

**Request Body:**
```json
{
  "username": "string",      // 필수: 사용자 아이디 (고유값)
  "password": "string",      // 필수: 비밀번호
  "name": "string",          // 필수: 사용자 실명
  "phone": "string",         // 선택: 전화번호
  "company": "string"        // 선택: 회사명
}
```

**Response:**
```json
// 성공 (201)
{
  "message": "회원가입이 완료되었습니다.",
  "userId": 123
}

// 실패 (400)
{
  "error": "Bad Request",
  "message": "필수 필드가 누락되었습니다."
}

// 실패 (409)
{
  "error": "Conflict",
  "message": "이미 사용 중인 아이디입니다."
}
```

### 아이디 중복 확인
사용자 아이디의 중복 여부를 확인합니다.

```http
GET /auth/check-username/:username
```

**Parameters:**
- `username` (string): 확인할 사용자 아이디

**Response:**
```json
{
  "available": true,
  "message": "사용 가능한 아이디입니다."
}
```

### 로그인
사용자 로그인을 처리합니다.

```http
POST /auth/login
```

**Request Body:**
```json
{
  "username": "string",  // 필수: 사용자 아이디
  "password": "string"   // 필수: 비밀번호
}
```

**Response:**
```json
// 성공 (200)
{
  "message": "로그인 성공",
  "user": {
    "id": 123,
    "username": "user123",
    "name": "홍길동",
    "phone": "010-1234-5678",
    "company": "ABC Company",
    "role": "user"
  }
}

// 실패 (401)
{
  "error": "Unauthorized",
  "message": "아이디 또는 비밀번호가 올바르지 않습니다."
}
```

### 로그아웃
현재 세션을 종료합니다.

```http
POST /auth/logout
```

**Response:**
```json
{
  "message": "로그아웃되었습니다."
}
```

### 현재 사용자 정보
로그인된 사용자의 정보를 조회합니다.

```http
GET /auth/me
```

**Response:**
```json
// 인증된 사용자 (200)
{
  "user": {
    "id": 123,
    "username": "user123",
    "name": "홍길동",
    "phone": "010-1234-5678",
    "company": "ABC Company",
    "role": "user"
  },
  "authenticated": true
}

// 인증되지 않은 사용자 (401)
{
  "error": "Unauthorized",
  "message": "로그인이 필요합니다."
}
```

## 배송 API

### 배송 접수 생성
새로운 배송 접수를 생성합니다.

```http
POST /shipping/orders
```

**인증 필요**: 예

**Request Body:**
```json
{
  // 발송인 정보 (7개 필드)
  "sender_name": "string",           // 필수
  "sender_phone": "string",          // 필수
  "sender_email": "string",          // 선택
  "sender_company": "string",        // 선택
  "sender_address": "string",        // 필수
  "sender_detail_address": "string", // 선택
  "sender_zipcode": "string",        // 필수

  // 수취인 정보 (7개 필드)
  "receiver_name": "string",           // 필수
  "receiver_phone": "string",          // 필수
  "receiver_email": "string",          // 선택
  "receiver_company": "string",        // 선택
  "receiver_address": "string",        // 필수
  "receiver_detail_address": "string", // 선택
  "receiver_zipcode": "string",        // 필수

  // 배송 정보 (8개 필드)
  "package_type": "string",        // 선택 (기본값: "소포")
  "package_weight": "number",      // 선택
  "package_size": "string",        // 선택
  "package_value": "number",       // 선택
  "delivery_type": "string",       // 선택 (기본값: "일반")
  "delivery_date": "string",       // 선택 (YYYY-MM-DD)
  "delivery_time": "string",       // 선택
  "package_description": "string", // 선택

  // 특수 옵션 (4개 필드)
  "is_fragile": "boolean",         // 선택 (기본값: false)
  "is_frozen": "boolean",          // 선택 (기본값: false)
  "requires_signature": "boolean", // 선택 (기본값: false)
  "insurance_amount": "number",    // 선택 (기본값: 0)

  // 추가 정보
  "delivery_memo": "string",       // 선택
  "special_instructions": "string" // 선택
}
```

**Response:**
```json
// 성공 (201)
{
  "message": "배송 접수가 완료되었습니다.",
  "orderId": 456,
  "trackingNumber": "TRK2024010100001",
  "status": "접수완료"
}
```

### 배송 접수 목록 조회
사용자의 배송 접수 목록을 페이지네이션으로 조회합니다.

```http
GET /shipping/orders?page=1&limit=10
```

**인증 필요**: 예

**Query Parameters:**
- `page` (number): 페이지 번호 (기본값: 1)
- `limit` (number): 페이지당 항목 수 (기본값: 10)

**Response:**
```json
{
  "orders": [
    {
      "id": 456,
      "tracking_number": "TRK2024010100001",
      "status": "접수완료",
      "sender_name": "홍길동",
      "receiver_name": "김철수",
      "package_type": "소포",
      "delivery_type": "일반",
      "created_at": "2024-01-01T00:00:00.000Z",
      "updated_at": "2024-01-01T00:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "totalPages": 3
  }
}
```

### 배송 접수 상세 조회
특정 배송 접수의 상세 정보를 조회합니다.

```http
GET /shipping/orders/:id
```

**인증 필요**: 예

**Parameters:**
- `id` (number): 배송 접수 ID

**Response:**
```json
{
  "order": {
    "id": 456,
    "user_id": 123,
    "tracking_number": "TRK2024010100001",
    "status": "접수완료",
    
    // 발송인 정보
    "sender_name": "홍길동",
    "sender_phone": "010-1234-5678",
    "sender_email": "hong@example.com",
    "sender_company": "ABC Company",
    "sender_address": "서울시 강남구 테헤란로 123",
    "sender_detail_address": "456호",
    "sender_zipcode": "12345",

    // 수취인 정보
    "receiver_name": "김철수",
    "receiver_phone": "010-9876-5432",
    "receiver_email": "kim@example.com",
    "receiver_company": "XYZ Company",
    "receiver_address": "부산시 해운대구 센텀로 789",
    "receiver_detail_address": "101동 202호",
    "receiver_zipcode": "67890",

    // 배송 정보
    "package_type": "소포",
    "package_weight": 2.5,
    "package_size": "중",
    "package_value": 50000,
    "delivery_type": "일반",
    "delivery_date": "2024-01-02",
    "delivery_time": "오전",
    "package_description": "전자제품",

    // 특수 옵션
    "is_fragile": true,
    "is_frozen": false,
    "requires_signature": true,
    "insurance_amount": 10000,

    // 추가 정보
    "delivery_memo": "문 앞에 놓아주세요",
    "special_instructions": "조심히 다뤄주세요",

    "created_at": "2024-01-01T00:00:00.000Z",
    "updated_at": "2024-01-01T00:00:00.000Z"
  }
}
```

### 배송 상태 업데이트
배송 접수의 상태를 업데이트합니다. (관리자/매니저만 가능)

```http
PATCH /shipping/orders/:id/status
```

**인증 필요**: 예 (관리자/매니저 권한)

**Parameters:**
- `id` (number): 배송 접수 ID

**Request Body:**
```json
{
  "status": "배송중"  // 가능한 값: "접수완료", "배송준비", "배송중", "배송완료", "취소", "반송"
}
```

**Response:**
```json
{
  "message": "주문 상태가 성공적으로 업데이트되었습니다.",
  "order": {
    // 업데이트된 주문 정보 (전체)
  }
}
```

### 운송장 추적 (공개 API)
운송장 번호로 배송 상태를 추적합니다. 인증이 필요하지 않습니다.

```http
GET /shipping/tracking/:trackingNumber
```

**Parameters:**
- `trackingNumber` (string): 운송장 번호

**Response:**
```json
{
  "trackingNumber": "TRK2024010100001",
  "currentStatus": "배송중",
  "trackingCompany": "한진택배",
  "estimatedDelivery": "2024-01-03",
  "orderInfo": {
    "senderName": "홍길동",
    "recipientName": "김철수",
    "recipientAddress": "부산시 해운대구 센텀로 789 101동 202호",
    "productName": "전자제품",
    "weight": 2.5,
    "value": 50000
  },
  "statusHistory": [
    {
      "status": "접수완료",
      "timestamp": "2024-01-01T00:00:00.000Z",
      "location": "집하점",
      "description": "배송 접수가 완료되었습니다."
    },
    {
      "status": "배송준비",
      "timestamp": "2024-01-01T10:00:00.000Z",
      "location": "물류센터",
      "description": "배송 준비 중입니다."
    },
    {
      "status": "배송중",
      "timestamp": "2024-01-02T08:00:00.000Z",
      "location": "배송 중",
      "description": "상품이 배송 중입니다."
    }
  ]
}
```

### 운송장 번호 할당 (관리자 전용)
관리자가 배송 접수에 운송장 번호를 할당합니다.

```http
POST /shipping/orders/:id/tracking
```

**인증 필요**: 예 (관리자 권한)

**Parameters:**
- `id` (number): 배송 접수 ID

**Request Body:**
```json
{
  "tracking_number": "string",      // 필수: 운송장 번호
  "tracking_company": "string",     // 선택: 운송회사
  "estimated_delivery": "string"    // 선택: 예상 배송일 (YYYY-MM-DD)
}
```

**Response:**
```json
{
  "message": "운송장 번호가 성공적으로 할당되었습니다.",
  "tracking_number": "HD123456789"
}
```

## 에러 응답

모든 API는 오류 발생 시 다음과 같은 형식으로 응답합니다:

```json
{
  "error": "Error Type",
  "message": "사용자에게 표시할 오류 메시지"
}
```

### HTTP 상태 코드

- `200` OK - 요청 성공
- `201` Created - 리소스 생성 성공
- `400` Bad Request - 잘못된 요청
- `401` Unauthorized - 인증 실패
- `403` Forbidden - 권한 없음
- `404` Not Found - 리소스를 찾을 수 없음
- `409` Conflict - 리소스 충돌 (중복 등)
- `500` Internal Server Error - 서버 내부 오류

## 상태값 정의

### 배송 상태
- `접수완료`: 배송 접수가 완료된 상태
- `배송준비`: 배송을 위한 준비 중인 상태
- `배송중`: 배송이 진행 중인 상태
- `배송완료`: 배송이 완료된 상태
- `취소`: 배송이 취소된 상태
- `반송`: 배송 실패로 인한 반송 상태

### 사용자 역할 (Role)
- `user`: 일반 사용자
- `manager`: 매니저 (주문 상태 변경 가능)
- `admin`: 관리자 (모든 권한)