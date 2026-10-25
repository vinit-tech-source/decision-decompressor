import test from 'node:test';
import assert from 'node:assert/strict';
import { validate, wordCount, Card } from './validator.ts';
import { FALLBACKS, MICRO } from './fallback.ts';
import { needsCare } from './safety.ts';
import { extractJson } from './json.ts';
import { isSmaller } from './helpers.ts';
import { validateAvoidPreferences, buildChosenForLabel } from './preferences.ts';
import {
  checkModelQuota,
  recordModelCall,
  markExternal429,
  getQuotaStatus,
  resetQuotaTrackerForTest,
  classifyError,
  getDailyLimit,
  getMinuteLimit,
  BUSY_USER_MESSAGE,
} from './quota.ts';


test('ACCEPT test cases from specification', () => {
  const accepts = [
    { action: "Open your boss's most recent email.", why_gentle: "It is one email and takes little time.", time_box_minutes: 2 },
    { action: "Drink a glass of water.", why_gentle: "It is physical and tiny.", time_box_minutes: 2 },
    { action: "Write down the first thing on your mind.", why_gentle: "It takes under two minutes.", time_box_minutes: 2 },
    { action: "Put one object back where it belongs.", why_gentle: "One object is reversible.", time_box_minutes: 2 },
    { action: "Water the plant on your desk.", why_gentle: "It gives your desk life.", time_box_minutes: 2 },
  ];

  for (const card of accepts) {
    const res = validate(card);
    assert.equal(res.ok, true, `Expected valid for "${card.action}", got: ${(res as any).reason}`);
  }
});

test('REJECT test cases from specification', () => {
  const rejects: Array<{ payload: any; label: string }> = [
    {
      payload: { action: "Open your email and reply to your boss.", why_gentle: "Gentle why.", time_box_minutes: 5 },
      label: "multi-action: and"
    },
    {
      payload: { action: "Stand up then stretch.", why_gentle: "Gentle why.", time_box_minutes: 1 },
      label: "multi-action: then"
    },
    {
      payload: { action: "Reply to the three emails.", why_gentle: "Gentle why.", time_box_minutes: 5 },
      label: "high effort: reply"
    },
    {
      payload: { action: "Write the entire report.", why_gentle: "Gentle why.", time_box_minutes: 5 },
      label: "verb not followed by down, and scope word"
    },
    {
      payload: { action: "Clean the whole kitchen.", why_gentle: "Gentle why.", time_box_minutes: 5 },
      label: "verb not allowlisted"
    },
    {
      payload: { action: "Open the file, read it, close it.", why_gentle: "Gentle why.", time_box_minutes: 5 },
      label: "commas"
    },
    {
      payload: { action: "Water the plant on your desk and your balcony garden.", why_gentle: "Gentle why.", time_box_minutes: 5 },
      label: "and"
    },
    {
      payload: { action: "Open the window. Rest.", why_gentle: "Gentle why.", time_box_minutes: 1 },
      label: "two sentences"
    },
    {
      payload: { action: "Take one step forward and walk across the entire room to inspect the bookshelf right now.", why_gentle: "Gentle why.", time_box_minutes: 2 },
      label: "over 15 words"
    },
    {
      payload: { action: "Drink a glass of water.", why_gentle: "Gentle why.", time_box_minutes: 0 },
      label: "time_box 0"
    },
    {
      payload: { action: "Drink a glass of water.", why_gentle: "Gentle why.", time_box_minutes: 11 },
      label: "time_box 11"
    },
    {
      payload: { action: "Drink a glass of water.", why_gentle: "Gentle why.", time_box_minutes: "5" },
      label: "time_box '5' string"
    }
  ];

  for (const { payload, label } of rejects) {
    const res = validate(payload);
    assert.equal(res.ok, false, `Expected invalid for ${label} ("${payload.action}"), but passed`);
  }
});

test('every FALLBACKS and MICRO card must pass validate()', () => {
  for (const card of FALLBACKS) {
    const res = validate(card);
    assert.equal(res.ok, true, `Fallback card "${card.action}" failed: ${(res as any).reason}`);
  }
  for (const card of MICRO) {
    const res = validate(card);
    assert.equal(res.ok, true, `Micro card "${card.action}" failed: ${(res as any).reason}`);
  }
});

test('needsCare() checks', () => {
  assert.equal(needsCare("I want to die"), true);
  assert.equal(needsCare("deadline thursday, boss emailed 3x"), false);
});

test('extractJson checks', () => {
  const fenced = "```json\n{\"action\":\"Drink a glass of water.\",\"why_gentle\":\"It is physical.\",\"time_box_minutes\":2}\n```";
  const res1 = extractJson(fenced);
  assert.equal(res1.ok, true);
  if (res1.ok) {
    assert.equal((res1.data as any).action, "Drink a glass of water.");
  }

  const surrounding = "Here is your suggestion: {\"action\":\"Open a window.\",\"why_gentle\":\"Fresh air.\",\"time_box_minutes\":1} hope this helps";
  const res2 = extractJson(surrounding);
  assert.equal(res2.ok, true);
  if (res2.ok) {
    assert.equal((res2.data as any).action, "Open a window.");
  }

  const bad = "no json here";
  const res3 = extractJson(bad);
  assert.equal(res3.ok, false);
});

