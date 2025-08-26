const { pool } = require('../config/database');

async function resetDatabase() {
  try {
    console.log('🚀 데이터베이스 리셋을 시작합니다...\n');

    // 기존 테이블 삭제 (순서 중요 - 외래키 관계)
    console.log('1. 기존 테이블 삭제...');
    await pool.execute('DROP TABLE IF EXISTS shipping_orders');
    await pool.execute('DROP TABLE IF EXISTS users');
    console.log('✅ 기존 테이블 삭제 완료\n');

    // users 테이블 생성
    console.log('2. users 테이블 생성...');
    await pool.execute(`
      CREATE TABLE users (
        id INT PRIMARY KEY AUTO_INCREMENT,
        username VARCHAR(50) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        name VARCHAR(100) NOT NULL,
        phone VARCHAR(20),
        company VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('✅ users 테이블 생성 완료');

    // shipping_orders 테이블 생성
    console.log('3. shipping_orders 테이블 생성...');
    await pool.execute(`
      CREATE TABLE shipping_orders (
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
    console.log('✅ shipping_orders 테이블 생성 완료\n');

    console.log('🎉 데이터베이스 리셋이 완료되었습니다!\n');
    console.log('생성된 테이블:');
    console.log('- users (id, username, password, name, phone, company, created_at)');
    console.log('- shipping_orders (26개 필드 + 시스템 필드)');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ 데이터베이스 리셋 실패:', error.message);
    process.exit(1);
  }
}

// 스크립트 실행
if (require.main === module) {
  resetDatabase();
}

module.exports = { resetDatabase };