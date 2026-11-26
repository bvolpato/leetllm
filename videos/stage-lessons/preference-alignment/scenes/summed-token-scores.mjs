// Scene 16: A response score gathers shifted targets and sums once (Teacher-forcing logit shift + mask + CPU toy)
import {
  ALIGNMENT_TOKEN_FIXTURE,
  COSMOS,
  TOKEN_BASE,
  TOKEN_BOOST,
  TOKEN_EXCLUDED,
  aura,
  glassCell,
  glowTex,
  glowingArc,
  group,
  guardedDynamic,
  heroTitle,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function summedTokenScores(s, c) {
  const phase = s.value(0);
  const sRouteVsP7 = s.value(0);
  const sShift = s.value(0);
  const sGather = s.value(0);
  const sIds = s.value(0);
  const sEos = s.value(0);
  const sCpu = s.value(0);
  const sRes = s.value(0);
  const sBoost = s.value(0);
  const sExcl = s.value(0);

  const bgAura = aura(0, 20, 620, '#14385c26', '#2e1a4a18');
  const title = heroTitle(['A Response Score Gathers', 'Shifted Targets & Sums Once'], {
    x: -855,
    y: -415,
    size: 52,
    lineHeight: 62,
    accent: COSMOS.gold,
    eyebrow: 'TEACHER-FORCED LOG-SOFTMAX · NEXT-TOKEN SHIFT & POSITION MASKING',
  });

  const live = guardedDynamic(s.value(1), () => {
    const p = phase.value;
    const pulse = 0.72 + 0.28 * Math.sin(p * 3.8);
    const gt = Math.max(0.4, sGather.value);
    const eo = sEos.value;
    const rs = sRes.value;
    const bo = sBoost.value;
    const ex = sExcl.value;

    const chosenIds = ALIGNMENT_TOKEN_FIXTURE.chosenIds; // [0, 2, 1, 2, 4, 0]
    const rejectedIds = ALIGNMENT_TOKEN_FIXTURE.rejectedIds; // [0, 2, 3, 0, 4, 0]
    const mask = ALIGNMENT_TOKEN_FIXTURE.mask; // [1, 1, 1, 1, 1, 0]

    const x0 = -730;
    const stride = 200;
    const rowChosenY = -104;
    const rowRejY = 66;

    const nodes = [
      txt(
        sIds.value < 0.3
          ? 'ROUTE TOY: m=1.0, beta=0.5 -> L=0.474   |   P-7 TOY: m=0.7, beta=0.1 -> L=0.659'
          : 'CPU TOY: PROMPT [0, 2]  ·  RESPONSE + EOS(4) SCORED  ·  TRAILING PAD EXCLUDED',
        -855,
        -246,
        26,
        sRouteVsP7.value > 0.2 && sIds.value < 0.3 ? COSMOS.gold : COSMOS.cyan,
        'mono',
        'left',
      ),
      txt('CHOSEN', -855, rowChosenY, 26, COSMOS.emerald, 'mono', 'left'),
      txt('REJECT', -855, rowRejY, 26, COSMOS.rose, 'mono', 'left'),
    ];

    chosenIds.forEach((cid, i) => {
      const cx = x0 + i * stride + 95;
      const isPrompt = i < 2;
      const isPad = mask[i] === 0;
      const isEos = i === 4;
      const scored = !isPrompt && !isPad;
      const colC = isPad
        ? COSMOS.dim
        : isPrompt
          ? COSMOS.blue
          : isEos && eo > 0.2
            ? COSMOS.gold
            : COSMOS.emerald;
      const colR = isPad
        ? COSMOS.dim
        : isPrompt
          ? COSMOS.blue
          : i === 3
            ? COSMOS.amber
            : isEos && eo > 0.2
              ? COSMOS.gold
              : COSMOS.rose;

      const roleTag = isPrompt ? 'PROMPT' : isPad ? 'PAD (0)' : isEos ? 'EOS (4)' : `RESP t=${i}`;

      nodes.push(
        txt(
          roleTag,
          cx,
          rowChosenY - 98,
          26,
          isPrompt ? COSMOS.blue : isPad ? COSMOS.dim : COSMOS.muted,
          'mono',
        ),
        glassCell(cx, rowChosenY, 164, 82, colC, {
          fill: scored ? '#0e2824' : '#12182b',
          glow: scored ? 7 : 2,
        }),
        txt(`id=${cid}`, cx, rowChosenY + 2, 30, colC, 'mono'),

        glassCell(cx, rowRejY, 164, 82, colR, {
          fill: scored ? '#28101a' : '#12182b',
          glow: scored ? 7 : 2,
        }),
        txt(i === 3 ? 'id=0 (!)' : `id=${rejectedIds[i]}`, cx, rowRejY + 2, 30, colR, 'mono'),
      );

      // Shifted gather arcs from logit row (t-1) to scored target t (positions 2, 3, 4)
      if (scored && gt > 0.2) {
        const prevX = x0 + (i - 1) * stride + 95;
        nodes.push(
          glowingArc([prevX, rowChosenY - 42], [cx, rowChosenY - 42], -30, {
            color: COSMOS.gold,
            width: 2.8,
            opacity: gt,
            glow: 7,
          }),
        );
      }
    });

    // Bottom metrics strip: Executed CPU toy numbers
    const activeLoss =
      ex > 0.4 ? TOKEN_EXCLUDED.loss : bo > 0.4 ? TOKEN_BOOST.loss : TOKEN_BASE.loss;
    const activeTag =
      ex > 0.4
        ? 'PERTURB PROMPT/PAD (+1000) -> LOSS UNCHANGED (0.662)'
        : bo > 0.4
          ? 'BOOST 2 CHOSEN LOGITS -> LOSS DROPS 0.662 -> 0.646'
          : rs > 0.2 || sCpu.value > 0.2
            ? `CHOSEN = ${TOKEN_BASE.chosen.toFixed(3)}   ·   REJECTED = ${TOKEN_BASE.rejected.toFixed(3)}   ·   DPO LOSS = ${TOKEN_BASE.loss.toFixed(3)}`
            : 'Mask by POSITION & attention_mask, NEVER by token ID (rejected t=3 has real content id=0!)';

    nodes.push(
      glassCell(
        0,
        224,
        1710,
        118,
        ex > 0.4 ? COSMOS.emerald : bo > 0.4 ? COSMOS.cyan : COSMOS.gold,
        {
          fill: '#131a2e',
          glow: rs > 0.2 || bo > 0.2 || ex > 0.2 ? 9 * pulse : 4,
        },
      ),
      txt(activeTag, 0, 200, 28, COSMOS.gold, 'mono'),
      txt(
        `ACTIVE DPO LOSS = ${activeLoss.toFixed(3)}   |   logit row (t-1) predicts target token t across full vocabulary`,
        0,
        248,
        26,
        COSMOS.ink,
        'sans',
      ),
    );

    return group(...nodes);
  });

  const eqSum = glowTex(
    '\\log \\pi(y \\mid x) = \\sum_{t \\in \\text{resp} \\cup \\{\\text{EOS}\\}} \\log \\operatorname{softmax}(z_{t-1})_{y_t}',
    {
      x: 0,
      y: 374,
      size: 34,
      color: COSMOS.cyan,
      glow: 6,
    },
  );

  s.add(bgAura, title, live, eqSum);
  runPhase(s, c, phase, 14);

  c.on('summed-token-scores-b0', () =>
    s.play(sRouteVsP7.to(1, { duration: remainDuration(c, 'summed-token-scores-b0', 0.45) })),
  );
  c.on('summed-token-scores-b1', () =>
    s.play(sShift.to(1, { duration: remainDuration(c, 'summed-token-scores-b1', 0.45) })),
  );
  c.on('pa-token-gather', () =>
    s.play(sGather.to(1, { duration: remainDuration(c, 'pa-token-gather', 0.55) })),
  );
  c.on('summed-token-scores-b2', () =>
    s.play(sIds.to(1, { duration: remainDuration(c, 'summed-token-scores-b2', 0.45) })),
  );
  c.on('pa-token-eos', () =>
    s.play(sEos.to(1, { duration: remainDuration(c, 'pa-token-eos', 0.45) })),
  );
  c.on('summed-token-scores-b3', () =>
    s.play(sCpu.to(1, { duration: remainDuration(c, 'summed-token-scores-b3', 0.45) })),
  );
  c.on('pa-token-result', () =>
    s.play(sRes.to(1, { duration: remainDuration(c, 'pa-token-result', 0.45) })),
  );
  c.on('pa-token-boost', () =>
    s.play(sBoost.to(1, { duration: remainDuration(c, 'pa-token-boost', 0.55) })),
  );
  c.on('pa-token-excluded', () =>
    s.play(sExcl.to(1, { duration: remainDuration(c, 'pa-token-excluded', 0.55) })),
  );
}
