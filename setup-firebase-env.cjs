// Automatically set up Firebase Admin environment variables in Vercel
const fs = require('fs');
const { execSync } = require('child_process');

const keyPath = 'C:\\Users\\User\\Downloads\\ultra-lab-tw-firebase-adminsdk-fbsvc-6f03ebc559.json';

console.log('🔑 Reading Firebase Service Account Key...\n');

const key = JSON.parse(fs.readFileSync(keyPath, 'utf8'));

const projectId = key.project_id;
const clientEmail = key.client_email;
const privateKey = key.private_key;

console.log(`✓ Project ID: ${projectId}`);
console.log(`✓ Client Email: ${clientEmail}`);
console.log(`✓ Private Key: ${privateKey.substring(0, 50)}...\n`);

console.log('📤 Uploading to Vercel...\n');

try {
  // Set FIREBASE_PROJECT_ID
  console.log('Setting FIREBASE_PROJECT_ID...');
  execSync(`printf "${projectId}" | vercel env add FIREBASE_PROJECT_ID production`, {
    stdio: 'inherit',
    shell: 'bash'
  });

  // Set FIREBASE_CLIENT_EMAIL
  console.log('\nSetting FIREBASE_CLIENT_EMAIL...');
  execSync(`printf "${clientEmail}" | vercel env add FIREBASE_CLIENT_EMAIL production`, {
    stdio: 'inherit',
    shell: 'bash'
  });

  // Set FIREBASE_PRIVATE_KEY (need to escape for bash)
  console.log('\nSetting FIREBASE_PRIVATE_KEY...');
  const escapedKey = privateKey.replace(/\$/g, '\\$').replace(/"/g, '\\"').replace(/`/g, '\\`');
  execSync(`printf "${escapedKey}" | vercel env add FIREBASE_PRIVATE_KEY production`, {
    stdio: 'inherit',
    shell: 'bash'
  });

  console.log('\n✅ All environment variables set!\n');
  console.log('Next steps:');
  console.log('  1. vercel --prod');
  console.log('  2. node test-prod-api.js\n');

} catch (error) {
  console.error('\n❌ Error:', error.message);
  console.error('\nTroubleshooting:');
  console.error('- Make sure you are logged in to Vercel CLI');
  console.error('- Try running: vercel login');
  process.exit(1);
}
