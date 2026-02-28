const bcrypt = require('bcryptjs');

async function testLogin() {
  const storedHash = "$2b$10$bb3Qk1Irao8QZ2QPPI0Q7.kZvQtWPbhAw5A9bqlQ8GjQWzStZ3k5y";
  const password = "admin123";
  
  const isValid = await bcrypt.compare(password, storedHash);
  
  console.log('Password:', password);
  console.log('Hash:', storedHash);
  console.log('¿Es válida?', isValid);
}

testLogin();
