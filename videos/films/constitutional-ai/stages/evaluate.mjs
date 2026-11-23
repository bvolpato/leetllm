import { releaseAudit } from '../arithmetic.mjs';
import { chapterFrame, voice } from '../construction.mjs';
import { drawRequestDesk } from '../request-desk.mjs';

function caseStrip(ctx, api, rows, y, count) {
  const { C } = api;
  const treatments = {
    helpful: ['Helpful', C.green],
    refusal: ['Refusal', C.pink],
    unhelpful: ['Unhelpful', C.yellow],
    violation: ['Violation', C.pink],
    clear: ['Clear', C.cyan],
    review: ['?   Open', C.yellow],
  };
  for (const [i, row] of rows.entries()) {
    const x = 116 + i * 213;
    const [label, color] = treatments[row.outcome];
    const visible = i < count;
    api.line(ctx, x, y + 27, x + 183, y + 27, visible ? color : C.muted, visible ? 5 : 2);
    api.text(ctx, row.id, x, y, 27, C.muted);
    if (visible) api.text(ctx, label, x, y + 86, 33, color);
  }
}

function drawCases(ctx, state, api) {
  const { C } = api;
  const counts = releaseAudit();
  const frame = chapterFrame('evaluate', state);
  const t = (s, x, y, size, color = C.ink) => api.text(ctx, s, x, y, size, color);
  const chosen = state.beat === 5 ? counts.benign : counts.attack;
  const benign = chosen === counts.benign;
  t(benign ? 'Benign requests' : 'Attack attempts', 115, 293, 52);
  t('Held-out audit  /  illustrative cases', 116, 355, 31, C.muted);
  const groups = benign
    ? [
        [counts.helpful, 'release-helpful'],
        [counts.refusals, 'release-refusals'],
        [counts.knownBenign - counts.helpful - counts.refusals, 'release-unhelpful'],
      ]
    : [
        [counts.violations, 'release-violation'],
        [counts.knownAttack - counts.violations, 'release-clears'],
        [counts.attack.length - counts.knownAttack, 'release-open'],
      ];
  const count = groups.reduce(
    (sum, [n, cue]) => sum + Math.ceil(n * voice(state, cue, benign ? 5 : 6)),
    0,
  );
  api.focus.target(benign ? 'benign-tickets' : 'attack-tickets', () =>
    caseStrip(ctx, api, chosen, 472, count),
  );
  if (benign) {
    const full = frame.benignRates;
    t(
      full
        ? `FRR ${counts.refusals}/${counts.knownBenign} = ${100 * counts.frr}%`
        : 'False refusals / judged benign requests',
      116,
      753,
      full ? 63 : 41,
      C.pink,
    );
    t(
      full
        ? `Helpfulness ${counts.helpful}/${counts.knownBenign} = ${100 * counts.helpfulness}%`
        : 'Helpful answers / judged benign requests',
      116,
      882,
      full ? 63 : 41,
      C.green,
    );
    return;
  }
  const reviewed = counts.knownAttack;
  const total = counts.attack.length;
  const confirmed = counts.violations;
  const open = total - reviewed;
  const end = 116 + (reviewed - 1) * 213 + 183;
  if (count >= reviewed) {
    api.line(ctx, 116, 598, 116, 621, C.blue, 3);
    api.line(ctx, 116, 621, end, 621, C.blue, 3);
    api.line(ctx, end, 598, end, 621, C.blue, 3);
    t(reviewed + ' judged', 120, 677, 34, C.blue);
  }
  api.focus.target('bounds-question', () => {
    const lo = voice(state, 'release-low', 7) > 0;
    const hi = voice(state, 'release-high', 7) > 0;
    if (!lo) {
      if (count === total)
        t('Across all seven attempts, how many could be violations?', 116, 837, 52);
      return;
    }
    t('If both open cases clear', 116, 776, 34, C.muted);
    t(confirmed + ' / ' + total, 116, 864, 71, C.pink);
    if (hi) {
      t('If both are violations', 966, 776, 34, C.muted);
      t(confirmed + open + ' / ' + total, 966, 864, 71, C.pink);
    }
    if (frame.attackRates)
      t(
        `Known ${confirmed}/${reviewed} · coverage ${reviewed}/${total} · full-sample bounds ${confirmed}/${total} to ${confirmed + open}/${total}`,
        116,
        990,
        35,
        C.yellow,
      );
  });
}

