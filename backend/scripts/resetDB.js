require('dotenv').config();
const { pool, initDatabase } = require('../config/database');

async function main() {
  try {
    console.log('데이터베이스 재초기화 시작...');
    
    // 기존 테이블 삭제
    await pool.execute('DROP TABLE IF EXISTS user_activities');
    await pool.execute('DROP TABLE IF EXISTS shipping_orders');
    await pool.execute('DROP TABLE IF EXISTS users');
    
    console.log('기존 테이블 삭제 완료');
    
    // 새로운 스키마로 테이블 생성
    const success = await initDatabase();
    
    if (success) {
      console.log('✅ 데이터베이스 재초기화 성공!');
      console.log('🔑 기본 관리자 계정: admin / admin123');
    } else {
      console.log('❌ 데이터베이스 재초기화 실패');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('오류 발생:', error);
    process.exit(1);
  }
}

main();