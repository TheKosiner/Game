// One-off script: manually verify a user's email
// Usage: node verify-user.mjs <email>
// Requires: firebase CLI logged in (firebase login)

import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

const email = process.argv[2];
if (!email) {
  console.error('Usage: node verify-user.mjs <email>');
  process.exit(1);
}

// Uses application default credentials from firebase CLI (no service account file needed)
if (!getApps().length) {
  initializeApp();
}

const auth = getAuth();

try {
  const user = await auth.getUserByEmail(email);
  console.log(`Found user: ${user.uid} (emailVerified: ${user.emailVerified})`);

  if (user.emailVerified) {
    console.log('Email already verified — nothing to do.');
    process.exit(0);
  }

  await auth.updateUser(user.uid, { emailVerified: true });
  console.log(`✓ Email verified for ${email}`);
} catch (e) {
  console.error('Error:', e.message);
  process.exit(1);
}
