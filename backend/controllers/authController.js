const { pool } = require('../config/database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

/**
 * 새 사용자를 등록하는 함수
 * @param {Object} req - Express 요청 객체
 * @param {Object} req.body - 요청 본문
 * @param {string} req.body.username - 사용자 아이디
 * @param {string} req.body.password - 비밀번호
 * @param {string} req.body.name - 사용자 실명
 * @param {string} [req.body.phone] - 전화번호 (선택사항)
 * @param {string} [req.body.company] - 회사명 (선택사항)
 * @param {Object} res - Express 응답 객체
 * @returns {Promise<void>} JSON 응답 (성공 시 201, 오류 시 400/409/500)
 */
async function register(req, res) {
  try {
    const { username, password, name, phone, company } = req.body;

    // 유효성 검증
    if (!username || !password || !name) {
      return res.status(400).json({
        error: 'Bad Request',
        message: '필수 필드가 누락되었습니다.'
      });
    }

    // 아이디 중복 확인
    const [existingUsers] = await pool.execute(
      'SELECT id FROM users WHERE username = ?',
      [username]
    );

    if (existingUsers.length > 0) {
      return res.status(409).json({
        error: 'Conflict',
        message: '이미 사용 중인 아이디입니다.'
      });
    }

    // 비밀번호 해싱
    const hashedPassword = await bcrypt.hash(password, 10);

    // 사용자 생성
    const [result] = await pool.execute(
      'INSERT INTO users (username, password, name, phone, company) VALUES (?, ?, ?, ?, ?)',
      [username, hashedPassword, name, phone || null, company || null]
    );

    res.status(201).json({
      message: '회원가입이 완료되었습니다.',
      userId: result.insertId
    });

  } catch (error) {
    console.error('회원가입 오류:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: '회원가입 처리 중 오류가 발생했습니다.'
    });
  }
}

/**
 * 사용자 아이디 중복 여부를 확인하는 함수
 * @param {Object} req - Express 요청 객체
 * @param {Object} req.params - URL 파라미터
 * @param {string} req.params.username - 확인할 사용자 아이디
 * @param {Object} res - Express 응답 객체
 * @returns {Promise<void>} JSON 응답 (available: boolean, message: string)
 */
async function checkUsername(req, res) {
  try {
    const { username } = req.params;

    const [users] = await pool.execute(
      'SELECT id FROM users WHERE username = ?',
      [username]
    );

    res.json({
      available: users.length === 0,
      message: users.length === 0 ? '사용 가능한 아이디입니다.' : '이미 사용 중인 아이디입니다.'
    });

  } catch (error) {
    console.error('아이디 확인 오류:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: '아이디 확인 중 오류가 발생했습니다.'
    });
  }
}

/**
 * 사용자 로그인을 처리하는 함수
 * @param {Object} req - Express 요청 객체
 * @param {Object} req.body - 요청 본문
 * @param {string} req.body.username - 사용자 아이디
 * @param {string} req.body.password - 비밀번호
 * @param {Object} req.session - Express 세션 객체
 * @param {Object} res - Express 응답 객체
 * @returns {Promise<void>} JSON 응답 (성공 시 사용자 정보, 실패 시 오류 메시지)
 */
async function login(req, res) {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        error: 'Bad Request',
        message: '아이디와 비밀번호를 입력해주세요.'
      });
    }

    // 사용자 조회 (비밀번호는 별도로 검증)
    const [users] = await pool.execute(
      'SELECT id, username, password, name, phone, company, role, is_active, created_at FROM users WHERE username = ?',
      [username]
    );

    if (users.length === 0) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: '아이디 또는 비밀번호가 올바르지 않습니다.'
      });
    }

    const user = users[0];

    // 비밀번호 검증
    const isValidPassword = await bcrypt.compare(password, user.password);
    
    if (!isValidPassword) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: '아이디 또는 비밀번호가 올바르지 않습니다.'
      });
    }

    // 계정 비활성화 확인
    if (!user.is_active) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: '비활성화된 계정입니다. 관리자에게 문의하세요.'
      });
    }

    // 마지막 로그인 시간 업데이트
    await pool.execute(
      'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?',
      [user.id]
    );

    // JWT 토큰 생성
    const userPayload = {
      id: user.id,
      username: user.username,
      name: user.name,
      phone: user.phone,
      company: user.company,
      role: user.role
    };

    // 일관된 JWT 시크릿 사용
    const jwtSecret = 'shipping-webapp-jwt-secret-2024';
    console.log('JWT 토큰 생성 - Using consistent secret');
    
    const token = jwt.sign(
      userPayload,
      jwtSecret,
      { expiresIn: '24h' }
    );

    // 세션에도 저장 (기존 호환성 유지)
    req.session.user = userPayload;

    res.json({
      message: '로그인 성공',
      user: userPayload,
      token: token
    });

  } catch (error) {
    console.error('로그인 오류:', error);
    console.error('Error stack:', error.stack);
    console.error('Session secret exists:', !!process.env.SESSION_SECRET);
    res.status(500).json({
      error: 'Internal Server Error',
      message: '로그인 처리 중 오류가 발생했습니다.',
      debug: process.env.NODE_ENV !== 'production' ? error.message : undefined
    });
  }
}

/**
 * 사용자 로그아웃을 처리하는 함수
 * @param {Object} req - Express 요청 객체
 * @param {Object} req.session - Express 세션 객체
 * @param {Object} res - Express 응답 객체
 * @returns {Promise<void>} JSON 응답 (로그아웃 완료 메시지)
 */
async function logout(req, res) {
  try {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({
          error: 'Internal Server Error',
          message: '로그아웃 처리 중 오류가 발생했습니다.'
        });
      }

      res.json({ message: '로그아웃되었습니다.' });
    });

  } catch (error) {
    console.error('로그아웃 오류:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: '로그아웃 처리 중 오류가 발생했습니다.'
    });
  }
}

/**
 * 현재 로그인된 사용자의 정보를 조회하는 함수
 * @param {Object} req - Express 요청 객체
 * @param {Object} req.session - Express 세션 객체
 * @param {Object} req.session.user - 세션에 저장된 사용자 정보
 * @param {Object} res - Express 응답 객체
 * @returns {Promise<void>} JSON 응답 (사용자 정보 또는 인증 오류)
 */
async function me(req, res) {
  try {
    if (!req.session.user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: '로그인이 필요합니다.'
      });
    }

    res.json({
      user: req.session.user,
      authenticated: true
    });

  } catch (error) {
    console.error('사용자 정보 조회 오류:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: '사용자 정보 조회 중 오류가 발생했습니다.'
    });
  }
}

module.exports = {
  register,
  checkUsername,
  login,
  logout,
  me
};