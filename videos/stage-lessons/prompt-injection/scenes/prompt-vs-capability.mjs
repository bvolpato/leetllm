// Scene 6: prompt-vs-capability - Prompt structure guides behavior
// Split-chamber context window vs host capability wall: developer instructions and
// retrieved evidence share one token buffer holding zero credentials, while any
// model output crosses the host boundary strictly as an unprivileged proposal object.
import { circle, group, line, rect } from 'vizmatic/stage';
import {
  COSMOS,
  PROPOSAL,
  REPORT,
  ROLE,
  aura,
  beamWithPhotons,
  cinemaHeader,
  clampDur,
  driftValue,
  energyRail,
  glowDot,
  guardedDynamic,
  hexGate,
  quadArcPts,
  txt,
} from '../parts.mjs';

export default function promptVsCapability(s, c) {
  const pulse = s.value(0);
  const devHi = s.value(0);
  const evHi = s.value(0);
  const followOn = s.value(0);
  const fieldsOn = s.value(0);
  const proposalOn = s.value(0);

  const header = cinemaHeader(
    'PROMPT vs CAPABILITY',
    'Prompt structure guides',
    'behavior, not permission',
    { accent: ROLE.host, size: 48 },
  );

  const stageAura = aura(150, 30, 620, '#5ce1e61c', '#fb923c1a');

  const view = guardedDynamic(
    () => 1,
    () => {
      const p = pulse.value;
      const dh = devHi.value;
      const eh = evHi.value;
      const fo = followOn.value;
      const fi = fieldsOn.value;
      const po = proposalOn.value;
      const nodes = [];

      // Left chamber: Single Context Window (Developer + Evidence, ZERO credentials)
      nodes.push(
        txt(
          'ONE CONTEXT WINDOW (ZERO CREDENTIALS)',
          -515,
          -230,
          26,
          COSMOS.muted,
          'mono',
          'center',
        ),
        energyRail(-855, -185, -35, ROLE.host, { width: 6, glow: 8 + dh * 7 }),
        txt('ROLE: DEVELOPER', -825, -162, 26, ROLE.host, 'mono', 'left'),
        txt('Summarize the evaluation report', -825, -106, 30, COSMOS.ink, 'sans', 'left'),
        txt('for candidate C17.', -825, -62, 28, COSMOS.muted, 'sans', 'left'),
      );

      nodes.push(
        energyRail(-855, 18, 210, ROLE.source, { width: 6, glow: 8 + eh * 7 }),
        txt('ROLE: RETRIEVED EVIDENCE', -825, 42, 26, ROLE.source, 'mono', 'left'),
        txt(`source: ${REPORT.source}`, -825, 92, 26, COSMOS.muted, 'mono', 'left'),
        txt(
          `“${REPORT.attack}”`,
          -825,
          150,
          30,
          fo > 0.3 ? ROLE.attack : ROLE.untrusted,
          'serif',
          'left',
        ).glow(fo > 0.3 ? 8 : 5, fo > 0.3 ? ROLE.attack : ROLE.untrusted),
      );

      // Explicit zero-credential indicator below context window
      nodes.push(
        rect(540, 56, {
          fill: '#101627',
          stroke: ROLE.denied,
          width: 2.2,
          radius: 8,
          dash: [8, 6],
        }).at(-555, 290),
        txt('NO CREDENTIAL MOVES WITH CONTEXT', -555, 290, 26, ROLE.denied, 'mono', 'center'),
      );

      // Center Trust Wall + Hexagonal Policy Boundary (split cleanly outside gate & sub)
      const gateX = 20;
      const gateY = 20;
      nodes.push(
        line([gateX, -245], [gateX, gateY - 128], {
          stroke: '#2c3d66',
          width: 2.6,
          dash: [10, 10],
        }),
        line([gateX, gateY + 190], [gateX, 340], { stroke: '#2c3d66', width: 2.6, dash: [10, 10] }),
        hexGate(gateX, gateY, 68, po > 0.3 ? ROLE.host : ROLE.untrusted, {
          label: 'HOST GATE',
          sub: 'EXECUTION NEXT',
          glow: 10,
        }),
      );

      // Beams crossing from context -> host gate -> proposal object
      const leftArc = quadArcPts([-220, 130], [gateX - 116, gateY], -25, 20);
      const rightArc = quadArcPts([gateX + 116, gateY], [250, 30], -25, 20);
      nodes.push(
        beamWithPhotons(leftArc, ROLE.untrusted, p * 1.1, {
          width: 3.4,
          alpha: 0.45 + fo * 0.55,
        }),
        beamWithPhotons(rightArc, ROLE.proposal, p * 1.1 + 0.5, {
          width: 3.4,
          alpha: 0.4 + po * 0.6,
        }),
      );

      // Right: Structured Proposed Action Object (untrusted until authorized)
      const rx = 275;
      nodes.push(
        energyRail(rx, -185, 240, po > 0.3 ? ROLE.proposal : '#334673', {
          width: 6,
          glow: po > 0.3 ? 10 : 4,
        }),
        txt('PROPOSED ACTION OBJECT', rx + 28, -162, 26, ROLE.proposal, 'mono', 'left'),
      );

      const rows = [
        ['candidate', PROPOSAL.candidate, ROLE.focus],
        ['stage', PROPOSAL.stage, ROLE.attack],
        ['traffic', `${PROPOSAL.traffic}%`, ROLE.untrusted],
        ['revision', `rev ${PROPOSAL.revision}`, ROLE.host],
        ['operationId', PROPOSAL.operationId, COSMOS.muted],
      ];
      rows.forEach(([k, v, col], idx) => {
        const y = -98 + idx * 66;
        const hi = fi > 0.25;
        nodes.push(
          txt(k, rx + 28, y, 26, COSMOS.muted, 'mono', 'left'),
          txt(v, 835, y, 28, hi ? col : COSMOS.ink, 'mono', 'right').glow(hi ? 6 : 0, col),
          line([rx + 28, y + 30], [835, y + 30], { stroke: '#223052', width: 1.5 }),
        );
      });

      nodes.push(
        txt(
          po > 0.3 ? 'PROPOSAL ONLY · NO SIDE EFFECT YET' : 'OUTPUT CROSSES HOST POLICY NEXT',
          rx + 28,
          292,
          26,
          po > 0.3 ? ROLE.host : COSMOS.muted,
          'mono',
          'left',
        ).glow(po > 0.3 ? 6 : 0, ROLE.host),
      );

      return group(...nodes);
    },
  );

  s.add(stageAura, header, view);
  driftValue(s, c, pulse, 5.0, { startOffset: 0.1, endMargin: 0.5 });

  c.on('prompt-vs-capability-beat-1-focus-1', () => {
    s.play(
      devHi.to(1, {
        duration: clampDur(c, c.cue('prompt-vs-capability-beat-1-focus-1').start, 0.35),
      }),
    );
  });
  c.on('prompt-vs-capability-beat-1-focus-2', () => {
    s.play(
      evHi.to(1, {
        duration: clampDur(c, c.cue('prompt-vs-capability-beat-1-focus-2').start, 0.35),
      }),
    );
  });
  c.on('prompt-vs-capability-beat-2-focus-2', () => {
    s.play(
      followOn.to(1, {
        duration: clampDur(c, c.cue('prompt-vs-capability-beat-2-focus-2').start, 0.35),
      }),
    );
  });
  c.on('pi-proposal-fields', () => {
    s.play(fieldsOn.to(1, { duration: clampDur(c, c.cue('pi-proposal-fields').start, 0.4) }));
  });
  c.on('prompt-vs-capability-beat-2-focus-1', () => {
    s.play(
      proposalOn.to(1, {
        duration: clampDur(c, c.cue('prompt-vs-capability-beat-2-focus-1').start, 0.35),
      }),
    );
  });
}
