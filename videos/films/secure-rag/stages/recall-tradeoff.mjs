import { authorize, retrieve } from '../arithmetic.mjs';
import { CANDIDATES, POLICY, PRINCIPAL } from '../fixtures.mjs';
import { drawLine, drawRectangle, drawText } from '../defaults.mjs';
import { voice } from '../voice.mjs';

export function drawRecallTradeoff(ctx, scene, state, api) {
  const c = api.C;
  const cue = voice(scene, state);
  const label = (s, x, y, size, color = c.ink, align = 'left') =>
    drawText(ctx, api, s, x, y, size, color, align);
  const exact = retrieve();
  const firstFive = cue('recall-five');
  const sixth = cue('recall-six');
  const seventh = cue('recall-seven');
  const distance = 5 * firstFive.progress + sixth.progress + seventh.progress;
  const inspected = Math.floor(distance + 1e-8);
  const found = retrieve(CANDIDATES, PRINCIPAL, POLICY, inspected);
  const known =
    seventh.phase !== 'before'
      ? cue('recall-two').phase === 'after'
      : sixth.phase !== 'before'
        ? cue('recall-one').phase === 'after'
        : cue('recall-zero').phase === 'after';
  const left = 118;
  const pitch = 242;
  const railY = 659;
  const frontier = left + pitch * distance;
  const referenceReady = cue('recall-reference').phase !== 'before';

  api.focus.target('rack', () => {
    label('Inside trusted search', left, 285, 40, c.blue);
    label('Tenant A   /   operations', 1285, 285, 34, c.blue);
    label('Candidates in supplied score order', left, 365, 32);
    CANDIDATES.forEach((row, index) => {
      const x = left + index * pitch + 8;
      const eligible = authorize(row);
      const color = eligible ? c.green : c.muted;
      drawRectangle(ctx, api, x, 396, 218, 190, color);
      label(row.id, x + 109, 459, 48, c.ink, 'center');
      label(row.score.toFixed(2), x + 109, 516, 37, c.yellow, 'center');
      label(eligible ? 'eligible' : 'restricted', x + 109, 562, 26, color, 'center');
    });
    drawLine(ctx, api, left, railY, left + pitch * CANDIDATES.length, railY, c.muted);
    for (let index = 0; index <= CANDIDATES.length; index++)
      drawLine(
        ctx,
        api,
        left + index * pitch,
        railY - 10,
        left + index * pitch,
        railY + 10,
        c.muted,
      );
    if (distance > 0) {
      api.line(ctx, left, railY, frontier, railY, c.yellow, 9);
      api.line(ctx, frontier, 605, frontier, railY + 15, c.yellow, 5);
    }
    label(inspected + ' of ' + CANDIDATES.length + ' inspected', left, 730, 33, c.yellow);
  });

  api.focus.target('slots', () => {
    label('Requested passages', left, 819, 31, c.muted);
    for (let slot = 0; slot < 2; slot++) {
      const x = 497 + slot * 295;
      const record = known ? found[slot] : null;
      drawRectangle(ctx, api, x, 764, 258, 90, record ? c.green : c.muted);
      label(
        record?.id ?? (known ? 'Empty' : '?'),
        x + 129,
        825,
        39,
        record ? c.green : c.muted,
        'center',
      );
    }
    if (referenceReady) {
      label('Exact search', 1210, 794, 30, c.muted);
      label(exact.map((r) => r.id).join('   +   '), 1460, 797, 36, c.green);
    }
    if (known) {
      label('Authorized recall', 1210, 857, 30, c.muted);
      label(found.length + ' of ' + exact.length, 1540, 858, 36, c.ink);
    }
  });
  let foot = '';
  if (seventh.phase !== 'before')
    foot = known
      ? 'Both reference passages reached under the same grants.'
      : 'Following one more candidate…';
  else if (sixth.phase !== 'before')
    foot = known ? 'R7 lies beyond the stop.' : 'Which passages fill the two slots at this stop?';
  else if (firstFive.phase === 'after')
    foot = known
      ? 'Both eligible passages lie beyond the stop.'
      : 'Inspect the grants above the yellow rail.';
  if (foot) label(foot, left, 965, 39, known ? c.ink : c.yellow);
}

export default {
  id: 'recall-tradeoff',
  draw: drawRecallTradeoff,
  cues: [
    'recall-reference',
    'recall-five',
    'recall-zero',
    'recall-six',
    'recall-question',
    'recall-one',
    'recall-seven',
    'recall-two',
  ],
};
