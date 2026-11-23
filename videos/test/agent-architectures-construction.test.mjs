import test from 'node:test';
import assert from 'node:assert/strict';
import {
  contextLedger,
  dependencyState,
  uctRows,
  approvalReplay,
  canonicalAgentAction,
  periodicWithoutProgress,
  recoveryVerdict,
  changedItinerary,
} from '../animations/agent-architectures.mjs';

test('an observation is submitted only on later requests', () => {
  const r = contextLedger(700, 100, 6);
  assert.deepEqual(r.calls, [700, 800, 900, 1000, 1100, 1200]);
  assert.equal(r.total, 5700);
  assert.equal(r.read + r.written, r.total);
  assert.equal(contextLedger(700, 100, 6, 2).total, 5100);
});
test('exclusive dependency expiry blocks the derived decision', () => {
  const rows = {
    ci: { revision: 'r', until: 1200, version: 1 },
    diff: { revision: 'r', until: 1200, version: 1 },
    health: { revision: 'r', until: 1100, version: 1 },
    decision: { revision: 'r', until: 1200, version: 1, consumed: { ci: 1, diff: 1, health: 1 } },
  };
  assert.equal(dependencyState(rows, 'r', 1099).valid.decision, true);
  const at = dependencyState(rows, 'r', 1100);
  assert.deepEqual(at.ready, ['health']);
  assert.equal(at.valid.decision, false);
});
test('a refreshed parent cannot revive a conclusion made from its prior version', () => {
  const rows = {
    ci: { revision: 'r', until: 1200, version: 1 },
    diff: { revision: 'r', until: 1200, version: 1 },
    health: { revision: 'r', until: 1200, version: 2 },
    decision: { revision: 'r', until: 1200, version: 1, consumed: { ci: 1, diff: 1, health: 1 } },
  };
  assert.equal(dependencyState(rows, 'r', 1100).valid.decision, false);
  rows.decision.consumed.health = 2;
  assert.equal(dependencyState(rows, 'r', 1100).valid.decision, true);
  assert.deepEqual(dependencyState(rows, 'other', 1100).ready, ['ci', 'diff', 'health']);
});
test('UCT can choose a low mean because its exploration bonus is larger', () => {
  const rows = uctRows(20, [
    { id: 'A', N: 16, W: 12.8 },
    { id: 'B', N: 4, W: 1.6 },
  ]);
  assert(rows[1].mean < rows[0].mean);
  assert(rows[1].score > rows[0].score);
  assert.equal(uctRows(10, [{ id: 'new', N: 0, W: 0 }])[0].score, Infinity);
  assert.throws(() => uctRows(10, [{ id: 'bad', N: 1, W: NaN }]));
});
test('reply loss and same-key replay conserve the proposal while authority remains current', () => {
  const r = { type: 'request', key: 'op', actor: 'a', release: 'r', revision: 'c' };
  const result = approvalReplay([
    r,
    { type: 'grant', allowed: false },
    r,
    { type: 'grant', allowed: true },
    r,
    { ...r, release: 'other' },
  ]);
  assert.deepEqual(result.outcomes, ['created RB2041', 'denied', 'replay RB2041', 'conflict']);
  assert.equal(result.records.length, 1);
});
test('canonical action keys ignore structural order but preserve nested query contents', () => {
  assert.equal(
    canonicalAgentAction({ tool: 'read', args: { a: 1, q: 'team id' } }),
    canonicalAgentAction({ args: { q: 'team id', a: 1 }, tool: 'read' }),
  );
  assert.notEqual(
    canonicalAgentAction({ tool: 'read', args: { q: 'team id' } }),
    canonicalAgentAction({ tool: 'read', args: { q: 'teamid' } }),
  );
  assert.throws(() => canonicalAgentAction({ args: { n: NaN } }));
});
test('period-three suffix detects stagnation after earlier progress but honors the newest marker', () => {
  const make = (tool) => ({ tool, args: {} }),
    actions = ['Z', 'A', 'B', 'C', 'A', 'B', 'C'].map(make),
    markers = ['p0', ...Array(7).fill('p1')];
  assert.equal(periodicWithoutProgress(actions, markers), true);
  assert.equal(periodicWithoutProgress(actions, [...markers.slice(0, -1), 'p2']), false);
  assert.equal(
    periodicWithoutProgress(
      [make('read'), { tool: 'read', args: { q: 'different' } }],
      ['p0', 'p0', 'p0'],
    ),
    false,
  );
});
test('recovery requires exact identity, exclusive age, finite latency and approval', () => {
  const h = { region: 'us-east', revision: 'def456', at: 990, p95: 200 };
  assert.equal(recoveryVerdict(h, { approved: true }), 'closed');
  assert.equal(recoveryVerdict({ ...h, at: 940 }, { approved: true }), 'stale or future');
  assert.equal(recoveryVerdict({ ...h, region: 'eu-west' }, { approved: true }), 'wrong identity');
  assert.equal(recoveryVerdict({ ...h, p95: NaN }, { approved: true }), 'unhealthy');
  assert.equal(recoveryVerdict(h), 'approval missing');
});
test('the changed itinerary fails the user limit until the explicitly approved duration changes', () => {
  assert.equal(changedItinerary().arrival, 945);
  assert.equal(changedItinerary().finish, 1035);
  assert.equal(changedItinerary().feasible, false);
  assert.equal(changedItinerary(70).finish, 1015);
  assert.equal(changedItinerary(70).feasible, true);
});

