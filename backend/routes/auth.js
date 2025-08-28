const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');

// 회원가입
router.post('/register', authController.register);

// 아이디 중복 확인
router.get('/check-username/:username', authController.checkUsername);

// 로그인
router.post('/login', authController.login);

// 로그아웃
router.post('/logout', authController.logout);

// 현재 사용자 정보
router.get('/me', authController.me);

// JWT 토큰 검증 테스트 엔드포인트
router.get('/test-jwt', authenticateToken, (req, res) => {
  res.json({
    message: 'JWT 인증 성공!',
    user: req.user,
    timestamp: new Date().toISOString()
  });
});

// 헤더 디버깅 엔드포인트
router.get('/debug-headers', (req, res) => {
  res.json({
    headers: req.headers,
    cookies: req.cookies,
    session: req.session ? 'exists' : 'none',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;