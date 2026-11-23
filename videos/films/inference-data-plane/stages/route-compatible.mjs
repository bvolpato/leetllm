import { localityRouteSnapshot } from '../model.mjs';
import { memory, rectangle, text } from '../defaults.mjs';
export function drawRouteCompatible(ctx, scene, state, api) {
  const currentBeat = state.beat ?? 0,
    progress = api.clamp(state.beatP ?? 0),
    { C: themeColors } = api;
  const q = (i, a = 0.12, z = 0.8) =>
    currentBeat < i ? 0 : currentBeat > i ? 1 : api.phase(progress, a, z);
  const body = () => {
    const model = localityRouteSnapshot(1),
      selected = currentBeat >= 2 ? model.selected.id : 'A';
    text(
      ctx,
      api,
      'R4219 · M17/r5 · TP2 · bf16 · paged-v2 ·48 blocks',
      960,
      280,
      32,
      themeColors.yellow,
      'center',
    );
    if (currentBeat < 2) {
      ['A · TP2 ·60 free blocks', 'B · TP1 ·72 free blocks'].forEach((name, i) => {
        const x = 250 + i * 900;
        text(ctx, api, name, x + 260, 390, 35, i ? themeColors.pink : themeColors.green, 'center');
        memory(
          ctx,
          api,
          x,
          470,
          8,
          6,
          48,
          'compatible meaning required',
          i ? themeColors.pink : themeColors.green,
          58,
        );
        const cue = i ? 'incompatible-worker-b' : 'compatible-worker-a',
          visible = api.focus.progress(cue, currentBeat < 1 ? 0 : q(1)) > 0;
        if (visible)
          api.focus.target(i ? 'routing-mismatch-verdict' : 'routing-match-verdict', () =>
            text(
              ctx,
              api,
              i ? 'layout mismatch' : 'layout matches',
              x + 260,
              935,
              35,
              i ? themeColors.pink : themeColors.green,
              'center',
            ),
          );
      });
    } else {
      text(ctx, api, 'TP1 / exclude', 960, 360, 27, themeColors.pink, 'center');
      model.rows
        .filter((r) => r.id !== 'B')
        .forEach((r, i) => {
          const x = 175 + i * 925,
            y = 420,
            reused = r.id === 'C' ? 36 : 0,
            missing = 48 - reused;
          text(
            ctx,
            api,
            'worker ' + r.id + ' · ' + r.locality,
            x + 350,
            350,
            37,
            r.id === selected ? themeColors.green : themeColors.blue,
            'center',
          );
          memory(
            ctx,
            api,
            x,
            y,
            8,
            6,
            r.id === 'C' ? 36 + Math.floor(q(3) * 12) : Math.floor(q(3) * 48),
            '48 logical blocks',
            r.id === 'C' ? themeColors.green : themeColors.blue,
            62,
          );
          for (let j = reused; j < 48; j++) {
            const xx = x + (j % 8) * 62,
              yy = y + Math.floor(j / 8) * 62;
            ctx.save();
            ctx.globalAlpha *= 0.2 + 0.8 * q(3);
            api.rect(ctx, xx, yy, 54, 54, null, themeColors.yellow, 8);
            ctx.restore();
          }
          text(
            ctx,
            api,
            reused + ' reused · ' + missing + ' cross link',
            x + 290,
            855,
            31,
            themeColors.yellow,
            'center',
          );
          text(
            ctx,
            api,
            r.id === 'C' ? '0.8+12/6=2.8' : '0.2+48/12=4.2',
            x + 290,
            940,
            37,
            r.id === selected ? themeColors.green : themeColors.blue,
            'center',
          );
        });
      text(
        ctx,
        api,
        'Predicted cost: slower rack link wins after valid reuse · authored units',
        960,
        1040,
        29,
        themeColors.muted,
        'center',
      );
      if (currentBeat === 3 && q(3) < 1) {
        const n = Math.min(11, Math.floor(q(3) * 12)),
          u = (q(3) * 12) % 1,
          px = 790 + 220 * u,
          py = 490;
        rectangle(ctx, api, px, py, 54, 54, themeColors.yellow);
        text(ctx, api, String(37 + n), px + 27, py + 37, 27, themeColors.yellow, 'center');
      }
    }
  };
  if (api.focus)
    api.focus.target('route-compatible-construction', () => {
      body();
    });
  else body();
}
export default {
  id: 'route-compatible',
  draw: drawRouteCompatible,
  cues: [
    'route-compatible-b1',
    'compatible-worker-a',
    'incompatible-worker-b',
    'route-compatible-b3',
    'route-compatible-b4',
  ],
};