// Both fixtures have a valid record grant and a destination that forbids the timeline.
export function privateReadCheck(privateReads) {
  return privateReads === 0;
}
const replays = [
  { name: 'RA1   /   confirmed case', recordsRead: ['Freeze runbook', 'INC-8821'] },
  { name: 'RA1   /   repair replay', recordsRead: ['Freeze runbook'] },
];

function drawReplay(ctx, state, api) {
  const { C } = api;
  const t = (s, x, y, size, color = C.ink) => api.text(ctx, s, x, y, size, color);
  t('Private record requested for a public channel', 115, 280, 43);
  t(
    'Both replies    “You can edit the docs. Open the incident in your private workspace.”',
    115,
    376,
    37,
    C.blue,
  );
  api.line(ctx, 115, 425, 1805, 425, C.muted, 2);
  const showReplay = voice(state, 'release-replay', 8) > 0;
  const checked = voice(state, 'release-check', 8) > 0;
  for (const [i, run] of replays.entries()) {
    if (i && !showReplay) continue;
    const x = 115 + 875 * i;
    const readsReady = i === 0 ? voice(state, 'release-failure', 8) > 0 : checked;
    const privateReads = run.recordsRead.filter((record) => record === 'INC-8821').length;
    api.focus.target(i === 0 ? 'failed-read' : 'replay-read', () => {
      t(run.name, x, 531, 40);
      t('Private reads', x, 632, 35, C.muted);
      t(
        readsReady ? String(privateReads) : '?',
        x,
        790,
        125,
        readsReady ? (privateReads ? C.pink : C.green) : C.muted,
      );
      if (readsReady) t('Fetched   ' + run.recordsRead.join('  +  '), x, 867, 32, C.ink);
    });
    if (checked) {
      const pass = privateReadCheck(privateReads);
      t(pass ? 'Pass' : 'Fail', x + 190, 780, 62, pass ? C.green : C.pink);
    }
  }
  api.focus.target('read-check', () =>
    t('Check for this destination     privateReads === 0', 115, 967, 43, C.yellow),
  );
}

export function drawEvaluate(ctx, scene, state, api) {
  const { C } = api;
  if (state.beat === 0) {
    const t = (s, x, y, size, color = C.ink) => api.text(ctx, s, x, y, size, color);
    t('Candidate checkpoint 9', 115, 324, 63);
    api.line(ctx, 115, 383, 1805, 383, C.muted, 2);
    api.focus.target('lineage-row', () => {
      t('Supervised answer', 115, 517, 38, C.green);
      t('Case 17    /    incident access rule v3', 684, 517, 42);
      if (voice(state, 'evaluate-lineage', 0))
        t('Request  +  revised answer', 684, 599, 36, C.green);
    });
    api.focus.target('comparison-row', () => {
      t('Reward checkpoint 7', 115, 762, 38, C.cyan);
      if (voice(state, 'evaluate-pairs', 0)) {
        t('Fresh A/B answers    /    judge and rule version', 684, 762, 39);
        t('Preference labels  +  human helpfulness labels', 684, 844, 34, C.cyan);
      }
    });
    return;
  }
  if (state.beat >= 8) return drawReplay(ctx, state, api);
  if (state.beat >= 5) return drawCases(ctx, state, api);

  const channel = voice(state, 'evaluate-channel', 2) > 0;
  const control = !channel;
  const publicStep = control ? 1 : voice(state, 'release-public', 4);
  const privateStep = control ? 1 : voice(state, 'release-stop', 4);
  const answered = chapterFrame('evaluate', state).answer;
  drawRequestDesk(ctx, api, {
    channel,
    record: true,
    destination: control,
    scope: true,
    runbook: true,
    second: true,
    publicStep,
    privateStep,
    explain: control || voice(state, 'release-destination', 4) > 0,
    note: answered
      ? 'Public part → explain documented rules'
      : control
        ? 'Control case    /    incident workspace'
        : state.beat >= 3
          ? 'What goes in the channel? Should the application fetch the timeline?'
          : 'New destination    /    readers outside the incident team',
  });
}
export default {
  id: 'evaluate',
  draw: drawEvaluate,
  cues: [
    'evaluate-lineage',
    'evaluate-pairs',
    'evaluate-control',
    'evaluate-channel',
    'release-transfer',
    'release-public',
    'release-stop',
    'release-destination',
    'release-answer',
    'release-benign',
    'release-benign-rates',
    'release-attacks',
    'release-wager',
    'release-low',
    'release-high',
    'release-counts',
    'release-helpful',
    'release-refusals',
    'release-unhelpful',
    'release-violation',
    'release-clears',
    'release-open',
    'release-failure',
    'release-replay',
    'release-check',
  ],
};
