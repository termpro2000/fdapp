import React, { useState } from 'react';
import { X, Package, User, MapPin, Truck, Clock, CheckCircle, AlertCircle, TrendingUp, Edit } from 'lucide-react';
import type { ShippingOrder } from '../../types';

interface OrderDetailModalProps {
  order: ShippingOrder | null;
  isOpen: boolean;
  onClose: () => void;
  onStatusUpdate?: (orderId: number, newStatus: string) => Promise<void>;
}

const OrderDetailModal: React.FC<OrderDetailModalProps> = ({ order, isOpen, onClose, onStatusUpdate }) => {
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  
  if (!isOpen || !order) return null;

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
      <span className={`inline-flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium ${config.color}`}>
        <Icon className="w-4 h-4" />
        {config.text}
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const statusOptions = [
    { value: 'pending', label: '접수대기', color: 'bg-yellow-500' },
    { value: 'processing', label: '처리중', color: 'bg-blue-500' },
    { value: 'completed', label: '완료', color: 'bg-green-500' },
    { value: 'cancelled', label: '취소', color: 'bg-red-500' }
  ];

  const handleStatusChange = async (newStatus: string) => {
    if (!onStatusUpdate) return;
    
    setIsUpdatingStatus(true);
    try {
      await onStatusUpdate(order.id, newStatus);
      setShowStatusDropdown(false);
    } catch (error) {
      console.error('상태 변경 실패:', error);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* 배경 오버레이 */}
        <div 
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          onClick={onClose}
        ></div>

        {/* 모달 컨테이너 */}
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
          {/* 모달 헤더 */}
          <div className="bg-white px-6 py-4 border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Package className="w-6 h-6 text-blue-500" />
                <div>
                  <h3 className="text-lg font-medium text-gray-900">배송 주문 상세정보</h3>
                  <p className="text-sm text-gray-500">
                    주문 ID: {order.id} | 접수일: {formatDate(order.created_at)}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="relative">
                  {getStatusBadge(order.status)}
                  {onStatusUpdate && (
                    <button
                      onClick={() => setShowStatusDropdown(!showStatusDropdown)}
                      className="ml-2 p-1 rounded-full hover:bg-gray-100 transition-colors"
                      title="상태 변경"
                    >
                      <Edit className="w-4 h-4 text-gray-500" />
                    </button>
                  )}
                  
                  {/* 상태 변경 드롭다운 */}
                  {showStatusDropdown && (
                    <div className="absolute top-full left-0 mt-2 w-40 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                      <div className="py-1">
                        {statusOptions.map((option) => (
                          <button
                            key={option.value}
                            onClick={() => handleStatusChange(option.value)}
                            disabled={isUpdatingStatus || option.value === order.status}
                            className={`w-full px-3 py-2 text-left hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 ${
                              option.value === order.status ? 'bg-gray-50' : ''
                            }`}
                          >
                            <div className={`w-3 h-3 rounded-full ${option.color}`}></div>
                            <span className="text-sm">{option.label}</span>
                            {option.value === order.status && (
                              <CheckCircle className="w-4 h-4 text-green-500 ml-auto" />
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
          </div>

          {/* 모달 본문 */}
          <div className="bg-white px-6 py-4 max-h-[calc(100vh-200px)] overflow-y-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              
              {/* 발송인 정보 */}
              <div className="bg-gray-50 rounded-lg p-6">
                <div className="flex items-center gap-2 mb-4">
                  <User className="w-5 h-5 text-blue-500" />
                  <h4 className="text-lg font-semibold text-gray-900">발송인 정보</h4>
                </div>
                
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-600">이름</label>
                      <p className="text-sm text-gray-900 mt-1">{order.sender_name || '-'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">전화번호</label>
                      <p className="text-sm text-gray-900 mt-1">{order.sender_phone || '-'}</p>
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-600">주소</label>
                    <p className="text-sm text-gray-900 mt-1">
                      ({order.sender_zipcode}) {order.sender_address} {order.sender_detail_address}
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-600">이메일</label>
                      <p className="text-sm text-gray-900 mt-1">{order.sender_email || '-'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">회사명</label>
                      <p className="text-sm text-gray-900 mt-1">{order.sender_company || '-'}</p>
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-600">메모</label>
                    <p className="text-sm text-gray-900 mt-1">{order.delivery_memo || '-'}</p>
                  </div>
                </div>
              </div>

              {/* 수취인 정보 */}
              <div className="bg-gray-50 rounded-lg p-6">
                <div className="flex items-center gap-2 mb-4">
                  <MapPin className="w-5 h-5 text-green-500" />
                  <h4 className="text-lg font-semibold text-gray-900">수취인 정보</h4>
                </div>
                
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-600">이름</label>
                      <p className="text-sm text-gray-900 mt-1">{order.receiver_name || '-'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">전화번호</label>
                      <p className="text-sm text-gray-900 mt-1">{order.receiver_phone || '-'}</p>
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-600">주소</label>
                    <p className="text-sm text-gray-900 mt-1">
                      ({order.receiver_zipcode}) {order.receiver_address} {order.receiver_detail_address}
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-600">이메일</label>
                      <p className="text-sm text-gray-900 mt-1">{order.receiver_email || '-'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">회사명</label>
                      <p className="text-sm text-gray-900 mt-1">{order.receiver_company || '-'}</p>
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-600">메모</label>
                    <p className="text-sm text-gray-900 mt-1">{order.delivery_memo || '-'}</p>
                  </div>
                </div>
              </div>

              {/* 배송 정보 */}
              <div className="bg-gray-50 rounded-lg p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Truck className="w-5 h-5 text-purple-500" />
                  <h4 className="text-lg font-semibold text-gray-900">배송 정보</h4>
                </div>
                
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-600">상품명</label>
                      <p className="text-sm text-gray-900 mt-1">{order.package_description || '-'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">수량</label>
                      <p className="text-sm text-gray-900 mt-1">{order.package_type || '-'}</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-600">무게 (kg)</label>
                      <p className="text-sm text-gray-900 mt-1">{order.package_weight || '-'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">크기 (cm)</label>
                      <p className="text-sm text-gray-900 mt-1">{order.package_size || '-'}</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-600">배송비</label>
                      <p className="text-sm text-gray-900 mt-1">{order.package_value ? `${order.package_value}원` : '-'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">운송장번호</label>
                      <p className="text-sm text-gray-900 mt-1 font-mono">{order.tracking_number || '미배정'}</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-600">희망배송일</label>
                      <p className="text-sm text-gray-900 mt-1">{order.delivery_date || '-'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">배송유형</label>
                      <p className="text-sm text-gray-900 mt-1">{order.delivery_type || '-'}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* 특수 옵션 */}
              <div className="bg-gray-50 rounded-lg p-6">
                <div className="flex items-center gap-2 mb-4">
                  <AlertCircle className="w-5 h-5 text-orange-500" />
                  <h4 className="text-lg font-semibold text-gray-900">특수 옵션</h4>
                </div>
                
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-600">보험가입</label>
                      <p className="text-sm text-gray-900 mt-1">
                        {order.insurance_amount && order.insurance_amount > 0 ? '가입' : '미가입'}
                        {order.insurance_amount && order.insurance_amount > 0 && ` (${order.insurance_amount}원)`}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">착불</label>
                      <p className="text-sm text-gray-900 mt-1">
                        {order.requires_signature ? '서명필요' : '서명불필요'}
                      </p>
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-600">특별 요청사항</label>
                    <p className="text-sm text-gray-900 mt-1 whitespace-pre-wrap">
                      {order.special_instructions || '없음'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* 배송 상태 히스토리 (향후 구현 예정) */}
            <div className="mt-8 bg-blue-50 rounded-lg p-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-500" />
                배송 추적 정보
              </h4>
              <div className="text-center py-8 text-gray-500">
                <Package className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                <p>배송 추적 기능은 향후 업데이트에서 제공될 예정입니다.</p>
              </div>
            </div>
          </div>

          {/* 모달 푸터 */}
          <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              닫기
            </button>
            <button
              onClick={() => {
                // TODO: 주문 수정 기능 구현
                console.log('주문 수정:', order.id);
              }}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              주문 수정
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailModal;