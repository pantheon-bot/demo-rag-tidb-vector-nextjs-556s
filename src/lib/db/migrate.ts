import { promises as fs } from 'fs';
import path from 'path';
import { createPool } from 'mysql2/promise';

async function runMigrations() {
  const pool = createPool({
    uri: process.env.DATABASE_URL!,
    ssl: {
      minVersion: 'TLSv1.2',
    }
  });

  try {
    const migrationsDir = path.join(process.cwd(), 'src/lib/db/migrations');
    const files = await fs.readdir(migrationsDir);
    const sqlFiles = files.filter(f => f.endsWith('.sql')).sort();

    console.log(`Found ${sqlFiles.length} migration files`);

    for (const file of sqlFiles) {
      console.log(`Running migration: ${file}`);
      const filePath = path.join(migrationsDir, file);
      const sql = await fs.readFile(filePath, 'utf-8');

      // Split by semicolon and filter out empty statements
      const statements = sql
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'));

      for (const statement of statements) {
        try {
          console.log(`  Executing: ${statement.substring(0, 60)}...`);
          await pool.query(statement);
          console.log(`  ✓ Executed successfully`);
        } catch (error: any) {
          // Ignore "already exists" errors for idempotency
          if (error.code === 'ER_TABLE_EXISTS_ERROR' ||
              error.code === 'ER_DUP_KEYNAME' ||
              error.message.includes('already exists')) {
            console.log(`  ⊙ Skipped (already exists)`);
          } else {
            console.error(`  ✗ Failed (code: ${error.code}):`, error.message);
            console.error(`  Statement was:`, statement.substring(0, 200));
            // Don't throw for TiFlash or vector index errors - continue with basic tables
            if (error.message.includes('TiFlash') ||
                error.message.includes('VECTOR INDEX') ||
                error.code === 'ER_NOT_SUPPORTED_YET') {
              console.log(`  ⚠ Continuing without vector index (may not be supported)`);
            } else {
              throw error;
            }
          }
        }
      }
    }

    console.log('✓ All migrations completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run if called directly
if (require.main === module) {
  runMigrations().catch(console.error);
}

export default runMigrations;
