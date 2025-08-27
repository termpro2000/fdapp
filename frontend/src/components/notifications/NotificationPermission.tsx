import React, { useState } from 'react';
import { Bell, BellOff, X } from 'lucide-react';

interface NotificationPermissionProps {
  permission: NotificationPermission;
  onRequestPermission: () => Promise<NotificationPermission>;
  onDismiss?: () => void;
}

const NotificationPermission: React.FC<NotificationPermissionProps> = ({
  permission,
  onRequestPermission,
  onDismiss
}) => {
  const [isRequesting, setIsRequesting] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  const handleRequestPermission = async () => {
    setIsRequesting(true);
    try {
      await onRequestPermission();
    } finally {
      setIsRequesting(false);
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    if (onDismiss) {
      onDismiss();
    }
  };

  // 권한이 이미 승인되었거나 사용자가 닫았으면 표시하지 않음
  if (permission === 'granted' || isDismissed) {
    return null;
  }

  // 브라우저가 알림을 지원하지 않으면 표시하지 않음
  if (!('Notification' in window)) {
    return null;
  }

  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 max-w-md w-full mx-4">
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            {permission === 'denied' ? (
              <BellOff className="w-8 h-8 text-red-500" />
            ) : (
              <Bell className="w-8 h-8 text-blue-500" />
            )}
          </div>
          
          <div className="flex-1">
            <h3 className="text-lg font-medium text-gray-900">
              {permission === 'denied' ? '알림이 차단되어 있습니다' : '알림 권한 요청'}
            </h3>
            
            <p className="text-sm text-gray-600 mt-2">
              {permission === 'denied' ? (
                '브라우저 설정에서 이 사이트의 알림을 허용해주세요. 주문 상태 변경 시 실시간으로 알림을 받을 수 있습니다.'
              ) : (
                '주문 상태 변경, 새 주문 접수 등 중요한 알림을 실시간으로 받으시겠습니까?'
              )}
            </p>
            
            <div className="flex gap-3 mt-4">
              {permission !== 'denied' && (
                <button
                  onClick={handleRequestPermission}
                  disabled={isRequesting}
                  className="px-4 py-2 bg-blue-500 text-white text-sm font-medium rounded-lg hover:bg-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isRequesting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      요청 중...
                    </>
                  ) : (
                    <>
                      <Bell className="w-4 h-4" />
                      알림 허용
                    </>
                  )}
                </button>
              )}
              
              <button
                onClick={handleDismiss}
                className="px-4 py-2 text-gray-600 text-sm font-medium rounded-lg hover:bg-gray-100 focus:ring-2 focus:ring-gray-300 focus:ring-offset-2"
              >
                {permission === 'denied' ? '닫기' : '나중에'}
              </button>
            </div>
          </div>
          
          <button
            onClick={handleDismiss}
            className="flex-shrink-0 p-1 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100"
            aria-label="닫기"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {permission === 'denied' && (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              <strong>설정 방법:</strong> 주소창 왼쪽의 🔒 또는 🛡️ 아이콘을 클릭하고 "알림" 권한을 허용으로 변경해주세요.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationPermission;