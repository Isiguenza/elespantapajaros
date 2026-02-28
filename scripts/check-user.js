const { neon } = require('@neondatabase/serverless');
require('dotenv').config();

async function checkUser() {
  const sql = neon(process.env.DATABASE_URL);
  
  const user = await sql`
    SELECT id, email, name, role, pin_hash, password_hash, employee_code, active
    FROM user_profiles 
    WHERE email = 'test@test.com'
  `;

  console.log('Usuario encontrado:');
  console.log(JSON.stringify(user[0], null, 2));
  console.log('\nTiene PIN hash:', !!user[0]?.pin_hash);
  console.log('Tiene password hash:', !!user[0]?.password_hash);
}

checkUser().catch(console.error);
