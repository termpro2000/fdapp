const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

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

module.exports = router;