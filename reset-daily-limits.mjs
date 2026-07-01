// One-off admin script: reset dungeonRunsToday + questsCompletedToday for all players
// Needed when the daily reset bug prevented midnight reset from firing.
//
// Usage:
//   node reset-daily-limits.mjs <serviceAccount.json>
//
// Get serviceAccount.json from Firebase Console:
//   Project Settings → Service accounts → Generate new private key

import { readFileSync } from 'fs';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const [serviceAccountPath] = process.argv.slice(2);
if (!serviceAccountPath) {
  console.error('Usage: node reset-daily-limits.mjs <serviceAccount.json>');
  process.exit(1);
}

const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));
if (!getApps().length) {
  initializeApp({ credential: cert(serviceAccount) });
}

const db = getFirestore();
const now = Date.now();

console.log('Fetching all saves...');
const snap = await db.collection('saves').get();
console.log(`Found ${snap.size} player saves.`);

// Firestore batch limit = 500 ops
const BATCH_SIZE = 499;
let updated = 0;
let batches = 0;

const docs = snap.docs;
for (let i = 0; i < docs.length; i += BATCH_SIZE) {
  const batch = db.batch();
  const chunk = docs.slice(i, i + BATCH_SIZE);
  for (const d of chunk) {
    batch.update(d.ref, {
      'hero.dungeonRunsToday': 0,
      'hero.questsCompletedToday': 0,
      'hero.kryptaRunsToday': 0,
      'hero.goldEarnedToday': 0,
      'hero.lastDailyReset': now,
    });
  }
  await batch.commit();
  updated += chunk.length;
  batches++;
  console.log(`  Batch ${batches}: reset ${updated}/${docs.length}`);
}

console.log(`\nDone! Reset daily limits for ${updated} players.`);
