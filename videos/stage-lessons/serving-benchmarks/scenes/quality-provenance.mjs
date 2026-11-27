// Scene 22: quality-provenance - A fast truncated answer has not met the task
// 3-mode Quality & Provenance Constellation (zero boxed tables!):
//   Mode 0: Protocol & structural gates on every response (finish reason, schema, stop parsing)
//   Mode 1: Separate 40-case reviewed semantic suite vs 60 unscored performance responses
//   Mode 2: Luminous 3-column Provenance Blueprint linking Identity, Workload & Outcomes to raw logs.
import { group, line, rect } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  aura,
  cinemaHeader,
  clampDur,
  dashedRule,
  fadeInHalf,
  fadeOutHalf,
  glowDot,
  glowingTrail,
  guardedDynamic,
  txt,
} from '../parts.mjs';

export default function qualityProvenance(s, c) {
  const protoLit = s.value(0.35);
  const mode01 = s.value(0); // 0 = structural gates, 1 = separate semantic sample
  const unscoredHi = s.value(0);
  const mode12 = s.value(0); // 0 = semantic sample, 1 = provenance blueprint

  const header = cinemaHeader('QUALITY & PROVENANCE', 'Fast truncation has', 'not met the task', {
    x: -860,
    y: -435,
    accent: ROLE.qualified,
    size: 50,
  });

  const stageAura = aura(130, 20, 680, '#6ee7b71a', '#5ce1e61a');

  // Mode 0: Structural & protocol check beams on every performance response
  const view0 = guardedDynamic(
    () => fadeOutHalf(mode01.value),
    (a) => {
      const pl = protoLit.value;
      const rows = [
        { dim: 'FINISH REASON', bad: 'length limit (truncated!)', good: 'natural stop' },
        { dim: 'SCHEMA / TOOLS', bad: 'missing / invalid args', good: 'valid required fields' },
        {
          dim: 'SPECULATIVE PATH',
          bad: 'unverified stop parsing',
          good: 'checked actual response',
        },
      ];
      const nodes = [
        txt('CHECK', -820, -190, 26, COSMOS.muted, 'mono', 'left').opacity(a),
        txt('LOOKS FAST, FAILS TASK', -250, -190, 26, ROLE.fail, 'mono').opacity(a),
        txt('VERIFIED RESPONSE', 480, -190, 26, ROLE.qualified, 'mono').opacity(a),
      ];

      rows.forEach((r, i) => {
        const yy = -80 + i * 150;
        nodes.push(
          txt(r.dim, -820, yy, 28, ROLE.open, 'mono', 'left').opacity(a),
          glowingTrail(
            [
              [-520, yy + 32],
              [20, yy + 32],
            ],
            { color: ROLE.fail, width: 4.5, glow: 8, opacity: a * (0.55 + 0.45 * pl) },
          ),
          glowDot(-520, yy + 32, { radius: 7, color: ROLE.fail, glow: 9, opacity: a }),
          txt(r.bad, -250, yy - 8, 28, ROLE.fail, 'sans').opacity(a),

          glowingTrail(
            [
              [180, yy + 32],
              [780, yy + 32],
            ],
            { color: ROLE.qualified, width: 4.5, glow: 8, opacity: a * (0.55 + 0.45 * pl) },
          ),
          glowDot(780, yy + 32, { radius: 7, color: ROLE.qualified, glow: 9, opacity: a }),
          txt(r.good, 480, yy - 8, 28, ROLE.qualified, 'sans').opacity(a),
        );
      });

      nodes.push(
        txt(
          'Verify protocol completion, finish reason, output length & schema on EVERY performance response',
          0,
          410,
          26,
          COSMOS.muted,
          'sans',
        ).opacity(a),
      );
      return group(...nodes);
    },
  );

  // Mode 1: Separate semantic suite (40 reviewed) vs performance responses (60 unscored)
  const view1 = guardedDynamic(
    () => fadeInHalf(mode01.value) * fadeOutHalf(mode12.value),
    (a) => {
      const uh = unscoredHi.value;
      const nodes = [
        // Gold separation laser
        dashedRule(0, -190, 0, 290, ROLE.slo, 0.9 * a, 3.2),
        txt('DO NOT BROADCAST LABELS', 0, -225, 26, ROLE.slo, 'mono').glow(6, ROLE.slo).opacity(a),

        // Left: 40 reviewed semantic cases (10 x 4)
        txt('SEPARATE SEMANTIC SUITE', -460, -165, 28, ROLE.qualified, 'mono')
          .glow(5, ROLE.qualified)
          .opacity(a),
        txt('40 reviewed cases (report pass rate)', -460, 226, 26, ROLE.qualified, 'sans').opacity(
          a,
        ),

        // Right: 60 performance responses (10 x 6)
        txt('PERFORMANCE RESPONSES', 460, -165, 28, uh > 0.2 ? ROLE.burst : COSMOS.muted, 'mono')
          .glow(uh > 0.2 ? 6 : 0, ROLE.burst)
          .opacity(a),
        txt(
          '60 responses: UNSCORED for semantics',
          460,
          286,
          26,
          uh > 0.2 ? ROLE.burst : COSMOS.muted,
          'mono',
        )
          .glow(uh > 0.2 ? 6 : 0, ROLE.burst)
          .opacity(a),
      ];

      for (let i = 0; i < 40; i++) {
        const cx = -710 + (i % 10) * 54;
        const cy = -85 + Math.floor(i / 10) * 62;
        nodes.push(
          rect(34, 38, { fill: ROLE.qualified, stroke: null, radius: 5 })
            .at(cx, cy)
            .opacity(0.86 * a),
        );
      }

      for (let i = 0; i < 60; i++) {
        const cx = 210 + (i % 10) * 54;
        const cy = -85 + Math.floor(i / 10) * 54;
        nodes.push(
          rect(34, 34, {
            fill: uh > 0.2 ? '#2c2214' : '#1b243b',
            stroke: uh > 0.2 ? ROLE.burst : '#4a5a7f',
            width: 2.0,
            radius: 5,
          })
            .at(cx, cy)
            .opacity(0.9 * a),
        );
      }

      nodes.push(
        txt(
          'To mark an answer semantically qualified, link its own judgment directly to its request ID',
          0,
          410,
          26,
          COSMOS.muted,
          'sans',
        ).opacity(a),
      );
      return group(...nodes);
    },
  );

  // Mode 2: 3-column unboxed Provenance Receipt Blueprint
  const view2 = guardedDynamic(
    () => fadeInHalf(mode12.value),
    (a) => {
      const cols = [
        {
          head: 'IDENTITY & ENV',
          col: ROLE.workload,
          x: -820,
          items: [
            'Model, tokenizer & chat template',
            'Quantization, engine & image',
            'GPU count, placement & gateway',
          ],
        },
        {
          head: 'WORKLOAD & CLOCKS',
          col: ROLE.open,
          x: -240,
          items: [
            'Exact trace bytes & SHA hashes',
            'Realized timestamps & warmup',
            'Cache, timeout & duration rules',
          ],
        },
        {
          head: 'OUTCOMES & AUDIT',
          col: ROLE.slo,
          x: 340,
          items: [
            'Raw terminal & timing records',
            'Linked judgments & telemetry',
            'Denominators, repeats & rejects',
          ],
        },
      ];

      const nodes = [];
      cols.forEach((col) => {
        nodes.push(
          txt(col.head, col.x, -175, 28, col.col, 'mono', 'left').glow(6, col.col).opacity(a),
          glowingTrail(
            [
              [col.x, -135],
              [col.x + 480, -135],
            ],
            { color: col.col, width: 3.4, glow: 7, opacity: a },
          ),
        );
        col.items.forEach((item, j) => {
          const yy = -50 + j * 124;
          nodes.push(
            glowDot(col.x + 8, yy, { radius: 6, color: col.col, glow: 8, opacity: a }),
            txt(item, col.x + 30, yy, 26, COSMOS.ink, 'sans', 'left').opacity(a),
            line([col.x, yy + 50], [col.x + 480, yy + 50], {
              stroke: '#19243e',
              width: 1.5,
            }).opacity(a),
          );
        });
      });

      nodes.push(
        txt(
          'KEEP ORIGINAL LOGS + FILE HASHES SO ANOTHER ENGINEER CAN TRACE EVERY NUMBER TO ITS EVENTS',
          0,
          395,
          26,
          ROLE.qualified,
          'mono',
        )
          .glow(6, ROLE.qualified)
          .opacity(a),
      );
      return group(...nodes);
    },
  );

  s.add(stageAura, header, view0, view1, view2);

  c.on('quality-provenance-beat-0', () => {
    const t = c.cue('quality-provenance-beat-0').start;
    s.play(protoLit.to(1, { duration: clampDur(c, t, 0.45) }));
  });
  c.on('quality-provenance-beat-1', () => {
    const t = c.cue('quality-provenance-beat-1').start;
    s.play(mode01.to(1, { duration: clampDur(c, t, 0.5) }));
  });
  c.on('quality-unscored', () => {
    const t = c.cue('quality-unscored').start;
    s.play(unscoredHi.to(1, { duration: clampDur(c, t, 0.4) }));
  });
  c.on('quality-provenance-beat-2', () => {
    const t = c.cue('quality-provenance-beat-2').start;
    s.play(mode12.to(1, { duration: clampDur(c, t, 0.5) }));
  });
}
