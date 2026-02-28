const { neon } = require('@neondatabase/serverless');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function fixPassword() {
  const sql = neon(process.env.DATABASE_URL);
  
  const password = "admin123";
  const passwordHash = await bcrypt.hash(password, 10);
  
  console.log('Generando nuevo hash para:', password);
  console.log('Hash:', passwordHash);
  
  // Verificar que el hash funciona
  const testResult = await bcrypt.compare(password, passwordHash);
  console.log('Verificación del hash:', testResult ? '✅ OK' : '❌ FALLO');
  
  if (!testResult) {
    console.error('El hash no funciona, abortando');
    return;
  }

  await sql`
    UPDATE user_profiles 
    SET password_hash = ${passwordHash}
    WHERE email = 'test@test.com'
  `;

  console.log('\n✅ Contraseña actualizada correctamente');
  console.log('Credenciales:');
  console.log('  Email: test@test.com');
  console.log('  Contraseña: admin123');
  console.log('  PIN: 1234');
  console.log('  Código empleado: 001234');
}

fixPassword().catch(console.error);
