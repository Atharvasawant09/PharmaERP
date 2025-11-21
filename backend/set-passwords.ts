import bcrypt from 'bcrypt';
import pool from '../backend/src/config/database';

async function setPasswords() {
  try {
    const users = [
      { email: 'admin@pharma.com', password: 'admin123' },
      { email: 'manager@pharma.com', password: 'manager123' },
      { email: 'agent@pharma.com', password: 'agent123' }
    ];

    console.log('🔐 Setting passwords...\n');

    for (const user of users) {
      // Generate bcrypt hash
      const hash = await bcrypt.hash(user.password, 10);

      // Update user
      await pool.query(
        'UPDATE Users SET PasswordHash = ? WHERE Email = ?',
        [hash, user.email]
      );

      console.log(`✅ ${user.email}`);
      console.log(`   Password: ${user.password}`);
      console.log(`   Hash: ${hash}\n`);
    }

    console.log('✅ All passwords set!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

setPasswords();
