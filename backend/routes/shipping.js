const express = require('express');
const router = express.Router();
const shippingController = require('../controllers/shippingController');
const { requireAuth } = require('../middleware/auth');

// 배송 접수 생성 (인증 필요)
router.post('/orders', requireAuth, shippingController.createShippingOrder);

// 사용자별 배송 접수 목록 조회 (인증 필요)
router.get('/orders', requireAuth, shippingController.getShippingOrders);

// 특정 배송 접수 상세 조회 (인증 필요)
router.get('/orders/:id', requireAuth, shippingController.getShippingOrder);

// 배송 접수 상태 업데이트 (인증 필요)
router.patch('/orders/:id/status', requireAuth, shippingController.updateShippingOrderStatus);

// 운송장 추적 (공개 API - 인증 불필요)
router.get('/tracking/:trackingNumber', shippingController.trackShipment);

module.exports = router;