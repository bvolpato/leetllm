import { DELAY_FIXTURE } from '../fixtures.mjs';
import { LEAF_CORRECTIONS, UPDATED_DELAY } from '../model.mjs';
import { boostCue } from '../construction.mjs';
import { cellText, chapterText, dot, line } from '../defaults.mjs';

const job = DELAY_FIXTURE.leaves.indexOf(1);
const first = DELAY_FIXTURE.initial[job];
const actual = DELAY_FIXTURE.actual[job];
const correction = LEAF_CORRECTIONS[DELAY_FIXTURE.leaves[job]];
const steps = 1 / DELAY_FIXTURE.learningRate;
const scaleX = (hours) => 220 + (1480 * hours) / actual;

function runningClock(ctx, api, hours, finished) {
  const { C } = api;
  const x = 445;
  const y = 426;
  api.rect(ctx, x - 17, y - 157, 34, 30, C.cyan);
  api.rect(ctx, x - 43, y - 173, 86, 19, C.cyan, undefined, 7);
  dot(ctx, api, x, y, C.cyan, 134);
  dot(ctx, api, x, y, C.bg, 124);
  for (let i = 0; i < 12; i++) {
    const angle = (i * Math.PI) / 6;
    const dx = Math.sin(angle);
    const dy = -Math.cos(angle);
    line(ctx, api, x + dx * 98, y + dy * 98, x + dx * 113, y + dy * 113, C.muted, 5);
  }
  const hand = (hours * Math.PI) / 6;
  line(ctx, api, x, y, x + 85 * Math.sin(hand), y - 85 * Math.cos(hand), C.cyan, 10);
  dot(ctx, api, x, y, C.cyan, 13);
  chapterText(ctx, api, 'Large-input training job', 720, 341, 46, C.ink);
  chapterText(ctx, api, Math.floor(hours) + ' h late', 714, 485, 120, C.cyan);
  chapterText(ctx, api, finished ? 'Finished' : 'Still running', 720, 559, 40, C.ink);
}

function trainingJob(ctx, api, state) {
  const { C } = api;
  const route = boostCue(state, 'opening-leaf', 0);
  const enter = Math.min(1, route * 2);
  const branch = Math.max(0, route * 2 - 1);
  const x = 265 + 405 * enter + 420 * branch;
  const y = 385 + 110 * branch;
  api.focus.target('job-leaf', () => {
    line(ctx, api, 190, 385, 670, 385, C.muted, 7);
    line(ctx, api, 670, 385, 1090, 265, C.muted, 7);
    line(ctx, api, 670, 385, 1090, 495, C.muted, 7);
    line(ctx, api, 190, 385, Math.min(x, 670), 385, C.cyan, 7);
    if (branch > 0) line(ctx, api, 670, 385, x, y, C.cyan, 7);
    dot(ctx, api, 670, 385, C.cyan, 15);
    dot(ctx, api, 1090, 265, C.muted, 14);
    dot(ctx, api, 1090, 495, C.cyan, 14);
    cellText(ctx, api, 'Large input?', 668, 300, C.ink, 42);
    chapterText(ctx, api, 'No   ·   Two jobs share a leaf', 1255, 280, 36, C.muted);
    chapterText(ctx, api, 'Yes   ·   This job alone', 1255, 509, 39, C.cyan);
    dot(ctx, api, x, y, C.cyan, 21);
    dot(ctx, api, x, y, C.bg, 8);
    api.rect(ctx, x - 128, y + 52, 256, 60, C.cyan, undefined, 12);
    cellText(ctx, api, 'Large-input job', x, y + 94, C.bg, 31);
  });
}

export function drawOpening(ctx, scene, state, api) {
  if (state.t < 0.35) ctx.globalAlpha = 1;
  const { C } = api;
  const start = scaleX(first);
  const end = scaleX(actual);
  const finish = state.cues?.['opening-finish'];
  const elapsed =
    finish?.end > 0 ? Math.min(1, state.t / finish.end) : boostCue(state, 'opening-finish', 0);
  const finished = finish ? finish.phase === 'after' : elapsed === 1;
  const hours = first + (actual - first) * elapsed;
  const route = boostCue(state, 'opening-leaf', 0);
  api.focus.target('job-clock', () => {
    if (route === 0) runningClock(ctx, api, hours, finished);
    line(ctx, api, start, 738, scaleX(hours), 738, C.cyan, 8);
    dot(ctx, api, scaleX(hours), 738, C.cyan, 12);
  });
  if (route > 0) trainingJob(ctx, api, state);
  const move = boostCue(state, 'opening-step', 2);
  const current = scaleX(first + (UPDATED_DELAY[job] - first) * move);
  const settled = state.cues?.['opening-step']
    ? state.cues['opening-step'].phase === 'after'
    : move === 1;

  line(ctx, api, scaleX(0), 775, end, 775, C.muted, 6);
  api.rect(ctx, scaleX(0), 754, start - scaleX(0), 42, C.blue, undefined, 0);
  for (const [hours, label, color] of [
    [first, 'First prediction', C.blue],
    [actual, 'Actual delay', C.cyan],
  ]) {
    if (hours === actual && !finished) continue;
    const x = scaleX(hours);
    line(ctx, api, x, 737, x, 817, color, 5);
    cellText(ctx, api, hours + ' h', x, 901, color, 79);
    cellText(ctx, api, label, x, 955, color, 32);
  }

  api.focus.target('delay-gap', () => {
    const span = boostCue(state, 'opening-gap', 0);
    if (span > 0) {
      const tip = start + (end - start) * span;
      line(ctx, api, start, 701, tip, 701, C.yellow, 4);
      line(ctx, api, start, 689, start, 716, C.yellow, 4);
      line(ctx, api, tip, 689, tip, 716, C.yellow, 4);
    }
    if (span === 1)
      cellText(
        ctx,
        api,
        'Original error   ' + correction + ' h',
        (start + end) / 2,
        655,
        C.yellow,
        42,
      );
    const divide = boostCue(state, 'opening-quarters', 1);
    for (let i = 1; i < steps && divide > 0; i++) {
      const x = start + ((end - start) * i) / steps;
      line(ctx, api, x, 701 - 16 * divide, x, 701 + 16 * divide, C.yellow, 4);
    }
  });

  api.focus.target('delay-prediction', () => {
    if (move > 0) api.rect(ctx, start, 754, current - start, 42, C.yellow, undefined, 0);
    dot(ctx, api, current, 775, C.yellow, 17);
    if (settled) {
      cellText(ctx, api, UPDATED_DELAY[job] + ' h', current, 901, C.yellow, 69);
      cellText(ctx, api, 'New prediction', current, 955, C.yellow, 32);
    }
  });
}

export default {
  id: 'opening',
  draw: drawOpening,
  cues: ['opening-finish', 'opening-leaf', 'opening-gap', 'opening-quarters', 'opening-step'],
};
