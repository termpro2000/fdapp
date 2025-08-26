import React, { useState } from 'react';
import { LogOut, Package, BarChart3, Plus, Users } from 'lucide-react';
import { AuthContext, useAuthProvider, useAuth } from './hooks/useAuth';
import AuthPage from './components/auth/AuthPage';
import ShippingOrderForm from './components/shipping/ShippingOrderForm';
import Dashboard from './components/dashboard/Dashboard';
import UserManagement from './components/admin/UserManagement';

const AppContent: React.FC = () => {
  const { user, isLoading, isAuthenticated, logout } = useAuth();
  const [currentPage, setCurrentPage] = useState<'dashboard' | 'new-order' | 'users'>('dashboard');

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AuthPage />;
  }

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('로그아웃 오류:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* 헤더 */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <Package className="w-8 h-8 text-blue-500" />
              <div>
                <h1 className="text-xl font-bold text-gray-900">배송접수 시스템</h1>
                <p className="text-sm text-gray-500">간편한 배송 접수 서비스</p>
              </div>
            </div>
            
            {/* 네비게이션 메뉴 */}
            <nav className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage('dashboard')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  currentPage === 'dashboard'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <BarChart3 className="w-5 h-5" />
                <span className="hidden sm:inline">대시보드</span>
              </button>
              
              <button
                onClick={() => setCurrentPage('new-order')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  currentPage === 'new-order'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <Plus className="w-5 h-5" />
                <span className="hidden sm:inline">새 배송접수</span>
              </button>
              
              {/* 관리자/매니저만 사용자 관리 메뉴 표시 */}
              {(user?.role === 'admin' || user?.role === 'manager') && (
                <button
                  onClick={() => setCurrentPage('users')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                    currentPage === 'users'
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <Users className="w-5 h-5" />
                  <span className="hidden sm:inline">사용자 관리</span>
                </button>
              )}
            </nav>
            
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="flex items-center gap-2">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{user?.name}님</p>
                    <p className="text-xs text-gray-500">@{user?.username}</p>
                  </div>
                  {user?.role && (
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      user.role === 'admin' 
                        ? 'bg-red-100 text-red-800' 
                        : user.role === 'manager'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {user.role === 'admin' ? '관리자' : user.role === 'manager' ? '매니저' : '사용자'}
                    </span>
                  )}
                </div>
              </div>
              
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                title="로그아웃"
              >
                <LogOut className="w-5 h-5" />
                <span className="hidden sm:inline">로그아웃</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* 메인 콘텐츠 */}
      <main className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {currentPage === 'dashboard' ? (
            <Dashboard key={Date.now()} />
          ) : currentPage === 'users' ? (
            <UserManagement />
          ) : (
            <>
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">새 배송 접수</h2>
                <p className="text-gray-600">
                  배송할 물품의 정보를 입력하여 접수를 완료하세요. 
                  총 26개의 필드를 단계별로 입력할 수 있습니다.
                </p>
              </div>
              
              <ShippingOrderForm onSuccess={() => setCurrentPage('dashboard')} />
            </>
          )}
        </div>
      </main>
      
      {/* 푸터 */}
      <footer className="bg-white border-t mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center text-sm text-gray-500">
            <p>&copy; 2024 배송접수 시스템. All rights reserved.</p>
            <p className="mt-1">안전하고 신뢰할 수 있는 배송 서비스를 제공합니다.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

const App: React.FC = () => {
  const authValue = useAuthProvider();

  return (
    <AuthContext.Provider value={authValue}>
      <AppContent />
    </AuthContext.Provider>
  );
};

export default App;
