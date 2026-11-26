import { group, line, rect } from 'vizmatic/stage';
import {
  COSMOS,
  MEM_STATS,
  ROLE,
  aura,
  cinemaHeader,
  clampDur,
  guardedDynamic,
  metricReadout,
  txt,
} from '../parts.mjs';

export function buildKvByteModel(s, c) {
  s.add(aura(-460, -40, 560, ROLE.tool, COSMOS.bg));
  s.add(aura(460, 120, 560, ROLE.ok, COSMOS.bg));

  s.add(
    cinemaHeader(
      'KV-CACHE BYTE ARITHMETIC',
      'Multiply dimensions first,',
      'then count shared stem once',
      {
        x: -860,
        y: -445,
        accent: ROLE.tool,
        size: 46,
      },
    ),
  );

  const tokOn = s.value(0);
  const branchOn = s.value(0);
  const shareOn = s.value(0);

  c.on('ra-kv-byte-model-1-0', () =>
    s.play(tokOn.to(1, { duration: clampDur(c, c.cue('ra-kv-byte-model-1-0').start, 0.5) })),
  );
  c.on('ra-kv-byte-model-1-2', () =>
    s.play(branchOn.to(1, { duration: clampDur(c, c.cue('ra-kv-byte-model-1-2').start, 0.5) })),
  );
  c.on('ra-kv-byte-model-1-4', () =>
    s.play(shareOn.to(1, { duration: clampDur(c, c.cue('ra-kv-byte-model-1-4').start, 0.55) })),
  );

  s.add(
    guardedDynamic(
      () => 1,
      () => {
        const tk = tokOn.value;
        const br = branchOn.value;
        const sh = shareOn.value;
        const nodes = [];

        // Row 1: Five factors multiplied -> 327,680 B = 320 KiB / token
        const factors = [
          { t: '2 (K,V)', col: ROLE.agent },
          { t: '80 LAYERS', col: ROLE.tool },
          { t: '8 KV HEADS', col: ROLE.model },
          { t: '128 DIM', col: ROLE.focus },
          { t: '2 B (BF16)', col: ROLE.ok },
        ];
        factors.forEach((f, i) => {
          const x = -715 + i * 250;
          nodes.push(
            rect(205, 62, { fill: '#0b1224', stroke: f.col, width: 2.5, radius: 8 }).at(x, -160),
            txt(f.t, x, -160, 26, f.col, 'mono', 'center'),
          );
          if (i < 4) {
            nodes.push(txt('x', x + 125, -160, 28, COSMOS.muted, 'mono', 'center'));
          }
        });
        nodes.push(
          txt(
            tk > 0.5 ? '= 320 KiB / tok' : `= ${MEM_STATS.bytesPerToken.toLocaleString()} B`,
            635,
            -160,
            28,
            ROLE.focus,
            'mono',
            'center',
          ),
        );

        nodes.push(
          txt(
            'USE KV HEAD COUNT (NOT QUERY HEADS IN GQA)  |  1 GiB = 1,024^3 BYTES',
            0,
            -78,
            26,
            COSMOS.muted,
            'mono',
            'center',
          ),
        );

        // Middle: Three stepped totals (1 branch -> 8 unshared -> 1 stem + 8 tails)
        nodes.push(line([-860, -18], [840, -18], { stroke: '#233152', width: 2 }));

        const bAlpha = 0.3 + 0.7 * br;
        const sAlpha = 0.3 + 0.7 * sh;

        nodes.push(
          metricReadout('1 BRANCH (16,384 TOK)', '5.0 GiB', -570, 128, {
            color: ROLE.agent,
            size: 46,
            sub: '16,384 x 320 KiB',
          }).opacity(bAlpha),
          metricReadout('8 FULL COPIES', `${MEM_STATS.unshared.toFixed(0)}.0 GiB`, 0, 128, {
            color: ROLE.fail,
            size: 46,
            sub: '8 x 5.0 GiB unshared',
          }).opacity(bAlpha),
          metricReadout('SHARED STEM + 8 TAILS', `${MEM_STATS.shared.toFixed(2)} GiB`, 570, 128, {
            color: ROLE.ok,
            size: 46,
            sub: '12,288 + 8 x 4,096 = 45,056',
          }).opacity(sAlpha),
        );

        // Bottom caveat
        nodes.push(line([-860, 282], [840, 282], { stroke: '#233152', width: 2 }));
        nodes.push(
          txt(
            'LOGICAL KV ONLY: STILL BUDGET WEIGHTS, WORKSPACE, PAGE ROUNDING & OTHER LIVE REQUESTS',
            0,
            356,
            26,
            ROLE.warn,
            'mono',
            'center',
          ).opacity(sAlpha),
        );

        return group(...nodes);
      },
    ),
  );
}
