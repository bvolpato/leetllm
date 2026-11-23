import { requests } from '../fixtures.mjs';
import { requestContract } from '../model.mjs';
import {
  chip,
  columns,
  cueProgress,
  cueVisible,
  dot,
  fade,
  footer,
  line,
  text,
} from '../defaults.mjs';
function drawMonitoring(ctx, scene, state, api) {
  const { C: themeColors } = api;
  const done = (key) => state.cues?.[`m-${'request-gate'}-${key}`]?.phase === 'after';
  const lerp = (a, z, q) => a + (z - a) * q;
  {
    columns(
      ctx,
      api,
      [
        ['source receipt', 435],
        ['schema', 990],
        ['snapshot ≤ 60 min', 1350],
        ['score', 1710],
      ],
      275,
    );
    requests.forEach((row, i) => {
      const y = 330 + i * 82,
        valid = requestContract(row),
        schema = row.backlog !== null;
      chip(
        ctx,
        api,
        `${row.id} · ${row.backlog ?? 'missing'} jobs · ${row.heartbeatHours} h`,
        140,
        y,
        590,
        themeColors.blue,
        62,
        27,
      );
      line(ctx, api, 730, y + 31, 830, y + 31, themeColors.muted, 2);
      line(ctx, api, 1125, y + 31, 1190, y + 31, themeColors.muted, 2);
      line(ctx, api, 1500, y + 31, 1570, y + 31, themeColors.muted, 2);
      const q = cueVisible(ctx, api, 'request-gate', 'schema') ? 1 : 0;
      fade(ctx, api, q, () =>
        chip(
          ctx,
          api,
          schema ? 'typed ✓' : 'missing ×',
          850,
          y,
          270,
          schema ? themeColors.cyan : themeColors.red,
          62,
          26,
        ),
      );
      if (cueVisible(ctx, api, 'request-gate', 'age'))
        chip(
          ctx,
          api,
          `${row.age} min`,
          1210,
          y,
          280,
          row.age <= 60 ? themeColors.cyan : themeColors.yellow,
          62,
          27,
        );
      if (done('four'))
        chip(
          ctx,
          api,
          valid === 'pass' ? row.score.toFixed(2) : 'blocked',
          1590,
          y,
          230,
          valid === 'pass' ? themeColors.green : themeColors.red,
          62,
          28,
        );
      else if (cueVisible(ctx, api, 'request-gate', 'missing') && i === 3)
        chip(ctx, api, 'blocked', 1590, y, 230, themeColors.red, 62, 28);
      else if (cueVisible(ctx, api, 'request-gate', 'stale') && i === 4)
        chip(ctx, api, 'blocked', 1590, y, 230, themeColors.yellow, 62, 28);
      // The row itself binds each packet to its original source receipt.
      const schemaP = cueProgress(ctx, api, 'request-gate', 'schema'),
        ageP = cueProgress(ctx, api, 'request-gate', 'age'),
        scoreP = cueProgress(ctx, api, 'request-gate', 'four');
      const packetX = !schema
        ? lerp(740, 990, schemaP)
        : ageP === 0
          ? lerp(740, 990, schemaP)
          : row.age > 60
            ? lerp(990, 1350, ageP)
            : scoreP === 0
              ? lerp(990, 1350, ageP)
              : lerp(1350, 1710, scoreP);
      dot(
        ctx,
        api,
        packetX,
        y + 73,
        valid === 'pass'
          ? themeColors.cyan
          : valid === 'schema'
            ? themeColors.red
            : themeColors.yellow,
        5,
      );
    });
    if (done('four'))
      text(ctx, api, '4 pass / 6 supplied requests', 960, 875, 35, themeColors.green);
    footer(
      ctx,
      api,
      'Finite numeric values · Booleans rejected · aware timestamp · future timestamps blocked',
      themeColors.muted,
    );
  }
}
export function drawRequestGate(ctx, scene, state, api) {
  return api.focus?.target
    ? api.focus.target('request-gate-mechanism', () => drawMonitoring(ctx, scene, state, api))
    : drawMonitoring(ctx, scene, state, api);
}
export default {
  id: 'request-gate',
  draw: drawRequestGate,
  cues: [
    'request-gate-beat-1-focus-1',
    'request-gate-beat-1-focus-2',
    'request-gate-beat-1-focus-3',
    'request-gate-beat-1-focus-4',
    'm-request-gate-schema',
    'm-request-gate-age',
    'request-gate-beat-2-focus-1',
    'm-request-gate-missing',
    'm-request-gate-stale',
    'request-gate-beat-3-focus-1',
    'm-request-gate-four',
  ],
};
