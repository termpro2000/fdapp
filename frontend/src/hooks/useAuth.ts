import { useState, useEffect, createContext, useContext } from 'react';
import type { User, LoginData, RegisterData } from '../types';
import { authAPI } from '../services/api';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (data: LoginData) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  checkUsername: (username: string) => Promise<{ available: boolean; message: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const useAuthProvider = (): AuthContextType => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  /**
   * 컴포넌트 마운트 시 기존 세션 유지 여부 확인
   * 브라우저 새로고침 시에도 로그인 상태 유지
   */
  useEffect(() => {
    checkSession();
  }, []);

  /**
   * 서버에서 현재 세션 상태를 확인하고 사용자 정보를 가져오는 함수
   */
  const checkSession = async () => {
    try {
      setIsLoading(true);
      const response = await authAPI.me();
      if (response.authenticated && response.user) {
        setUser(response.user);
      }
    } catch (error) {
      console.log('세션 없음 또는 만료됨');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * 사용자 로그인 처리 함수
   * @param data - 로그인 정보 (사용자명, 비밀번호)
   * @throws {Error} 로그인 실패 시 에러 발생
   */
  const login = async (data: LoginData) => {
    try {
      const response = await authAPI.login(data);
      if (response.user) {
        setUser(response.user);
      }
    } catch (error: any) {
      const message = error.response?.data?.message || '로그인에 실패했습니다.';
      throw new Error(message);
    }
  };

  /**
   * 사용자 회원가입 처리 함수
   * 회원가입 성공 후 자동으로 로그인 처리
   * @param data - 회원가입 정보
   * @throws {Error} 회원가입 실패 시 에러 발생
   */
  const register = async (data: RegisterData) => {
    try {
      await authAPI.register(data);
      // 회원가입 성공 후 자동 로그인
      await login({
        username: data.username,
        password: data.password
      });
    } catch (error: any) {
      const message = error.response?.data?.message || '회원가입에 실패했습니다.';
      throw new Error(message);
    }
  };

  /**
   * 사용자 로그아웃 처리 함수
   * 서버 오류가 있어도 클라이언트에서는 로그아웃 상태로 처리
   */
  const logout = async () => {
    try {
      await authAPI.logout();
      setUser(null);
    } catch (error) {
      console.error('로그아웃 오류:', error);
      // 로그아웃은 서버 오류가 있어도 클라이언트에서는 처리
      setUser(null);
    }
  };

  /**
   * 아이디 중복 여부를 확인하는 함수
   * @param username - 확인할 사용자 아이디
   * @returns {Promise<{available: boolean, message: string}>} 사용 가능 여부와 메시지
   * @throws {Error} 아이디 확인 실패 시 에러 발생
   */
  const checkUsername = async (username: string) => {
    try {
      return await authAPI.checkUsername(username);
    } catch (error: any) {
      const message = error.response?.data?.message || '아이디 확인에 실패했습니다.';
      throw new Error(message);
    }
  };

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    checkUsername
  };
};

export { AuthContext };