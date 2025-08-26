import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { User, Lock, Phone, Building, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import type { LoginData, RegisterData } from '../../types';

const AuthPage: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string>('');
  const [usernameCheck, setUsernameCheck] = useState<{ available: boolean; message: string } | null>(null);

  const { login, register, checkUsername } = useAuth();

  const loginForm = useForm<LoginData>();
  const registerForm = useForm<RegisterData>();

  // 로그인 처리
  const handleLogin = async (data: LoginData) => {
    try {
      setIsSubmitting(true);
      setError('');
      await login(data);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 회원가입 처리
  const handleRegister = async (data: RegisterData) => {
    try {
      setIsSubmitting(true);
      setError('');

      // 비밀번호 확인
      if (data.password !== data.confirmPassword) {
        setError('비밀번호가 일치하지 않습니다.');
        return;
      }

      await register(data);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 아이디 중복 확인
  const handleUsernameCheck = async (username: string) => {
    if (username.length < 3) {
      setUsernameCheck(null);
      return;
    }

    try {
      const result = await checkUsername(username);
      setUsernameCheck(result);
    } catch (error: any) {
      setUsernameCheck({ available: false, message: error.message });
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setError('');
    setUsernameCheck(null);
    loginForm.reset();
    registerForm.reset();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
        {/* 헤더 */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <User className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">배송접수 시스템</h1>
          <p className="text-gray-600">
            {isLogin ? '로그인하여 서비스를 이용하세요' : '회원가입하여 시작하세요'}
          </p>
        </div>

        {/* 에러 메시지 */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-6 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <span className="text-red-700 text-sm">{error}</span>
          </div>
        )}

        {/* 로그인 폼 */}
        {isLogin ? (
          <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">아이디</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  {...loginForm.register('username', { required: '아이디를 입력하세요' })}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="아이디를 입력하세요"
                />
              </div>
              {loginForm.formState.errors.username && (
                <p className="mt-1 text-sm text-red-600">{loginForm.formState.errors.username.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">비밀번호</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  {...loginForm.register('password', { required: '비밀번호를 입력하세요' })}
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="비밀번호를 입력하세요"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {loginForm.formState.errors.password && (
                <p className="mt-1 text-sm text-red-600">{loginForm.formState.errors.password.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white font-medium py-3 rounded-lg transition-colors"
            >
              {isSubmitting ? '로그인 중...' : '로그인'}
            </button>
          </form>
        ) : (
          // 회원가입 폼
          <form onSubmit={registerForm.handleSubmit(handleRegister)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">아이디</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  {...registerForm.register('username', { 
                    required: '아이디를 입력하세요',
                    minLength: { value: 3, message: '아이디는 3자 이상이어야 합니다' },
                    onChange: (e) => handleUsernameCheck(e.target.value)
                  })}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="아이디를 입력하세요"
                />
              </div>
              {registerForm.formState.errors.username && (
                <p className="mt-1 text-sm text-red-600">{registerForm.formState.errors.username.message}</p>
              )}
              {usernameCheck && (
                <p className={`mt-1 text-sm ${usernameCheck.available ? 'text-green-600' : 'text-red-600'}`}>
                  {usernameCheck.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">이름</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  {...registerForm.register('name', { required: '이름을 입력하세요' })}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="이름을 입력하세요"
                />
              </div>
              {registerForm.formState.errors.name && (
                <p className="mt-1 text-sm text-red-600">{registerForm.formState.errors.name.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">비밀번호</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  {...registerForm.register('password', { 
                    required: '비밀번호를 입력하세요',
                    minLength: { value: 6, message: '비밀번호는 6자 이상이어야 합니다' }
                  })}
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="비밀번호를 입력하세요"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {registerForm.formState.errors.password && (
                <p className="mt-1 text-sm text-red-600">{registerForm.formState.errors.password.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">비밀번호 확인</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  {...registerForm.register('confirmPassword', { required: '비밀번호 확인을 입력하세요' })}
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="비밀번호를 다시 입력하세요"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {registerForm.formState.errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-600">{registerForm.formState.errors.confirmPassword.message}</p>
              )}
            </div>

            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">전화번호 (선택)</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="tel"
                    {...registerForm.register('phone')}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="전화번호를 입력하세요"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">회사명 (선택)</label>
                <div className="relative">
                  <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    {...registerForm.register('company')}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="회사명을 입력하세요"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || (usernameCheck && !usernameCheck.available) || false}
              className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white font-medium py-3 rounded-lg transition-colors"
            >
              {isSubmitting ? '가입 중...' : '회원가입'}
            </button>
          </form>
        )}

        {/* 모드 전환 */}
        <div className="mt-6 text-center">
          <button
            onClick={toggleMode}
            className="text-blue-500 hover:text-blue-600 text-sm font-medium"
          >
            {isLogin ? '회원가입하기' : '이미 계정이 있나요? 로그인하기'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;