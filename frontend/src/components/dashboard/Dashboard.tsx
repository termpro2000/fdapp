import React, { useState, useEffect, useRef } from 'react';
import { Package, TrendingUp, Clock, CheckCircle, AlertCircle, Eye, Search, Filter, RefreshCw, Pause, Play } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { api, shippingAPI } from '../../services/api';
import type { ShippingOrder } from '../../types';
import OrderDetailModal from './OrderDetailModal';

interface DashboardStats {
  total: number;
  pending: number;
  processing: number;
  completed: number;
  cancelled: number;
}

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<ShippingOrder[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    total: 0,
    pending: 0,
    processing: 0,
    completed: 0,
    cancelled: 0
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState<ShippingOrder | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isAutoRefreshEnabled, setIsAutoRefreshEnabled] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const visibilityRef = useRef<boolean>(true);

  // 페이지 가시성 감지
  useEffect(() => {
    const handleVisibilityChange = () => {
      visibilityRef.current = !document.hidden;
      
      // 페이지가 보이게 되면 즉시 새로고침
      if (!document.hidden && isAutoRefreshEnabled) {
        fetchOrders(true);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isAutoRefreshEnabled]);

  // 자동 새로고침 설정
  useEffect(() => {
    if (isAutoRefreshEnabled) {
      intervalRef.current = setInterval(() => {
        // 페이지가 보일 때만 새로고침
        if (visibilityRef.current) {
          fetchOrders(true); // 새로고침 인디케이터 표시
        }
      }, 10000); // 10초마다
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isAutoRefreshEnabled]);

  // 컴포넌트 마운트 시 초기 데이터 로드
  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async (showRefreshIndicator = false) => {
    try {
      if (showRefreshIndicator) {
        setIsRefreshing(true);
      } else {
        setLoading(true);
      }
      
      const response = await api.get('/shipping/orders');
      const ordersData = response.data.orders || [];
      
      setOrders(ordersData);
      setLastUpdated(new Date());
      
      // 통계 계산
      const newStats = {
        total: ordersData.length,
        pending: ordersData.filter((o: ShippingOrder) => o.status === 'pending').length,
        processing: ordersData.filter((o: ShippingOrder) => o.status === 'processing').length,
        completed: ordersData.filter((o: ShippingOrder) => o.status === 'completed').length,
        cancelled: ordersData.filter((o: ShippingOrder) => o.status === 'cancelled').length
      };
      setStats(newStats);
    } catch (error: any) {
      console.error('주문 목록을 가져오는 중 오류 발생:', error);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800', text: '접수대기', icon: Clock },
      processing: { color: 'bg-blue-100 text-blue-800', text: '처리중', icon: TrendingUp },
      completed: { color: 'bg-green-100 text-green-800', text: '완료', icon: CheckCircle },
      cancelled: { color: 'bg-red-100 text-red-800', text: '취소', icon: AlertCircle }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const Icon = config.icon;
    
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        <Icon className="w-3 h-3" />
        {config.text}
      </span>
    );
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.tracking_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.receiver_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.sender_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const handleOrderClick = (order: ShippingOrder) => {
    setSelectedOrder(order);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedOrder(null);
  };

  const handleManualRefresh = () => {
    fetchOrders(true);
  };

  const toggleAutoRefresh = () => {
    setIsAutoRefreshEnabled(!isAutoRefreshEnabled);
  };

  const formatLastUpdated = (date: Date) => {
    return date.toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const handleStatusUpdate = async (orderId: number, newStatus: string) => {
    try {
      await shippingAPI.updateOrderStatus(orderId, newStatus);
      
      // 주문 목록 새로고침
      await fetchOrders(true);
      
      // 선택된 주문 업데이트
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder({ ...selectedOrder, status: newStatus });
      }
      
      // 성공 알림
      setNotification({
        type: 'success',
        message: '주문 상태가 성공적으로 업데이트되었습니다.'
      });
      
      // 3초 후 알림 제거
      setTimeout(() => setNotification(null), 3000);
      
    } catch (error: any) {
      console.error('상태 업데이트 실패:', error);
      setNotification({
        type: 'error',
        message: error.response?.data?.message || '상태 업데이트 중 오류가 발생했습니다.'
      });
      
      // 5초 후 알림 제거
      setTimeout(() => setNotification(null), 5000);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">대시보드를 로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 알림 메시지 */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg border ${
          notification.type === 'success' 
            ? 'bg-green-50 text-green-800 border-green-200' 
            : 'bg-red-50 text-red-800 border-red-200'
        }`}>
          <div className="flex items-center gap-2">
            {notification.type === 'success' ? (
              <CheckCircle className="w-5 h-5" />
            ) : (
              <AlertCircle className="w-5 h-5" />
            )}
            <span className="font-medium">{notification.message}</span>
          </div>
        </div>
      )}
      {/* 환영 메시지 */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-6 text-white">
        <h2 className="text-2xl font-bold mb-2">안녕하세요, {user?.name}님! 👋</h2>
        <p className="text-blue-100">
          오늘도 안전하고 신속한 배송 서비스를 제공해보세요.
        </p>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">전체 주문</p>
              <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <Package className="w-12 h-12 text-blue-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">접수대기</p>
              <p className="text-3xl font-bold text-yellow-600">{stats.pending}</p>
            </div>
            <Clock className="w-12 h-12 text-yellow-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">처리중</p>
              <p className="text-3xl font-bold text-blue-600">{stats.processing}</p>
            </div>
            <TrendingUp className="w-12 h-12 text-blue-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">완료</p>
              <p className="text-3xl font-bold text-green-600">{stats.completed}</p>
            </div>
            <CheckCircle className="w-12 h-12 text-green-500" />
          </div>
        </div>
      </div>

      {/* 주문 목록 */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <h3 className="text-lg font-semibold text-gray-900">배송 주문 목록</h3>
              
              {/* 새로고침 상태 표시 */}
              <div className="flex items-center gap-2 text-sm text-gray-500">
                {isRefreshing && (
                  <RefreshCw className="w-4 h-4 animate-spin text-blue-500" />
                )}
                <span>마지막 업데이트: {formatLastUpdated(lastUpdated)}</span>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3">
              {/* 새로고침 컨트롤 */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handleManualRefresh}
                  disabled={isRefreshing}
                  className="flex items-center gap-1 px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
                  title="수동 새로고침"
                >
                  <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                  새로고침
                </button>
                
                <button
                  onClick={toggleAutoRefresh}
                  className={`flex items-center gap-1 px-3 py-2 text-sm rounded-lg border transition-colors ${
                    isAutoRefreshEnabled 
                      ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100' 
                      : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                  }`}
                  title={isAutoRefreshEnabled ? '자동 새로고침 끄기' : '자동 새로고침 켜기'}
                >
                  {isAutoRefreshEnabled ? (
                    <>
                      <Pause className="w-4 h-4" />
                      자동새로고침 ON
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4" />
                      자동새로고침 OFF
                    </>
                  )}
                </button>
              </div>
              {/* 검색 */}
              <div className="relative">
                <Search className="w-5 h-5 absolute left-3 top-3 text-gray-400" />
                <input
                  type="text"
                  placeholder="운송장번호, 수취인, 발송인 검색..."
                  className="pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              {/* 상태 필터 */}
              <div className="relative">
                <Filter className="w-5 h-5 absolute left-3 top-3 text-gray-400" />
                <select
                  className="pl-10 pr-8 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="all">모든 상태</option>
                  <option value="pending">접수대기</option>
                  <option value="processing">처리중</option>
                  <option value="completed">완료</option>
                  <option value="cancelled">취소</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  운송장번호
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  발송인
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  수취인
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  상품명
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  상태
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  접수일
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  액션
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                    {searchTerm || statusFilter !== 'all' ? '검색 결과가 없습니다.' : '배송 주문이 없습니다.'}
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {order.tracking_number || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {order.sender_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {order.receiver_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {order.package_description || order.package_type || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(order.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(order.created_at).toLocaleDateString('ko-KR')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        className="text-blue-600 hover:text-blue-900 flex items-center gap-1"
                        onClick={() => handleOrderClick(order)}
                      >
                        <Eye className="w-4 h-4" />
                        상세보기
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 주문 상세 모달 */}
      <OrderDetailModal
        order={selectedOrder}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onStatusUpdate={handleStatusUpdate}
      />
    </div>
  );
};

export default Dashboard;