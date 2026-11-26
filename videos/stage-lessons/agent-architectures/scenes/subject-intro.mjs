// Scene 1: subject-intro - Where should the assistant look next?
// Illuminated transit map: train photon glides to Art Museum -> closure pulse flares rose ->
// History Museum beacon appears across town with 90m / 17:00 constraints (prediction pause!) ->
// answer reveals checking History's opening hours first before booking transit.
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
  quadArcPts,
  trimSeg,
  txt,
} from '../parts.mjs';

export default function subjectIntro(s, c) {
  const pulse = s.value(0);
  const closedOn = s.value(0);
  const histOn = s.value(0);
  const taskOn = s.value(0);
  const nextReveal = s.value(0);

  const header = cinemaHeader(
    'OBSERVATION-DRIVEN AGENTS',
    'Where should the assistant',
    'look next?',
    { accent: ROLE.action, size: 50 },
  );

  const stageAura = aura(240, 40, 640, '#5ce1e61e', '#a78bfa18');

  const view = guardedDynamic(
    () => 1,
    () => {
      const p = pulse.value;
      const cl = closedOn.value;
      const hs = histOn.value;
      const tk = taskOn.value;
      const nr = nextReveal.value;
      const nodes = [];

      // Transit station coordinates (right & center expanse)
      const startPt = [-540, 120];
      const artPt = [-20, -40];
      const histPt = [560, 120];

      // Rail line from Station -> Art Museum
      const [a0, a1] = trimSeg(startPt, artPt, 58, 64);
      nodes.push(
        beamWithPhotons([a0, a1], cl > 0.4 ? ROLE.fail : ROLE.action, p * 1.1, { width: 4 }),
        orbNode(startPt[0], startPt[1], 'START', ROLE.host, { radius: 54, sub: 'You are here' }),
        orbNode(artPt[0], artPt[1], 'ART', cl > 0.4 ? ROLE.fail : ROLE.action, {
          radius: 58,
          sub: cl > 0.4 ? 'CLOSED FOR REPAIRS' : 'Art Museum',
        }),
      );

      // Dashed unknown route to History across town
      const [h0, h1] = trimSeg(startPt, histPt, 62, 66);
      nodes.push(
        line(h0, h1, {
          stroke: nr > 0.4 ? ROLE.ok : '#344770',
          width: 3,
          dash: [10, 10],
        }).opacity(0.35 + hs * 0.65),
        orbNode(histPt[0], histPt[1], 'HIST', nr > 0.4 ? ROLE.ok : ROLE.policy, {
          radius: 58,
          opacity: 0.35 + hs * 0.65,
          sub: nr > 0.4 ? '1. CHECK HOURS FIRST' : 'Hours: ?  ·  Route: ?',
        }),
      );

      // Orbiting radar ring around History when active (compact so it never crowds `sub`)
      if (hs > 0.2) {
        nodes.push(
          circle(68 + Math.sin(p * 4) * 3, {
            fill: null,
            stroke: nr > 0.4 ? ROLE.ok : ROLE.focus,
            width: 2,
            dash: [8, 8],
          })
            .at(histPt[0], histPt[1])
            .opacity(hs * 0.7),
        );
      }

      // Task constraints rail on bottom-left
      if (tk > 0.05) {
        nodes.push(
          txt('TASK CONSTRAINTS', -840, 295, 26, ROLE.focus, 'mono', 'left').opacity(tk),
          txt(
            '90 min inside  ·  Finish by 17:00',
            -840,
            348,
            30,
            COSMOS.ink,
            'mono',
            'left',
          ).opacity(tk),
        );
      }

      // Prediction prompt -> answer reveal (strictly withheld until `intro-next`!)
      if (hs > 0.25 && nr < 0.05) {
        nodes.push(
          txt(
            'Look up first: opening hours or a train?',
            140,
            330,
            32,
            ROLE.focus,
            'serif',
            'center',
          ).glow(6, ROLE.focus),
        );
      } else if (nr > 0.05) {
        const checkArc = quadArcPts(
          [artPt[0] + 55, artPt[1] + 25],
          [histPt[0] - 65, histPt[1] - 30],
          -60,
        );
        nodes.push(
          beamWithPhotons(checkArc, ROLE.ok, p * 1.2, { alpha: nr, width: 3.6 }),
          txt('CHECK HOURS FIRST -> THEN FIND TRAIN', 220, 348, 28, ROLE.ok, 'mono', 'center')
            .glow(8, ROLE.ok)
            .opacity(nr),
        );
      }

      return group(...nodes);
    },
  );

  s.add(stageAura, header, view);
  driftValue(s, c, pulse, 4.2, { startOffset: 0.1, endMargin: 0.5 });

  c.on('intro-art', () => {
    s.play(pulse.to(0.4, { duration: clampDur(c, c.cue('intro-art').start, 0.25) }));
  });
  c.on('intro-closure', () => {
    s.play(closedOn.to(1, { duration: clampDur(c, c.cue('intro-closure').start, 0.35) }));
  });
  c.on('intro-history', () => {
    s.play(histOn.to(1, { duration: clampDur(c, c.cue('intro-history').start, 0.4) }));
  });
  c.on('intro-task', () => {
    s.play(taskOn.to(1, { duration: clampDur(c, c.cue('intro-task').start, 0.35) }));
  });
  c.on('intro-question', () => {
    s.play(taskOn.to(1, { duration: 0.12 }));
  });
  // Strict prediction withholding!
  c.after('intro-next', () => {
    s.play(nextReveal.to(1, { duration: clampDur(c, c.cue('intro-next').end, 0.35) }));
  });
}
