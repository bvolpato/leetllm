// Scene 03: decode: Sequential token feedback loop -> 4 prompt + 3 consumed = 7 cached rows; final "." stays uncached!
import {
  COSMOS,
  ROLE,
  aura,
  bindCueBeat,
  chipPill,
  glowTex,
  group,
  guardedDynamic,
  heroTitle,
  outputs,
  playCue,
  prompt,
  txt,
} from '../parts.mjs';

export default function decode(s, c) {
  const consumedCount = s.value(0); // 0 -> 1 (at) -> 2 (dawn) -> 3 (too)
  const emittedCount = s.value(1); // 1 (at) -> 2 (dawn) -> 3 (too) -> 4 (.)

  const bgAura = aura(0, 0, 740, '#103c3628', '#16355e18');
  const title = heroTitle(['Autoregressive Decode:', 'what enters the cache?'], {
    x: -855,
    y: -430,
    size: 52,
    lineHeight: 60,
    accent: ROLE.decode,
  });

  const formula = glowTex(String.raw`\text{Cached} = L_{\text{prompt}} + L_{\text{out}} - 1`, {
    x: 470,
    y: -380,
    size: 36,
    color: ROLE.wait,
    glow: 6,
  });

  const stageVis = s.value(1);
  const layer = guardedDynamic(stageVis, (alpha) => {
    const cons = Math.round(consumedCount.value);
    const emit = Math.round(emittedCount.value);
    const totalCached = prompt.length + cons; // 4 -> 5 -> 6 -> 7
    const nodes = [
      txt(`EMITTED OUTPUTS (${emit} / 4)`, -855, -215, 26, ROLE.wait, 'mono', 'left').opacity(
        alpha,
      ),
    ];

    // Top emitted token strip
    outputs.forEach((tok, idx) => {
      const visible = idx < emit;
      const isConsumed = idx < cons;
      const col = !visible ? COSMOS.rule : isConsumed ? ROLE.clockA : ROLE.wait;
      nodes.push(
        chipPill(visible ? `"${tok}"` : '...', -705 + idx * 250, -130, {
          w: 210,
          h: 74,
          color: col,
          size: 34,
          glow: visible ? 10 : 0,
          opacity: (visible ? 1 : 0.25) * alpha,
        }),
      );
    });

    // Bottom KV cache slots (8 slots: 0..3 prompt, 4..6 consumed outputs, slot 7 empty!)
    nodes.push(
      txt(
        `KV CACHE SLOTS (${totalCached} FILLED · SLOT 7 EMPTY FOR ".")`,
        -855,
        25,
        26,
        ROLE.clockA,
        'mono',
        'left',
      ).opacity(alpha),
    );
    const allTokens = [...prompt, ...outputs];
    allTokens.forEach((tok, idx) => {
      const filled = idx < totalCached;
      const isPrompt = idx < 4;
      const x = -760 + idx * 214;
      const col = !filled ? COSMOS.rule : isPrompt ? ROLE.prefill : ROLE.decode;
      nodes.push(
        chipPill(filled ? tok : 'empty', x, 125, {
          w: 194,
          h: 78,
          color: col,
          size: 28,
          glow: filled ? 8 : 0,
          opacity: (filled ? 1 : 0.35) * alpha,
        }),
        txt(`pos ${idx}`, x, 195, 26, filled ? col : COSMOS.dim, 'mono', 'center').opacity(alpha),
      );
    });

    nodes.push(
      txt(
        `4 prompt + ${cons} consumed = ${totalCached} cached KV rows  (final "${outputs[emit - 1]}" is outside)`,
        -855,
        325,
        30,
        totalCached === 7 ? ROLE.decode : ROLE.clockA,
        'mono',
        'left',
      )
        .glow(6, totalCached === 7 ? ROLE.decode : ROLE.clockA)
        .opacity(alpha),
    );
    return group(...nodes);
  });

  s.add(bgAura, title, formula, layer);
  playCue(s, c, 'take-at', (d) => s.play(consumedCount.to(1, { duration: d })), { dur: 0.45 });
  playCue(s, c, 'emit-dawn', (d) => s.play(emittedCount.to(2, { duration: d })), {
    after: true,
    dur: 0.4,
  });
  playCue(s, c, 'take-dawn', (d) => s.play(consumedCount.to(2, { duration: d })), { dur: 0.45 });
  playCue(s, c, 'emit-too', (d) => s.play(emittedCount.to(3, { duration: d })), {
    after: true,
    dur: 0.4,
  });
  playCue(s, c, 'take-too', (d) => s.play(consumedCount.to(3, { duration: d })), { dur: 0.45 });
  playCue(s, c, 'emit-period', (d) => s.play(emittedCount.to(4, { duration: d })), {
    after: true,
    dur: 0.4,
  });
  bindCueBeat(s, c, s.value(0), ['seven-cached']);
}
