// Scene 30: incident-recovery - Match the recovered state to the affected incident
// 5-predicate atomic incident closure gate (region, revision, age < 60s, p95 <= 200ms, approval)
// evaluated sequentially via recoveryVerdict(): eu-west 120ms (wrong region) -> us-east 940ms
// (unhealthy) -> us-east 120ms no approval (stays open) -> approval arrives -> CLOSED!
import { circle, group, line } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  aura,
  beamWithPhotons,
  cinemaHeader,
  clampDur,
  driftValue,
  guardedDynamic,
  orbNode,
  recoveryVerdict,
  txt,
} from '../parts.mjs';

const V_EU = recoveryVerdict(
  { region: 'eu-west', revision: 'def456', at: 990, p95: 120 },
  { approved: true },
);
const V_SLOW = recoveryVerdict(
  { region: 'us-east', revision: 'def456', at: 990, p95: 940 },
  { approved: true },
);
const V_NOAP = recoveryVerdict(
  { region: 'us-east', revision: 'def456', at: 990, p95: 120 },
  { approved: false },
);
const V_OK = recoveryVerdict(
  { region: 'us-east', revision: 'def456', at: 990, p95: 120 },
  { approved: true },
);

export default function incidentRecovery(s, c) {
  const pulse = s.value(0);
  const gatesOn = s.value(0);
  const caseStage = s.value(0); // 1=eu-west wrong, 2=us-east 940ms, 3=us-east 120ms unapproved, 4=closed

  const header = cinemaHeader(
    'ATOMIC CLOSURE PREDICATES',
    'Match recovery to the',
    'affected incident',
    {
      accent: ROLE.ok,
      size: 48,
    },
  );

  const stageAura = aura(160, 40, 620, '#6ee7b71c', '#ff6b8b1a');

  const view = guardedDynamic(
    () => 1,
    () => {
      const p = pulse.value;
      const g = gatesOn.value;
      const st = caseStage.value;
      const nodes = [];

      // 5 sequential predicate gates across x in [-660..+360], Incident Status orb on right
      const xs = [-660, -405, -150, 105, 360];
      const names = ['REGION', 'REVISION', 'AGE < 60s', 'p95 <= 200', 'APPROVAL'];
      const gateY = 30;
      const incPt = [680, 30];

      // Determine which predicates pass in current stage
      const passFlags =
        st >= 3.5
          ? [true, true, true, true, true]
          : st >= 2.5
            ? [true, true, true, true, false]
            : st >= 1.5
              ? [true, true, true, false, false]
              : [false, true, true, true, true];

      const sampleTxt =
        st >= 3.5
          ? `SAMPLE: us-east · def456 · p95=120ms · approved=true -> ${V_OK.toUpperCase()}`
          : st >= 2.5
            ? `SAMPLE: us-east · def456 · p95=120ms · approved=false -> ${V_NOAP.toUpperCase()}`
            : st >= 1.5
              ? `SAMPLE: us-east · def456 · p95=940ms -> ${V_SLOW.toUpperCase()}`
              : `SAMPLE: eu-west · p95=120ms (Incident is in us-east!) -> ${V_EU.toUpperCase()}`;

      nodes.push(
        txt(sampleTxt, 0, -170, 28, st >= 3.5 ? ROLE.ok : ROLE.fail, 'mono', 'center').glow(
          7,
          st >= 3.5 ? ROLE.ok : ROLE.fail,
        ),
      );

      // Segmented connectors strictly BETWEEN predicate circles so no stroke crosses OK/FAIL!
      let lastPass = -1;
      for (let i = 0; i < 5; i++) {
        if (passFlags[i]) lastPass = i;
        else break;
      }
      for (let i = 0; i < 5; i++) {
        const segStart = xs[i] + 54;
        const segEnd = i < 4 ? xs[i + 1] - 54 : incPt[0] - 88;
        const passed = i <= lastPass;
        if (passed) {
          nodes.push(
            beamWithPhotons(
              [
                [segStart, gateY],
                [segEnd, gateY],
              ],
              ROLE.ok,
              p * 1.1 + i * 0.18,
              { width: 4.2, photonCount: 1 },
            ),
          );
        } else {
          nodes.push(line([segStart, gateY], [segEnd, gateY], { stroke: '#25355a', width: 3.2 }));
        }
      }

      names.forEach((nm, i) => {
        const ok = passFlags[i];
        const col = ok ? ROLE.ok : ROLE.fail;
        nodes.push(
          circle(48, { fill: '#0b1224', stroke: col, width: 3.4 })
            .at(xs[i], gateY)
            .glow(ok ? 7 : 9, col)
            .opacity(0.45 + g * 0.55),
          txt(ok ? 'OK' : 'FAIL', xs[i], gateY, 26, col, 'mono', 'center').opacity(0.45 + g * 0.55),
          txt(nm, xs[i], gateY + 86, 26, col, 'mono', 'center').opacity(0.45 + g * 0.55),
        );
      });

      const isClosed = st >= 3.5;
      nodes.push(
        orbNode(incPt[0], incPt[1], isClosed ? 'CLOSED' : 'OPEN', isClosed ? ROLE.ok : ROLE.fail, {
          radius: 66,
          sub: isClosed ? 'Verified & atomic' : 'Incident stays open',
        }),
        line([-840, 270], [840, 270], { stroke: '#25355a', width: 2 }).opacity(0.65),
        txt(
          'MAKE PREDICATE CHECK & CLOSE ATOMIC · CHECK SUSTAINED RECOVERY WINDOW',
          0,
          335,
          26,
          COSMOS.muted,
          'mono',
          'center',
        ),
      );

      return group(...nodes);
    },
  );

  s.add(stageAura, header, view);
  driftValue(s, c, pulse, 4.8, { startOffset: 0.1, endMargin: 0.5 });

  c.on('aa-incident-recovery-0', () => {
    s.play(pulse.to(0.3, { duration: clampDur(c, c.cue('aa-incident-recovery-0').start, 0.25) }));
  });
  c.on('aa-incident-recovery-1', () => {
    s.play(gatesOn.to(1, { duration: clampDur(c, c.cue('aa-incident-recovery-1').start, 0.35) }));
  });
  c.on('aa-incident-recovery-2', () => {
    s.play(caseStage.to(1, { duration: clampDur(c, c.cue('aa-incident-recovery-2').start, 0.25) }));
  });
  c.on('recovery-region', () => {
    s.play(caseStage.to(1, { duration: 0.15 }));
  });
  c.on('recovery-high-latency', () => {
    s.play(caseStage.to(2, { duration: clampDur(c, c.cue('recovery-high-latency').start, 0.35) }));
  });
  c.on('recovery-no-approval', () => {
    s.play(caseStage.to(3, { duration: clampDur(c, c.cue('recovery-no-approval').start, 0.35) }));
  });
  c.on('recovery-close', () => {
    s.play(caseStage.to(4, { duration: clampDur(c, c.cue('recovery-close').start, 0.35) }));
  });
}
