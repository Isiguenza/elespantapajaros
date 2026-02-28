const { neon } = require('@neondatabase/serverless');
require('dotenv').config();

async function checkAuthTables() {
  const sql = neon(process.env.DATABASE_URL);
  
  // Ver todas las tablas
  const tables = await sql`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public'
    ORDER BY table_name
  `;

  console.log('📋 Tablas en la base de datos:');
  tables.forEach(t => console.log('  -', t.table_name));
  
  // Ver estructura de tabla de auth si existe
  const authTables = tables.filter(t => t.table_name.includes('auth'));
  
  if (authTables.length > 0) {
    console.log('\n🔐 Tablas de autenticación encontradas:');
    for (const table of authTables) {
      console.log(`\n  Tabla: ${table.table_name}`);
      const columns = await sql`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = ${table.table_name}
        ORDER BY ordinal_position
      `;
      columns.forEach(c => {
        console.log(`    - ${c.column_name} (${c.data_type}${c.is_nullable === 'YES' ? ', nullable' : ''})`);
      });
    }
  }
}

checkAuthTables().catch(console.error);