import { createCanvas } from '@napi-rs/canvas';
import { registerLessonFonts } from '../lib/fonts.mjs';
import { readLesson } from '../lib/lesson.mjs';
import { drawFrame } from '../lib/scene.mjs';
import { draw } from '../animations/agent-architectures.mjs';
const root = new URL('../../', import.meta.url).pathname;
const lessonPromise = readLesson(root + 'videos/lessons/agent-architectures.lesson.yaml', root);
async function visibleState(sceneId, beat, overrides = {}) {
  registerLessonFonts();
  const lesson = await lessonPromise,
    scene = lesson.scenes.find((s) => s.id === sceneId);
  const cues = Object.fromEntries(
    scene.beats.flatMap((b, i) =>
      (b.visual_cues ?? []).map((c) => [
        c.id,
        {
          ...c,
          phase: i < beat ? 'after' : 'before',
          progress: i < beat ? 1 : 0,
          strength: 0,
          reveal: i < beat ? 1 : 0,
        },
      ]),
    ),
  );
  for (const [id, progress] of Object.entries(overrides))
    Object.assign(cues[id], {
      progress,
      reveal: progress,
      phase: progress === 1 ? 'after' : progress ? 'during' : 'before',
    });
  const canvas = createCanvas(1920, 1080);
  return drawFrame(
    canvas.getContext('2d'),
    lesson,
    scene,
    { beat, beatP: 0.5, t: 0, opacity: 1, cues, cueTiming: 'estimated-lexical-words' },
    draw,
  ).labels.map((x) => x.text);
}

test('fresh finish numbers do not reveal the separate limit verdict early', async () => {
  const failedNumber = await visibleState('fresh-itinerary', 1, {
    'fresh-arrival': 1,
    'fresh-finish': 1,
  });
  assert(failedNumber.some((x) => x.includes('finish 17:15')));
  assert(!failedNumber.some((x) => x.includes('user deadline fails')));
  const failedDecision = await visibleState('fresh-itinerary', 1, {
    'fresh-arrival': 1,
    'fresh-finish': 1,
    'fresh-failed': 1,
  });
  assert(failedDecision.some((x) => x.includes('user deadline fails')));
  const repairedNumber = await visibleState('fresh-itinerary', 2, {
    'fresh-short': 1,
    'fresh-repaired': 1,
  });
  assert(repairedNumber.some((x) => x.includes('finish 16:55')));
  assert(!repairedNumber.some((x) => x.includes('Both limits pass')));
  const repairedDecision = await visibleState('fresh-itinerary', 2, {
    'fresh-short': 1,
    'fresh-repaired': 1,
    'fresh-repair-pass': 1,
  });
  assert(repairedDecision.some((x) => x.includes('Both limits pass')));
});

test('a current selected run replaces the failed evaluator state and retains one memory', async () => {
  const labels = await visibleState('reflexion-feedback', 2);
  assert(labels.includes('current-run · c1842'));
  assert(labels.includes('revision-aware: PASS'));
  assert(!labels.includes('revision-aware: FAIL'));
  assert(labels.some((x) => x.includes('memory count stays 1')));
});

test('removing a plan effect removes that graph node while the external proposal survives', async () => {
  const before = await visibleState('consumed-versions', 1, { 'version-health': 1 });
  assert(before.includes('effect'));
  const removed = await visibleState('consumed-versions', 1, {
    'version-health': 1,
    'version-effect': 1,
  });
  assert(!removed.includes('effect'));
  assert(removed.includes('External proposal ledger: RB2041'));
});

