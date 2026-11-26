// Scene 04: goodput-contract - Count successful requests without hiding failures
// Evaluates 5 arrivals (R1..R5) against joint gate: Complete AND TTFT <= 800 ms AND Worst gap <= 120 ms.
// Keeps failed R4 in denominator; reveals final 3 / 5 = 60% strictly after s1-3.
import { group, line, rect } from 'vizmatic/stage';
import {
  COSMOS,
  MULTITENANT_REQUESTS,
  ROLE,
  aura,
  cinemaHeader,
  driftValue,
  glowMeter,
  guardedDynamic,
  stepAfter,
  stepOn,
  txt,
} from '../parts.mjs';

export default function goodputContract(s, c) {
  const pulse = s.value(0);
  const b0On = s.value(0);
  const r1On = s.value(0);
  const r2On = s.value(0);
  const b1On = s.value(0);
  const r3On = s.value(0);
  const r4On = s.value(0);
  const r5On = s.value(0);
  const sumOn = s.value(0);
  const b2On = s.value(0);

  const stageAura = aura(0, 30, 740, '#6ee7b71a', '#ff6b8b14');
  const header = cinemaHeader(
    'PER-REQUEST GOODPUT GATE',
    'Count successful requests',
    'without hiding failures',
    { x: -860, y: -450, accent: ROLE.ok, size: 46 },
  );

  const checks = [r1On, r2On, r3On, r4On, r5On];

  const view = guardedDynamic(
    () => 1,
    () => {
      const b1 = b1On.value > 0.5;
      const summary = sumOn.value > 0.5;
      const b2 = b2On.value > 0.5;
      const nodes = [];

      // Joint gate pill at top right
      nodes.push(
        rect(930, 82, { fill: '#0d1528', stroke: ROLE.focus, width: 2.6, radius: 14 })
          .at(380, -395)
          .glow(6, ROLE.focus),
        txt(
          'GATE: Complete AND TTFT <= 800 ms AND Gap <= 120 ms',
          380,
          -395,
          26,
          ROLE.focus,
          'mono',
          'center',
        ),
      );

      // Column headers
      const cols = [-790, -560, -250, 120, 580];
      const headers = ['REQ', 'STREAM', 'FIRST OUTPUT', 'WORST GAP', 'VERDICT'];
      headers.forEach((h, i) => {
        nodes.push(txt(h, cols[i], -252, 26, COSMOS.muted, 'mono', i === 0 ? 'left' : 'center'));
      });
      nodes.push(line([-840, -220], [840, -220], { stroke: '#2c3d66', width: 2 }));

      // Five request lanes derived directly from MULTITENANT_REQUESTS
      MULTITENANT_REQUESTS.forEach((req, idx) => {
        const y = -156 + idx * 104;
        const checked = checks[idx].value > 0.5;
        const pass = req.complete && req.first <= 800 && req.gap <= 120;
        const shown = checked || (idx < 2 ? b0On.value > 0.2 : b1);

        const rowStroke = !checked ? '#253356' : pass ? ROLE.ok : ROLE.fail;
        nodes.push(
          rect(1680, 82, {
            fill: '#0b1224',
            stroke: rowStroke,
            width: checked ? 2.6 : 1.6,
            radius: 12,
          })
            .at(0, y)
            .glow(checked ? 6 : 0, rowStroke),
          txt(req.id, cols[0], y, 30, ROLE.shared, 'mono', 'left'),
          txt(
            shown ? (req.complete ? 'complete' : 'FAILED') : 'pending',
            cols[1],
            y,
            28,
            shown ? (req.complete ? COSMOS.ink : ROLE.fail) : COSMOS.dim,
            'mono',
            'center',
          ),
          txt(
            shown ? `${req.first} ms` : '---',
            cols[2],
            y,
            28,
            shown ? (req.first <= 800 ? COSMOS.ink : ROLE.fail) : COSMOS.dim,
            'mono',
            'center',
          ),
          txt(
            shown ? `${req.gap} ms` : '---',
            cols[3],
            y,
            28,
            shown ? (req.gap <= 120 ? COSMOS.ink : ROLE.fail) : COSMOS.dim,
            'mono',
            'center',
          ),
        );

        // Verdict badge strictly withheld until checked
        if (checked) {
          const reason = pass
            ? idx === 1
              ? 'PASS (on limit)'
              : 'PASS'
            : !req.complete
              ? 'FAIL (stream)'
              : 'FAIL (TTFT)';
          nodes.push(
            rect(320, 54, {
              fill: pass ? '#0e2820' : '#2b101b',
              stroke: pass ? ROLE.ok : ROLE.fail,
              width: 2.2,
              radius: 10,
            })
              .at(cols[4], y)
              .glow(7, pass ? ROLE.ok : ROLE.fail),
            txt(reason, cols[4], y, 26, pass ? ROLE.ok : ROLE.fail, 'mono', 'center'),
          );
        } else {
          nodes.push(txt('checking', cols[4], y, 26, COSMOS.dim, 'mono', 'center'));
        }
      });

      // Bottom summary bar
      if (summary) {
        nodes.push(
          glowMeter(-840, 395, 960, 46, 3 / 5, { fill: ROLE.ok }),
          txt('3 passing / 5 arrivals = 60%', 165, 395, 34, ROLE.ok, 'mono', 'left').glow(
            8,
            ROLE.ok,
          ),
        );
      } else {
        nodes.push(
          glowMeter(-840, 395, 960, 46, 0.04, { fill: ROLE.shared }),
          txt('Evaluating all 5 arrivals...', 165, 395, 30, COSMOS.muted, 'mono', 'left'),
        );
      }

      if (b2) {
        nodes.push(
          txt(
            'Count each arrival once (including failed R4); pooled gaps overweight long streams.',
            0,
            458,
            26,
            ROLE.focus,
            'sans',
            'center',
          ),
        );
      }

      return group(...nodes);
    },
  );

  s.add(stageAura, header, view);
  driftValue(s, c, pulse, 4.0);

  stepOn(s, c, 'mt-goodput-contract-b0', b0On, 1);
  stepAfter(s, c, 'mt-goodput-contract-s0-2', r1On, 1);
  stepAfter(s, c, 'mt-goodput-contract-s0-3', r2On, 1);
  stepOn(s, c, 'mt-goodput-contract-b1', b1On, 1);
  stepAfter(s, c, 'mt-goodput-contract-s1-0', r3On, 1);
  stepAfter(s, c, 'mt-goodput-contract-s1-1', r4On, 1);
  stepAfter(s, c, 'mt-goodput-contract-s1-2', r5On, 1);
  // Strict withholding: final 3/5 = 60% appears only after complete conclusion.
  stepAfter(s, c, 'mt-goodput-contract-s1-3', sumOn, 1);
  stepOn(s, c, 'mt-goodput-contract-b2', b2On, 1);
}
