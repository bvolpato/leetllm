import { cosine, rotateEmbedding } from '../arithmetic.mjs';
import { V } from '../fixtures.mjs';
import { equation, focusTarget, text, vector } from '../defaults.mjs';
import { normalizeVector, lerpArray } from 'vizmatic';
export function drawGeometry(ctx, scene, state, api) {
  const { C: themeColors, teaching: teaching } = api,
    currentBeat = state.beat ?? 0,
    progress = state.beatP ?? 0,
    q = (i) => (currentBeat < i ? 0 : currentBeat > i ? 1 : api.phase(progress, 0.07, 0.9));
  {
    const a = teaching.axes({
        x: 210,
        y: 395,
        width: 950,
        height: 460,
        equalUnits: true,
        xDomain: [0, 1.2],
        yDomain: [0, 1.2],
        xTicks: [0, 1],
        yTicks: [0, 1],
        xLabel: 'toy coordinate 1',
        yLabel: 'toy coordinate 2',
        fontSize: 26,
      }),
      origin = a.point(0, 0);
    const unit = {
      river: normalizeVector(V.river),
      water: normalizeVector(V.water),
      money: normalizeVector(V.money),
      bank: normalizeVector(V.bank),
    };
    const label = (name, v, color, dx, dy) => {
      const at = a.point(...v);
      text(ctx, api, name, at.x + dx, at.y + dy, 29, color, 'center');
    };
    focusTarget(ctx, api, 'geometry-river-water-vectors', () => {
      vector(ctx, api, a, unit.river, themeColors.cyan);
      label('river', unit.river, themeColors.cyan, -110, -30);
      vector(ctx, api, a, unit.water, themeColors.blue);
      label('water', unit.water, themeColors.blue, 60, 30);
    });
    if (currentBeat > 0) {
      vector(ctx, api, a, unit.money, themeColors.green);
      label('money', unit.money, themeColors.green, 45, -25);
    }
    const showBank =
      currentBeat > 1 ||
      state.cues?.['geometry-bank-position-b2-2']?.phase === 'after' ||
      (state.cues?.['geometry-bank-position-b2-2']?.progress ?? 0) > 0;
    if (showBank) {
      vector(ctx, api, a, unit.bank, themeColors.yellow, 'geometry-bank-vector');
      label('bank', unit.bank, themeColors.yellow, 55, -25);
    }
    focusTarget(ctx, api, 'geometry-object-unit-length-arrows-5', () =>
      text(
        ctx,
        api,
        'Normalize: keep direction, set length to 1',
        960,
        285,
        34,
        themeColors.ink,
        'center',
      ),
    );
    if (currentBeat === 0) {
      const amount = q(0),
        v = lerpArray(V.river, unit.river, amount);
      vector(ctx, api, a, v, themeColors.cyan);
      text(
        ctx,
        api,
        'river norm ' + Math.hypot(...V.river).toFixed(3) + ' → 1',
        1430,
        445,
        32,
        themeColors.cyan,
        'center',
      );
    } else if (currentBeat === 1) {
      const value = cosine(V.river, V.money),
        project = unit.money.map((v) => v * value * q(1)),
        at = a.point(...unit.river),
        end = a.point(...project);
      api.line(ctx, at.x, at.y, end.x, end.y, themeColors.pink, 3);
      api.arrow(ctx, origin.x, origin.y, end.x, end.y, themeColors.pink, 7);
      text(ctx, api, 'river projected onto unit money', 1440, 450, 29, themeColors.pink, 'center');
      text(
        ctx,
        api,
        (q(1) === 1 ? 'cosine ' : 'Building projection ') + (value * q(1)).toFixed(3),
        1440,
        540,
        36,
        themeColors.pink,
        'center',
      );
    } else {
      const angle = (q(2) * Math.PI) / 2,
        other = rotateEmbedding(unit.money, angle);
      text(
        ctx,
        api,
        'Second coordinate frame · authored rotation',
        1430,
        380,
        28,
        themeColors.muted,
        'center',
      );
      const o = {
          x: 1420,
          y: 690,
        },
        s = 210;
      api.line(ctx, 1180, 690, 1710, 690, themeColors.muted, 2);
      api.line(ctx, 1420, 440, 1420, 900, themeColors.muted, 2);
      api.arrow(ctx, o.x, o.y, o.x + s * other[0], o.y - s * other[1], themeColors.green, 5);
      text(
        ctx,
        api,
        'Same width 2 does not establish alignment',
        1430,
        960,
        28,
        themeColors.yellow,
        'center',
      );
    }
    focusTarget(ctx, api, 'geometry-equation-string-raw-cos-u-v-frac-u-top-v-u-v-10', () =>
      equation(
        ctx,
        api,
        String.raw`\cos(u,v)=\frac{u^\top v}{\|u\|\|v\|}`,
        960,
        1030,
        40,
        themeColors.ink,
        'center',
      ),
    );
  }
}
export default {
  id: 'geometry',
  draw: drawGeometry,
  cues: [
    'geometry-beat-1-focus-1',
    'geometry-beat-1-focus-2',
    'geometry-beat-2-focus-1',
    'geometry-bank-position-b2-2',
    'geometry-beat-3-focus-1',
  ],
};
