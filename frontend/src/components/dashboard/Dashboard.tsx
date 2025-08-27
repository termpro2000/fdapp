import React, { useState, useEffect, useRef } from 'react';
import { Package, TrendingUp, Clock, CheckCircle, AlertCircle, Eye, Search, Filter, RefreshCw, Pause, Play, Truck, Download, FileSpreadsheet, FileText } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { api, shippingAPI } from '../../services/api';
import type { ShippingOrder } from '../../types';
import OrderDetailModal from './OrderDetailModal';

/**
 * 대시보드 통계 데이터 인터페이스
 */
interface DashboardStats {
  total: number;
  접수완료: number;
  배송준비: number;
  배송중: number;
  배송완료: number;
  취소: number;
  반송: number;
}

/**
 * 대시보드 컴포넌트 props 인터페이스
 */
interface DashboardProps {
  /** 주문 상태 변경 시 호출되는 콜백 함수 */
  onOrderStatusChange?: (orderInfo: {
    orderId: number;
    status: string;
    customerName?: string;
    trackingNumber?: string;
  }) => void;
}

/**
 * 배송 관리 대시보드 컴포넌트
 * 주문 목록 조회, 통계 표시, 실시간 업데이트, 데이터 내보내기 기능 제공
 * 
 * @param props - 컴포넌트 props
 * @returns 대시보드 JSX 엘리먼트
 */