test('isSmaller() guard checks', () => {
  const prev: Card = { action: "Write down the first thing on your mind.", why_gentle: "Short.", time_box_minutes: 5 };
  const smallerTime: Card = { action: "Write down the first thing on your mind.", why_gentle: "Short.", time_box_minutes: 2 };
  const smallerWords: Card = { action: "Drink water.", why_gentle: "Short.", time_box_minutes: 5 };
  const notSmaller: Card = { action: "Write down the first thing on your mind and focus.", why_gentle: "Short.", time_box_minutes: 6 };

  assert.equal(isSmaller(smallerTime, prev), true);
  assert.equal(isSmaller(smallerWords, prev), true);
  assert.equal(isSmaller(notSmaller, prev), false);
});

test('validateAvoidPreferences deterministic checks', () => {
  // Screens or messages
  assert.equal(validateAvoidPreferences("Put your phone face down.", ["Screens or messages"]).ok, false);
  assert.equal(validateAvoidPreferences("Open your boss's most recent email.", ["Screens or messages"]).ok, false);
  assert.equal(validateAvoidPreferences("Read one message in your inbox.", ["Screens or messages"]).ok, false);
  assert.equal(validateAvoidPreferences("Drink a glass of water.", ["Screens or messages"]).ok, true);

  // Going outside
  assert.equal(validateAvoidPreferences("Take a walk outside.", ["Going outside"]).ok, false);
  assert.equal(validateAvoidPreferences("Step onto the balcony.", ["Going outside"]).ok, false);
  assert.equal(validateAvoidPreferences("Write down the first thing on your mind.", ["Going outside"]).ok, true);

  // Talking to people
  assert.equal(validateAvoidPreferences("Talk to a friend.", ["Talking to people"]).ok, false);
  assert.equal(validateAvoidPreferences("Ask someone for help.", ["Talking to people"]).ok, false);
  assert.equal(validateAvoidPreferences("Open a window.", ["Talking to people"]).ok, true);

  // Anything physical
  assert.equal(validateAvoidPreferences("Stand up slowly.", ["Anything physical"]).ok, false);
  assert.equal(validateAvoidPreferences("Stretch your arms slowly.", ["Anything physical"]).ok, false);
  assert.equal(validateAvoidPreferences("Breathe out slowly.", ["Anything physical"]).ok, true);
});

test('buildChosenForLabel checks', () => {
  assert.equal(
    buildChosenForLabel({ energy: 'Low', helps: ['Writing it down'] }),
    'Chosen for: low energy · you like writing things down'
  );
  assert.equal(
    buildChosenForLabel({ energy: 'Very low' }),
    'Chosen for: very low energy'
  );
  assert.equal(
    buildChosenForLabel({ focus: 'Work' }),
    'Chosen for: work focus'
  );
});

test('quota protection defaults and counters', () => {
  resetQuotaTrackerForTest();
  assert.equal(getDailyLimit(), 600);
  assert.equal(getMinuteLimit(), 12);

  const initial = getQuotaStatus();
  assert.equal(initial.dailyCount, 0);
  assert.equal(initial.minuteCount, 0);
  assert.equal(initial.isBusy, false);
  assert.equal(checkModelQuota().allowed, true);

  // Record up to minute limit
  for (let i = 0; i < 12; i++) {
    assert.equal(checkModelQuota().allowed, true);
    recordModelCall();
  }

  // 13th call should be blocked with reason busy
  const minuteBlocked = checkModelQuota();
  assert.equal(minuteBlocked.allowed, false);
  assert.equal(minuteBlocked.reason, 'busy');
  assert.equal(getQuotaStatus().isBusy, true);

  // Reset for next check
  resetQuotaTrackerForTest();
  assert.equal(checkModelQuota().allowed, true);
});

test('classifyError detects 429 and RESOURCE_EXHAUSTED as busy', () => {
  assert.equal(classifyError({ status: 429 }), 'busy');
  assert.equal(classifyError({ status: 'RESOURCE_EXHAUSTED' }), 'busy');
  assert.equal(classifyError(new Error('Resource has been exhausted (e.g. check quota).')), 'busy');
  assert.equal(classifyError(new Error('Quota exceeded for quota metric...')), 'busy');
  assert.equal(classifyError(new Error('Rate limit exceeded: 429')), 'busy');

  // Other error classifications
  assert.equal(classifyError(new Error('API key not valid. Please pass a valid API key.')), 'no API key');
  assert.equal(classifyError(new Error('models/gemma-not-found is not found')), 'model not found');
  assert.equal(classifyError(new Error('timeout')), 'timeout');
});

test('markExternal429 triggers busy state and returns busy note', () => {
  resetQuotaTrackerForTest();
  assert.equal(checkModelQuota().allowed, true);

  markExternal429(10000); // 10s cooldown
  const status = checkModelQuota();
  assert.equal(status.allowed, false);
  assert.equal(status.reason, 'busy');
  assert.equal(
    BUSY_USER_MESSAGE,
    'Still is resting for a moment. You can try again soon, or switch to Local mode in Settings.'
  );

  resetQuotaTrackerForTest();
});


