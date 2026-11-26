// Scene 23: release-gate - Which result stops this candidate?
// Two 100-item gauges: Recall 94/100 (min 92 -> +2 PASS) vs Citation Faithfulness 93/100
// (min 95 -> -2 FAIL!) + 0 leaks -> STRICT prediction withholding before revealing gap & HOLD!
import { group, line, rect } from 'vizmatic/stage';
import {
  COSMOS,
  GATE_BASE,
  ROLE,
  aura,
  cinemaHeader,
  clampDur,
  driftValue,
  glowDot,
  guardedDynamic,
  txt,
} from '../parts.mjs';

export default function releaseGateScene(s, c) {
  const phase = s.value(0);
  const gapReveal = s.value(0); // STRICT after release-gap!
  const holdReveal = s.value(0); // STRICT after release-hold!
  const ownerOn = s.value(0);

  const header = cinemaHeader(
    'PRE-LAUNCH EVALUATION GATE',
    'Which result stops',
    'this candidate?',
    {
      x: -860,
      y: -445,
      accent: ROLE.fail,
      size: 46,
    },
  );

  const bgAura = aura(40, 20, 680, '#6ee7b718', '#f43f5e1a');

  const view = guardedDynamic(
    () => 1,
    () => {
      const p = phase.value;
      const gp = gapReveal.value;
      const hl = holdReveal.value;
      const ow = ownerOn.value;
      const nodes = [];

      // Zoomed scale: 85 .. 100 across x = [-420 .. +660]
      const x0 = -420;
      const x1 = 660;
      const mapPct = (pct) => x0 + ((pct - 85) / 15) * (x1 - x0);

      // Row 1: Recall 94/100 vs min 92%
      const y1 = -112;
      const xRec = mapPct(GATE_BASE.recall * 100); // 94
      const xRecMin = mapPct(GATE_BASE.minima.recall * 100); // 92
      nodes.push(
        txt('RECALL (100 DOCS)', -840, y1, 26, ROLE.ok, 'mono', 'left'),
        rect(xRec - x0, 44, { fill: ROLE.ok, stroke: '#ffffff', width: 1.5, radius: 6 })
          .at((x0 + xRec) * 0.5, y1)
          .glow(7, ROLE.ok)
          .opacity(0.9),
        line([xRecMin, y1 - 36], [xRecMin, y1 + 36], { stroke: ROLE.focus, width: 4 }).glow(
          8,
          ROLE.focus,
        ),
        txt('MIN 92', xRecMin, y1 - 68, 26, ROLE.focus, 'mono', 'center'),
        txt(
          gp > 0.35 ? '94 / 100 (+2 PASS)' : '94 / 100',
          xRec + 28,
          y1,
          26,
          ROLE.ok,
          'mono',
          'left',
        ),
      );

      // Row 2: Citation Faithfulness 93/100 vs min 95%
      const y2 = 52;
      const xFth = mapPct(GATE_BASE.faithfulness * 100); // 93
      const xFthMin = mapPct(GATE_BASE.minima.faithfulness * 100); // 95
      const fCol = gp > 0.35 ? ROLE.fail : ROLE.req;
      nodes.push(
        txt('FAITHFUL (100 CITES)', -840, y2, 26, fCol, 'mono', 'left'),
        rect(xFth - x0, 44, { fill: fCol, stroke: '#ffffff', width: 1.5, radius: 6 })
          .at((x0 + xFth) * 0.5, y2)
          .glow(8, fCol)
          .opacity(0.9),
        line([xFthMin, y2 - 36], [xFthMin, y2 + 36], { stroke: ROLE.focus, width: 4 }).glow(
          8,
          ROLE.focus,
        ),
        txt('MIN 95', xFthMin, y2 - 68, 26, ROLE.focus, 'mono', 'center'),
        txt(
          gp > 0.35 ? '93 / 100 (-2 SHORT!)' : '93 / 100',
          xFthMin + 28,
          y2,
          26,
          fCol,
          'mono',
          'left',
        ),
      );

      // Row 3: Permission leaks = 0
      nodes.push(
        txt('PERMISSION LEAKS: 0 observed in sample', -840, 155, 26, ROLE.ok, 'mono', 'left'),
      );

      // Top-right rule
      nodes.push(
        txt('POLICY OWNERSHIP', 480, -425, 26, ROLE.focus, 'mono', 'center'),
        txt(
          ow > 0.4
            ? 'RELEASE SERVICE OWNS THE MINIMA!'
            : 'Extra docs cannot fix unsupported claims',
          480,
          -378,
          26,
          ow > 0.4 ? ROLE.warn : COSMOS.muted,
          'mono',
          'center',
        ),
      );

      // Bottom prediction prompt -> STRICT withholding before release-gap/hold!
      const botY = 290;
      if (ow > 0.4) {
        nodes.push(
          txt(
            'EVALUATOR CANNOT LOWER THE MINIMUM · MISSING RESULT ALSO BLOCKS CANARY',
            0,
            botY,
            26,
            ROLE.warn,
            'mono',
            'center',
          ).glow(8, ROLE.warn),
        );
      } else if (hl > 0.35 || gp > 0.35) {
        nodes.push(
          txt(
            'HOLD CANDIDATE: CITATION FAITHFULNESS IS 2 SHORT (93 < 95 MINIMUM)!',
            0,
            botY,
            28,
            ROLE.fail,
            'mono',
            'center',
          ).glow(9, ROLE.fail),
          txt(
            'Recall passed (+2), but each gate is independent; fix unsupported claims & rerun',
            0,
            botY + 52,
            26,
            COSMOS.muted,
            'sans',
            'center',
          ),
        );
      } else {
        nodes.push(
          txt(
            'Recall 94 (min 92), Faithfulness 93 (min 95), Leaks 0: which check stops launch, and by how many?',
            0,
            botY,
            30,
            ROLE.focus,
            'serif',
            'center',
          ).glow(6, ROLE.focus),
        );
      }

      nodes.push(
        glowDot(-780 + ((p * 110) % 220), 435, { radius: 4.5, color: fCol, glow: 8, opacity: 0.7 }),
      );

      return group(...nodes);
    },
  );

  s.add(bgAura, header, view);
  driftValue(s, c, phase, 4.4);

  c.after('release-gap', () => {
    s.play(gapReveal.to(1, { duration: clampDur(c, c.cue('release-gap').end, 0.35) }));
  });
  c.after('release-hold', () => {
    s.play(holdReveal.to(1, { duration: clampDur(c, c.cue('release-hold').end, 0.35) }));
  });
  c.on('release-owner', () => {
    s.play(ownerOn.to(1, { duration: clampDur(c, c.cue('release-owner').start, 0.35) }));
  });
}
