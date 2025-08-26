const { testConnection, initDatabase } = require('../config/database');

async function setupDatabase() {
  console.log('🚀 데이터베이스 설정을 시작합니다...\n');

  // 1. 연결 테스트
  console.log('1. 데이터베이스 연결 테스트...');
  const connected = await testConnection();
  
  if (!connected) {
    console.log('\n❌ 데이터베이스 연결 실패');
    console.log('환경 설정을 확인해주세요:');
    console.log('- .env 파일의 DB_HOST, DB_USER, DB_PASSWORD, DB_NAME');
    console.log('- Gabia MySQL 서버 상태');
    process.exit(1);
  }

  // 2. 테이블 초기화
  console.log('\n2. 데이터베이스 테이블 초기화...');
  const initialized = await initDatabase();

  if (!initialized) {
    console.log('\n❌ 데이터베이스 초기화 실패');
    process.exit(1);
  }

  console.log('\n🎉 데이터베이스 설정이 완료되었습니다!');
  console.log('\n테이블 생성 완료:');
  console.log('- users (사용자)');
  console.log('- shipping_orders (배송접수, 26개 필드)');
  console.log('\n이제 백엔드 서버를 시작할 수 있습니다:');
  console.log('npm run dev');

  process.exit(0);
}

// 스크립트 실행
if (require.main === module) {
  setupDatabase().catch(error => {
    console.error('\n❌ 설정 중 오류 발생:', error.message);
    process.exit(1);
  });
}

module.exports = { setupDatabase };