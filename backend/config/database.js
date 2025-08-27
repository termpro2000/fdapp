const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
  host: process.env.DB_HOST || 'my8003.gabiadb.com',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'miraepartner',
  password: process.env.DB_PASSWORD || 'mirae11825826!@',
  database: process.env.DB_NAME || 'miraeapp',
  charset: process.env.DB_CHARSET || 'utf8mb4',
  timezone: process.env.DB_TIMEZONE || '+09:00',
  connectionLimit: 10,
  waitForConnections: true,
  queueLimit: 0
};

/**
 * MySQL 커넥션 풀 생성
 * 연결 수 제한과 대기열 관리를 통해 데이터베이스 연결 최적화
 */
const pool = mysql.createPool(dbConfig);

/**
 * 데이터베이스 연결 상태를 테스트하는 함수
 * 연결 풀에서 연결을 가져와서 정상 작동 여부를 확인
 * @returns {Promise<boolean>} 연결 성공 여부
 */
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('✅ MySQL 데이터베이스 연결 성공');
    connection.release();
    return true;
  } catch (error) {
    console.error('❌ MySQL 데이터베이스 연결 실패:', error.message);
    return false;
  }
}

/**
 * 데이터베이스 테이블과 기본 데이터를 초기화하는 함수
 * - users 테이블: 사용자 정보 저장
 * - shipping_orders 테이블: 26개 필드를 가진 배송 접수 데이터
 * - user_activities 테이블: 사용자 활동 로그
 * - 기본 관리자 계정 생성
 * @returns {Promise<boolean>} 초기화 성공 여부
 */
async function initDatabase() {
  try {
    // users 테이블 생성
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id INT PRIMARY KEY AUTO_INCREMENT,
        username VARCHAR(50) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        name VARCHAR(100) NOT NULL,
        phone VARCHAR(20),
        company VARCHAR(100),
        role ENUM('admin', 'manager', 'user') DEFAULT 'user',
        is_active BOOLEAN DEFAULT TRUE,
        last_login TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // shipping_orders 테이블 생성
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS shipping_orders (
        id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT NOT NULL,
        
        -- 발송인 정보 (7개)
        sender_name VARCHAR(100) NOT NULL,
        sender_phone VARCHAR(20) NOT NULL,
        sender_email VARCHAR(100),
        sender_company VARCHAR(100),
        sender_address VARCHAR(300) NOT NULL,
        sender_detail_address VARCHAR(200),
        sender_zipcode VARCHAR(10) NOT NULL,
        
        -- 수취인 정보 (7개)  
        receiver_name VARCHAR(100) NOT NULL,
        receiver_phone VARCHAR(20) NOT NULL,
        receiver_email VARCHAR(100),
        receiver_company VARCHAR(100),
        receiver_address VARCHAR(300) NOT NULL,
        receiver_detail_address VARCHAR(200),
        receiver_zipcode VARCHAR(10) NOT NULL,
        
        -- 배송 정보 (8개)
        package_type VARCHAR(20) DEFAULT '소포',
        package_weight DECIMAL(10,2),
        package_size VARCHAR(50),
        package_value DECIMAL(15,2),
        delivery_type VARCHAR(20) DEFAULT '일반',
        delivery_date DATE,
        delivery_time VARCHAR(30),
        package_description TEXT,
        
        -- 특수 옵션 (4개)
        is_fragile BOOLEAN DEFAULT FALSE,
        is_frozen BOOLEAN DEFAULT FALSE,
        requires_signature BOOLEAN DEFAULT FALSE,
        insurance_amount DECIMAL(15,2) DEFAULT 0,
        
        -- 추가 메모
        delivery_memo TEXT,
        special_instructions TEXT,
        
        -- 시스템 필드
        status ENUM('접수완료', '배송준비', '배송중', '배송완료', '취소', '반송') DEFAULT '접수완료',
        tracking_number VARCHAR(50) UNIQUE,
        tracking_company VARCHAR(50),
        estimated_delivery DATE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        
        FOREIGN KEY (user_id) REFERENCES users(id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // user_activities 테이블 생성 (사용자 활동 로그)
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS user_activities (
        id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT NOT NULL,
        action VARCHAR(100) NOT NULL,
        target_type VARCHAR(50),
        target_id INT,
        details JSON,
        ip_address VARCHAR(45),
        user_agent TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_user_created (user_id, created_at),
        INDEX idx_action_created (action, created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 기본 관리자 계정 생성 (존재하지 않는 경우에만)
    const bcrypt = require('bcryptjs');
    const adminPassword = await bcrypt.hash('admin123', 10);
    
    await pool.execute(`
      INSERT IGNORE INTO users (username, password, name, role) 
      VALUES ('admin', ?, '시스템 관리자', 'admin')
    `, [adminPassword]);

    console.log('✅ 데이터베이스 테이블 초기화 완료');
    console.log('📝 기본 관리자 계정: admin / admin123');
    return true;
  } catch (error) {
    console.error('❌ 데이터베이스 초기화 실패:', error.message);
    return false;
  }
}

/**
 * 유니크한 운송장 번호를 생성하는 함수
 * 형식: SH + YYYYMMDD + 6자리 랜덤 문자열
 * 예시: SH20240101ABC123
 * @returns {string} 생성된 운송장 번호
 */
function generateTrackingNumber() {
  // 현재 날짜를 YYYYMMDD 형식으로 변환
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  // 6자리 랜덤 영숫자 조합 생성
  const random = Math.random().toString(36).substr(2, 6).toUpperCase();
  return `SH${date}${random}`;
}

module.exports = {
  pool,
  testConnection,
  initDatabase,
  generateTrackingNumber
};