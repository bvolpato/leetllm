import { scores, values } from '../fixtures.mjs';
import { afterCue, cueMotion, sampleModel } from '../construction.mjs';

export function drawTiles(ctx, scene, state, api) {
  const { C, focus } = api;
  const s = sampleModel(scene.id, state);
  const released = afterCue(state, 2, 'tile-release');
  const secondLoad = cueMotion(state, 1, 'tile-second');
  const pair = secondLoad > 0 ? 2 : 0;
  const loading = pair ? secondLoad : cueMotion(state, 0, 'tile-first');
  const label = (v, x, y, size, color = C.ink, align = 'left') =>
    api.text(ctx, v, x, y, size, color, align);
  label('Main memory', 170, 267, 37, C.blue);
  label('One retained query', 1165, 267, 37, C.yellow);
  const memoryPairs = [0, 2].map((k) =>
    api.components.card({
      x: 140,
      y: 326 + k * 112,
      width: 545,
      height: 211,
      label: '',
      fill: C.panel,
      stroke: !released && k === pair ? C.cyan : C.muted,
    }),
  );
  for (let k = 0; k < scores.length; k++) {
    const y = 345 + 112 * k;
    const active = !released && k >= pair && k < pair + 2;
    label(`Key ${k}`, 170, y + 48, 37, active ? C.cyan : C.muted);
    label(`V = [${values[k].join(', ')}]`, 350, y + 48, 37, active ? C.ink : C.muted);
  }
  focus.target('tile-slots', () => {
    const color = released ? C.muted : C.cyan;
    const slots = api.components.card({
      x: 1100,
      y: 414,
      width: 481,
      height: 168,
      label: '',
      fill: C.panel,
      stroke: color,
    });
    if (!released) {
      api.teaching.transfer({
        source: { shape: memoryPairs[pair / 2], opacity: 1 },
        target: { shape: slots, opacity: 1 },
        color,
        progress: loading,
        particle: { radius: 6, fill: color },
        margin: 10,
      });
    }
    label(released ? 'Score slots released' : 'On-chip scores', 1110, 400, 34, color);
    api.teaching.grid({
      x: 1120,
      y: 434,
      width: 441,
      height: 128,
      rows: 1,
      columns: 2,
      labels: [
        s.count === pair + 2 && !released ? scores.slice(pair, pair + 2).map(String) : ['·', '·'],
      ],
      fontSize: 60,
      textColor: color,
      stroke: color,
      fill: C.panel,
    });
  });
  focus.target('tiles-running-summary', () =>
    label(
      s.count ? `m = ${s.m}     ℓ ≈ ${s.l.toFixed(4)}` : 'No keys scored yet',
      1085,
      689,
      39,
      C.yellow,
    ),
  );
  label(`Value sum   [${s.u.map((v) => v.toFixed(3)).join(', ')}]`, 1085, 767, 35);
  focus.target('tile-counts', () =>
    label(`Comparisons complete    ${s.count} / 4`, 170, 927, 40, C.cyan),
  );
  if (released) label('Output = value sum / weight sum', 1085, 927, 33, C.green);
}

export default {
  id: 'tiles',
  draw: drawTiles,
  cues: ['tile-first', 'tile-save', 'tile-second', 'tile-count', 'tile-release'],
};
