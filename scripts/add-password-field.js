const { neon } = require('@neondatabase/serverless');
require('dotenv').config();

async function addPasswordField() {
  const sql = neon(process.env.DATABASE_URL);

  await sql`
    ALTER TABLE user_profiles 
    ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255)
  `;

  console.log('✅ Campo password_hash agregado a user_profiles');
}

addPasswordField().catch(console.error);
