import axios from 'axios';
import type { 
  User, 
  LoginData, 
  RegisterData, 
  ShippingOrderData,
  ShippingOrder,
  ShippingOrderListItem,
  Pagination 
} from '../types';

/**
 * API 베이스 URL 설정 (환경변수에서 가져오거나 기본값 사용)
 */
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

/**
 * Axios 클라이언트 인스턴스 생성
 * 세션 기반 인증을 위한 쿠키 포함 및 기본 설정 적용
 */
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // 세션 쿠키 포함
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  }
});

/**
 * 응답 인터셉터 설정 - 인증 오류 처리
 */
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // 인증 실패 시 로그인 페이지로 리다이렉트 (필요시)
      console.warn('인증이 필요합니다.');
    }
    return Promise.reject(error);
  }
);

/**
 * 인증 관련 API 함수들
 * 회원가입, 로그인, 로그아웃, 사용자 정보 조회 기능 제공
 */
export const authAPI = {
  // 회원가입
  register: async (data: RegisterData) => {
    const response = await apiClient.post('/auth/register', {
      username: data.username,
      password: data.password,
      name: data.name,
      phone: data.phone,
      company: data.company
    });
    return response.data;
  },

  // 아이디 중복 확인
  checkUsername: async (username: string) => {
    const response = await apiClient.get(`/auth/check-username/${username}`);
    return response.data;
  },

  // 로그인
  login: async (data: LoginData) => {
    const response = await apiClient.post('/auth/login', data);
    return response.data;
  },

  // 로그아웃
  logout: async () => {
    const response = await apiClient.post('/auth/logout');
    return response.data;
  },

  // 현재 사용자 정보
  me: async (): Promise<{ user: User; authenticated: boolean }> => {
    const response = await apiClient.get('/auth/me');
    return response.data;
  }
};

/**
 * 배송 관련 API 함수들
 * 배송 접수 생성, 조회, 수정, 운송장 추적 기능 제공
 */
export const shippingAPI = {
  // 배송접수 생성
  createOrder: async (data: ShippingOrderData) => {
    const response = await apiClient.post('/shipping/orders', data);
    return response.data;
  },

  // 배송접수 목록 조회
  getOrders: async (page = 1, limit = 10): Promise<{
    orders: ShippingOrderListItem[];
    pagination: Pagination;
  }> => {
    const response = await apiClient.get(`/shipping/orders?page=${page}&limit=${limit}`);
    return response.data;
  },

  // 배송접수 상세 조회
  getOrder: async (id: number): Promise<{ order: ShippingOrder }> => {
    const response = await apiClient.get(`/shipping/orders/${id}`);
    return response.data;
  },

  // 운송장 추적 (공개 API)
  trackShipment: async (trackingNumber: string) => {
    const response = await apiClient.get(`/shipping/tracking/${trackingNumber}`);
    return response.data;
  },

  // 배송 접수 상태 업데이트
  updateOrderStatus: async (id: number, status: string) => {
    const response = await apiClient.patch(`/shipping/orders/${id}/status`, { status });
    return response.data;
  },

  // 관리자용 운송장 번호 할당
  assignTrackingNumber: async (id: number, trackingData: {
    tracking_number: string;
    tracking_company?: string;
    estimated_delivery?: string;
  }) => {
    const response = await apiClient.post(`/shipping/orders/${id}/tracking`, trackingData);
    return response.data;
  }
};

/**
 * 사용자 관리 API 함수들 (관리자/매니저 전용)
 * 사용자 CRUD, 활동 로그 조회 기능 제공
 */
export const userAPI = {
  // 모든 사용자 조회 (관리자/매니저만)
  getAllUsers: async (page = 1, limit = 10, search = '', role = '') => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(search && { search }),
      ...(role && { role })
    });
    const response = await apiClient.get(`/users?${params}`);
    return response.data;
  },

  // 특정 사용자 조회
  getUser: async (id: number) => {
    const response = await apiClient.get(`/users/${id}`);
    return response.data;
  },

  // 사용자 생성 (관리자만)
  createUser: async (userData: {
    username: string;
    password: string;
    name: string;
    phone?: string;
    company?: string;
    role?: string;
  }) => {
    const response = await apiClient.post('/users', userData);
    return response.data;
  },

  // 사용자 업데이트 (관리자만)
  updateUser: async (id: number, userData: {
    name?: string;
    phone?: string;
    company?: string;
    role?: string;
    is_active?: boolean;
    password?: string;
  }) => {
    const response = await apiClient.put(`/users/${id}`, userData);
    return response.data;
  },

  // 사용자 삭제 (관리자만)
  deleteUser: async (id: number) => {
    const response = await apiClient.delete(`/users/${id}`);
    return response.data;
  },

  // 사용자 활동 로그 조회
  getUserActivities: async (page = 1, limit = 20, userId?: number, action?: string) => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(userId && { user_id: userId.toString() }),
      ...(action && { action })
    });
    const response = await apiClient.get(`/users/activities/logs?${params}`);
    return response.data;
  }
};

/**
 * 서버 상태 확인을 위한 헬스 체크 API
 * @returns 서버 상태 정보
 */
export const healthCheck = async () => {
  const response = await apiClient.get('/', { 
    baseURL: import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3000'
  });
  return response.data;
};

/**
 * API 클라이언트 인스턴스 내보내기
 * named export와 default export로 모두 사용 가능
 */
export const api = apiClient;
export default apiClient;