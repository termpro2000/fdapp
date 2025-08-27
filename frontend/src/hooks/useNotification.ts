import { useState, useEffect, useCallback } from 'react';

interface NotificationOptions {
  title: string;
  body: string;
  icon?: string;
  tag?: string;
  requireInteraction?: boolean;
  timeout?: number;
}

interface ToastNotification {
  id: string;
  type: 'success' | 'info' | 'warning' | 'error';
  title: string;
  message: string;
  timeout?: number;
}

export const useNotification = () => {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [toasts, setToasts] = useState<ToastNotification[]>([]);

  // 브라우저 알림 권한 요청
  const requestPermission = useCallback(async () => {
    if ('Notification' in window) {
      const result = await Notification.requestPermission();
      setPermission(result);
      return result;
    }
    return 'denied';
  }, []);

  // 브라우저 알림 표시
  const showBrowserNotification = useCallback(async (options: NotificationOptions) => {
    if ('Notification' in window && permission === 'granted') {
      const notification = new Notification(options.title, {
        body: options.body,
        icon: options.icon || '/favicon.ico',
        tag: options.tag,
        requireInteraction: options.requireInteraction || false,
      });

      if (options.timeout) {
        setTimeout(() => {
          notification.close();
        }, options.timeout);
      }

      return notification;
    } else if (permission === 'default') {
      // 권한이 없으면 요청
      const newPermission = await requestPermission();
      if (newPermission === 'granted') {
        return showBrowserNotification(options);
      }
    }
    return null;
  }, [permission, requestPermission]);

  // 토스트 알림 표시
  const showToast = useCallback((toast: Omit<ToastNotification, 'id'>) => {
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    const newToast: ToastNotification = {
      ...toast,
      id,
      timeout: toast.timeout || 5000,
    };

    setToasts(prev => [...prev, newToast]);

    // 자동 제거
    if (newToast.timeout && newToast.timeout > 0) {
      setTimeout(() => {
        removeToast(id);
      }, newToast.timeout);
    }

    return id;
  }, []);

  // 토스트 제거
  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  // 모든 토스트 제거
  const clearToasts = useCallback(() => {
    setToasts([]);
  }, []);

  // 주문 상태 변경 알림 (통합)
  const notifyOrderStatusChange = useCallback(async (
    orderInfo: {
      orderId: number;
      status: string;
      customerName?: string;
      trackingNumber?: string;
    }
  ) => {
    const statusMessages = {
      '접수완료': { title: '주문 접수 완료', emoji: '📦', color: 'info' },
      '배송준비': { title: '배송 준비 중', emoji: '📋', color: 'info' },
      '배송중': { title: '배송 시작', emoji: '🚚', color: 'info' },
      '배송완료': { title: '배송 완료', emoji: '✅', color: 'success' },
      '취소': { title: '주문 취소', emoji: '❌', color: 'warning' },
      '반송': { title: '주문 반송', emoji: '↩️', color: 'error' },
    };

    const statusInfo = statusMessages[orderInfo.status as keyof typeof statusMessages] || 
      { title: '상태 변경', emoji: '📋', color: 'info' };

    const message = orderInfo.trackingNumber 
      ? `운송장: ${orderInfo.trackingNumber}`
      : `주문번호: ${orderInfo.orderId}`;

    // 브라우저 알림
    await showBrowserNotification({
      title: `${statusInfo.emoji} ${statusInfo.title}`,
      body: `${orderInfo.customerName || '고객'}님의 주문이 ${orderInfo.status} 상태로 변경되었습니다.\n${message}`,
      tag: `order-${orderInfo.orderId}`,
      requireInteraction: orderInfo.status === '배송완료',
      timeout: 8000,
    });

    // 토스트 알림
    showToast({
      type: statusInfo.color as ToastNotification['type'],
      title: statusInfo.title,
      message: `주문 #${orderInfo.orderId}이 ${orderInfo.status} 상태로 변경되었습니다.`,
      timeout: 5000,
    });
  }, [showBrowserNotification, showToast]);

  // 새 주문 알림 (관리자용)
  const notifyNewOrder = useCallback(async (orderInfo: {
    orderId: number;
    customerName: string;
    productName?: string;
    amount?: number;
  }) => {
    // 브라우저 알림
    await showBrowserNotification({
      title: '🆕 새 주문 접수',
      body: `${orderInfo.customerName}님이 새 주문을 등록했습니다.\n주문번호: ${orderInfo.orderId}`,
      tag: `new-order-${orderInfo.orderId}`,
      requireInteraction: true,
    });

    // 토스트 알림
    showToast({
      type: 'info',
      title: '새 주문 접수',
      message: `${orderInfo.customerName}님의 주문 #${orderInfo.orderId}이 접수되었습니다.`,
      timeout: 7000,
    });
  }, [showBrowserNotification, showToast]);

  // 초기화: 권한 확인
  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  return {
    // 상태
    permission,
    toasts,
    
    // 브라우저 알림
    requestPermission,
    showBrowserNotification,
    
    // 토스트 알림
    showToast,
    removeToast,
    clearToasts,
    
    // 특수 알림
    notifyOrderStatusChange,
    notifyNewOrder,
  };
};

export default useNotification;