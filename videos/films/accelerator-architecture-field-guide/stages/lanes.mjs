import { accEvent } from '../construction.mjs';
import { waveReduction } from '../arithmetic.mjs';

export function drawLanes(ctx, scene, state, api) {
  const { C, text, rect, line } = api;
  const beat = state.beat;
  const at = (name, b) => accEvent(scene, state, name, b);
  const low = at('low', 1);
  const added = at('next', 2) > 0;
  const nextSent = added && at('second-partial', 3) === 1;
  const high = at('upper', 4);
  const joined = high === 1 && at('join', 4) === 1;
  const size = added ? 65 : 64;
  const broken = waveReduction(size, 32);
  const full = waveReduction(size, 64);
  const [firstHalf, secondHalf] = full.waves[0].halves;
  const valueWidth = 64;
  api.focus.target('wave-reduction', () => {
    text(ctx, 'Physical wave 1', 145, 272, 42, C.ink);
    text(ctx, '64 lanes', 1167, 266, 32, C.muted, 'right');
    text(ctx, 'Physical wave 2', 1310, 272, 42, C.ink);
    line(ctx, 1222, 305, 1222, 789, C.muted, 2);
    for (let i = 0; i < 64; i++) {
      const col = i % 16,
        row = Math.floor(i / 16);
      const active = i < 32 ? i < Math.ceil(low * 32) : i - 32 < Math.ceil(high * 32);
      const missed = low === 1 && i >= 32 && !active;
      const x = 145 + col * valueWidth,
        y = 335 + row * 82 + (row >= 2 ? 28 : 0);
      const color = active ? C.cyan : missed ? C.pink : C.muted;
      rect(ctx, x, y, 58, 65, active ? '#163748' : C.panel, color, 6);
      text(ctx, String(i + 1), x + 29, y + 45, 32, active || missed ? color : C.ink, 'center');
    }
    text(ctx, added ? '65' : '·', 1390, 400, 48, added ? C.cyan : C.muted, 'center');
    line(ctx, 1320, 430, 1460, 430, added ? C.cyan : C.muted, 3);
    text(ctx, added ? 'One occupied lane' : 'No inputs yet', 1310, 500, 31, C.muted);
    if (low === 1) text(ctx, '1…32   →   ' + firstHalf, 145, 767, 38, C.cyan);
    if (low === 1)
      text(
        ctx,
        high === 1 ? '33…64   →   ' + secondHalf.toLocaleString('en-US') : '33…64   omitted',
        600,
        767,
        38,
        high === 1 ? C.cyan : C.pink,
      );
    if (nextSent) text(ctx, '65   →   ' + full.waves[1].total, 1310, 767, 38, C.cyan);

    let question = 'Reference sum for 1…64   =   ' + full.waves[0].total.toLocaleString('en-US');
    if (beat === 1 && low === 1)
      question =
        'Published   ' + firstHalf + '     /     Expected   ' + full.total.toLocaleString('en-US');
    if (beat === 2 || beat === 3) question = 'Published with input 65   =   ?';
    if (nextSent) question = firstHalf + ' + 65   =   ?';
    if (nextSent && at('total', 3) === 1)
      question =
        'Published   ' +
        firstHalf +
        ' + 65 = ' +
        broken.total +
        '     /     Expected   ' +
        full.total.toLocaleString('en-US');
    if (joined)
      question =
        firstHalf +
        ' + ' +
        secondHalf.toLocaleString('en-US') +
        ' + 65   =   ' +
        full.total.toLocaleString('en-US');
    text(ctx, question, 960, 913, 47, joined ? C.green : C.yellow, 'center');
    if (joined)
      text(
        ctx,
        '63 inputs → 2,016     ·     64 → 2,080     ·     65 → 2,145',
        960,
        1001,
        30,
        C.muted,
        'center',
      );
  });
}
export default {
  id: 'lanes',
  draw: drawLanes,
  cues: [
    'ag-lanes-wave',
    'ag-lanes-low',
    'ag-lanes-next',
    'ag-lanes-second-partial',
    'ag-lanes-total',
    'ag-lanes-upper',
    'ag-lanes-join',
  ],
};
