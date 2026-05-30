import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import Stripe from 'stripe';

admin.initializeApp();

const db = admin.firestore();

// ── Roulette helpers (server-side, matches CasinoPanel logic) ─────────────────
const RED_NUMS = new Set([1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36]);
type BetType = 'red'|'black'|'odd'|'even'|'low'|'high'|'dozen1'|'dozen2'|'dozen3'|string;

function rouletteWin(bet: BetType, n: number): boolean {
  if (n === 0) return false;
  switch (bet) {
    case 'red':    return RED_NUMS.has(n);
    case 'black':  return !RED_NUMS.has(n);
    case 'odd':    return n % 2 === 1;
    case 'even':   return n % 2 === 0;
    case 'low':    return n >= 1 && n <= 18;
    case 'high':   return n >= 19 && n <= 36;
    case 'dozen1': return n >= 1  && n <= 12;
    case 'dozen2': return n >= 13 && n <= 24;
    case 'dozen3': return n >= 25 && n <= 36;
    default: return bet === `num_${n}`;
  }
}

function rouletteReturn(bet: BetType, stake: number): number {
  if (typeof bet === 'string' && bet.startsWith('num_')) return stake * 36;
  if (['dozen1','dozen2','dozen3'].includes(bet)) return stake * 3;
  return stake * 2;
}

const VALID_BETS: BetType[] = ['red','black','odd','even','low','high','dozen1','dozen2','dozen3'];
const NUM_BET_RE = /^num_([0-9]|[12][0-9]|3[0-6])$/;

// ── spinRoulette ──────────────────────────────────────────────────────────────
// Fully server-side: RNG, stake validation, and Firestore update all happen here.
// Client receives only the result — cannot influence spin outcome or gold amount.
export const spinRoulette = functions.https.onCall(async (data, context) => {
  if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Not logged in');

  const uid = context.auth.uid;
  const { betType, stake } = data as { betType: BetType; stake: number };

  if (!VALID_BETS.includes(betType) && !NUM_BET_RE.test(betType ?? ''))
    throw new functions.https.HttpsError('invalid-argument', 'Invalid bet type');
  if (!Number.isInteger(stake) || stake < 1 || stake > 1_000_000_000)
    throw new functions.https.HttpsError('invalid-argument', 'Invalid stake');

  const saveRef = db.doc(`saves/${uid}`);

  return db.runTransaction(async tx => {
    const snap = await tx.get(saveRef);
    if (!snap.exists) throw new functions.https.HttpsError('not-found', 'No save found');

    const hero = (snap.data()!.hero ?? {}) as Record<string, number>;
    const gold: number = hero.gold ?? 0;

    if (stake > gold)
      throw new functions.https.HttpsError('failed-precondition', 'Not enough gold');

    // Server-side RNG — client has zero influence over this
    const result = Math.floor(Math.random() * 37);
    const won = rouletteWin(betType, result);
    const back = won ? rouletteReturn(betType, stake) : 0;
    const newGold = gold - stake + back;
    const netProfit = back - stake;
    const newGoldEarnedToday = Math.max(0, (hero.goldEarnedToday ?? 0) + Math.max(0, netProfit));
    const now = Date.now();

    tx.update(saveRef, {
      'hero.gold': newGold,
      'hero.goldEarnedToday': newGoldEarnedToday,
      'hero.lastCasinoSpinAt': now,
      updatedAt: now,
    });

    return { result, won, net: netProfit, newGold, newGoldEarnedToday };
  });
});

// ── Gem packages ─────────────────────────────────────────────────────────────
const GEM_PACKAGES: Record<string, { gems: number; priceUsd: number }> = {
  '100':  { gems: 100,  priceUsd:  99 },   // $0.99
  '550':  { gems: 550,  priceUsd: 499 },   // $4.99
  '1200': { gems: 1200, priceUsd: 999 },   // $9.99
};

function getStripe() {
  const key = functions.config().stripe?.secret_key;
  if (!key) throw new functions.https.HttpsError('internal', 'Stripe not configured. Run: firebase functions:config:set stripe.secret_key=sk_...');
  return new Stripe(key, { apiVersion: '2026-04-22.dahlia' });
}

// ── createCheckoutSession ─────────────────────────────────────────────────────
export const createCheckoutSession = functions.https.onCall(async (data, context) => {
  if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Must be logged in');

  const { packageId, originUrl } = data as { packageId: string; originUrl: string };
  const pkg = GEM_PACKAGES[packageId];
  if (!pkg) throw new functions.https.HttpsError('invalid-argument', 'Invalid gem package');

  const stripe = getStripe();
  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    line_items: [{
      price_data: {
        currency: 'usd',
        unit_amount: pkg.priceUsd,
        product_data: {
          name: `${pkg.gems} 💎 Gems — GlitchSoul`,
          description: `${pkg.gems} gems for use in GlitchSoul RPG`,
        },
      },
      quantity: 1,
    }],
    metadata: { uid: context.auth.uid, gems: pkg.gems.toString() },
    success_url: `${originUrl}?gems_success=1&gems=${pkg.gems}`,
    cancel_url:  `${originUrl}?gems_cancelled=1`,
  });

  return { url: session.url };
});

