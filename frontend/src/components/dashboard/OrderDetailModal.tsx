import React, { useState } from 'react';
import { X, Package, User, MapPin, Truck, Clock, CheckCircle, AlertCircle, TrendingUp, Edit, Hash } from 'lucide-react';
import type { ShippingOrder } from '../../types';
import { shippingAPI } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';

interface OrderDetailModalProps {
  order: ShippingOrder | null;
  isOpen: boolean;
  onClose: () => void;
  onStatusUpdate?: (orderId: number, newStatus: string) => Promise<void>;
  onTrackingAssigned?: () => void;
}

const OrderDetailModal: React.FC<OrderDetailModalProps> = ({ order, isOpen, onClose, onStatusUpdate, onTrackingAssigned }) => {
  const { user } = useAuth();
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [showTrackingForm, setShowTrackingForm] = useState(false);
  const [trackingFormData, setTrackingFormData] = useState({
    tracking_number: '',
    tracking_company: '',
    estimated_delivery: ''
  });
  
  if (!isOpen || !order) return null;

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
    { value: '접수완료', label: '접수완료', color: 'bg-yellow-500' },
    { value: '배송준비', label: '배송준비', color: 'bg-blue-500' },
    { value: '배송중', label: '배송중', color: 'bg-orange-500' },
    { value: '배송완료', label: '배송완료', color: 'bg-green-500' },
    { value: '취소', label: '취소', color: 'bg-red-500' },
    { value: '반송', label: '반송', color: 'bg-red-500' }
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

  const handleTrackingAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!trackingFormData.tracking_number.trim()) {
      alert('운송장 번호를 입력해주세요.');
      return;
    }

    try {
      await shippingAPI.assignTrackingNumber(order.id, {
        tracking_number: trackingFormData.tracking_number.trim(),
        tracking_company: trackingFormData.tracking_company.trim() || undefined,
        estimated_delivery: trackingFormData.estimated_delivery || undefined
      });
      
      setShowTrackingForm(false);
      setTrackingFormData({
        tracking_number: '',
        tracking_company: '',
        estimated_delivery: ''
      });
      
      if (onTrackingAssigned) {
        onTrackingAssigned();
      }
      
      alert('운송장 번호가 성공적으로 할당되었습니다.');
    } catch (error: any) {
      console.error('운송장 할당 실패:', error);
      alert(error.response?.data?.message || '운송장 할당 중 오류가 발생했습니다.');
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
                {/* 관리자/매니저만 운송장 할당 버튼 표시 */}
                {(user?.role === 'admin' || user?.role === 'manager') && !order.tracking_number && (
                  <button
                    onClick={() => setShowTrackingForm(true)}
                    className="px-3 py-1 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm flex items-center gap-1"
                    title="운송장 번호 할당"
                  >
                    <Hash className="w-4 h-4" />
                    운송장 할당
                  </button>
                )}
                
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
                      <div className="mt-1 flex items-center gap-2">
                        <p className="text-sm text-gray-900 font-mono">{order.tracking_number || '미배정'}</p>
                        {order.tracking_number && (
                          <a
                            href={`/tracking?number=${order.tracking_number}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-500 hover:text-blue-700 text-xs underline"
                          >
                            추적
                          </a>
                        )}
                      </div>
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

            {/* 운송장 할당 폼 */}
            {showTrackingForm && (user?.role === 'admin' || user?.role === 'manager') && (
              <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Hash className="w-5 h-5 text-blue-500" />
                  운송장 번호 할당
                </h4>
                
                <form onSubmit={handleTrackingAssign} className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="tracking_number" className="block text-sm font-medium text-gray-700 mb-1">
                        운송장 번호 *
                      </label>
                      <input
                        type="text"
                        id="tracking_number"
                        value={trackingFormData.tracking_number}
                        onChange={(e) => setTrackingFormData(prev => ({ ...prev, tracking_number: e.target.value }))}
                        placeholder="운송장 번호를 입력하세요"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="tracking_company" className="block text-sm font-medium text-gray-700 mb-1">
                        택배회사
                      </label>
                      <input
                        type="text"
                        id="tracking_company"
                        value={trackingFormData.tracking_company}
                        onChange={(e) => setTrackingFormData(prev => ({ ...prev, tracking_company: e.target.value }))}
                        placeholder="예: CJ대한통운, 롯데택배"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label htmlFor="estimated_delivery" className="block text-sm font-medium text-gray-700 mb-1">
                      예상 배송일
                    </label>
                    <input
                      type="date"
                      id="estimated_delivery"
                      value={trackingFormData.estimated_delivery}
                      onChange={(e) => setTrackingFormData(prev => ({ ...prev, estimated_delivery: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  
                  <div className="flex justify-end gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowTrackingForm(false)}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      취소
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      할당하기
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* 배송 추적 정보 */}
            {order.tracking_number && (
              <div className="mt-8 bg-green-50 border border-green-200 rounded-lg p-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Truck className="w-5 h-5 text-green-500" />
                  배송 추적 정보
                </h4>
                
                <div className="grid md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <span className="text-sm font-medium text-gray-600">운송장 번호</span>
                    <p className="text-lg font-mono text-gray-900">{order.tracking_number}</p>
                  </div>
                  {order.tracking_company && (
                    <div>
                      <span className="text-sm font-medium text-gray-600">택배회사</span>
                      <p className="text-lg text-gray-900">{order.tracking_company}</p>
                    </div>
                  )}
                  {order.estimated_delivery && (
                    <div>
                      <span className="text-sm font-medium text-gray-600">예상 배송일</span>
                      <p className="text-lg text-gray-900">{new Date(order.estimated_delivery).toLocaleDateString('ko-KR')}</p>
                    </div>
                  )}
                </div>
                
                <div className="flex justify-center">
                  <a
                    href={`/tracking?number=${order.tracking_number}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <Truck className="w-5 h-5" />
                    배송 추적하기
                  </a>
                </div>
              </div>
            )}
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