const Dashboard: React.FC<DashboardProps> = ({ onOrderStatusChange }) => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<ShippingOrder[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    total: 0,
    접수완료: 0,
    배송준비: 0,
    배송중: 0,
    배송완료: 0,
    취소: 0,
    반송: 0
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState<ShippingOrder | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAutoRefreshEnabled, setIsAutoRefreshEnabled] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showExportModal, setShowExportModal] = useState(false);
  const intervalRef = useRef<number | null>(null);
  const visibilityRef = useRef<boolean>(true);

  /**
   * 페이지 가시성 변화를 감지하여 비활성 상태에서 자동 새로고침을 중지하고,
   * 다시 활성화될 때 즉시 데이터를 업데이트
   */
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

  /**
   * 자동 새로고침 기능 설정 - 10초마다 데이터 업데이트
   * 페이지가 보이는 상태에서만 실행
   */
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

  /**
   * 컴포넌트 마운트 시 초기 데이터 로드
   */
  useEffect(() => {
    fetchOrders();
  }, []);

  /**
   * 서버에서 주문 데이터를 가져와서 로컬 상태와 통계를 업데이트
   * @param showRefreshIndicator - 새로고침 인디케이터 표시 여부
   */
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
        접수완료: ordersData.filter((o: ShippingOrder) => o.status === '접수완료').length,
        배송준비: ordersData.filter((o: ShippingOrder) => o.status === '배송준비').length,
        배송중: ordersData.filter((o: ShippingOrder) => o.status === '배송중').length,
        배송완료: ordersData.filter((o: ShippingOrder) => o.status === '배송완료').length,
        취소: ordersData.filter((o: ShippingOrder) => o.status === '취소').length,
        반송: ordersData.filter((o: ShippingOrder) => o.status === '반송').length
      };
      setStats(newStats);
    } catch (error: any) {
      console.error('주문 목록을 가져오는 중 오류 발생:', error);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  /**
   * 주문 상태에 따른 배지 스타일과 아이콘을 반환
   * @param status - 주문 상태 (접수완료, 배솨준비, 배송중, 배송완료, 취소, 반송)
   * @returns JSX 요소
   */
  const getStatusBadge = (status: string) => {
    const statusConfig = {
      '접수완료': { color: 'bg-yellow-100 text-yellow-800', text: '접수완료', icon: Clock },
      '배송준비': { color: 'bg-blue-100 text-blue-800', text: '배송준비', icon: TrendingUp },
      '배송중': { color: 'bg-orange-100 text-orange-800', text: '배송중', icon: Truck },
      '배송완료': { color: 'bg-green-100 text-green-800', text: '배송완료', icon: CheckCircle },
      '취소': { color: 'bg-red-100 text-red-800', text: '취소', icon: AlertCircle },
      '반송': { color: 'bg-red-100 text-red-800', text: '반송', icon: AlertCircle }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig['접수완료'];
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
      
      // 알림 발송
      if (onOrderStatusChange && selectedOrder) {
        onOrderStatusChange({
          orderId: orderId,
          status: newStatus,
          customerName: selectedOrder.receiver_name,
          trackingNumber: selectedOrder.tracking_number
        });
      }
      
    } catch (error: any) {
      console.error('상태 업데이트 실패:', error);
    }
  };

  /**
   * 데이터를 지정된 형식으로 내보내기
   * @param format - 내보내기 형식 (xlsx 또는 csv)
   * @param type - 내보내기 데이터 유형 (orders: 주문 데이터, statistics: 통계 데이터)
   */
  const handleExport = async (format: 'xlsx' | 'csv', type: 'orders' | 'statistics') => {
    try {
      const params = new URLSearchParams();
      params.append('format', format);
      
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      if (statusFilter !== 'all') params.append('status', statusFilter);
      
      const endpoint = type === 'orders' ? 'orders' : 'statistics';
      const url = `/api/exports/${endpoint}?${params.toString()}`;
      
      // 파일 다운로드
      const response = await fetch(url, {
        method: 'GET',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Export failed');
      }

      const blob = await response.blob();
      const filename = response.headers.get('Content-Disposition')?.match(/filename="(.+)"/)?.[1] || 
                     `export_${type}_${new Date().toISOString().split('T')[0]}.${format}`;
      
      // 파일 다운로드 트리거
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = decodeURIComponent(filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);
      
      setShowExportModal(false);
    } catch (error) {
      console.error('Export error:', error);
      alert('데이터 내보내기 중 오류가 발생했습니다.');
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
              <p className="text-sm text-gray-600">접수완료</p>
              <p className="text-3xl font-bold text-yellow-600">{stats.접수완료}</p>
            </div>
            <Clock className="w-12 h-12 text-yellow-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">배송중</p>
              <p className="text-3xl font-bold text-blue-600">{stats.배송중}</p>
            </div>
            <Truck className="w-12 h-12 text-blue-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">배송완료</p>
              <p className="text-3xl font-bold text-green-600">{stats.배송완료}</p>
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
            
            <div className="flex flex-col gap-4">
              {/* 모바일: 상단 컨트롤 행 */}
              <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                {/* 새로고침 컨트롤 */}
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    onClick={handleManualRefresh}
                    disabled={isRefreshing}
                    className="flex items-center gap-1 px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors touch-manipulation"
                    title="수동 새로고침"
                  >
                    <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                    <span className="hidden xs:inline">새로고침</span>
                  </button>
                  
                  <button
                    onClick={toggleAutoRefresh}
                    className={`flex items-center gap-1 px-3 py-2 text-sm rounded-lg border transition-colors touch-manipulation ${
                      isAutoRefreshEnabled 
                        ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100' 
                        : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                    }`}
                    title={isAutoRefreshEnabled ? '자동 새로고침 끄기' : '자동 새로고침 켜기'}
                  >
                    {isAutoRefreshEnabled ? (
                      <>
                        <Pause className="w-4 h-4" />
                        <span className="hidden xs:inline">자동 ON</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4" />
                        <span className="hidden xs:inline">자동 OFF</span>
                      </>
                    )}
                  </button>
                  
                  {/* 데이터 내보내기 버튼 */}
                  <button
                    onClick={() => setShowExportModal(true)}
                    className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors touch-manipulation"
                    title="데이터 내보내기"
                  >
                    <Download className="w-4 h-4" />
                    <span className="hidden xs:inline">내보내기</span>
                  </button>
                </div>
              </div>
              
              {/* 모바일: 검색 및 필터 행 */}
              <div className="flex flex-col sm:flex-row gap-3">
                {/* 검색 */}
                <div className="relative flex-1">
                  <Search className="w-5 h-5 absolute left-3 top-3 text-gray-400" />
                  <input
                    type="text"
                    placeholder="운송장번호, 수취인, 발송인 검색..."
                    className="w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>

                {/* 상태 필터 */}
                <div className="relative sm:w-48">
                  <Filter className="w-5 h-5 absolute left-3 top-3 text-gray-400 pointer-events-none" />
                  <select
                    className="w-full pl-10 pr-8 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white text-base"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <option value="all">모든 상태</option>
                    <option value="접수완료">접수완료</option>
                    <option value="배송준비">배송준비</option>
                    <option value="배송중">배송중</option>
                    <option value="배송완료">배송완료</option>
                    <option value="취소">취소</option>
                    <option value="반송">반송</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 데스크톱: 테이블 뷰 */}
        <div className="hidden lg:block overflow-x-auto">
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
                        className="text-blue-600 hover:text-blue-900 flex items-center gap-1 touch-manipulation"
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

        {/* 모바일/태블릿: 카드 뷰 */}
        <div className="lg:hidden space-y-4">
          {filteredOrders.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
              {searchTerm || statusFilter !== 'all' ? '검색 결과가 없습니다.' : '배송 주문이 없습니다.'}
            </div>
          ) : (
            filteredOrders.map((order) => (
              <div key={order.id} className="bg-white rounded-lg shadow hover:shadow-md transition-shadow">
                <div className="p-4">
                  {/* 카드 헤더 */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Truck className="w-5 h-5 text-blue-500" />
                      <span className="font-medium text-gray-900">
                        {order.tracking_number || `주문 #${order.id}`}
                      </span>
                    </div>
                    {getStatusBadge(order.status)}
                  </div>
                  
                  {/* 카드 내용 */}
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">발송인</span>
                      <span className="text-sm font-medium text-gray-900">{order.sender_name}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">수취인</span>
                      <span className="text-sm font-medium text-gray-900">{order.receiver_name}</span>
                    </div>
                    {(order.package_description || order.package_type) && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-500">상품</span>
                        <span className="text-sm font-medium text-gray-900 text-right">
                          {order.package_description || order.package_type}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">접수일</span>
                      <span className="text-sm font-medium text-gray-900">
                        {new Date(order.created_at).toLocaleDateString('ko-KR')}
                      </span>
                    </div>
                  </div>
                  
                  {/* 카드 액션 */}
                  <div className="flex justify-end">
                    <button
                      className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 transition-colors touch-manipulation"
                      onClick={() => handleOrderClick(order)}
                    >
                      <Eye className="w-4 h-4" />
                      상세보기
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 데이터 내보내기 모달 */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">데이터 내보내기</h3>
              
              {/* 날짜 범위 설정 */}
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">시작 날짜</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">종료 날짜</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* 내보내기 옵션 */}
              <div className="space-y-3 mb-6">
                <h4 className="text-sm font-medium text-gray-700">주문 데이터 내보내기</h4>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => handleExport('xlsx', 'orders')}
                    className="flex items-center justify-center gap-2 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <FileSpreadsheet className="w-5 h-5 text-green-600" />
                    <span className="text-sm">Excel 파일</span>
                  </button>
                  <button
                    onClick={() => handleExport('csv', 'orders')}
                    className="flex items-center justify-center gap-2 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <FileText className="w-5 h-5 text-blue-600" />
                    <span className="text-sm">CSV 파일</span>
                  </button>
                </div>
                
                {/* 매니저/관리자만 통계 리포트 내보내기 가능 */}
                {(user?.role === 'admin' || user?.role === 'manager') && (
                  <>
                    <h4 className="text-sm font-medium text-gray-700 mt-4">통계 리포트 내보내기</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => handleExport('xlsx', 'statistics')}
                        className="flex items-center justify-center gap-2 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <FileSpreadsheet className="w-5 h-5 text-green-600" />
                        <span className="text-sm">Excel 리포트</span>
                      </button>
                      <button
                        onClick={() => handleExport('csv', 'statistics')}
                        className="flex items-center justify-center gap-2 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <FileText className="w-5 h-5 text-blue-600" />
                        <span className="text-sm">CSV 리포트</span>
                      </button>
                    </div>
                  </>
                )}
              </div>

              {/* 버튼 */}
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowExportModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  취소
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 주문 상세 모달 */}
      <OrderDetailModal
        order={selectedOrder}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onStatusUpdate={(user?.role === 'admin' || user?.role === 'manager') ? handleStatusUpdate : undefined}
        onTrackingAssigned={() => {
          // 운송장 할당 후 데이터 새로고침
          fetchOrders(true);
        }}
      />
    </div>
  );
};

export default Dashboard;