import bcrypt from 'bcrypt';

async function generateHash() {
  const password = 'Admin@123';
  const saltRounds = 10;
  
  try {
    const hash = await bcrypt.hash(password, saltRounds);
    console.log('\n✅ Password Hash Generated Successfully!\n');
    console.log('Password:', password);
    console.log('Hash:', hash);
    console.log('\n📋 Copy this hash and update in MySQL:\n');
    console.log(`UPDATE Users SET PasswordHash = '${hash}' WHERE Email = 'admin@pharma.com';\n`);
  } catch (error) {
    console.error('Error generating hash:', error);
  }
}

generateHash();
