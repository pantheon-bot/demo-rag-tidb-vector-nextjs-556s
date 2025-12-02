import { createPool } from 'mysql2/promise';

async function checkTables() {
  const pool = createPool({
    uri: process.env.DATABASE_URL!,
    ssl: {
      minVersion: 'TLSv1.2',
    }
  });

  try {
    console.log('Checking database tables...');

    // Show all tables
    const [tables] = await pool.query('SHOW TABLES');
    console.log('Existing tables:', tables);

    // Check rag_chunks structure
    try {
      const [ragStructure] = await pool.query('DESCRIBE rag_chunks');
      console.log('\nrag_chunks structure:', ragStructure);
    } catch (e: any) {
      console.log('rag_chunks does not exist:', e.message);
    }

    // Check chat_messages structure
    try {
      const [msgStructure] = await pool.query('DESCRIBE chat_messages');
      console.log('\nchat_messages structure:', msgStructure);
    } catch (e: any) {
      console.log('chat_messages does not exist:', e.message);
    }

  } finally {
    await pool.end();
  }
}

checkTables().catch(console.error);