// ── stripeWebhook ─────────────────────────────────────────────────────────────
export const stripeWebhook = functions.https.onRequest(async (req, res) => {
  const sig = req.headers['stripe-signature'] as string;
  const webhookSecret = functions.config().stripe?.webhook_secret;

  if (!webhookSecret) { res.status(500).send('Webhook secret not configured'); return; }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let event: any;
  try {
    const stripe = new Stripe(functions.config().stripe?.secret_key ?? '', { apiVersion: '2026-04-22.dahlia' });
    event = stripe.webhooks.constructEvent((req as any).rawBody, sig, webhookSecret);
  } catch (err: any) {
    console.error('Stripe webhook signature error:', err.message);
    res.status(400).send(`Webhook Error: ${err.message}`);
    return;
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const uid  = session.metadata?.uid;
    const gems = parseInt(session.metadata?.gems ?? '0', 10);

    if (uid && gems > 0 && session.payment_status === 'paid') {
      await db.collection('gemCredits').add({
        uid, gems,
        sessionId: session.id,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        claimed: false,
      });
      console.log(`Queued +${gems} gems for uid=${uid}`);
    }
  }

  res.json({ received: true });
});

// ── claimGemCredits ───────────────────────────────────────────────────────────
export const claimGemCredits = functions.https.onCall(async (_data, context) => {
  if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Must be logged in');

  const uid = context.auth.uid;
  return db.runTransaction(async tx => {
    const snap = await tx.get(
      db.collection('gemCredits').where('uid', '==', uid).where('claimed', '==', false)
    );
    if (snap.empty) return { gems: 0 };

    let total = 0;
    const now = admin.firestore.FieldValue.serverTimestamp();
    snap.docs.forEach(d => {
      total += (d.data().gems as number) ?? 0;
      tx.update(d.ref, { claimed: true, claimedAt: now });
    });
    return { gems: total };
  });
});

interface PvpRequest {
  attackerId: string;
  defenderId: string;
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

  const { attackerId, defenderId } = data;

  if (context.auth.uid !== attackerId) {
    throw new functions.https.HttpsError('permission-denied', 'Can only fight as yourself');
  }

  // Read BOTH players from Firestore — never trust client-provided stats
  const [attackerDoc, defenderDoc] = await Promise.all([
    db.collection('players').doc(attackerId).get(),
    db.collection('players').doc(defenderId).get(),
  ]);

  if (!attackerDoc.exists) throw new functions.https.HttpsError('not-found', 'Attacker not found');
  if (!defenderDoc.exists) throw new functions.https.HttpsError('not-found', 'Defender not found');

  const attackerData = attackerDoc.data()!;
  const defenderData = defenderDoc.data()!;

  const lastPvpFight = attackerData.lastPvpFight || 0;
  if (Date.now() - lastPvpFight < PVP_COOLDOWN_MS) {
    throw new functions.https.HttpsError('failed-precondition', 'PvP cooldown active');
  }

