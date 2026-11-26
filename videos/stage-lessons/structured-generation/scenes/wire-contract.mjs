// Scene 16: wire-contract - Which rule reaches the backend?
// Dual-gate comparator for {"retry_count": -1}:
// Left gate = Host validator (minimum: 0) vs Right gate = Wire copy sent to backend.
// On wire-copy, minimum: 0 moves into description prose; wire admits -1; host rejects -1;
// replacing host with wire copy turns BOTH gates permissive (warning crimson beam!).
import { group, line } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  aura,
  beamWithPhotons,
  cinemaHeader,
  clampDur,
  driftValue,
  fsmNode,
  guardedDynamic,
  opticalRail,
  quadArcPts,
  txt,
} from '../parts.mjs';

export default function wireContract(s, c) {
  const pulse = s.value(0);
  const wireCopied = s.value(0);
  const wireAdmits = s.value(0);
  const hostChecks = s.value(0);
  const hostReplaced = s.value(0);

  const header = cinemaHeader('WIRE VS LOCAL VALIDATION', 'Which rule reaches', 'the backend?', {
    accent: ROLE.prefix,
    size: 50,
  });

  const stageAura = aura(180, 40, 640, '#ffd1661c', '#ff6b8b18');

  const stageView = guardedDynamic(
    () => 1,
    () => {
      const p = pulse.value;
      const wc = wireCopied.value;
      const wa = wireAdmits.value;
      const hc = hostChecks.value;
      const hr = hostReplaced.value;
      const nodes = [];

      const hostHasMin = hr < 0.5;
      const wireHasMin = wc < 0.5;

      // Top candidate payload beacon
      nodes.push(
        txt('COMPLETED CANDIDATE PAYLOAD', -840, -230, 26, COSMOS.muted, 'mono', 'left'),
        txt('{"retry_count": -1}', -840, -162, 52, ROLE.prefix, 'mono', 'left').glow(
          8,
          ROLE.prefix,
        ),
      );

      // Top-right branching beams down to the two validators
      const leftArc = quadArcPts([-420, -110], [-420, -20], 0);
      const rightArc = quadArcPts([-220, -110], [420, -20], -28);
      nodes.push(
        beamWithPhotons(leftArc, hostHasMin ? ROLE.prefix : ROLE.prune, p * 1.1, {
          width: 3.2,
          photonCount: 1,
        }),
        beamWithPhotons(rightArc, ROLE.fsm, p * 1.1 + 0.5, { width: 3.2, photonCount: 2 }),
      );

      // Two side-by-side optical validator gates
      const drawGate = (x0, heading, hasMin, active, isHost) => {
        const accent = isHost ? (hr > 0.5 ? ROLE.prune : ROLE.prefix) : ROLE.fsm;
        nodes.push(
          opticalRail(x0, -10, 275, accent),
          txt(heading, x0 + 34, 10, 30, accent, 'mono', 'left'),
          line([x0 + 34, 42], [x0 + 700, 42], { stroke: accent, width: 2.5 }).opacity(0.65),
          txt('type: integer', x0 + 34, 96, 36, COSMOS.ink, 'mono', 'left'),
          txt(
            hasMin ? 'minimum: 0  (ENFORCED)' : 'description: "at least 0"',
            x0 + 34,
            156,
            30,
            hasMin ? ROLE.legal : ROLE.review,
            'mono',
            'left',
          ).glow(hasMin ? 6 : 8, hasMin ? ROLE.legal : ROLE.review),
        );

        const accepts = !hasMin;
        if (active) {
          nodes.push(
            fsmNode(x0 + 640, 232, 52, accepts ? 'PASS' : 'DENY', {
              color: accepts ? (isHost ? ROLE.prune : ROLE.fsm) : ROLE.prune,
              accepting: accepts,
              size: 26,
            }),
            txt(
              accepts ? 'ADMITS -1' : 'REJECTS -1',
              x0 + 34,
              238,
              42,
              accepts ? (isHost ? ROLE.prune : ROLE.fsm) : ROLE.prune,
              'mono',
              'left',
            ).glow(10, accepts ? (isHost ? ROLE.prune : ROLE.fsm) : ROLE.prune),
          );
        } else {
          nodes.push(txt('awaiting check...', x0 + 34, 238, 30, COSMOS.dim, 'mono', 'left'));
        }
      };

      drawGate(
        -840,
        hr > 0.5 ? 'HOST (REPLACED BY WIRE COPY!)' : 'HOST ORIGINAL VALIDATOR',
        hostHasMin,
        hc > 0.4,
        true,
      );
      drawGate(60, 'SENT TO BACKEND (WIRE COPY)', wireHasMin, wa > 0.4, false);

      // Bottom takeaway
      nodes.push(
        txt(
          hr > 0.5
            ? 'BOTH SIDES ACCEPT -1  ·  ALWAYS KEEP YOUR ORIGINAL LOCAL VALIDATOR & ENUM CHECKS'
            : hc > 0.5
              ? 'Prose descriptions nudge generation but never enforce numeric bounds'
              : 'Adapters may strip unsupported bounds (minimum/maximum) onto description text',
          -840,
          365,
          28,
          hr > 0.5 ? ROLE.prune : COSMOS.muted,
          hr > 0.5 ? 'mono' : 'serif',
          'left',
        ).glow(hr > 0.5 ? 7 : 0, ROLE.prune),
      );

      return group(...nodes);
    },
  );

  s.add(stageAura, header, stageView);
  driftValue(s, c, pulse, 4.6, { startOffset: 0.1, endMargin: 0.5 });

  c.on('wire-copy', () => {
    s.play(wireCopied.to(1, { duration: clampDur(c, c.cue('wire-copy').start, 0.45) }));
  });
  c.on('wire-integer', () => {
    s.play(wireAdmits.to(1, { duration: clampDur(c, c.cue('wire-integer').start, 0.4) }));
  });
  c.on('wire-check', () => {
    s.play(hostChecks.to(1, { duration: clampDur(c, c.cue('wire-check').start, 0.45) }));
  });
  c.on('wire-replace', () => {
    s.play(hostReplaced.to(1, { duration: clampDur(c, c.cue('wire-replace').start, 0.45) }));
  });
}
