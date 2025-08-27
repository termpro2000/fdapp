import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { 
  User, Phone, Mail, Building, MapPin, Package, Truck, 
  Calendar, Clock, AlertTriangle, Snowflake, FileText, 
  Shield, ChevronLeft, ChevronRight, Check
} from 'lucide-react';
import { shippingAPI } from '../../services/api';
import type { ShippingOrderData } from '../../types';

const STEPS = [
  { id: 1, title: '발송인 정보', description: '발송인 정보를 입력하세요' },
  { id: 2, title: '수취인 정보', description: '수취인 정보를 입력하세요' },
  { id: 3, title: '배송 정보', description: '배송 상세정보를 입력하세요' },
  { id: 4, title: '완료', description: '배송접수를 완료하세요' }
];

const PACKAGE_TYPES = ['문서', '소포', '박스', '팔레트'];
const DELIVERY_TYPES = ['일반', '당일', '익일', '지정일'];

interface ShippingOrderFormProps {
  onSuccess?: () => void;
  onNewOrder?: (orderInfo: {
    orderId: number;
    customerName: string;
    productName?: string;
    amount?: number;
  }) => void;
}

const ShippingOrderForm: React.FC<ShippingOrderFormProps> = ({ onSuccess, onNewOrder }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<{ success: boolean; message: string; trackingNumber?: string } | null>(null);

  const { register, handleSubmit, formState: { errors }, watch, trigger } = useForm<ShippingOrderData>({
    defaultValues: {
      package_type: '소포',
      delivery_type: '일반',
      is_fragile: false,
      is_frozen: false,
      requires_signature: false,
      insurance_amount: 0
    }
  });

  const watchedValues = watch();

  // 다음 단계로
  const nextStep = async () => {
    const fieldsToValidate = getFieldsForStep(currentStep);
    const isValid = await trigger(fieldsToValidate as any);
    
    if (isValid) {
      setCurrentStep(prev => Math.min(prev + 1, 4));
    }
  };

  // 이전 단계로
  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  // 단계별 필수 필드 반환
  const getFieldsForStep = (step: number): (keyof ShippingOrderData)[] => {
    switch (step) {
      case 1:
        return ['sender_name', 'sender_phone', 'sender_address', 'sender_zipcode'];
      case 2:
        return ['receiver_name', 'receiver_phone', 'receiver_address', 'receiver_zipcode'];
      case 3:
        return ['package_weight', 'package_size'];
      default:
        return [];
    }
  };

  // 폼 제출
  const onSubmit = async (data: ShippingOrderData) => {
    try {
      setIsSubmitting(true);
      const response = await shippingAPI.createOrder(data);
      
      setSubmitResult({
        success: true,
        message: '배송접수가 완료되었습니다!',
        trackingNumber: response.trackingNumber
      });
      
      // 새 주문 알림 발송 (관리자/매니저용)
      if (onNewOrder && response.orderId) {
        onNewOrder({
          orderId: response.orderId,
          customerName: data.receiver_name,
          productName: data.package_description,
          amount: data.package_value
        });
      }
      
      // 성공 시 대시보드로 이동
      if (onSuccess) {
        setTimeout(() => {
          onSuccess();
        }, 2000); // 2초 후 대시보드로 이동
      }
    } catch (error: any) {
      setSubmitResult({
        success: false,
        message: error.response?.data?.message || '배송접수 처리 중 오류가 발생했습니다.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // 단계 1: 발송인 정보
  const renderStep1 = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            발송인 이름 <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              {...register('sender_name', { required: '발송인 이름은 필수입니다' })}
              className="w-full pl-10 pr-4 py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="이름을 입력하세요"
              autoComplete="name"
            />
          </div>
          {errors.sender_name && <p className="mt-1 text-sm text-red-600">{errors.sender_name.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            전화번호 <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="tel"
              {...register('sender_phone', { required: '전화번호는 필수입니다' })}
              className="w-full pl-10 pr-4 py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="010-1234-5678"
              autoComplete="tel"
            />
          </div>
          {errors.sender_phone && <p className="mt-1 text-sm text-red-600">{errors.sender_phone.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">이메일</label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="email"
              {...register('sender_email')}
              className="w-full pl-10 pr-4 py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="example@email.com"
              autoComplete="email"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">회사명</label>
          <div className="relative">
            <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              {...register('sender_company')}
              className="w-full pl-10 pr-4 py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="회사명을 입력하세요"
              autoComplete="organization"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            주소 <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              {...register('sender_address', { required: '주소는 필수입니다' })}
              className="w-full pl-10 pr-4 py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="주소를 입력하세요"
              autoComplete="street-address"
            />
          </div>
          {errors.sender_address && <p className="mt-1 text-sm text-red-600">{errors.sender_address.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            우편번호 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            {...register('sender_zipcode', { required: '우편번호는 필수입니다' })}
            className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="12345"
            autoComplete="postal-code"
            inputMode="numeric"
          />
          {errors.sender_zipcode && <p className="mt-1 text-sm text-red-600">{errors.sender_zipcode.message}</p>}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">상세주소</label>
        <input
          type="text"
          {...register('sender_detail_address')}
          className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="아파트명, 동/호수 등 상세주소"
          autoComplete="street-address-line2"
        />
      </div>
    </div>
  );

  // 단계 2: 수취인 정보 (발송인과 동일한 구조)
  const renderStep2 = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            수취인 이름 <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              {...register('receiver_name', { required: '수취인 이름은 필수입니다' })}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="이름을 입력하세요"
            />
          </div>
          {errors.receiver_name && <p className="mt-1 text-sm text-red-600">{errors.receiver_name.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            전화번호 <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="tel"
              {...register('receiver_phone', { required: '전화번호는 필수입니다' })}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="전화번호를 입력하세요"
            />
          </div>
          {errors.receiver_phone && <p className="mt-1 text-sm text-red-600">{errors.receiver_phone.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">이메일</label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="email"
              {...register('receiver_email')}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="이메일을 입력하세요"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">회사명</label>
          <div className="relative">
            <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              {...register('receiver_company')}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="회사명을 입력하세요"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            주소 <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              {...register('receiver_address', { required: '주소는 필수입니다' })}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="주소를 입력하세요"
            />
          </div>
          {errors.receiver_address && <p className="mt-1 text-sm text-red-600">{errors.receiver_address.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            우편번호 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            {...register('receiver_zipcode', { required: '우편번호는 필수입니다' })}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="우편번호"
          />
          {errors.receiver_zipcode && <p className="mt-1 text-sm text-red-600">{errors.receiver_zipcode.message}</p>}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">상세주소</label>
        <input
          type="text"
          {...register('receiver_detail_address')}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="상세주소를 입력하세요"
        />
      </div>
    </div>
  );

  // 단계 3: 배송 정보
  const renderStep3 = () => (
    <div className="space-y-6">
      {/* 화물 정보 */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Package className="w-5 h-5" />
          화물 정보
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">화물 종류</label>
            <select
              {...register('package_type')}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {PACKAGE_TYPES.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              중량 (kg) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              step="0.1"
              min="0"
              {...register('package_weight', { 
                required: '중량은 필수입니다',
                min: { value: 0.1, message: '중량은 0.1kg 이상이어야 합니다' }
              })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="중량을 입력하세요"
            />
            {errors.package_weight && <p className="mt-1 text-sm text-red-600">{errors.package_weight.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              크기 (cm) <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              {...register('package_size', { required: '크기는 필수입니다' })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="예: 30x20x10"
            />
            {errors.package_size && <p className="mt-1 text-sm text-red-600">{errors.package_size.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">화물 가액 (원)</label>
            <input
              type="number"
              min="0"
              {...register('package_value')}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="화물 가액을 입력하세요"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">화물 설명</label>
          <textarea
            {...register('package_description')}
            rows={3}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="화물에 대한 상세 설명을 입력하세요"
          />
        </div>
      </div>

      {/* 배송 옵션 */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Truck className="w-5 h-5" />
          배송 옵션
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">배송 유형</label>
            <select
              {...register('delivery_type')}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {DELIVERY_TYPES.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">희망 배송일</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="date"
                {...register('delivery_date')}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">희망 배송시간</label>
            <div className="relative">
              <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                {...register('delivery_time')}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="예: 오전 9-12시"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">보험료 (원)</label>
            <div className="relative">
              <Shield className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="number"
                min="0"
                {...register('insurance_amount')}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="보험료를 입력하세요"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 특수 옵션 */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">특수 옵션</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="flex items-center gap-3 p-3 border border-gray-300 rounded-lg hover:bg-white transition-colors cursor-pointer">
            <input
              type="checkbox"
              {...register('is_fragile')}
              className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <AlertTriangle className="w-5 h-5 text-orange-500" />
            <span className="text-gray-700">파손주의</span>
          </label>

          <label className="flex items-center gap-3 p-3 border border-gray-300 rounded-lg hover:bg-white transition-colors cursor-pointer">
            <input
              type="checkbox"
              {...register('is_frozen')}
              className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <Snowflake className="w-5 h-5 text-blue-500" />
            <span className="text-gray-700">냉동보관</span>
          </label>

          <label className="flex items-center gap-3 p-3 border border-gray-300 rounded-lg hover:bg-white transition-colors cursor-pointer">
            <input
              type="checkbox"
              {...register('requires_signature')}
              className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <FileText className="w-5 h-5 text-green-500" />
            <span className="text-gray-700">서명확인</span>
          </label>
        </div>
      </div>

      {/* 메모 */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">배송 메모</label>
          <textarea
            {...register('delivery_memo')}
            rows={3}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="배송 관련 특이사항이나 요청사항을 입력하세요"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">특별 지시사항</label>
          <textarea
            {...register('special_instructions')}
            rows={3}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="기타 특별한 지시사항을 입력하세요"
          />
        </div>
      </div>
    </div>
  );

  // 단계 4: 완료 및 확인
  const renderStep4 = () => (
    <div className="space-y-6">
      {submitResult ? (
        <div className={`p-6 rounded-lg ${submitResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
          <div className="flex items-center gap-3">
            {submitResult.success ? (
              <Check className="w-8 h-8 text-green-500" />
            ) : (
              <AlertTriangle className="w-8 h-8 text-red-500" />
            )}
            <div>
              <h3 className={`text-lg font-semibold ${submitResult.success ? 'text-green-800' : 'text-red-800'}`}>
                {submitResult.success ? '배송접수 완료' : '배송접수 실패'}
              </h3>
              <p className={submitResult.success ? 'text-green-700' : 'text-red-700'}>
                {submitResult.message}
              </p>
              {submitResult.trackingNumber && (
                <p className="text-green-700 mt-2">
                  <strong>운송장 번호: {submitResult.trackingNumber}</strong>
                </p>
              )}
            </div>
          </div>
          
          {submitResult.success && (
            <div className="mt-4 flex gap-3">
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
              >
                새 접수하기
              </button>
            </div>
          )}
          
          {!submitResult.success && (
            <div className="mt-4">
              <button
                onClick={() => setSubmitResult(null)}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                다시 시도
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-800 mb-4">배송접수 정보 확인</h3>
          
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold text-gray-800 mb-2">발송인</h4>
                <p>{watchedValues.sender_name} ({watchedValues.sender_phone})</p>
                <p className="text-gray-600">{watchedValues.sender_address}</p>
              </div>
              
              <div>
                <h4 className="font-semibold text-gray-800 mb-2">수취인</h4>
                <p>{watchedValues.receiver_name} ({watchedValues.receiver_phone})</p>
                <p className="text-gray-600">{watchedValues.receiver_address}</p>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold text-gray-800 mb-2">화물 정보</h4>
              <p>{watchedValues.package_type} - {watchedValues.package_weight}kg - {watchedValues.package_size}</p>
              <p className="text-gray-600">배송유형: {watchedValues.delivery_type}</p>
            </div>
          </div>
          
          <button
            onClick={handleSubmit(onSubmit)}
            disabled={isSubmitting}
            className="w-full mt-6 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white font-medium py-4 text-lg rounded-lg transition-colors touch-manipulation"
          >
            {isSubmitting ? '접수 처리 중...' : '배송접수 완료'}
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* 단계 표시기 */}
      <div className="mb-8">
        <div className="flex justify-between items-center">
          {STEPS.map((step, index) => (
            <div key={step.id} className="flex-1">
              <div className="flex items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                  currentStep >= step.id 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gray-200 text-gray-500'
                }`}>
                  {currentStep > step.id ? <Check className="w-5 h-5" /> : step.id}
                </div>
                
                {index < STEPS.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-4 ${
                    currentStep > step.id ? 'bg-blue-500' : 'bg-gray-200'
                  }`} />
                )}
              </div>
              
              <div className="mt-2">
                <p className={`text-sm font-medium ${
                  currentStep >= step.id ? 'text-blue-600' : 'text-gray-500'
                }`}>
                  {step.title}
                </p>
                <p className="text-xs text-gray-500">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 폼 내용 */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-6">
          {STEPS[currentStep - 1].title}
        </h2>
        
        <form onSubmit={handleSubmit(onSubmit)}>
          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}
          {currentStep === 4 && renderStep4()}
        </form>
      </div>

      {/* 네비게이션 버튼 */}
      {!submitResult && (
        <div className="flex justify-between gap-4">
          <button
            onClick={prevStep}
            disabled={currentStep === 1}
            className="flex items-center gap-2 px-6 py-4 bg-gray-500 hover:bg-gray-600 disabled:bg-gray-300 text-white font-medium rounded-lg transition-colors touch-manipulation"
          >
            <ChevronLeft className="w-5 h-5" />
            <span className="hidden sm:inline">이전</span>
          </button>
          
          {currentStep < 4 ? (
            <button
              onClick={nextStep}
              className="flex items-center gap-2 px-6 py-4 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg transition-colors touch-manipulation"
            >
              <span className="hidden sm:inline">다음</span>
              <ChevronRight className="w-5 h-5" />
            </button>
          ) : null}
        </div>
      )}
    </div>
  );
};

export default ShippingOrderForm;