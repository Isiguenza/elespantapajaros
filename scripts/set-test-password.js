const { neon } = require('@neondatabase/serverless');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function setTestPassword() {
  const sql = neon(process.env.DATABASE_URL);
  
  // Hash de "admin123"
  const passwordHash = await bcrypt.hash('admin123', 10);

  await sql`
    UPDATE user_profiles 
    SET password_hash = ${passwordHash}
    WHERE id = 'b0faa020-4757-4018-b6d6-a97ef5a5851f'
  `;

  console.log('✅ Contraseña configurada para empleado test');
  console.log('   Email: test@test.com');
  console.log('   PIN: 1234');
  console.log('   Código: 001234');
  console.log('   Contraseña: admin123');
}

setTestPassword().catch(console.error);
