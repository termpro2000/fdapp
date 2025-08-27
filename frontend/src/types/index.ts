// 사용자 타입
export interface User {
  id: number;
  username: string;
  name: string;
  phone?: string;
  company?: string;
  role?: string;
}

// 인증 관련 타입
export interface LoginData {
  username: string;
  password: string;
}

export interface RegisterData {
  username: string;
  password: string;
  confirmPassword: string;
  name: string;
  phone?: string;
  company?: string;
}

// 배송접수 관련 타입 (26개 필드)
export interface ShippingOrderData {
  // 발송인 정보 (7개)
  sender_name: string;
  sender_phone: string;
  sender_email?: string;
  sender_company?: string;
  sender_address: string;
  sender_detail_address?: string;
  sender_zipcode: string;
  
  // 수취인 정보 (7개)
  receiver_name: string;
  receiver_phone: string;
  receiver_email?: string;
  receiver_company?: string;
  receiver_address: string;
  receiver_detail_address?: string;
  receiver_zipcode: string;
  
  // 배송 정보 (8개)
  package_type?: string;
  package_weight?: number;
  package_size?: string;
  package_value?: number;
  delivery_type?: string;
  delivery_date?: string;
  delivery_time?: string;
  package_description?: string;
  
  // 특수 옵션 (4개)
  is_fragile?: boolean;
  is_frozen?: boolean;
  requires_signature?: boolean;
  insurance_amount?: number;
  
  // 추가 메모
  delivery_memo?: string;
  special_instructions?: string;
}

// 배송접수 완료 후 응답 타입 (데이터베이스 스키마와 일치)
export interface ShippingOrder {
  id: number;
  user_id: number;
  
  // 발송인 정보 (7개)
  sender_name: string;
  sender_phone: string;
  sender_email?: string;
  sender_company?: string;
  sender_address: string;
  sender_detail_address?: string;
  sender_zipcode: string;
  
  // 수취인 정보 (7개)
  receiver_name: string;
  receiver_phone: string;
  receiver_email?: string;
  receiver_company?: string;
  receiver_address: string;
  receiver_detail_address?: string;
  receiver_zipcode: string;
  
  // 배송 정보 (8개)
  package_type?: string;
  package_weight?: number;
  package_size?: string;
  package_value?: number;
  delivery_type?: string;
  delivery_date?: string;
  delivery_time?: string;
  package_description?: string;
  
  // 특수 옵션 (4개)
  is_fragile?: boolean;
  is_frozen?: boolean;
  requires_signature?: boolean;
  insurance_amount?: number;
  
  // 추가 메모
  delivery_memo?: string;
  special_instructions?: string;
  
  // 시스템 필드
  status: string;
  tracking_number?: string;
  tracking_company?: string;
  estimated_delivery?: string;
  created_at: string;
  updated_at: string;
}

// 배송접수 목록 조회 응답 타입
export interface ShippingOrderListItem {
  id: number;
  tracking_number: string;
  status: string;
  sender_name: string;
  receiver_name: string;
  package_type: string;
  delivery_type: string;
  created_at: string;
  updated_at: string;
}

// API 응답 공통 타입
export interface ApiResponse<T = any> {
  message?: string;
  error?: string;
  data?: T;
}

// 페이지네이션 타입
export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}