// Scene 14: earned-transfer: Latency crossover (16 tokens: 168 vs 177 ms; 256 tokens: 936 vs 609 ms; cross at 23) + 32-layer hybrid stack.
import {
  COSMOS,
  ROLE,
  aura,
  bindCueBeat,
  cacheWorksheet,
  group,
  guardedDynamic,
  heroTitle,
  lumBar,
  playCue,
  rect,
  swapVis,
  timingFixture,
  txt,
} from '../parts.mjs';

export default function earnedTransfer(s, c) {
  const view1Vis = s.value(1);
  const view2Vis = s.value(0);
  const show16 = s.value(1);
  const show256Prompt = s.value(0);
  const reveal256 = s.value(0); // strictly withheld until AFTER `ssm-timing256`!
  const showCrossing = s.value(0);
  const showHybridModels = s.value(0);

  const bgAura = aura(0, 0, 740, '#16355e28', '#2a1b5418');
  const title = heroTitle(['Latency Crossover', '& Hybrid Layer Stacks'], {
    x: -855,
    y: -430,
    size: 50,
    lineHeight: 58,
    accent: ROLE.delta,
  });

  const t16 = timingFixture(16); // attn=168, ssm=177
  const t256 = timingFixture(256); // attn=936, ssm=609, crossing=22.43 -> token 23
  const fullCache = cacheWorksheet(32); // 32 GiB
  const hybridCache = cacheWorksheet(4); // 4 GiB

  const view1 = guardedDynamic(view1Vis, (alpha) => {
    const p256 = show256Prompt.value;
    const r256 = reveal256.value;
    const cr = showCrossing.value;
    const maxMs = 1000;
    const maxW = 860;
    const barX = -420;
    const nodes = [
      txt(
        '16-TOKEN REPLY  (PREFILL + 15 DECODE STEPS)',
        -855,
        -220,
        26,
        COSMOS.muted,
        'mono',
        'left',
      ).opacity(alpha),
      txt('Attention (120 + 3.2/tok)', -855, -135, 28, ROLE.carry, 'mono', 'left').opacity(alpha),
      lumBar(barX, -135, (t16.attention / maxMs) * maxW, 34, ROLE.carry, {
        opacity: alpha,
        maxTrackW: maxW,
      }),
      txt(`${t16.attention} ms`, barX + maxW + 30, -135, 30, ROLE.carry, 'mono', 'left').opacity(
        alpha,
      ),

      txt('SSM (150 + 1.8/tok)', -855, -55, 28, ROLE.write, 'mono', 'left').opacity(alpha),
      lumBar(barX, -55, (t16.ssm / maxMs) * maxW, 34, ROLE.write, {
        opacity: alpha,
        maxTrackW: maxW,
      }),
      txt(`${t16.ssm} ms`, barX + maxW + 30, -55, 30, ROLE.write, 'mono', 'left').opacity(alpha),
    ];

    // 256-token tracks present quietly from t=0 (strictly withholding totals until AFTER ssm-timing256!)
    const show256 = r256 > 0.2;
    const t256Op = show256 ? r256 * alpha : alpha * 0.28;
    nodes.push(
      txt(
        '256-TOKEN REPLY  (PREFILL + 255 DECODE STEPS)',
        -855,
        75,
        26,
        show256 ? ROLE.state : COSMOS.muted,
        'mono',
        'left',
      ).opacity(t256Op),
      txt('Attention', -855, 155, 30, ROLE.carry, 'mono', 'left').opacity(t256Op),
      lumBar(barX, 155, show256 ? (t256.attention / maxMs) * maxW : 10, 34, ROLE.carry, {
        opacity: t256Op,
        maxTrackW: maxW,
      }),
      txt(
        show256 ? `${t256.attention} ms` : '? ms',
        barX + maxW + 30,
        155,
        32,
        ROLE.carry,
        'mono',
        'left',
      ).opacity(t256Op),

      txt(show256 ? 'SSM (WINS!)' : 'SSM', -855, 235, 30, ROLE.state, 'mono', 'left')
        .glow(show256 ? 6 : 0, ROLE.state)
        .opacity(t256Op),
      lumBar(barX, 235, show256 ? (t256.ssm / maxMs) * maxW : 10, 34, ROLE.state, {
        opacity: t256Op,
        maxTrackW: maxW,
      }),
      txt(
        show256 ? `${t256.ssm} ms` : '? ms',
        barX + maxW + 30,
        235,
        32,
        ROLE.state,
        'mono',
        'left',
      )
        .glow(show256 ? 8 : 0, ROLE.state)
        .opacity(t256Op),
    );

    if (p256 > 0.05 && r256 < 0.2) {
      nodes.push(
        txt(
          '256-TOKEN REPLY: keep rates; what are both totals & who finishes first?',
          -855,
          355,
          32,
          ROLE.delta,
          'serif',
          'left',
        )
          .glow(8, ROLE.delta)
          .opacity(p256 * (1 - r256 * 5) * alpha),
      );
    }

    if (cr > 0.05) {
      nodes.push(
        txt(
          'Saves 1.4 ms/token after 30 ms startup gap → SSM first wins at output 23',
          -855,
          355,
          30,
          ROLE.delta,
          'mono',
          'left',
        )
          .glow(8, ROLE.delta)
          .opacity(cr * alpha),
      );
    }
    return group(...nodes);
  });

  // View 2: 32-layer hybrid stack (4 attention layers + 28 SSM layers -> KV shrinks 32 GiB -> 4 GiB)
  const view2 = guardedDynamic(view2Vis, (alpha) => {
    const hm = showHybridModels.value;
    const nodes = [
      txt(
        '32-LAYER HYBRID STACK: 4 ATTENTION (PINK) + 28 SSM (CYAN)',
        -855,
        -210,
        28,
        ROLE.read,
        'mono',
        'left',
      ).opacity(alpha),
    ];

    for (let i = 0; i < 32; i++) {
      const x = -830 + i * 53;
      const isAttn = i % 8 === 4;
      const col = isAttn ? ROLE.write : ROLE.read;
      nodes.push(
        rect(42, 110, { fill: isAttn ? '#3d1730' : '#10243d', stroke: col, width: 2.4, radius: 6 })
          .at(x, -85)
          .glow(isAttn ? 10 : 4, col)
          .opacity(alpha),
      );
    }

    nodes.push(
      txt(
        `4 / 32 = 1/8 attention layers  →  KV cache shrinks ${fullCache.kvGiB} GiB → ${hybridCache.kvGiB} GiB`,
        -855,
        55,
        32,
        ROLE.state,
        'mono',
        'left',
      )
        .glow(8, ROLE.state)
        .opacity(alpha),
    );

    if (hm > 0.05) {
      nodes.push(
        txt(
          'Jamba block unit: 1 Attention + 7 Mamba mixers (each paired with FFN/MoE)',
          -855,
          190,
          28,
          ROLE.write,
          'sans',
          'left',
        ).opacity(hm * alpha),
        txt(
          'Nemotron-H 8B sublayers: 4 Attention + 24 Mamba-2 + 24 FFN counted separately',
          -855,
          255,
          28,
          ROLE.carry,
          'sans',
          'left',
        ).opacity(hm * alpha),
        txt(
          'Always inspect actual layer types & buffers when budgeting a hybrid stack',
          -855,
          330,
          28,
          ROLE.delta,
          'sans',
          'left',
        ).opacity(hm * alpha),
      );
    }
    return group(...nodes);
  });

  s.add(bgAura, title, view1, view2);
  playCue(s, c, 'ssm-timing-input', (d) => s.play(show256Prompt.to(1, { duration: d })), {
    dur: 0.45,
  });
  // Strictly withhold 256-token totals until AFTER `ssm-timing256`!
  playCue(s, c, 'ssm-timing256', (d) => s.play(reveal256.to(1, { duration: d })), {
    after: true,
    dur: 0.5,
  });
  playCue(s, c, 'ssm-timing-crossing', (d) => s.play(showCrossing.to(1, { duration: d })), {
    after: true,
    dur: 0.45,
  });

  playCue(s, c, 'earned-transfer-extension-4', (d) => s.play(swapVis(view1Vis, view2Vis, d)), {
    dur: 0.6,
  });
  playCue(s, c, 'jamba-mixers', (d) => s.play(showHybridModels.to(1, { duration: d })), {
    dur: 0.5,
  });
  bindCueBeat(s, c, s.value(0), [
    'earned-transfer-b1',
    'ssm-timing16',
    'earned-transfer-b2',
    'ssm-hybrid-cache',
    'ssm-hybrid-models',
  ]);
}
