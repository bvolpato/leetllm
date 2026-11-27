// Scene 1: intro - Two hits for one search
// Opening prediction beat: Alice asks about starting migration on day 45.
// Two policy hits emerge from her query (30d policy, 60d conditional exception).
// Strictly withholds the 30-day verdict until `c.after('intro-outside')`, then approves and extends to 60 days.
import { circle, group, line, rect } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  aura,
  beamWithPhotons,
  buildMigrationRulerNodes,
  clampDur,
  generalWindow,
  guardedDynamic,
  migrationDecision,
  quadArcPts,
  txt,
} from '../parts.mjs';

export default function intro(s, c) {
  const queryOn = s.value(0);
  const baseFrac = s.value(0);
  const offerFrac = s.value(0);
  const pendingOn = s.value(0);
  const askOn = s.value(0);
  const outsideVerdict = s.value(0);
  const approvedOn = s.value(0);
  const extFrac = s.value(0);
  const insideVerdict = s.value(0);

  const stageAura = aura(0, -40, 740, '#5ce1e620', '#6ee7b716');

  const view = guardedDynamic(
    () => 1,
    () => {
      const b = baseFrac.value;
      const o = offerFrac.value;
      const pend = pendingOn.value;
      const ask = askOn.value;
      const outV = outsideVerdict.value;
      const app = approvedOn.value;
      const ext = extFrac.value;
      const inV = insideVerdict.value;

      const granted = app > 0.5;
      const decision = migrationDecision(1, 45, { granted });
      const nodes = [];

      // Floating query beam (no PowerPoint chrome)
      const qGlow = 6 + queryOn.value * 6;
      nodes.push(
        rect(1520, 88, { fill: '#0b1426', stroke: ROLE.query, width: 2.6, radius: 44 })
          .at(0, -412)
          .glow(qGlow, ROLE.query),
        circle(16, { fill: null, stroke: ROLE.query, width: 3.5 }).at(-708, -414),
        line([-696, -402], [-682, -388], { stroke: ROLE.query, width: 3.5 }),
        txt('Can we start the migration on day 45?', -646, -412, 40, COSMOS.ink, 'serif', 'left'),
      );

      // Luminous retrieval beams connecting query bar to the two returned policy passages
      nodes.push(
        beamWithPhotons(quadArcPts([-320, -368], [-440, -252], -12), ROLE.policy, 0, {
          width: 3,
          glow: 8,
          alpha: 0.4 + 0.6 * b,
        }),
        beamWithPhotons(quadArcPts([320, -368], [440, -252], -12), ROLE.exception, 0, {
          width: 3,
          glow: 8,
          alpha: 0.4 + 0.6 * o,
        }),
      );

      // Left hit: general policy (30 days)
      nodes.push(
        rect(720, 178, { fill: '#0d1528', stroke: ROLE.policy, width: 2.8, radius: 14 })
          .at(-430, -160)
          .glow(6 + b * 6, ROLE.policy),
        txt('PARSER-V2 POLICY  ·  policy@2', -755, -214, 26, ROLE.policy, 'mono', 'left'),
        txt(`${generalWindow} days`, -755, -152, 54, ROLE.policy, 'serif', 'left').glow(
          6,
          ROLE.policy,
        ),
        txt('from the deprecation notice', -755, -100, 28, COSMOS.muted, 'sans', 'left'),
      );

      // Right hit: service-account exception (60 days with security approval)
      nodes.push(
        rect(720, 178, { fill: '#0d1924', stroke: ROLE.exception, width: 2.8, radius: 14 })
          .at(430, -160)
          .glow(6 + o * 6, ROLE.exception),
        txt(
          'SERVICE-ACCOUNT EXCEPTION  ·  exception@1',
          105,
          -214,
          26,
          ROLE.exception,
          'mono',
          'left',
        ),
        txt(`${decision.exceptionDays} days`, 105, -152, 54, ROLE.exception, 'serif', 'left').glow(
          6,
          ROLE.exception,
        ),
        txt('only with security approval', 105, -100, 28, COSMOS.ink, 'sans', 'left'),
      );

      // Determine approval record and verdict strictly from settled cues
      let recordText = 'Approval record: checking...';
      let recordColor = COSMOS.muted;
      if (granted) {
        recordText = 'Security approval: GRANTED';
        recordColor = ROLE.ok;
      } else if (pend > 0.5) {
        recordText = 'Security approval: PENDING';
        recordColor = ROLE.pending;
      }

      const showVerdict = granted ? inV > 0.5 : outV > 0.5;
      const bottomText =
        !showVerdict && ask > 0.5 && !granted ? 'Which deadline applies today?' : '';

      nodes.push(
        ...buildMigrationRulerNodes({
          decision,
          rulerY: 145,
          baseFrac: b,
          offerFrac: o,
          extFrac: ext,
          recordText,
          recordColor,
          bottomText,
          bottomColor: ROLE.focus,
          showVerdict,
          showRuleLabels: false,
        }),
      );

      return group(...nodes);
    },
  );

  s.add(stageAura, view);
  c.on('intro-start', () => {
    s.play(queryOn.to(1, { duration: clampDur(c, c.cue('intro-start').start, 0.35) }));
  });
  c.on('intro-general', () => {
    s.play(baseFrac.to(1, { duration: clampDur(c, c.cue('intro-general').start, 0.65) }));
  });
  c.on('intro-exception', () => {
    s.play(offerFrac.to(1, { duration: clampDur(c, c.cue('intro-exception').start, 0.65) }));
  });
  c.on('intro-pending', () => {
    s.play(pendingOn.to(1, { duration: clampDur(c, c.cue('intro-pending').start, 0.25) }));
  });
  c.on('intro-question', () => {
    s.play(askOn.to(1, { duration: clampDur(c, c.cue('intro-question').start, 0.25) }));
  });
  // Strict prediction withholding: reveal 30-day outside verdict only AFTER "Thirty days" finishes.
  c.after('intro-outside', () => {
    s.play(outsideVerdict.to(1, { duration: clampDur(c, c.cue('intro-outside').end, 0.3) }));
  });
  c.after('intro-approved', () => {
    s.play(approvedOn.to(1, { duration: clampDur(c, c.cue('intro-approved').end, 0.25) }));
  });
  c.on('intro-extend', () => {
    s.play(extFrac.to(1, { duration: clampDur(c, c.cue('intro-extend').start, 0.65) }));
  });
  c.after('intro-extend', () => {
    s.play(insideVerdict.to(1, { duration: clampDur(c, c.cue('intro-extend').end, 0.25) }));
  });
}
