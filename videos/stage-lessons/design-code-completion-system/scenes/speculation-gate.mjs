// Scene 21: speculation-gate - Keep the accepted-length and latency conditions together
// 2D decision quadrant (Accepted Draft Length >= 2.0 vs Latency Saved >= 10 ms):
// Python imports (3.8 tok, +42 ms saved: 178->136 ms -> PASS!) vs SQL (1.1 tok, -7 ms slower: 169->176 ms -> REJECT!).
import { group, line } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  aura,
  cinemaHeader,
  clampDur,
  glowDot,
  guardedDynamic,
  txt,
} from '../parts.mjs';

export default function speculationGate(s, c) {
  const pyOn = s.value(0);
  const sqlOn = s.value(0);
  const selOn = s.value(0);

  const header = cinemaHeader(
    'SPECULATION ROLLOUT GATE',
    'Keep accept length',
    '& latency together',
    {
      x: -860,
      y: -445,
      accent: ROLE.ok,
      size: 46,
    },
  );

  const bgAura = aura(40, 20, 680, '#6ee7b71a', '#f43f5e16');

  const view = guardedDynamic(
    () => 1,
    () => {
      const py = pyOn.value;
      const sq = sqlOn.value;
      const sl = selOn.value;
      const nodes = [];

      // 2D Plane: x = accepted tokens (0 .. 5 across [-760 .. +560]), y = ms saved (-20 .. +55 across [205 .. -175])
      const x0 = -760;
      const x1 = 560;
      const yBot = 205;
      const yTop = -175;
      const mapX = (tok) => x0 + (tok / 5) * (x1 - x0);
      const mapY = (ms) => yBot - ((ms + 20) / 75) * (yBot - yTop);

      const xThresh = mapX(2.0);
      const yThresh = mapY(10);

      // Axes & gold dual thresholds
      nodes.push(
        line([x0, yBot], [x1, yBot], { stroke: '#344770', width: 3 }),
        line([x0, yTop], [x0, yBot], { stroke: '#344770', width: 3 }),
        txt(
          'MEAN ACCEPTED DRAFT TOKENS',
          (x0 + x1) * 0.5,
          yBot + 46,
          26,
          COSMOS.muted,
          'mono',
          'center',
        ),
        txt('MS SAVED', x0 - 20, yTop - 32, 26, COSMOS.muted, 'mono', 'right'),
        line([xThresh, yTop], [xThresh, yBot], {
          stroke: ROLE.focus,
          width: 3.5,
          dash: [10, 8],
        }).glow(8, ROLE.focus),
        txt('>= 2.0 tok', xThresh, yTop - 28, 26, ROLE.focus, 'mono', 'center'),
        line([x0, yThresh], [x1, yThresh], { stroke: ROLE.focus, width: 3.5, dash: [10, 8] }).glow(
          8,
          ROLE.focus,
        ),
        txt('>= 10 ms saved', x1 + 20, yThresh, 26, ROLE.focus, 'mono', 'left'),
      );

      // Point 1: Python imports (3.8 tok, +42 ms saved: 178 -> 136 ms)
      const px = mapX(3.8);
      const pyCoord = mapY(42);
      nodes.push(
        glowDot(px, pyCoord, { radius: 11, color: ROLE.ok, glow: 12, opacity: 0.45 + py * 0.55 }),
        txt(
          'PYTHON IMPORTS (3.8 tok, +42 ms)',
          px,
          pyCoord - 42,
          26,
          ROLE.ok,
          'mono',
          'center',
        ).opacity(0.45 + py * 0.55),
        txt(
          '178 -> 136 ms (PASSES BOTH!)',
          px,
          pyCoord + 40,
          26,
          ROLE.ok,
          'mono',
          'center',
        ).opacity(0.45 + py * 0.55),
      );

      // Point 2: SQL (1.1 tok, -7 ms slower: 169 -> 176 ms)
      const sx = mapX(1.1);
      const sy = mapY(-7);
      nodes.push(
        glowDot(sx, sy, { radius: 11, color: ROLE.fail, glow: 12, opacity: 0.4 + sq * 0.6 }),
        txt('SQL: 1.1 tok (-7 ms)', sx, sy - 42, 26, ROLE.fail, 'mono', 'center').opacity(
          0.4 + sq * 0.6,
        ),
        txt('169 -> 176 ms (SLOWER)', sx, sy + 40, 26, ROLE.fail, 'mono', 'center').opacity(
          0.4 + sq * 0.6,
        ),
      );

      nodes.push(
        txt('PER-SLICE GATING', 480, -425, 26, ROLE.focus, 'mono', 'center'),
        txt(
          'Enable ONLY where BOTH thresholds pass',
          480,
          -378,
          26,
          COSMOS.muted,
          'mono',
          'center',
        ),
        txt(
          sl > 0.4
            ? 'SHORTLIST PYTHON IMPORTS ONLY · REPLAY TRAFFIC TO VERIFY DISTRIBUTION & TAIL LATENCY'
            : 'Both acceptance length and net latency gain must clear thresholds under load',
          0,
          330,
          26,
          sl > 0.4 ? ROLE.ok : COSMOS.muted,
          'mono',
          'center',
        ),
      );

      return group(...nodes);
    },
  );

  s.add(bgAura, header, view);
  c.on('cc-spec-python', () => {
    s.play(pyOn.to(1, { duration: clampDur(c, c.cue('cc-spec-python').start, 0.35) }));
  });
  c.on('cc-spec-sql', () => {
    s.play(sqlOn.to(1, { duration: clampDur(c, c.cue('cc-spec-sql').start, 0.35) }));
  });
  c.on('cc-spec-selection', () => {
    s.play(selOn.to(1, { duration: clampDur(c, c.cue('cc-spec-selection').start, 0.35) }));
  });
}
