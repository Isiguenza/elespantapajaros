const { neon } = require('@neondatabase/serverless');
require('dotenv').config();

async function updateEmployeeCode() {
  const sql = neon(process.env.DATABASE_URL);

  await sql`
    UPDATE user_profiles 
    SET employee_code = '001234'
    WHERE id = 'b0faa020-4757-4018-b6d6-a97ef5a5851f'
  `;

  console.log('✅ Empleado actualizado con código: 001234');
  console.log('   Email: test@test.com');
  console.log('   PIN: 1234');
  console.log('   Código de empleado: 001234');
}

updateEmployeeCode().catch(console.error);
