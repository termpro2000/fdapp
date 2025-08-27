import React, { useState } from 'react';
import { Search, Package, Clock, CheckCircle, Truck, AlertCircle, ArrowLeft } from 'lucide-react';
import { shippingAPI } from '../../services/api';

interface TrackingInfo {
  trackingNumber: string;
  currentStatus: string;
  trackingCompany?: string;
  estimatedDelivery?: string;
  orderInfo: {
    senderName: string;
    recipientName: string;
    recipientAddress: string;
    productName: string;
    weight?: number;
    value?: number;
  };
  statusHistory: Array<{
    status: string;
    timestamp: string;
    location: string;
    description: string;
  }>;
}

interface TrackingPageProps {
  onNavigateBack?: () => void;
}

const TrackingPage: React.FC<TrackingPageProps> = ({ onNavigateBack }) => {
  const [trackingNumber, setTrackingNumber] = useState('');
  const [trackingInfo, setTrackingInfo] = useState<TrackingInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleTrackingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!trackingNumber.trim()) {
      setError('운송장 번호를 입력해주세요.');
      return;
    }

    setLoading(true);
    setError('');
    setTrackingInfo(null);

    try {
      const data = await shippingAPI.trackShipment(trackingNumber.trim());
      setTrackingInfo(data);
    } catch (err: any) {
      if (err.response?.status === 404) {
        setError('해당 운송장 번호를 찾을 수 없습니다. 번호를 다시 확인해주세요.');
      } else {
        setError('배송 추적 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
      }
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case '접수완료':
        return <Package className="w-5 h-5 text-blue-500" />;
      case '배송준비':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case '배송중':
        return <Truck className="w-5 h-5 text-orange-500" />;
      case '배송완료':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case '취소':
      case '반송':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Package className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case '접수완료':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case '배송준비':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case '배송중':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case '배송완료':
        return 'bg-green-100 text-green-800 border-green-200';
      case '취소':
      case '반송':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            {/* 뒤로가기 버튼 */}
            {onNavigateBack && (
              <button
                onClick={onNavigateBack}
                className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                <span className="hidden sm:inline">대시보드로 돌아가기</span>
                <span className="sm:hidden">돌아가기</span>
              </button>
            )}
            
            {/* 중앙 제목 */}
            <div className="flex items-center gap-3">
              <Package className="w-8 h-8 text-blue-500" />
              <div className="text-center">
                <h1 className="text-2xl font-bold text-gray-900">배송 추적</h1>
                <p className="text-sm text-gray-500">운송장 번호로 배송 상태를 확인하세요</p>
              </div>
            </div>
            
            {/* 빈 공간 (레이아웃 균형용) */}
            <div className="w-32"></div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 추적 검색 */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
          <form onSubmit={handleTrackingSubmit} className="space-y-4">
            <div>
              <label htmlFor="trackingNumber" className="block text-sm font-medium text-gray-700 mb-2">
                운송장 번호
              </label>
              <div className="flex gap-4">
                <input
                  type="text"
                  id="trackingNumber"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  placeholder="운송장 번호를 입력하세요"
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={loading}
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Search className="w-5 h-5" />
                  )}
                  {loading ? '추적 중...' : '추적하기'}
                </button>
              </div>
            </div>

            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-red-500" />
                  <p className="text-red-700">{error}</p>
                </div>
              </div>
            )}
          </form>
        </div>

        {/* 추적 결과 */}
        {trackingInfo && (
          <div className="space-y-6">
            {/* 기본 정보 */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">배송 정보</h2>
                <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(trackingInfo.currentStatus)}`}>
                  {trackingInfo.currentStatus}
                </span>
              </div>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div>
                    <span className="text-sm font-medium text-gray-500">운송장 번호</span>
                    <p className="text-lg font-mono">{trackingInfo.trackingNumber}</p>
                  </div>
                  {trackingInfo.trackingCompany && (
                    <div>
                      <span className="text-sm font-medium text-gray-500">택배회사</span>
                      <p className="text-gray-900">{trackingInfo.trackingCompany}</p>
                    </div>
                  )}
                  {trackingInfo.estimatedDelivery && (
                    <div>
                      <span className="text-sm font-medium text-gray-500">예상 배송일</span>
                      <p className="text-gray-900">{new Date(trackingInfo.estimatedDelivery).toLocaleDateString('ko-KR')}</p>
                    </div>
                  )}
                </div>
                
                <div className="space-y-3">
                  <div>
                    <span className="text-sm font-medium text-gray-500">보내는 분</span>
                    <p className="text-gray-900">{trackingInfo.orderInfo.senderName}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">받는 분</span>
                    <p className="text-gray-900">{trackingInfo.orderInfo.recipientName}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">배송지</span>
                    <p className="text-gray-900">{trackingInfo.orderInfo.recipientAddress}</p>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t">
                <div className="grid md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-500">상품명</span>
                    <p className="text-gray-900">{trackingInfo.orderInfo.productName}</p>
                  </div>
                  {trackingInfo.orderInfo.weight && (
                    <div>
                      <span className="font-medium text-gray-500">중량</span>
                      <p className="text-gray-900">{trackingInfo.orderInfo.weight}kg</p>
                    </div>
                  )}
                  {trackingInfo.orderInfo.value && (
                    <div>
                      <span className="font-medium text-gray-500">상품가액</span>
                      <p className="text-gray-900">{trackingInfo.orderInfo.value.toLocaleString()}원</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* 배송 상태 히스토리 */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">배송 현황</h3>
              
              <div className="space-y-4">
                {trackingInfo.statusHistory.map((item, index) => (
                  <div key={index} className="flex items-start gap-4">
                    <div className="flex-shrink-0 mt-1">
                      {getStatusIcon(item.status)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-gray-900">{item.status}</h4>
                        <span className="text-sm text-gray-500">
                          {new Date(item.timestamp).toLocaleString('ko-KR')}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                      <p className="text-sm text-gray-500 mt-1">{item.location}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 안내사항 */}
        <div className="bg-blue-50 rounded-lg border border-blue-200 p-6 mt-8">
          <h3 className="text-lg font-medium text-blue-900 mb-3">배송 추적 안내</h3>
          <ul className="text-sm text-blue-800 space-y-2">
            <li>• 운송장 번호는 배송 접수 완료 후 발급됩니다.</li>
            <li>• 배송 상태는 실시간으로 업데이트되며, 다소 지연될 수 있습니다.</li>
            <li>• 배송 관련 문의사항이 있으시면 고객센터로 연락주세요.</li>
            <li>• 운송장 번호를 분실하신 경우 주문 시 등록한 연락처로 문의하세요.</li>
          </ul>
        </div>
      </main>

      {/* 푸터 */}
      <footer className="bg-white border-t mt-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center text-sm text-gray-500">
            <p>&copy; 2024 배송접수 시스템. All rights reserved.</p>
            <p className="mt-1">안전하고 신뢰할 수 있는 배송 서비스를 제공합니다.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default TrackingPage;