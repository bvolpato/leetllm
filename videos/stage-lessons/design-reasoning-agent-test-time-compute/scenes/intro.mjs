import { group, line, rect } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  advise,
  aura,
  cinemaHeader,
  clampDur,
  glowDot,
  guardedDynamic,
  metricReadout,
  observation,
  txt,
} from '../parts.mjs';

export function buildIntro(s, c) {
  s.add(aura(-480, -40, 560, ROLE.agent, COSMOS.bg));
  s.add(aura(480, 120, 560, ROLE.focus, COSMOS.bg));

  s.add(
    cinemaHeader('CHECKOUT CANARY', 'Spend reasoning where', 'verification can help', {
      x: -860,
      y: -445,
      accent: ROLE.agent,
      size: 46,
    }),
  );

  const revMatch = s.value(0);
  const ageOn = s.value(0);
  const policyOn = s.value(0);
  const holdRev = s.value(0);

  // Strict prediction withholding: rev7 match revealed after intro-request, HOLD revealed after intro-hold!
  c.after('intro-request', () =>
    s.play(revMatch.to(1, { duration: clampDur(c, c.cue('intro-request').end, 0.5) })),
  );
  c.on('intro-age', () =>
    s.play(ageOn.to(1, { duration: clampDur(c, c.cue('intro-age').start, 0.45) })),
  );
  c.on('intro-policy', () =>
    s.play(policyOn.to(1, { duration: clampDur(c, c.cue('intro-policy').start, 0.5) })),
  );
  c.after('intro-hold', () =>
    s.play(holdRev.to(1, { duration: clampDur(c, c.cue('intro-hold').end, 0.5) })),
  );

  const verdict = advise(observation, 110); // HOLD

  s.add(
    guardedDynamic(
      () => 1,
      () => {
        const rm = revMatch.value;
        const ag = ageOn.value;
        const po = policyOn.value;
        const hr = holdRev.value;
        const nodes = [];

        // Top comparison: Live Rollout vs Metrics Receipt
        const yTop = -155;
        nodes.push(
          txt('LIVE ROLLOUT', -840, yTop - 42, 26, ROLE.agent, 'mono', 'left'),
          txt('deploy: checkout-42', -840, yTop + 4, 28, COSMOS.ink, 'mono', 'left'),
          txt(
            'revision: 7   canary: 10%   smoke: PASS',
            -840,
            yTop + 48,
            28,
            ROLE.ok,
            'mono',
            'left',
          ),
        );

        const recCol = rm > 0.5 ? ROLE.ok : ROLE.warn;
        const recRev = rm > 0.5 ? 7 : 6;
        nodes.push(
          line([-20, yTop - 52], [-20, yTop + 72], { stroke: '#233152', width: 2 }),
          txt(
            rm > 0.5 ? 'AUTHENTICATED RECEIPT (MATCHED)' : 'METRICS RECEIPT (CHECK REV)',
            40,
            yTop - 42,
            26,
            recCol,
            'mono',
            'left',
          ),
          txt(
            `revision: ${recRev}   p95: 240 ms   smoke: PASS`,
            40,
            yTop + 4,
            28,
            recCol,
            'mono',
            'left',
          ),
          txt(
            ag > 0.4
              ? 'age: 10 s  (inside 30 s window)'
              : rm > 0.5
                ? 'fetched via metrics tool for revision 7'
                : 'revision 6 != live revision 7',
            40,
            yTop + 48,
            26,
            ag > 0.4 ? ROLE.ok : COSMOS.muted,
            'mono',
            'left',
          ),
        );

        // Policy p95 latency ruler (0 .. 400 ms across [-760 .. +760])
        const x0 = -760;
        const x1 = 760;
        const mapMs = (ms) => x0 + (ms / 400) * (x1 - x0);
        const yR = 68;
        const pAlpha = 0.28 + 0.72 * po;

        const bands = [
          { a: 0, b: 200, label: 'CONTINUE (<200)', col: ROLE.ok },
          { a: 200, b: 300, label: 'HOLD (200..299)', col: ROLE.focus },
          { a: 300, b: 400, label: 'ROLLBACK (>=300)', col: ROLE.fail },
        ];
        bands.forEach((b) => {
          const xa = mapMs(b.a);
          const xb = mapMs(b.b);
          nodes.push(
            rect(xb - xa - 4, 52, { fill: b.col, stroke: null, radius: 6 })
              .at((xa + xb) * 0.5, yR)
              .opacity(0.24 * pAlpha),
            txt(b.label, (xa + xb) * 0.5, yR, 26, b.col, 'mono', 'center').opacity(pAlpha),
          );
        });

        nodes.push(
          line([x0, yR + 46], [x1, yR + 46], { stroke: '#344770', width: 3 }).opacity(pAlpha),
        );
        [0, 100, 200, 240, 300, 400].forEach((ms) => {
          const tx = mapMs(ms);
          nodes.push(
            line([tx, yR + 38], [tx, yR + 54], { stroke: '#5c74a8', width: 2 }).opacity(pAlpha),
            txt(
              `${ms}`,
              tx,
              yR + 84,
              26,
              ms === 240 ? ROLE.focus : COSMOS.muted,
              'mono',
              'center',
            ).opacity(pAlpha),
          );
        });

        // 240 ms marker cleanly above ruler
        const x240 = mapMs(240);
        if (po > 0.35 || rm > 0.5) {
          nodes.push(
            glowDot(x240, yR - 44, { radius: 9, color: ROLE.focus, glow: 10, opacity: pAlpha }),
            txt('240 ms', x240, yR - 82, 26, ROLE.focus, 'mono', 'center').opacity(pAlpha),
          );
        }

        // Bottom prediction / decision bar
        nodes.push(line([-860, 220], [840, 220], { stroke: '#233152', width: 2 }));

        let cap = 'DECISION';
        let val = 'WHICH CALL HELPS FIRST?';
        let col = ROLE.focus;
        let sub = 'COMPARE LIVE REVISION 7 WITH RECEIPT REVISION 6';

        if (hr > 0.5) {
          cap = 'POLICY VERDICT (1 LOOKUP)';
          val = `${verdict} CANARY AT 10%`;
          col = ROLE.ok;
          sub = 'SPEND EXTRA COMPUTE ONLY WHEN ANOTHER PATH OR CHECK CAN HELP';
        } else if (po > 0.5) {
          cap = 'WHERE DOES 240 ms LAND?';
          val = '[ ? ]';
          col = ROLE.focus;
          sub = 'SMOKE PASS · AGE 10 s <= 30 s · HOLD >= 200 · ROLLBACK >= 300';
        } else if (rm > 0.5) {
          cap = 'FRESH RECEIPT ACQUIRED';
          val = 'REV 7 · 240 ms';
          col = ROLE.agent;
          sub = 'NOW CHECK FRESHNESS WINDOW AND RELEASE POLICY RULER';
        }

        nodes.push(metricReadout(cap, val, 0, 332, { color: col, size: 46, sub }));
        return group(...nodes);
      },
    ),
  );
}
