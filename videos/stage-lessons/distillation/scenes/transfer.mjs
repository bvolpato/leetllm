// Scene 16: How far does one fitted prefix take us? (40-step convergence + 4-checkpoint eval)
import {
  COSMOS,
  TEACHER_PROBS,
  TRACE_40,
  WORDS,
  aura,
  glassCell,
  glowDot,
  glowingTrail,
  group,
  guardedDynamic,
  heroTitle,
  line,
  rect,
  remainDuration,
  runPhase,
  stableSoftmax,
  txt,
} from '../parts.mjs';

export default function transfer(s, c) {
  const phase = s.value(0);
  const stepVal = s.value(0); // 0 -> 40 on transfer-b1-1
  const sKlNote = s.value(0);
  const sFreshEval = s.value(0);

  const bgAura = aura(300, 40, 600, '#13355c26', '#2e1d5214');
  const title = heroTitle(['How Far Does One', 'Fitted Prefix Take Us?'], {
    x: -855,
    y: -415,
    size: 54,
    lineHeight: 64,
    accent: COSMOS.emerald,
    eyebrow: 'SINGLE-PREFIX CONVERGENCE vs FRESH-REQUEST GENERALIZATION',
  });

  const px0 = 155;
  const px1 = 815;
  const pyBot = 128;
  const pyTop = -142;
  const maxLoss = TRACE_40[0].loss * 1.05;
  const mapX = (st) => px0 + (st / 40) * (px1 - px0);
  const mapY = (loss) => pyBot - (loss / maxLoss) * (pyBot - pyTop);
  const fullCurvePts = TRACE_40.map((r) => [mapX(r.step), mapY(r.loss)]);

  const live = guardedDynamic(s.value(1), () => {
    const p = phase.value;
    const pulse = 0.72 + 0.28 * Math.sin(p * 3.8);
    const stFloat = Math.max(0, Math.min(40, stepVal.value));
    const idx0 = Math.floor(stFloat);
    const idx1 = Math.min(40, idx0 + 1);
    const frac = stFloat - idx0;
    const logits = TRACE_40[idx0].logits.map((v, i) => v + (TRACE_40[idx1].logits[i] - v) * frac);
    const probs = stableSoftmax(logits);
    const loss = TRACE_40[idx0].loss + (TRACE_40[idx1].loss - TRACE_40[idx0].loss) * frac;
    const kn = sKlNote.value;
    const fe = sFreshEval.value;

    const baseY = 128;
    const maxH = 240;

    const nodes = [
      txt('TEACHER AT "... saw a"', -645, -182, 26, COSMOS.blue, 'mono'),
      txt(`STUDENT · STEP ${Math.round(stFloat)}`, -195, -182, 26, COSMOS.cyan, 'mono'),
      line([-840, baseY], [-450, baseY], { stroke: COSMOS.rule, width: 2.2 }),
      line([-390, baseY], [0, baseY], { stroke: COSMOS.rule, width: 2.2 }),
    ];

    WORDS.forEach((word, i) => {
      const tx = -790 + i * 96;
      const sx = -340 + i * 96;
      const th = Math.max(12, TEACHER_PROBS[i] * maxH);
      const sh = Math.max(12, probs[i] * maxH);
      const isCat = i === 2;
      nodes.push(
        rect(60, th, { fill: '#17386b', stroke: COSMOS.blue, width: 2.2, radius: 6 }).at(
          tx,
          baseY - th * 0.5,
        ),
        txt(TEACHER_PROBS[i].toFixed(2), tx, baseY - th - 22, 26, COSMOS.blue, 'mono'),
        txt(word, tx, baseY + 34, 26, isCat ? COSMOS.gold : COSMOS.muted, 'mono'),

        rect(60, sh, {
          fill: isCat ? '#2e250e' : '#0e3c50',
          stroke: isCat ? COSMOS.gold : COSMOS.cyan,
          width: 2.4,
          radius: 6,
        })
          .at(sx, baseY - sh * 0.5)
          .glow(isCat ? 7 * pulse : 3, isCat ? COSMOS.gold : COSMOS.cyan),
        txt(
          probs[i].toFixed(2),
          sx,
          baseY - sh - 22,
          26,
          isCat ? COSMOS.gold : COSMOS.cyan,
          'mono',
        ),
        txt(word, sx, baseY + 34, 26, isCat ? COSMOS.gold : COSMOS.muted, 'mono'),
      );
    });

    // Right: 40-step KL curve
    nodes.push(
      txt('SINGLE-PREFIX FORWARD KL', px0, pyTop - 40, 26, COSMOS.emerald, 'mono', 'left'),
      txt(`KL = ${loss.toFixed(4)}`, px1, pyTop - 40, 28, COSMOS.gold, 'mono', 'right'),
      line([px0, pyBot], [px1 + 18, pyBot], { stroke: COSMOS.rule, width: 2.2 }),
      line([px0, pyBot], [px0, pyTop - 16], { stroke: COSMOS.rule, width: 2.2 }),
      txt('0', px0, pyBot + 34, 26, COSMOS.muted, 'mono'),
      txt('20', mapX(20), pyBot + 34, 26, COSMOS.muted, 'mono'),
      txt('40', mapX(40), pyBot + 34, 26, COSMOS.muted, 'mono'),
      glowingTrail(fullCurvePts, {
        color: COSMOS.dim,
        width: 2.2,
        opacity: 0.35,
        glow: 0,
        core: false,
      }),
    );

    const activePts = TRACE_40.slice(0, idx0 + 1).map((r) => [mapX(r.step), mapY(r.loss)]);
    if (frac > 0.02) activePts.push([mapX(stFloat), mapY(loss)]);
    if (activePts.length >= 2) {
      nodes.push(glowingTrail(activePts, { color: COSMOS.emerald, width: 4.2, glow: 9 }));
    }
    nodes.push(glowDot(mapX(stFloat), mapY(loss), { radius: 8, color: COSMOS.gold }));

    // Bottom: 4-checkpoint benchmark row (highlighted on transfer-b3-1)
    const checkpoints = [
      { label: '1. Base Student', col: COSMOS.muted },
      { label: '2. Hard-Label SFT', col: COSMOS.amber },
      { label: '3. Distilled Student', col: COSMOS.emerald },
      { label: '4. Teacher', col: COSMOS.blue },
    ];
    nodes.push(
      txt(
        fe > 0.35
          ? 'BENCHMARK ALL FOUR CHECKPOINTS ON FRESH REQUESTS & DEVICE COST:'
          : kn > 0.35
            ? 'Small KL belongs ONLY to "... saw a" · fresh wording & policy checks remain open!'
            : '40 logit updates move cat from 0.59 toward the teacher share (0.18)',
        -835,
        244,
        27,
        fe > 0.35 ? COSMOS.emerald : kn > 0.35 ? COSMOS.amber : COSMOS.muted,
        'sans',
        'left',
      ),
    );

    checkpoints.forEach(({ label, col }, i) => {
      const cx = -625 + i * 418;
      const active = fe > 0.35;
      nodes.push(
        glassCell(cx, 336, 386, 86, active ? col : COSMOS.rule, {
          fill: active && i === 2 ? '#0f2c27' : '#10182b',
          glow: active && i === 2 ? 9 * pulse : 2,
          opacity: active ? 1 : 0.72,
        }),
        txt(label, cx, 338, 28, active ? col : COSMOS.muted, 'mono'),
      );
    });

    return group(...nodes);
  });

  s.add(bgAura, title, live);
  runPhase(s, c, phase, 14);

  c.on('transfer-b1-1', () => s.play(stepVal.to(40, { duration: 2.6 })));
  c.on('transfer-b2-1', () => s.play(sKlNote.to(1, { duration: 0.5 })));
  c.on('transfer-b3-1', () =>
    s.play(sFreshEval.to(1, { duration: remainDuration(c, 'transfer-b3-1', 0.6) })),
  );
}
