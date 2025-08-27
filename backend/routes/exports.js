const express = require('express');
const router = express.Router();
const { exportOrdersToExcel, exportStatisticsReport } = require('../controllers/exportController');

// 권한 확인 미들웨어
function requireAuth(req, res, next) {
  if (!req.session.user) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: '로그인이 필요합니다.'
    });
  }
  next();
}

// 매니저 이상 권한 확인
function requireManagerAuth(req, res, next) {
  if (!req.session.user || (req.session.user.role !== 'admin' && req.session.user.role !== 'manager')) {
    return res.status(403).json({
      error: 'Forbidden',
      message: '매니저 이상의 권한이 필요합니다.'
    });
  }
  next();
}

// 주문 데이터 내보내기 (Excel/CSV)
router.get('/orders', requireAuth, exportOrdersToExcel);

// 통계 리포트 내보내기 (Excel/CSV) - 매니저 이상만 접근 가능
router.get('/statistics', requireManagerAuth, exportStatisticsReport);

module.exports = router;