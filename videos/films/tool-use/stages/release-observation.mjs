import { filmClock } from '../clock.mjs';
import { releaseCall, scopedReleaseRead, validatedReleaseCalls } from '../model.mjs';

const call = releaseCall();
const [request] = validatedReleaseCalls({ status: 'completed', output: [call] });
const record = scopedReleaseRead({ project_id: 'search' }, request.release_id);
const formatPercent = (value) => Number((value * 100).toFixed(1));

export function drawReleaseObservation(ctx, scene, state, api) {
  const { C, focus } = api;
  const { started, after, progress } = filmClock(scene, state);
  const label = (value, x, y, size, color = C.ink, font = 'sans') =>
    api.text(ctx, value, x, y, size, color, 'left', font);
  const filed = after('release-file') && record.ok;
  focus.target('release-slip', () => {
    api.rect(ctx, 120, 280, 635, 604, C.panel, C.blue, 9);
    label('Release desk', 160, 350, 40, C.blue);
    label(request.release_id, 160, 445, 51, C.ink, 'mono');
    api.line(ctx, 160, 480, 710, 480, C.muted, 2);
    if (started('release-propose')) {
      label(call.name, 160, 546, 34, C.ink, 'mono');
      label('Call     ' + request.call_id, 160, 616, 34, C.blue);
    }
    if (filed) label('Reply   ' + call.call_id, 160, 690, 34, C.cyan);
    if (after('release-status')) label(record.status, 160, 754, 40, C.cyan, 'mono');
    if (after('release-budget')) label('budget      ' + record.budget, 160, 810, 32, C.yellow, 'mono');
    if (after('release-rate')) label('error_rate  ' + record.error_rate, 160, 854, 32, C.blue, 'mono');
  });

  focus.target('release-ruler', () => {
    label('Canary error rate', 900, 345, 49, C.ink, 'serif');
    const left = 930, width = 815, y = 590;
    const at = (rate) => left + width * rate / 0.10;
    api.line(ctx, left, y, left + width, y, C.muted, 3);
    for (let i = 0; i <= 10; i++) {
      const x = at(i / 100);
      api.line(ctx, x, y, x, y + (i % 5 ? 11 : 20), C.muted, 2);
      if (i % 5 === 0) api.text(ctx, i + '%', x, y + 65, 33, C.muted, 'center');
    }
    if (after('release-budget')) {
      const x = at(record.budget);
      api.line(ctx, x, y - 85, x, y + 10, C.yellow, 4);
      api.text(ctx, 'Budget  ' + formatPercent(record.budget) + '%', x, y - 106, 34, C.yellow, 'center');
    }
    if (started('release-rate')) {
      const tip = at(record.error_rate * progress('release-rate'));
      if (tip > left) api.line(ctx, left, y - 25, tip, y - 25, C.blue, 9);
      if (after('release-rate')) {
        api.text(ctx, 'Observed  ' + formatPercent(record.error_rate) + '%', tip, y - 55, 33, C.blue, 'center');
      }
    }
    if (started('release-ask')) {
      const x1 = at(record.budget), x2 = at(record.error_rate);
      api.line(ctx, x1, 716, x2, 716, C.cyan, 3);
      for (const x of [x1, x2]) api.line(ctx, x, 699, x, 717, C.cyan, 3);
      const gap = after('release-gap') ? '+' + formatPercent(record.error_rate - record.budget) : '?';
      api.text(ctx, gap + ' percentage points',
        (x1 + x2) / 2, 793, 43, C.cyan, 'center');
    }
  });
  focus.target('release-executor', () => {
    label(started('release-host') ? 'Hosted tool  /  provider service' : 'Status lookup  /  application runtime',
      125, 947, 33, C.muted);
    label('Example service data', 1390, 947, 30, C.muted);
  });
}

export default {
  id: 'release-observation',
  draw: drawReleaseObservation,
  cues: ['release-propose', 'release-read', 'release-file', 'release-status', 'release-budget',
    'release-rate', 'release-ask', 'release-gap', 'release-host'],
};
