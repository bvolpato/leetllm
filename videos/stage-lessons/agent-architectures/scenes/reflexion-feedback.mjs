// Scene 13: reflexion-feedback - Repair feedback before adding another reflection
// Living Actor -> Evaluator -> Reflection orbital ring: existence-only evaluator falsely
// passes stale revision c1841 -> revision-aware evaluator rejects c1841 (task wants c1842)
// and stores exactly 1 scoped lesson -> next trial selects c1842 and passes!
import { group, line } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  aura,
  beamWithPhotons,
  cinemaHeader,
  clampDur,
  fadeInHalf,
  fadeOutHalf,
  guardedDynamic,
  orbNode,
  quadArcPts,
  txt,
} from '../parts.mjs';

export default function reflexionFeedback(s, c) {
  const pulse = s.value(0);
  const falsePassOn = s.value(0);
  const revRejectOn = s.value(0);
  const storeLessonOn = s.value(0);
  const currPassOn = s.value(0);
  const ctxNoteOn = s.value(0);

  const header = cinemaHeader(
    'REFLEXION VERBAL FEEDBACK',
    'Repair the evaluator',
    'before reflecting again',
    { accent: ROLE.focus, size: 48 },
  );

  const stageAura = aura(160, 40, 620, '#ffd1661c', '#ff6b8b1a');

  const view = guardedDynamic(
    () => 1,
    () => {
      const p = 0;
      const fp = falsePassOn.value;
      const rr = revRejectOn.value;
      const sl = storeLessonOn.value;
      const cp = currPassOn.value;
      const cn = ctxNoteOn.value;
      const nodes = [];

      // Orbital triad: Actor (left), Evaluator (top-right), Reflection memory (bottom-right)
      const actPt = [-540, 40];
      const evalPt = [50, -110];
      const refPt = [50, 175];

      const evalCol =
        cp > 0.35 ? ROLE.ok : rr > 0.35 ? ROLE.fail : fp > 0.35 ? ROLE.caution : ROLE.host;
      const evalLabel = cp > 0.35 ? 'PASS' : rr > 0.35 ? 'FAIL' : fp > 0.35 ? 'PASS*' : 'EVAL';

      nodes.push(
        beamWithPhotons(
          quadArcPts([actPt[0] + 82, actPt[1] - 25], [evalPt[0] - 82, evalPt[1]], -26),
          ROLE.policy,
          p * 1.1,
          {
            width: 3.4,
          },
        ),
        beamWithPhotons(
          [
            [evalPt[0], evalPt[1] + 80],
            [refPt[0], refPt[1] - 80],
          ],
          sl > 0.3 ? ROLE.focus : '#2e3f68',
          p * 1.1 + 0.33,
          { alpha: 0.35 + sl * 0.65, width: 3.4 },
        ),
        beamWithPhotons(
          quadArcPts([refPt[0] - 82, refPt[1]], [actPt[0] + 82, actPt[1] + 25], 26),
          ROLE.focus,
          p * 1.1 + 0.66,
          {
            alpha: 0.3 + sl * 0.7,
            width: 3.4,
          },
        ),
        orbNode(actPt[0], actPt[1], 'ACTOR', ROLE.policy, {
          radius: 64,
          sub: cp > 0.35 ? 'Selects c1842' : 'Selects old c1841',
        }),
        orbNode(evalPt[0], evalPt[1], evalLabel, evalCol, { radius: 68 }),
        txt(
          rr > 0.35 ? 'Revision-aware eval' : 'Existence-only eval',
          evalPt[0],
          evalPt[1] - 96,
          26,
          evalCol,
          'mono',
          'center',
        ),
        orbNode(refPt[0], refPt[1], sl > 0.35 ? 'NOTE' : 'REFLECT', ROLE.focus, {
          radius: 64,
          sub: sl > 0.35 ? 'Bind run to c1842' : 'Episodic note (1-3)',
          opacity: 0.4 + sl * 0.6,
        }),
      );

      // Right-hand diagnostic readout (sequential crossfade via fadeOutHalf/fadeInHalf!)
      const rx = 260;
      nodes.push(
        txt('TASK TARGET: c1842', rx, -160, 26, ROLE.action, 'mono', 'left'),
        txt('OLD RECEIPT: c1841', rx, -110, 26, ROLE.caution, 'mono', 'left'),
      );
      const fpAlpha = fp * fadeOutHalf(rr);
      if (fpAlpha > 0.05) {
        nodes.push(
          txt('Existence check passes c1841!', rx, -35, 28, ROLE.caution, 'sans', 'left').opacity(
            fpAlpha,
          ),
          txt('Stops before reflection runs', rx, 15, 26, COSMOS.muted, 'sans', 'left').opacity(
            fpAlpha,
          ),
        );
      }
      const rrAlpha = fadeInHalf(rr);
      if (rrAlpha > 0.05) {
        nodes.push(
          txt('Revision check FAILS c1841', rx, -35, 28, ROLE.fail, 'mono', 'left')
            .glow(6, ROLE.fail)
            .opacity(rrAlpha),
        );
      }
      if (sl > 0.05) {
        nodes.push(
          txt('Stores 1 scoped lesson', rx, 25, 28, ROLE.focus, 'mono', 'left').opacity(sl),
        );
      }
      if (cp > 0.05) {
        nodes.push(
          txt('Current run c1842 PASSES', rx, 95, 28, ROLE.ok, 'mono', 'left')
            .glow(7, ROLE.ok)
            .opacity(cp),
          txt('No 2nd failure note added', rx, 145, 26, COSMOS.muted, 'sans', 'left').opacity(cp),
        );
      }

      nodes.push(
        line([-840, 325], [840, 325], { stroke: '#25355a', width: 2 }).opacity(0.6),
        txt(
          cn > 0.35
            ? 'WEIGHTS STAY FIXED  ·  COUNT ACTOR + EVAL + REFLECTION + TOOLS PER TRIAL'
            : 'Actor -> Evaluator -> Scoped reflection feeds next trial context',
          0,
          375,
          26,
          cn > 0.35 ? ROLE.focus : COSMOS.muted,
          'mono',
          'center',
        ),
      );

      return group(...nodes);
    },
  );

  s.add(stageAura, header, view);

  c.on('aa-reflexion-feedback-0', () => {
    s.play(pulse.to(0.3, { duration: clampDur(c, c.cue('aa-reflexion-feedback-0').start, 0.25) }));
  });
  c.on('aa-reflexion-feedback-1', () => {
    s.play(
      falsePassOn.to(0.4, { duration: clampDur(c, c.cue('aa-reflexion-feedback-1').start, 0.25) }),
    );
  });
  c.on('reflect-false-pass', () => {
    s.play(falsePassOn.to(1, { duration: clampDur(c, c.cue('reflect-false-pass').start, 0.35) }));
  });
  c.on('reflect-reject', () => {
    s.play(revRejectOn.to(1, { duration: clampDur(c, c.cue('reflect-reject').start, 0.35) }));
  });
  c.on('reflect-store', () => {
    s.play(storeLessonOn.to(1, { duration: clampDur(c, c.cue('reflect-store').start, 0.35) }));
  });
  c.on('reflect-current', () => {
    s.play(currPassOn.to(1, { duration: clampDur(c, c.cue('reflect-current').start, 0.35) }));
  });
  c.on('aa-reflexion-feedback-2', () => {
    s.play(
      ctxNoteOn.to(1, { duration: clampDur(c, c.cue('aa-reflexion-feedback-2').start, 0.35) }),
    );
  });
}
