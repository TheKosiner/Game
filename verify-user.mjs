// One-off script: manually verify a user's email by UID or email
// Usage:
//   node verify-user.mjs <serviceAccount.json> uid:<UID>
//   node verify-user.mjs <serviceAccount.json> <email>

import { readFileSync } from 'fs';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

const [serviceAccountPath, target] = process.argv.slice(2);
if (!serviceAccountPath || !target) {
  console.error('Usage: node verify-user.mjs <serviceAccount.json> uid:<UID>|<email>');
  process.exit(1);
}

const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));
if (!getApps().length) {
  initializeApp({ credential: cert(serviceAccount) });
}

const auth = getAuth();

try {
  const user = target.startsWith('uid:')
    ? await auth.getUser(target.slice(4))
    : await auth.getUserByEmail(target);

  console.log(`Found: ${user.uid} | email: ${user.email} | verified: ${user.emailVerified}`);

  if (user.emailVerified) {
    console.log('Already verified — nothing to do.');
    process.exit(0);
  }

  await auth.updateUser(user.uid, { emailVerified: true });
  console.log(`✓ Email zweryfikowany dla ${user.email}`);
} catch (e) {
  console.error('Error:', e.message);
  process.exit(1);
}
