// Scene 2: entry-and-objective - How did the recommendation get here?
// Dual glowing optical ingress conduits (Direct user paste vs Indirect tool fetch +
// multimodal extraction) converging into a single model context node, contrasted with
// application-policy vs jailbreak targets and the signed-in session's read-only scope.
import { group, line } from 'vizmatic/stage';
import {
  COSMOS,
  REPORT,
  ROLE,
  aura,
  autoNodeRadius,
  beamWithPhotons,
  cinemaHeader,
  clampDur,
  driftValue,
  energyRail,
  gateNode,
  guardedDynamic,
  quadArcPts,
  trimSeg,
  txt,
} from '../parts.mjs';

export default function entryAndObjective(s, c) {
  const pulse = s.value(0);
  const srcHi = s.value(0);
  const pasteOn = s.value(0);
  const fetchOn = s.value(0);
  const objOn = s.value(0);
  const mediaOn = s.value(0);
  const sessionOn = s.value(0);

  const header = cinemaHeader(
    'INGRESS ROUTES & OBJECTIVES',
    'How did the recommendation',
    'reach the model?',
    { accent: ROLE.untrusted, size: 48 },
  );

  const stageAura = aura(120, 40, 620, '#fb923c1a', '#5ce1e61a');

  const view = guardedDynamic(
    () => 1,
    () => {
      const p = pulse.value;
      const sh = srcHi.value;
      const pa = pasteOn.value;
      const fe = fetchOn.value;
      const ob = objOn.value;
      const md = mediaOn.value;
      const se = sessionOn.value;
      const nodes = [];

      // Left: Fixed external excerpt source rail
      nodes.push(
        energyRail(-855, -180, 175, ROLE.source, { width: 6, glow: 8 + sh * 6 }),
        txt('SAME EXTERNAL EXCERPT', -825, -155, 26, ROLE.source, 'mono', 'left'),
        txt(`“${REPORT.attack}”`, -825, -100, 28, ROLE.proposal, 'serif', 'left').glow(
          6,
          ROLE.proposal,
        ),
        txt('Author & sentence fixed', -825, -45, 26, COSMOS.muted, 'sans', 'left'),
      );

      // Two parallel ingress lanes feeding center Model node
      const modelPos = [55, 10];
      const modelR = autoNodeRadius('MODEL', 58);

      const directY = -115;
      const indirectY = 125;

      // Top lane: Direct injection (labels cleanly ABOVE beam)
      nodes.push(
        txt(
          'DIRECT INJECTION',
          -245,
          directY - 102,
          26,
          pa > 0.3 ? ROLE.proposal : COSMOS.muted,
          'mono',
          'center',
        ),
        txt('Colleague pastes into chat', -245, directY - 56, 26, COSMOS.muted, 'sans', 'center'),
      );
      const directSeg = trimSeg([-435, directY], modelPos, 10, modelR + 14);
      nodes.push(
        beamWithPhotons(quadArcPts(directSeg[0], directSeg[1], -10, 22), ROLE.proposal, p * 0.9, {
          width: 3.4,
          alpha: 0.4 + pa * 0.6,
        }),
      );

      // Bottom lane: Indirect injection (labels cleanly BELOW beam)
      nodes.push(
        txt(
          'INDIRECT INJECTION',
          -245,
          indirectY + 56,
          26,
          fe > 0.3 ? ROLE.attack : COSMOS.muted,
          'mono',
          'center',
        ),
        txt('Assistant fetches report', -245, indirectY + 100, 26, COSMOS.muted, 'sans', 'center'),
      );
      const indirectSeg = trimSeg([-435, indirectY], modelPos, 10, modelR + 14);
      nodes.push(
        beamWithPhotons(
          quadArcPts(indirectSeg[0], indirectSeg[1], 10, 22),
          ROLE.attack,
          p * 0.9 + 0.45,
          {
            width: 3.4,
            alpha: 0.4 + fe * 0.6,
          },
        ),
      );

      // Multimodal & multi-turn sub-track along bottom left
      nodes.push(
        energyRail(-855, 250, 385, md > 0.3 ? ROLE.untrusted : '#2c3d66', {
          width: 4.5,
          glow: md > 0.3 ? 8 : 0,
          opacity: 0.45 + md * 0.55,
        }),
        txt(
          'MULTIMODAL · TRANSLATION · MULTI-TURN',
          -825,
          280,
          26,
          md > 0.3 ? ROLE.untrusted : COSMOS.dim,
          'mono',
          'left',
        ),
        txt(
          'Image OCR or audio transcript keeps source label',
          -825,
          336,
          26,
          md > 0.3 ? COSMOS.ink : COSMOS.dim,
          'sans',
          'left',
        ),
      );

      // Center: Model Context Node
      nodes.push(
        gateNode(modelPos[0], modelPos[1], 'MODEL', ROLE.host, {
          radius: 58,
          sub: 'SHARED CONTEXT',
          glow: 10,
        }),
      );

      // Right: Target contrast + Signed-In Session Authority Rail
      const rightX = 290;
      const appPos = [rightX, -150];
      const sesPos = [rightX, 155];

      const toApp = trimSeg(modelPos, appPos, modelR + 14, 16);
      nodes.push(
        beamWithPhotons(quadArcPts(toApp[0], toApp[1], -22, 20), ROLE.attack, p * 1.1, {
          width: 3.2,
          alpha: 0.4 + ob * 0.6,
        }),
        energyRail(rightX, -245, -18, ob > 0.3 ? ROLE.attack : ROLE.host, {
          width: 5,
          glow: ob > 0.3 ? 10 : 5,
        }),
        txt('PROMPT INJECTION vs JAILBREAK', rightX + 26, -220, 26, ROLE.attack, 'mono', 'left'),
        txt('App policy: summary -> release', rightX + 26, -162, 28, COSMOS.ink, 'sans', 'left'),
        txt(
          'Jailbreak: model safety training',
          rightX + 26,
          -108,
          26,
          COSMOS.muted,
          'sans',
          'left',
        ),
        txt('One attempt can target both', rightX + 26, -54, 26, ROLE.untrusted, 'mono', 'left'),
      );

      const toSes = trimSeg(modelPos, sesPos, modelR + 14, 16);
      nodes.push(
        beamWithPhotons(quadArcPts(toSes[0], toSes[1], 24, 20), ROLE.session, p * 0.8 + 0.3, {
          width: 3.2,
          alpha: 0.4 + se * 0.6,
        }),
        energyRail(rightX, 55, 345, ROLE.session, {
          width: 5,
          glow: se > 0.3 ? 10 : 5,
        }),
        txt('SIGNED-IN SESSION', rightX + 26, 82, 26, ROLE.session, 'mono', 'left'),
        txt('Read accessible eval: ALLOWED', rightX + 26, 142, 28, ROLE.ok, 'sans', 'left'),
        txt('Release permission: NONE', rightX + 26, 198, 28, ROLE.denied, 'sans', 'left'),
        line([rightX + 26, 236], [835, 236], { stroke: '#2a3a62', width: 2 }),
        txt(
          'Check source of tool descriptions',
          rightX + 26,
          276,
          26,
          COSMOS.muted,
          'sans',
          'left',
        ),
        txt('AND tool outputs from connectors', rightX + 26, 322, 26, ROLE.host, 'mono', 'left'),
      );

      return group(...nodes);
    },
  );

  s.add(stageAura, header, view);
  driftValue(s, c, pulse, 5.2, { startOffset: 0.1, endMargin: 0.5 });

  c.on('entry-source', () => {
    s.play(srcHi.to(1, { duration: clampDur(c, c.cue('entry-source').start, 0.35) }));
  });
  c.on('entry-paste', () => {
    s.play(pasteOn.to(1, { duration: clampDur(c, c.cue('entry-paste').start, 0.35) }));
  });
  c.on('entry-fetch', () => {
    s.play(fetchOn.to(1, { duration: clampDur(c, c.cue('entry-fetch').start, 0.35) }));
  });
  c.on('entry-objective', () => {
    s.play(objOn.to(1, { duration: clampDur(c, c.cue('entry-objective').start, 0.35) }));
  });
  c.on('entry-media', () => {
    s.play(mediaOn.to(1, { duration: clampDur(c, c.cue('entry-media').start, 0.35) }));
  });
  c.on('entry-session', () => {
    s.play(sessionOn.to(1, { duration: clampDur(c, c.cue('entry-session').start, 0.35) }));
  });
}