test('the next malformed patch request conserves the already-created draft', async () => {
  const labels = await visibleState('tainted-interface', 2, { 'patch-extra': 1 });
  assert(labels.includes('Draft count: 1'));
  assert(labels.includes('Exact change approved'));
  assert(labels.includes('Reject before any new draft'));
});

test('the visible recovery cases use the actual local values and independent failed gates', async () => {
  const wrong = await visibleState('incident-recovery', 2);
  assert(wrong.includes('eu-west'));
  assert(wrong.includes('def456'));
  assert(wrong.includes('120 ms'));
  assert(wrong.some((x) => x.includes('wrong identity')));
  const slow = await visibleState('incident-recovery', 2, { 'recovery-high-latency': 0.5 });
  assert(slow.includes('us-east'));
  assert(slow.includes('940 ms'));
  assert(slow.some((x) => x.includes('unhealthy')));
  const healthy = await visibleState('incident-recovery', 2, {
    'recovery-high-latency': 1,
    'recovery-no-approval': 0.5,
  });
  assert(healthy.includes('120 ms'));
  assert(healthy.some((x) => x.includes('approval missing')));
  const closed = await visibleState('incident-recovery', 2, {
    'recovery-high-latency': 1,
    'recovery-no-approval': 1,
    'recovery-close': 1,
  });
  assert(closed.includes('A2099 + def456'));
  assert(closed.some((x) => x.includes('incident closes')));
});

test('an established arrival keeps the complete journey segment while the finish is still pending', () => {
  const rects = [],
    C = {
      ink: '#fff',
      muted: '#999',
      bg: '#000',
      panel: '#111',
      cyan: '#0af',
      blue: '#44f',
      pink: '#f6a',
      yellow: '#ff0',
      green: '#0f0',
    };
  const cues = {
    'aa-fresh-itinerary-1': { progress: 0.05 },
    'fresh-arrival': { progress: 1 },
    'fresh-finish': { progress: 0 },
  };
  const api = {
    C,
    text() {},
    math() {},
    line() {},
    arrow() {},
    circle() {},
    rect(_ctx, x, y, width, height, fill) {
      rects.push({ x, y, width, height, fill });
    },
    focus: {
      target(_id, paint) {
        return paint();
      },
      progress(id) {
        return cues[id]?.progress ?? 0;
      },
    },
  };
  draw({}, { id: 'fresh-itinerary' }, { beat: 1, beatP: 0.05, cues }, api);
  const journey = rects.find((x) => x.fill === C.cyan && x.height === 44);
  const visit = rects.find((x) => x.fill === C.yellow && x.height === 44);
  assert.equal(journey.width, 25 * 5.52);
  assert(
    Math.abs(journey.x + journey.width - visit.x) < 1e-9,
    'The visit must begin at the established arrival, with no gap after the bus segment.',
  );
});

test('the surviving hours and route receipts enter the ledger at their separate spoken operations', () => {
  const positions = (beat, cues) => {
    const rects = [],
      labels = [],
      C = {
        ink: '#fff',
        muted: '#999',
        line: '#888',
        panel: '#111',
        cyan: '#0af',
        blue: '#44f',
        pink: '#f6a',
        yellow: '#ff0',
        green: '#0f0',
      },
      api = {
        C,
        text(_ctx, text, x, y) {
          labels.push({ text, x, y });
        },
        math() {},
        line() {},
        arrow() {},
        circle() {},
        rect(_ctx, x, y, width, height) {
          rects.push({ x, y, width, height });
        },
        focus: {
          target(_id, paint) {
            return paint();
          },
          progress(id) {
            return cues[id]?.progress ?? 0;
          },
        },
      };
    draw({}, { id: 'transfer' }, { beat, beatP: 0.5, cues }, api);
    return {
      ys: rects.filter((r) => r.width === 1560 && r.height === 86).map((r) => r.y),
      labels: labels.map((r) => r.text),
    };
  };
  assert.deepEqual(positions(0, {}).ys, [650, 820]);
  const first = positions(0, { 'transfer-b1-1': { progress: 1 } });
  assert.deepEqual(first.ys, [340, 820]);
  const both = positions(0, { 'transfer-b1-1': { progress: 1 }, 'transfer-b1-2': { progress: 1 } });
  assert.deepEqual(both.ys, [340, 455]);
  assert.deepEqual(positions(1, {}).ys, [340, 455]);
  assert(first.labels.includes('hours-24 · History / today / closes 18:00'));
  assert(both.labels.includes('route-31 · History / today / bus 14:10 / journey 25 min'));
});
