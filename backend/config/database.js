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

// Connection pool 생성
const pool = mysql.createPool(dbConfig);

// 연결 테스트 함수
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

// 데이터베이스 초기화 함수
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
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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
        status VARCHAR(20) DEFAULT '접수완료',
        tracking_number VARCHAR(50) UNIQUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        
        FOREIGN KEY (user_id) REFERENCES users(id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    console.log('✅ 데이터베이스 테이블 초기화 완료');
    return true;
  } catch (error) {
    console.error('❌ 데이터베이스 초기화 실패:', error.message);
    return false;
  }
}

// 운송장 번호 생성 함수
function generateTrackingNumber() {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const random = Math.random().toString(36).substr(2, 6).toUpperCase();
  return `SH${date}${random}`;
}

module.exports = {
  pool,
  testConnection,
  initDatabase,
  generateTrackingNumber
};