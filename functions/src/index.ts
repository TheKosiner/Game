import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp();

const db = admin.firestore();

interface PvpRequest {
  attackerId: string;
  defenderId: string;
  attackerStats: {
    attack: number;
    defense: number;
    maxHp: number;
    level: number;
  };
}

interface PvpResult {
  won: boolean;
  xpGained: number;
  goldGained: number;
  timestamp: number;
}

const MAX_PVP_ROUNDS = 300;
const PVP_COOLDOWN_MS = 15 * 60 * 1000;

function simulatePvp(
  heroAtk: number,
  heroDef: number,
  heroHp: number,
  oppAtk: number,
  oppDef: number,
  oppHp: number
): boolean {
  let hHp = heroHp;
  let oHp = oppHp;

  for (let i = 0; i < MAX_PVP_ROUNDS; i++) {
    oHp -= Math.max(1, Math.round(heroAtk * (0.85 + Math.random() * 0.3)) - oppDef);
    if (oHp <= 0) return true;

    hHp -= Math.max(1, Math.round(oppAtk * (0.85 + Math.random() * 0.3)) - heroDef);
    if (hHp <= 0) return false;
  }

  return hHp >= oHp;
}

export const performPvp = functions.https.onCall(async (data: PvpRequest, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { attackerId, defenderId, attackerStats } = data;

  if (context.auth.uid !== attackerId) {
    throw new functions.https.HttpsError('permission-denied', 'Can only fight as yourself');
  }

  const attackerDoc = await db.collection('players').doc(attackerId).get();
  if (!attackerDoc.exists) {
    throw new functions.https.HttpsError('not-found', 'Attacker not found');
  }

  const attackerData = attackerDoc.data()!;
  const lastPvpFight = attackerData.lastPvpFight || 0;

  if (Date.now() - lastPvpFight < PVP_COOLDOWN_MS) {
    throw new functions.https.HttpsError(
      'failed-precondition',
      'PvP cooldown active'
    );
  }

  const defenderDoc = await db.collection('players').doc(defenderId).get();
  if (!defenderDoc.exists) {
    throw new functions.https.HttpsError('not-found', 'Defender not found');
  }

  const defenderData = defenderDoc.data()!;

  const won = simulatePvp(
    attackerStats.attack,
    attackerStats.defense,
    attackerStats.maxHp,
    defenderData.attack || 10,
    defenderData.defense || 5,
    defenderData.maxHp || 100
  );

  const xpGained = won ? Math.max(20, defenderData.level * 20) : 8;
  const goldGained = won ? Math.max(10, defenderData.level * 10) : 0;

  const result: PvpResult = {
    won,
    xpGained,
    goldGained,
    timestamp: Date.now(),
  };

  await db.collection('players').doc(attackerId).update({
    lastPvpFight: Date.now(),
    pvpWins: admin.firestore.FieldValue.increment(won ? 1 : 0),
    pvpLosses: admin.firestore.FieldValue.increment(won ? 0 : 1),
  });

  await db.collection('pvp_results').add({
    attackerId,
    defenderId,
    result,
    timestamp: Date.now(),
  });

  return result;
});

export const validatePlayerUpdate = functions.firestore
  .document('players/{uid}')
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();

    if (after.level > before.level + 5) {
      console.error(`Suspicious level gain for ${context.params.uid}: ${before.level} -> ${after.level}`);
      await change.after.ref.update({ level: before.level });
    }

    if (after.gold > before.gold + 10000) {
      console.error(`Suspicious gold gain for ${context.params.uid}: ${before.gold} -> ${after.gold}`);
      await change.after.ref.update({ gold: before.gold });
    }
  });
