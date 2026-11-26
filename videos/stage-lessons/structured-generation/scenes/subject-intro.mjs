// Scene 1: subject-intro - Which reply can Python read?
// Dual byte-stream optical lanes scanning Reply A ('Sure! {"status":"failed"}')
// and Reply B ('{"status":"passed"}') with a live parser laser cursor, stopping at S,
// sweeping B brace-to-brace, then illuminating the CI runner log and sending B to review.
import { circle, group, line } from 'vizmatic/stage';
import {
  CI_RUN,
  COSMOS,
  OPENING_REPLIES,
  ROLE,
  RUN_LOG,
  aura,
  beamWithPhotons,
  cinemaHeader,
  clampDur,
  driftValue,
  fsmNode,
  glowDot,
  guardedDynamic,
  opticalRail,
  quadArcPts,
  txt,
} from '../parts.mjs';

export default function subjectIntro(s, c) {
  const pulse = s.value(0);
  const askHi = s.value(0);
  const byteStop = s.value(0);
  const parseSweep = s.value(0);
  const logShow = s.value(0);
  const compareShow = s.value(0);

  const header = cinemaHeader('STRUCTURED GENERATION', 'Which reply can Python', 'read as JSON?', {
    accent: ROLE.fsm,
    size: 50,
  });

  const stageAura = aura(260, 40, 620, '#5ce1e622', '#ffd16618');

  const stageView = guardedDynamic(
    () => 1,
    () => {
      const p = pulse.value;
      const ah = askHi.value;
      const bs = byteStop.value;
      const ps = parseSweep.value;
      const lg = logShow.value;
      const cp = compareShow.value;
      const nodes = [];

      const yA = -155;
      const yB = 15;
      const startX = -730;
      const charW = 24;

      // Left optical rails + Reply A and Reply B byte streams
      nodes.push(
        txt('json.loads(reply)', -840, -245, 28, ROLE.schema, 'mono', 'left'),
        opticalRail(-840, yA - 52, yA + 52, bs > 0.5 ? ROLE.prune : ROLE.fsm),
        txt('A', -800, yA, 38, bs > 0.5 ? ROLE.prune : ROLE.fsm, 'mono', 'center'),
        txt(OPENING_REPLIES[0], startX, yA, 38, COSMOS.ink, 'mono', 'left'),

        opticalRail(-840, yB - 52, yB + 52, ps > 0.8 ? ROLE.legal : ROLE.fsm),
        txt('B', -800, yB, 38, ps > 0.8 ? ROLE.legal : ROLE.fsm, 'mono', 'center'),
        txt(OPENING_REPLIES[1], startX, yB, 38, COSMOS.ink, 'mono', 'left'),
      );

      // Character-zero cursor markers (strictly withholding verdicts until cues fire!)
      const cursorAcol = bs > 0.5 ? ROLE.prune : ROLE.prefix;
      const breath = 0.72 + 0.28 * Math.sin(p * Math.PI * 3);
      nodes.push(
        line([startX, yA + 44], [startX + charW, yA + 44], { stroke: cursorAcol, width: 6 })
          .glow(10, cursorAcol)
          .opacity(bs > 0.5 ? 1 : breath),
      );
      if (bs > 0.45) {
        nodes.push(
          glowDot(startX + charW * 0.5, yA + 44, {
            radius: 6.5,
            color: ROLE.prune,
            glow: 14,
            opacity: bs,
          }),
          txt('STOPPED AT "S"', 410, yA, 32, ROLE.prune, 'mono', 'left')
            .glow(8, ROLE.prune)
            .opacity(bs),
        );
      } else {
        nodes.push(
          txt('byte 0: ?', 410, yA, 28, ah > 0.2 ? ROLE.prefix : COSMOS.dim, 'mono', 'left'),
        );
      }

      // Reply B sweep cursor from opening brace to closing brace
      const bSpan = OPENING_REPLIES[1].length * charW;
      const bX = startX + ps * (bSpan - charW);
      const cursorBcol = ps > 0.85 ? ROLE.legal : ROLE.prefix;
      nodes.push(
        line([startX, yB + 44], [bX + charW, yB + 44], { stroke: cursorBcol, width: 5.5 })
          .glow(10, cursorBcol)
          .opacity(ps > 0.05 ? 1 : breath),
      );
      if (ps > 0.85) {
        nodes.push(
          glowDot(startX + bSpan - 8, yB + 44, {
            radius: 6.5,
            color: ROLE.legal,
            glow: 14,
            opacity: ps,
          }),
          txt('PARSED: "passed"', 410, yB, 32, ROLE.legal, 'mono', 'left')
            .glow(8, ROLE.legal)
            .opacity(ps),
        );
      } else {
        nodes.push(
          txt('byte 0: ?', 410, yB, 28, ah > 0.2 ? ROLE.prefix : COSMOS.dim, 'mono', 'left'),
        );
      }

      // Right-hand live parser gate emblem (keeps right side balanced at all times)
      const gateCx = 660;
      const gateCy = -320;
      const orbA = p * Math.PI * 2;
      nodes.push(
        fsmNode(gateCx, gateCy, 66, bs > 0.5 && ps > 0.85 ? '{ }' : 'JSON', {
          color: cp > 0.5 ? ROLE.review : ps > 0.85 ? ROLE.legal : ROLE.fsm,
          accepting: ps > 0.85,
          size: 28,
        }),
        circle(88, { fill: null, stroke: '#1f2e52', width: 1.8 }).at(gateCx, gateCy),
        glowDot(gateCx + Math.cos(orbA) * 88, gateCy + Math.sin(orbA) * 88, {
          radius: 5,
          color: ROLE.fsm,
          glow: 10,
        }),
      );

      // Bottom band: prediction question while waiting -> Runner Log -> Comparison verdict
      if (lg < 0.05) {
        nodes.push(
          line([-840, 130], [840, 130], { stroke: '#233154', width: 2 }),
          txt(
            'Start at character zero. Which reply parses as valid JSON?',
            -840,
            215,
            34,
            ROLE.prefix,
            'serif',
            'left',
          ).glow(6, ROLE.prefix),
          txt('SYNTAX CHECK BEFORE SEMANTICS', -840, 290, 26, COSMOS.dim, 'mono', 'left'),
        );
      } else {
        nodes.push(
          opticalRail(-840, 145, 255, ROLE.prefix, { opacity: lg }),
          txt('RUNNER LOG (GROUND TRUTH)', -805, 165, 26, ROLE.prefix, 'mono', 'left').opacity(lg),
          txt(RUN_LOG, -805, 222, 32, COSMOS.ink, 'sans', 'left').opacity(lg),
        );

        if (cp < 0.05) {
          nodes.push(
            txt(
              'B parsed as "passed". Should the dashboard display passed?',
              -805,
              340,
              32,
              ROLE.prefix,
              'serif',
              'left',
            )
              .glow(6, ROLE.prefix)
              .opacity(lg),
          );
        } else {
          const bStatus = JSON.parse(OPENING_REPLIES[1]).status;
          const arc = quadArcPts([560, yB + 32], [560, 330], 0, 24).map(([x, y], i) => [
            x + Math.sin((i / 24) * Math.PI) * 70,
            y,
          ]);
          nodes.push(
            beamWithPhotons(arc, ROLE.prune, p * 1.2, { alpha: cp, width: 3.4 }),
            txt(`B SAYS: ${bStatus}`, -805, 345, 34, ROLE.fsm, 'mono', 'left').opacity(cp),
            txt(`CI LOG: ${CI_RUN.status}`, -360, 345, 34, ROLE.prefix, 'mono', 'left').opacity(cp),
            txt('SEND B TO REVIEW', 180, 345, 36, ROLE.prune, 'mono', 'left')
              .glow(10, ROLE.prune)
              .opacity(cp),
          );
        }
      }

      return group(...nodes);
    },
  );

  s.add(stageAura, header, stageView);
  driftValue(s, c, pulse, 4.2, { startOffset: 0.1, endMargin: 0.5 });

  c.on('intro-ask', () => {
    s.play(askHi.to(1, { duration: clampDur(c, c.cue('intro-ask').start, 0.35) }));
  });
  // Strict prediction withholding: reveal parse failure & parse sweep AFTER spoken reveal!
  c.after('intro-byte', () => {
    s.play(byteStop.to(1, { duration: clampDur(c, c.cue('intro-byte').end, 0.35) }));
  });
  c.on('intro-parse', () => {
    s.play(parseSweep.to(1, { duration: clampDur(c, c.cue('intro-parse').start, 0.65) }));
  });
  c.on('intro-log', () => {
    s.play(logShow.to(1, { duration: clampDur(c, c.cue('intro-log').start, 0.4) }));
  });
  // Strict prediction withholding on Beat 1 question -> reveal verdict AFTER spoken clause!
  c.after('intro-compare', () => {
    s.play(compareShow.to(1, { duration: clampDur(c, c.cue('intro-compare').end, 0.4) }));
  });
}
