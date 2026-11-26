// Scene 14: reflexion-evidence - When does a passing self-test help?
// Paired glowing benchmark bars (HumanEval 80.1% -> 91.0% vs MBPP 80.1% -> 77.1%)
// beside the false-positive self-test rate diagnostic (16.3% wrong on MBPP vs 1.4% on HumanEval).
import { group, line } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  aura,
  cinemaHeader,
  clampDur,
  driftValue,
  glowMeter,
  guardedDynamic,
  txt,
} from '../parts.mjs';

export default function reflexionEvidence(s, c) {
  const pulse = s.value(0);
  const heBase = s.value(0);
  const heRef = s.value(0);
  const mbBase = s.value(0);
  const mbRef = s.value(0);
  const selfGrp = s.value(0);
  const mbWrong = s.value(0);
  const heWrong = s.value(0);

  const header = cinemaHeader(
    'REFLEXION EMPIRICAL EVIDENCE',
    'When does a passing',
    'self-test actually help?',
    { accent: ROLE.ok, size: 48 },
  );

  const stageAura = aura(160, 40, 620, '#6ee7b71c', '#ff6b8b1a');

  const view = guardedDynamic(
    () => 1,
    () => {
      const hb = Math.max(0.25, heBase.value);
      const hr = Math.max(0.2, heRef.value);
      const mb = Math.max(0.2, mbBase.value);
      const mr = Math.max(0.2, mbRef.value);
      const sg = selfGrp.value;
      const mw = mbWrong.value;
      const hw = heWrong.value;
      const nodes = [];

      // Left: Pass@1 Final Answer Accuracy
      const lx = -840;
      const bw = 720;
      nodes.push(
        txt('HUMANEVAL (GPT-4 PASS@1)', lx, -185, 26, ROLE.ok, 'mono', 'left'),
        txt('1-shot baseline         80.1%', lx, -135, 26, COSMOS.muted, 'mono', 'left').opacity(
          hb,
        ),
        glowMeter(lx, -96, bw, 24, 0.801 * hb, { fill: ROLE.host, opacity: hb }),
        txt('Reflexion (self-test)   91.0% (+10.9)', lx, -36, 26, ROLE.ok, 'mono', 'left')
          .glow(hr > 0.5 ? 6 : 0, ROLE.ok)
          .opacity(hr),
        glowMeter(lx, 4, bw, 24, 0.91 * hr, { fill: ROLE.ok, opacity: hr }),

        txt('MBPP (GPT-4 PASS@1)', lx, 105, 26, ROLE.fail, 'mono', 'left').opacity(mb),
        txt('1-shot baseline         80.1%', lx, 155, 26, COSMOS.muted, 'mono', 'left').opacity(mb),
        glowMeter(lx, 194, bw, 24, 0.801 * mb, { fill: ROLE.host, opacity: mb }),
        txt('Reflexion (self-test)   77.1% (-3.0)', lx, 254, 26, ROLE.fail, 'mono', 'left')
          .glow(mr > 0.5 ? 6 : 0, ROLE.fail)
          .opacity(mr),
        glowMeter(lx, 294, bw, 24, 0.771 * mr, { fill: ROLE.fail, opacity: mr }),
      );

      // Right: False-Positive Rate among solutions that PASSED their own tests!
      const rx = 110;
      const rw = 680;
      nodes.push(
        line([40, -195], [40, 320], { stroke: '#25355a', width: 2 }).opacity(0.65),
        txt(
          'PASSED SELF-TEST BUT ACTUALLY WRONG',
          rx,
          -185,
          26,
          ROLE.focus,
          'mono',
          'left',
        ).opacity(0.35 + sg * 0.65),
        txt('MBPP false-pass rate', rx, -90, 28, ROLE.fail, 'mono', 'left').opacity(
          0.25 + mw * 0.75,
        ),
        txt('16.3%', rx + 510, -90, 48, ROLE.fail, 'mono', 'left')
          .glow(mw > 0.4 ? 10 : 0, ROLE.fail)
          .opacity(0.25 + mw * 0.75),
        glowMeter(rx, -28, rw, 30, 0.163 * 4 * Math.max(0.15, mw), {
          fill: ROLE.fail,
          opacity: 0.25 + mw * 0.75,
        }),

        txt('HumanEval false-pass rate', rx, 85, 28, ROLE.ok, 'mono', 'left').opacity(
          0.25 + hw * 0.75,
        ),
        txt('1.4%', rx + 510, 85, 48, ROLE.ok, 'mono', 'left')
          .glow(hw > 0.4 ? 9 : 0, ROLE.ok)
          .opacity(0.25 + hw * 0.75),
        glowMeter(rx, 146, rw, 30, 0.014 * 4 * Math.max(0.15, hw), {
          fill: ROLE.ok,
          opacity: 0.25 + hw * 0.75,
        }),

        txt(
          'Weak self-tests lock in broken solutions',
          rx,
          265,
          28,
          ROLE.focus,
          'serif',
          'left',
        ).opacity(0.35 + sg * 0.65),
      );

      return group(...nodes);
    },
  );

  s.add(stageAura, header, view);
  driftValue(s, c, pulse, 4.2, { startOffset: 0.1, endMargin: 0.5 });

  c.on('aa-reflexion-evidence-0', () => {
    s.play(pulse.to(0.3, { duration: clampDur(c, c.cue('aa-reflexion-evidence-0').start, 0.25) }));
  });
  c.on('human-baseline', () => {
    s.play(heBase.to(1, { duration: clampDur(c, c.cue('human-baseline').start, 0.35) }));
  });
  c.on('human-refined', () => {
    s.play(heRef.to(1, { duration: clampDur(c, c.cue('human-refined').start, 0.35) }));
  });
  c.on('aa-reflexion-evidence-1', () => {
    s.play(mbBase.to(0.5, { duration: clampDur(c, c.cue('aa-reflexion-evidence-1').start, 0.25) }));
  });
  c.on('mbpp-baseline', () => {
    s.play(mbBase.to(1, { duration: clampDur(c, c.cue('mbpp-baseline').start, 0.35) }));
  });
  c.on('mbpp-refined', () => {
    s.play(mbRef.to(1, { duration: clampDur(c, c.cue('mbpp-refined').start, 0.35) }));
  });
  c.on('self-test-group', () => {
    s.play(selfGrp.to(1, { duration: clampDur(c, c.cue('self-test-group').start, 0.35) }));
  });
  c.on('mbpp-self-test', () => {
    s.play(mbWrong.to(1, { duration: clampDur(c, c.cue('mbpp-self-test').start, 0.35) }));
  });
  c.on('human-self-test', () => {
    s.play(heWrong.to(1, { duration: clampDur(c, c.cue('human-self-test').start, 0.35) }));
  });
}
