import assert from 'node:assert/strict';
import {
  reasoningDecision,
  reasoningRecordScore,
} from '../../../films/reasoning-search/arithmetic.mjs';
import {
  field,
  rect,
  line,
  txt,
  label,
  badge,
  plate,
  disk,
  mix,
  ease,
  cue,
  navy,
  ink,
  cream,
  mint,
  teal,
  copper,
  pale,
  red,
} from './art.mjs';

const keys = ['tests_passed', 'security_scan_clear', 'reviewer_approved'];
const sources = ['Test runner', 'Scan service', 'Review log'];
const predicates = ['Tests passed', 'Scan clear', 'Review approved'];
const clean = Object.fromEntries(keys.map((k) => [k, true]));
const act = (a) =>
  ({ merge_release: 'Merge', manual_review: 'Manual review', waiting: 'Await scan' })[a];
const scanRead = { name: 'get_security_scan', run_id: 'ci-1482' };
const readScope = 'scan:read:ci-1482';
function authorized(call, scope) {
  return call.name === 'get_security_scan' && call.run_id === 'ci-1482' && scope === readScope;
}
function readScan(call, scope) {
  assert(authorized(call, scope), 'The scan read requires the matching run and permission.');
  return { run_id: call.run_id, security_scan_clear: false };
}
function snapshot(ending, stage) {
  const facts = { ...clean },
    checks = { ...clean };
  let action = 'merge_release';
  const requests = ending && stage >= 3 && authorized(scanRead, readScope) ? [scanRead] : [];
  const reply = stage >= 4 && requests.length ? readScan(requests[0], readScope) : null;
  if (ending) facts.security_scan_clear = stage >= 5 ? reply.security_scan_clear : undefined;
  else if (stage < 2) checks.security_scan_clear = false;
  else if (stage === 3) {
    delete checks.security_scan_clear;
    delete checks.reviewer_approved;
    action = 'manual_review';
  }
  const policy =
    typeof facts.security_scan_clear === 'boolean' ? reasoningDecision(facts) : 'waiting';
  return {
    facts,
    checks,
    action,
    policy,
    version: ending ? 17 : null,
    reads: requests.length,
    score: ending ? null : reasoningRecordScore({ checks, final_action: action }, facts),
  };
}
function jack(g, x, y, on, color) {
  disk(g, x, y, 11, '#121f25', '#b4aa92', 3);
  disk(g, x, y, 5, on ? color : '#07171c');
}
function cable(g, x, y, w, t, color) {
  const points = [];
  for (let i = 0; i <= 40 * t; i++) {
    const a = i / 40;
    points.push([x + w * a, y + Math.sin(Math.PI * a) * 15]);
  }
  for (const [width, col, dy] of [
    [8, '#092b30', 3],
    [4, color, 0],
  ]) {
    g.beginPath();
    points.forEach(([xx, yy], i) => (i ? g.lineTo(xx, yy + dy) : g.moveTo(xx, yy + dy)));
    g.lineWidth = width;
    g.strokeStyle = col;
    g.stroke();
  }
}
function value(g, v, x, y, highlight = false) {
  const word = v === undefined ? 'empty' : String(v);
  rect(g, x, y - 24, 111, 48, '#182e34', 6, highlight ? copper : '#6a807c', highlight ? 4 : 1);
  txt(g, word, x + 55.5, y, 26, v === undefined ? '#c0c5be' : cream, 'center', 'Mono');
}
export function release(g, c, end = false) {
  const q = (b, p, t = 0) => cue(c, b, p, t);
  const stage = end
    ? q(3, 'Put false')
      ? 5
      : q(3, 'scan failed')
        ? 4
        : q(2, 'Send that one request')
          ? 3
          : q(2, 'read permission')
            ? 2
            : q(2, 'proposes a typed read')
              ? 1
              : 0
    : q(3, 'Try the shorter record')
      ? 3
      : q(2, 'to true')
        ? 2
        : q(2, 'The scan')
          ? 1
          : 0;
  const s = snapshot(end, stage);
  field(g, 'panel');
  const id = end ? 'ci-1482' : 'ci-1481';
  label(g, 'RELEASE CONTROL   /   ' + id, 62, 70, pale);
  if (end) {
    txt(g, 'Deployed', 645, 69, 23, pale);
    badge(g, 'v' + s.version, 756, 47, 90, mint);
    txt(g, 'Candidate', 901, 69, 23, pale);
    badge(g, 'v18', 1024, 47, 95, '#45636a', cream);
  } else txt(g, 'Policy requires all three checks', 1205, 71, 28, cream, 'right', 'Serif');
  const arrival = end || c.beat.beatIndex > 0 ? 1 : ease(Math.min(1, 0.68 + c.elapsed * 0.44));
  const mx = 699 + 65 * (1 - arrival);
  plate(g, 50, 130, 520, 405, '#d9e5d8');
  plate(g, mx, 130, 530, 405, '#f3dfbb');
  label(g, 'TRUSTED SERVICE', 84, 165, teal);
  label(g, 'MODEL RECORD', mx + 36, 165, red);
  const verdict = end && stage === 5 && !q(3, 'Manual review') ? 'Checking policy' : act(s.policy);
  txt(g, verdict, 83, 221, 46, ink, 'left', 'Serif');
  txt(g, act(s.action), mx + 35, 221, 46, ink, 'left', 'Serif');
  line(g, 84, 262, 536, 262, '#91a399');
  line(g, mx + 35, 262, mx + 495, 262, '#baac91');
  keys.forEach((k, i) => {
    const y = 309 + 82 * i;
    txt(g, sources[i], 86, y, 27, ink);
    value(
      g,
      s.facts[k],
      403,
      y,
      (!end && stage === 1 && i === 1) || (end && stage === 5 && i === 1),
    );
    value(g, s.checks[k], mx + 43, y, !end && stage === 1 && i === 1);
    txt(g, predicates[i], mx + 180, y, 26, ink);
    const connected = typeof s.facts[k] === 'boolean' && typeof s.checks[k] === 'boolean';
    const reach =
      end || c.beat.beatIndex > 0 ? 1 : Math.min(1, arrival + (c.elapsed - i * 0.25) * 0.12);
    if (connected)
      cable(
        g,
        550,
        y,
        mx + 14 - 550,
        Math.max(0, reach),
        !end && stage === 1 && i === 1 ? copper : '#aac9bc',
      );
    jack(g, 550, y, connected, mint);
    jack(g, mx + 14, y, connected, copper);
  });
  if (!end) {
    if (stage > 0 && (stage !== 3 || q(3, 'One of three fields'))) {
      const scoreY = 581;
      label(g, 'FIELDS SUPPLIED', 83, scoreY - 1, pale);
      label(g, 'VALUES', 550, scoreY - 1, pale);
      label(g, 'ACTION', 940, scoreY - 1, pale);
      txt(g, Math.round(s.score.coverage * 3) + ' of 3', 270, scoreY, 36, cream);
      txt(
        g,
        s.score.valuesMatch ? 'Match' : 'Mismatch',
        638,
        scoreY,
        36,
        s.score.valuesMatch ? mint : copper,
      );
      txt(
        g,
        s.score.actionMatches ? 'Match' : 'Mismatch',
        1028,
        scoreY,
        36,
        s.score.actionMatches ? mint : copper,
      );
    } else
      txt(
        g,
        stage === 3 ? 'How many fields arrived?' : 'Which value changed?',
        640,
        621,
        38,
        cream,
        'center',
        'Serif',
      );
  } else if (stage === 0) {
    label(g, 'SCAN INPUT', 72, 583, pale);
    txt(g, 'Where does this run’s result live?', 223, 581, 35, cream, 'left', 'Serif');
  } else {
    const message = [
      '',
      'Proposed read',
      'Run and read scope checked',
      'Read sent · waiting',
      'Reply · scan clear = false',
      'Recorded · scan clear = false',
    ][stage];
    const statusY = 564;
    const pathY = 565;
    label(g, message.toUpperCase(), 72, statusY, stage >= 4 ? copper : pale, 'left', 19);
    label(g, s.reads + ' read' + (s.reads === 1 ? '' : 's'), 601, statusY, mint, 'right', 20);
    txt(
      g,
      scanRead.name + '(run_id="' + scanRead.run_id + '")',
      72,
      596,
      25,
      cream,
      'left',
      'Mono',
    );
    const route = [706, 914, 1138];
    const legs = ['Runtime', 'Read scope', 'Scan service'];
    const progress = stage === 1 ? 0 : stage === 2 ? 1 : 1 + q(2, 'Send that one request', 0.8);
    line(g, route[0], pathY, route[2], pathY, '#64847c', 3);
    route.forEach((x, i) => {
      disk(g, x, pathY, 7, i <= progress ? mint : navy, pale, 2);
      label(g, legs[i], x, 598, pale, 'center', 16);
    });
    const x = mix(
      route[Math.floor(progress)],
      route[Math.min(2, Math.floor(progress) + 1)],
      progress % 1,
    );
    disk(g, x, pathY, 12, stage >= 4 ? copper : mint, navy, 3);
  }
}
export function checkRelease() {
  assert.throws(() => readScan({ ...scanRead, run_id: 'ci-1481' }, readScope));
  assert.throws(() => readScan(scanRead, 'scan:write:ci-1482'));
  assert.deepEqual(readScan(scanRead, readScope), {
    run_id: 'ci-1482',
    security_scan_clear: false,
  });
  const stages = [0, 1, 2, 3].map((s) => snapshot(false, s));
  assert.deepEqual(
    stages.map((s) => Object.values(s.checks)),
    [[true, false, true], [true, false, true], [true, true, true], [true]],
  );
  assert.deepEqual(
    stages.map((s) => [s.score.coverage, s.score.valuesMatch, s.score.actionMatches]),
    [
      [1, false, true],
      [1, false, true],
      [1, true, true],
      [1 / 3, false, false],
    ],
  );
  for (let i = 0; i <= 5; i++) {
    const s = snapshot(true, i);
    assert.deepEqual(
      [s.version, s.reads, s.facts.security_scan_clear, s.action, s.policy],
      [
        17,
        i >= 3 ? 1 : 0,
        i >= 5 ? false : undefined,
        'merge_release',
        i >= 5 ? 'manual_review' : 'waiting',
      ],
    );
  }
}