  // Use Firestore stats for both sides — client cannot inflate them
  const won = simulatePvp(
    attackerData.attack  || 10,
    attackerData.defense || 5,
    attackerData.maxHp   || 100,
    defenderData.attack  || 10,
    defenderData.defense || 5,
    defenderData.maxHp   || 100
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

// ── claimDailyReward ──────────────────────────────────────────────────────────
// Server validates the day using server time — immune to client clock manipulation
function isSameDaySrv(ts: number, now: number): boolean {
  const a = new Date(ts);
  const b = new Date(now);
  return a.getFullYear() === b.getFullYear() &&
         a.getMonth()    === b.getMonth()    &&
         a.getDate()     === b.getDate();
}

export const claimDailyReward = functions.https.onCall(async (_data, context) => {
  if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Must be logged in');
  const uid = context.auth.uid;

  return db.runTransaction(async tx => {
    const saveRef = db.doc(`saves/${uid}`);
    const snap = await tx.get(saveRef);
    if (!snap.exists) return { claimed: false };

    const hero = snap.data()!.hero ?? {};
    const lastDailyReset: number = hero.lastDailyReset ?? 0;
    const now = Date.now(); // server-side — client cannot influence this

    // Future timestamp means clock was manipulated — fix it silently
    if (lastDailyReset > now) {
      tx.update(saveRef, { 'hero.lastDailyReset': now });
      return { claimed: false };
    }

    if (isSameDaySrv(lastDailyReset, now)) return { claimed: false };

    const DAILY_GEMS = 5;
    const newGems = (hero.gems ?? 0) + DAILY_GEMS;

    tx.update(saveRef, {
      'hero.lastDailyReset': now,
      'hero.dungeonRunsToday': 0,
      'hero.questsCompletedToday': 0,
      'hero.gems': newGems,
      updatedAt: now,
    });

    return { claimed: true, gemsAdded: DAILY_GEMS, gems: newGems, lastDailyReset: now };
  });
});

// ── collectQuestServer ────────────────────────────────────────────────────────
// Server validates quest completion time — client cannot skip timers by moving clock
export const collectQuestServer = functions.https.onCall(async (_data, context) => {
  if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Must be logged in');
  const uid = context.auth.uid;

  return db.runTransaction(async tx => {
    const saveRef = db.doc(`saves/${uid}`);
    const snap = await tx.get(saveRef);
    if (!snap.exists) throw new functions.https.HttpsError('not-found', 'No save found');

    const activeQuest = snap.data()!.activeQuest;
    if (!activeQuest) throw new functions.https.HttpsError('failed-precondition', 'No active quest');

    const now = Date.now(); // server time
    if (now < activeQuest.endsAt) {
      throw new functions.https.HttpsError('failed-precondition', 'Quest not finished yet');
    }

    tx.update(saveRef, { activeQuest: null, updatedAt: now });

    return {
      valid: true,
      xpReward:   activeQuest.quest?.xpReward   ?? 0,
      goldReward: activeQuest.quest?.goldReward  ?? 0,
    };
  });
});

// ── collectBeggingServer ──────────────────────────────────────────────────────
// Server validates begging timer — client cannot skip it by moving clock forward
export const collectBeggingServer = functions.https.onCall(async (_data, context) => {
  if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Must be logged in');
  const uid = context.auth.uid;

  return db.runTransaction(async tx => {
    const saveRef = db.doc(`saves/${uid}`);
    const snap = await tx.get(saveRef);
    if (!snap.exists) throw new functions.https.HttpsError('not-found', 'No save found');

    const hero = snap.data()!.hero ?? {};
    if (!hero.beggingUntil) throw new functions.https.HttpsError('failed-precondition', 'Not begging');

    const now = Date.now();
    if (now < hero.beggingUntil) throw new functions.https.HttpsError('failed-precondition', 'Begging not finished yet');

    // Cap reward to what was promised at start — prevent localStorage tampering
    const maxGold = Math.floor(10 * (5 + (hero.level ?? 1) * 2) * 1.2); // max possible reward
    const reward = Math.min(hero.beggingReward ?? 0, maxGold);

    tx.update(saveRef, {
      'hero.beggingUntil': null,
      'hero.beggingReward': null,
      'hero.beggingStartAt': null,
      updatedAt: now,
    });

    return { valid: true, goldReward: reward };
  });
});

// ── resetAllDailyLimits ───────────────────────────────────────────────────────
// Admin-only: resets dungeonRunsToday + questsCompletedToday for every player
// and clears today's attackedAt for all active guild operation participants.
export const resetAllDailyLimits = functions.https.onCall(async (_data, context) => {
  if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Must be logged in');

  const adminUid = functions.config().admin?.uid as string | undefined;
  if (adminUid && context.auth.uid !== adminUid) {
    throw new functions.https.HttpsError('permission-denied', 'Admin only');
  }

  const BATCH_SIZE = 400;
  let resetCount = 0;

  // ── Reset saves (dungeonRunsToday, questsCompletedToday) ──────────────────
  const savesSnap = await db.collection('saves').get();
  for (let i = 0; i < savesSnap.docs.length; i += BATCH_SIZE) {
    const batch = db.batch();
    savesSnap.docs.slice(i, i + BATCH_SIZE).forEach(d => {
      batch.update(d.ref, {
        'hero.dungeonRunsToday': 0,
        'hero.questsCompletedToday': 0,
      });
      resetCount++;
    });
    await batch.commit();
  }

  // ── Reset guild op attackedAt for all active operations ───────────────────
  const yesterday = Date.now() - 25 * 60 * 60 * 1000;
  const guildsSnap = await db.collection('guilds').get();
  for (let i = 0; i < guildsSnap.docs.length; i += BATCH_SIZE) {
    const batch = db.batch();
    guildsSnap.docs.slice(i, i + BATCH_SIZE).forEach(d => {
      const op = d.data().guildOperation;
      if (!op || op.status !== 'active') return;
      const participants: Record<string, unknown> = op.participants ?? {};
      const updates: Record<string, unknown> = {};
      for (const uid of Object.keys(participants)) {
        updates[`guildOperation.participants.${uid}.attackedAt`] = yesterday;
      }
      if (Object.keys(updates).length > 0) batch.update(d.ref, updates);
    });
    await batch.commit();
  }

  return { ok: true, resetCount };
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
