import React, { useState, useEffect } from 'react';
import { LogOut, Package, BarChart3, Plus, Users, Search } from 'lucide-react';
import { AuthContext, useAuthProvider, useAuth } from './hooks/useAuth';
import { useNotification } from './hooks/useNotification';
import AuthPage from './components/auth/AuthPage';
import ShippingOrderForm from './components/shipping/ShippingOrderForm';
import Dashboard from './components/dashboard/Dashboard';
import UserManagement from './components/admin/UserManagement';
import TrackingPage from './components/tracking/TrackingPage';
import ToastContainer from './components/notifications/ToastContainer';
import NotificationPermission from './components/notifications/NotificationPermission';

const AppContent: React.FC = () => {
  const { user, isLoading, isAuthenticated, logout } = useAuth();
  const {
    permission,
    toasts,
    requestPermission,
    removeToast,
    notifyOrderStatusChange,
    notifyNewOrder
  } = useNotification();
  type PageType = 'dashboard' | 'new-order' | 'users' | 'tracking';
  const [currentPage, setCurrentPage] = useState<PageType>('dashboard');
  const [showPermissionRequest, setShowPermissionRequest] = useState(false);

  // URL에서 tracking 모드 확인
  useEffect(() => {
    const urlPath = window.location.pathname;
    const searchParams = new URLSearchParams(window.location.search);
    
    if (urlPath.includes('/tracking') || searchParams.has('number')) {
      setCurrentPage('tracking' as PageType);
    }
  }, []);

  // 로그인 후 알림 권한 요청 (관리자/매니저만)
  useEffect(() => {
    if (isAuthenticated && (user?.role === 'admin' || user?.role === 'manager') && permission === 'default') {
      const timer = setTimeout(() => {
        setShowPermissionRequest(true);
      }, 2000); // 2초 후 권한 요청 표시
      
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, user?.role, permission]);

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

  // 추적 페이지는 인증없이 접근 가능
  if (currentPage === 'tracking') {
    return <TrackingPage onNavigateBack={isAuthenticated ? () => setCurrentPage('dashboard' as PageType) : undefined} />;
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
            <nav className="flex items-center gap-1 sm:gap-2">
              <button
                onClick={() => setCurrentPage('dashboard' as PageType)}
                className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg transition-colors touch-manipulation ${
                  currentPage === 'dashboard'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <BarChart3 className="w-5 h-5" />
                <span className="hidden md:inline">대시보드</span>
              </button>
              
              <button
                onClick={() => setCurrentPage('new-order' as PageType)}
                className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg transition-colors touch-manipulation ${
                  currentPage === 'new-order'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <Plus className="w-5 h-5" />
                <span className="hidden md:inline">새 배송접수</span>
              </button>

              <button
                onClick={() => setCurrentPage('tracking' as PageType)}
                className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg transition-colors touch-manipulation ${
                  (currentPage as string) === 'tracking'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <Search className="w-5 h-5" />
                <span className="hidden md:inline">배송 추적</span>
              </button>
              
              {/* 테스트용 알림 버튼 (개발 중) */}
              {(user?.role === 'admin' || user?.role === 'manager') && (
                <button
                  onClick={() => {
                    notifyOrderStatusChange({
                      orderId: 123,
                      status: '배송완료',
                      customerName: '테스트 고객',
                      trackingNumber: '1234567890'
                    });
                  }}
                  className="px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 text-sm"
                  title="알림 테스트"
                >
                  🔔
                </button>
              )}
              
              {/* 관리자/매니저만 사용자 관리 메뉴 표시 */}
              {(user?.role === 'admin' || user?.role === 'manager') && (
                <button
                  onClick={() => setCurrentPage('users' as PageType)}
                  className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg transition-colors touch-manipulation ${
                    currentPage === 'users'
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <Users className="w-5 h-5" />
                  <span className="hidden md:inline">사용자 관리</span>
                </button>
              )}
            </nav>
            
            <div className="flex items-center gap-2 sm:gap-4">
              <div className="text-right hidden sm:block">
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
              
              {/* 모바일에서는 역할 배지만 표시 */}
              <div className="sm:hidden">
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
              
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-3 sm:px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors touch-manipulation"
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
            <Dashboard 
              key={Date.now()} 
              onOrderStatusChange={notifyOrderStatusChange}
            />
          ) : currentPage === 'users' ? (
            <UserManagement />
          ) : (currentPage as string) === 'tracking' ? (
            <TrackingPage onNavigateBack={() => setCurrentPage('dashboard' as PageType)} />
          ) : (
            <>
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">새 배송 접수</h2>
                <p className="text-gray-600">
                  배송할 물품의 정보를 입력하여 접수를 완료하세요. 
                  총 26개의 필드를 단계별로 입력할 수 있습니다.
                </p>
              </div>
              
              <ShippingOrderForm 
                onSuccess={() => setCurrentPage('dashboard' as PageType)}
                onNewOrder={notifyNewOrder}
              />
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
      
      {/* 알림 시스템 */}
      <ToastContainer toasts={toasts} onRemoveToast={removeToast} />
      
      {/* 알림 권한 요청 */}
      {showPermissionRequest && (
        <NotificationPermission
          permission={permission}
          onRequestPermission={requestPermission}
          onDismiss={() => setShowPermissionRequest(false)}
        />
      )}
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
