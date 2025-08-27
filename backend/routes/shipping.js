const express = require('express');
const router = express.Router();
const shippingController = require('../controllers/shippingController');
const { authenticateToken, requireAuth, requireManager } = require('../middleware/auth');

// 배송 접수 생성 (JWT 인증 필요)
router.post('/orders', authenticateToken, shippingController.createShippingOrder);

// 사용자별 배송 접수 목록 조회 (JWT 인증 필요)
router.get('/orders', authenticateToken, shippingController.getShippingOrders);

// 특정 배송 접수 상세 조회 (JWT 인증 필요)
router.get('/orders/:id', authenticateToken, shippingController.getShippingOrder);

// 배송 접수 상태 업데이트 (매니저 이상)
router.patch('/orders/:id/status', requireManager, shippingController.updateShippingOrderStatus);

// 운송장 추적 (공개 API - 인증 불필요)
router.get('/tracking/:trackingNumber', shippingController.trackShipment);

// 관리자용 운송장 번호 할당 (매니저 이상)
router.post('/orders/:id/tracking', requireManager, shippingController.assignTrackingNumber);

module.exports = router;