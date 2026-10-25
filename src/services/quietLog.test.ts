import test from 'node:test';
import assert from 'node:assert';
import {
  QuietLogEntry,
  getQuietLogInsight,
} from './quietLog.ts';

test('getQuietLogInsight provides gentle insight based on context frequency', () => {
  const restEntries: QuietLogEntry[] = [
    { id: '1', action: 'sit for 1 minute', why_gentle: 'rest', time_box_minutes: 1, context: 'Rest', timestamp: 1 },
    { id: '2', action: 'close your eyes', why_gentle: 'rest', time_box_minutes: 2, context: 'Rest', timestamp: 2 },
    { id: '3', action: 'stretch', why_gentle: 'body', time_box_minutes: 2, context: 'Work', timestamp: 3 },
  ];
  assert.strictEqual(
    getQuietLogInsight(restEntries),
    'You have been choosing Rest mode a lot lately. It is okay to take it slow.'
  );

  const homeEntries: QuietLogEntry[] = [
    { id: '1', action: 'put away one mug', why_gentle: 'home', time_box_minutes: 1, context: 'Home', timestamp: 1 },
    { id: '2', action: 'wipe counter', why_gentle: 'clean', time_box_minutes: 2, context: 'Home', timestamp: 2 },
  ];
  assert.strictEqual(
    getQuietLogInsight(homeEntries),
    'You often get stuck on Home tasks. Start small.'
  );

  const workEntries: QuietLogEntry[] = [
    { id: '1', action: 'close one tab', why_gentle: 'focus', time_box_minutes: 1, context: 'Work', timestamp: 1 },
    { id: '2', action: 'archive one email', why_gentle: 'inbox', time_box_minutes: 2, context: 'Work', timestamp: 2 },
    { id: '3', action: 'look out window', why_gentle: 'eyes', time_box_minutes: 1, context: 'Rest', timestamp: 3 },
  ];
  assert.strictEqual(
    getQuietLogInsight(workEntries),
    'You have been focusing on Work tasks recently. Remember to take gentle breaths between them.'
  );

  const studyEntries: QuietLogEntry[] = [
    { id: '1', action: 'read one paragraph', why_gentle: 'study', time_box_minutes: 2, context: 'Study', timestamp: 1 },
    { id: '2', action: 'jot down one term', why_gentle: 'notes', time_box_minutes: 1, context: 'Study', timestamp: 2 },
  ];
  assert.strictEqual(
    getQuietLogInsight(studyEntries),
    'You have been in Study mode recently. Remember to pause and let concepts settle.'
  );

  const mixedEntries: QuietLogEntry[] = [
    { id: '1', action: 'close one tab', why_gentle: 'focus', time_box_minutes: 1, context: 'Work', timestamp: 1 },
    { id: '2', action: 'drink water', why_gentle: 'hydrate', time_box_minutes: 1, context: 'Home', timestamp: 2 },
    { id: '3', action: 'breathe', why_gentle: 'calm', time_box_minutes: 1, context: 'Rest', timestamp: 3 },
  ];
  assert.strictEqual(
    getQuietLogInsight(mixedEntries),
    'A quiet rhythm across different parts of your day. Take each moment as it comes.'
  );

  assert.strictEqual(getQuietLogInsight([]), '');
});
