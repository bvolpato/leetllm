// Scene 02: collision: Two distinct files ([3,1] and [1,2]) collide at state 1.25 and stay merged forever.
import {
  COSMOS,
  ROLE,
  aura,
  bindCueBeat,
  glowDot,
  glowingTrail,
  group,
  guardedDynamic,
  heroTitle,
  playCue,
  run,
  txt,
} from '../parts.mjs';

export default function collision(s, c) {
  const showFileB = s.value(0);
  const showPredict = s.value(0);
  const revealMerge = s.value(0); // strictly withheld until AFTER `ssm-collision-equality`!
  const stepFour = s.value(0);
  const stepTwo = s.value(0);
  const showAnswers = s.value(0);

  const bgAura = aura(0, 0, 740, '#3e1a4a26', '#103c3618');
  const title = heroTitle(['State Collision:', 'two files, one number'], {
    x: -855,
    y: -430,
    size: 54,
    lineHeight: 62,
    accent: ROLE.write,
  });

  const traceA = run([3, 1, 4, 2], 0.5, 0.5); // [1.5, 1.25, 2.625, 2.3125]
  const traceB = run([1, 2, 4, 2], 0.5, 0.5); // [0.5, 1.25, 2.625, 2.3125]
  const xsPos = [-720, -340, 40, 420, 760];
  const yOf = (val) => 220 - val * 125;

  const stageVis = s.value(1);
  const layer = guardedDynamic(stageVis, (alpha) => {
    const fb = showFileB.value;
    const pr = showPredict.value;
    const mg = revealMerge.value;
    const s4 = stepFour.value;
    const s2 = stepTwo.value;
    const ans = showAnswers.value;
    const nodes = [];

    // Step labels along horizontal axis
    const stepNames = ['start (0)', 'retries', 'timeout', '+ input 4', '+ input 2'];
    stepNames.forEach((lbl, idx) => {
      nodes.push(txt(lbl, xsPos[idx], 285, 26, COSMOS.muted, 'mono', 'center').opacity(alpha));
    });

    // Path A: 0 -> 1.5
    const pA0 = [xsPos[0], yOf(0)];
    const pA1 = [xsPos[1], yOf(traceA[0])];
    const pM = [xsPos[2], yOf(traceA[1])];
    const p4 = [xsPos[3], yOf(traceA[2])];
    const p2 = [xsPos[4], yOf(traceA[3])];

    nodes.push(
      glowingTrail([pA0, pA1], { color: ROLE.carry, width: 4.5, glow: 10, opacity: alpha }),
      glowDot(pA1[0], pA1[1], { radius: 8, color: ROLE.carry, opacity: alpha }),
      txt(
        'File A (retries=3, t=1): 1.50',
        pA1[0],
        pA1[1] - 42,
        26,
        ROLE.carry,
        'mono',
        'center',
      ).opacity(alpha),
    );

    if (fb > 0.05) {
      const pB1 = [xsPos[1], yOf(traceB[0])];
      nodes.push(
        glowingTrail([pA0, pB1], { color: ROLE.write, width: 4.5, glow: 10, opacity: fb * alpha }),
        glowDot(pB1[0], pB1[1], { radius: 8, color: ROLE.write, opacity: fb * alpha }),
        txt(
          'File B (retries=1, t=2): 0.50',
          pB1[0],
          pB1[1] + 62,
          26,
          ROLE.write,
          'mono',
          'center',
        ).opacity(fb * alpha),
      );

      if (mg > 0.05) {
        nodes.push(
          glowingTrail([pA1, pM], { color: ROLE.carry, width: 4.5, glow: 10, opacity: mg * alpha }),
          glowingTrail([pB1, pM], { color: ROLE.write, width: 4.5, glow: 10, opacity: mg * alpha }),
          glowDot(pM[0], pM[1], { radius: 12, color: ROLE.state, glow: 16, opacity: mg * alpha }),
          txt(`BOTH = ${traceA[1].toFixed(2)}`, pM[0], pM[1] + 56, 32, ROLE.state, 'mono', 'center')
            .glow(8, ROLE.state)
            .opacity(mg * alpha),
        );
      }
    }

    if (s4 > 0.05) {
      nodes.push(
        glowingTrail([pM, p4], { color: ROLE.state, width: 5, glow: 12, opacity: s4 * alpha }),
        glowDot(p4[0], p4[1], { radius: 9, color: ROLE.state, opacity: s4 * alpha }),
        txt(traceA[2].toFixed(3), p4[0], p4[1] - 42, 28, ROLE.state, 'mono', 'center').opacity(
          s4 * alpha,
        ),
      );
    }

    if (s2 > 0.05) {
      nodes.push(
        glowingTrail([p4, p2], { color: ROLE.state, width: 5, glow: 12, opacity: s2 * alpha }),
        glowDot(p2[0], p2[1], { radius: 10, color: ROLE.state, opacity: s2 * alpha }),
        txt(traceA[3].toFixed(4), p2[0], p2[1] - 42, 28, ROLE.state, 'mono', 'center').opacity(
          s2 * alpha,
        ),
      );
    }

    if (pr > 0.05 && mg < 0.2) {
      nodes.push(
        txt(
          'Average each slot with its timeout: what lands in both slots?',
          -855,
          375,
          34,
          ROLE.delta,
          'serif',
          'left',
        )
          .glow(8, ROLE.delta)
          .opacity(pr * (1 - mg * 5) * alpha),
      );
    }

    if (ans > 0.05) {
      nodes.push(
        txt(
          'Same state (2.3125), two answers: File A needs 3, File B needs 1',
          -855,
          375,
          32,
          ROLE.delta,
          'mono',
          'left',
        )
          .glow(8, ROLE.delta)
          .opacity(ans * alpha),
      );
    }

    return group(...nodes);
  });

  s.add(bgAura, title, layer);
  playCue(s, c, 'second-file', (d) => s.play(showFileB.to(1, { duration: d })), { dur: 0.5 });
  playCue(s, c, 'two-slots', (d) => s.play(showPredict.to(1, { duration: d })), { dur: 0.4 });
  // Strictly withhold 1.25 collision reveal until AFTER `ssm-collision-equality`!
  playCue(s, c, 'ssm-collision-equality', (d) => s.play(revealMerge.to(1, { duration: d })), {
    after: true,
    dur: 0.55,
  });
  playCue(s, c, 'common-four', (d) => s.play(stepFour.to(1, { duration: d })), { dur: 0.5 });
  playCue(s, c, 'common-two', (d) => s.play(stepTwo.to(1, { duration: d })), { dur: 0.5 });
  playCue(s, c, 'two-answers', (d) => s.play(showAnswers.to(1, { duration: d })), { dur: 0.5 });
  bindCueBeat(s, c, s.value(0), []);
}
