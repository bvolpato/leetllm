// Scene 17: Locate the learned state before naming the method: Soft Prompt vs Prefix Tuning vs LoRA injection sites.
import {
  COSMOS,
  arrow,
  aura,
  glassCell,
  glowDot,
  group,
  guardedDynamic,
  heroTitle,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function promptPrefix(s, c) {
  const phase = s.value(0);
  const hlPrompt = s.value(0);
  const showPromptVecs = s.value(0);
  const hlPrefix = s.value(0);
  const showPrefixKV = s.value(0);
  const showLoraSite = s.value(0);
  const showCheckpoint = s.value(0);

  const bgAura = aura(0, 20, 640, '#a78bfa1e', '#ffd16618');
  const title = heroTitle(['Locate the', 'Learned State'], {
    x: -855,
    y: -420,
    size: 56,
    lineHeight: 66,
    accent: COSMOS.violet,
    eyebrow: 'PEFT FAMILIES · PLACEMENT MATTERS',
  });

  const live = guardedDynamic(1, () => {
    const p = phase.value;
    const hp = Math.max(hlPrompt.value, showPromptVecs.value);
    const hpf = Math.max(hlPrefix.value, showPrefixKV.value);
    const hlo = showLoraSite.value;
    const sc = showCheckpoint.value;
    const pulse = 0.72 + 0.28 * Math.sin(p * 3.6);

    const cols = [-560, 0, 560];
    const nodes = [
      // Column 1: Soft Prompt Tuning (virtual input tokens)
      glassCell(cols[0], 25, 515, 490, hp > 0.2 ? COSMOS.violet : '#334268', {
        fill: '#16142e',
        glow: hp > 0.2 ? 10 * pulse : 3,
      }),
      txt('1. SOFT PROMPT TUNING', cols[0], -180, 26, COSMOS.violet, 'mono'),
      glassCell(cols[0] - 115, -75, 190, 74, COSMOS.violet, {
        fill: '#2a1d4a',
        glow: hp > 0.2 ? 9 : 2,
      }),
      txt('[v₁] [v₂]', cols[0] - 115, -75, 28, COSMOS.violet, 'mono'),
      glassCell(cols[0] + 105, -75, 205, 74, COSMOS.blue, { fill: '#12203d', glow: 3 }),
      txt('ticket tokens', cols[0] + 105, -75, 26, COSMOS.ink, 'sans'),
      arrow([cols[0], -28], [cols[0], 34], { stroke: COSMOS.violet, width: 3.5, tip: 11 }),
      glassCell(cols[0], 98, 420, 108, COSMOS.blue, { fill: '#101b35', glow: 4 }),
      txt('FROZEN LAYERS 1..L', cols[0], 82, 26, COSMOS.blue, 'mono'),
      txt('all projections fixed', cols[0], 118, 26, COSMOS.muted, 'sans'),
      txt(
        sc > 0.2 ? 'Saves: virtual input vectors' : 'Virtual tokens eat context',
        cols[0],
        215,
        26,
        COSMOS.violet,
        'sans',
      ),

      // Column 2: Prefix Tuning (per-layer K, V state)
      glassCell(cols[1], 25, 515, 490, hpf > 0.2 ? COSMOS.cyan : '#334268', {
        fill: '#101d30',
        glow: hpf > 0.2 ? 10 * pulse : 3,
      }),
      txt('2. PREFIX TUNING', cols[1], -180, 26, COSMOS.cyan, 'mono'),
      glassCell(cols[1] - 115, -40, 185, 86, COSMOS.cyan, {
        fill: '#102f3d',
        glow: hpf > 0.2 ? 9 : 2,
      }),
      txt('K/V L1', cols[1] - 115, -40, 26, COSMOS.cyan, 'mono'),
      glassCell(cols[1] + 100, -40, 205, 86, COSMOS.blue, { fill: '#12203d', glow: 4 }),
      txt('Attn Layer 1', cols[1] + 100, -40, 26, COSMOS.ink, 'mono'),
      glassCell(cols[1] - 115, 86, 185, 86, COSMOS.cyan, {
        fill: '#102f3d',
        glow: hpf > 0.2 ? 9 : 2,
      }),
      txt('K/V L2', cols[1] - 115, 86, 26, COSMOS.cyan, 'mono'),
      glassCell(cols[1] + 100, 86, 205, 86, COSMOS.blue, { fill: '#12203d', glow: 4 }),
      txt('Attn Layer 2', cols[1] + 100, 86, 26, COSMOS.ink, 'mono'),
      txt(
        sc > 0.2 ? 'Saves: per-layer K/V state' : 'Extra K/V prepended per layer',
        cols[1],
        215,
        26,
        COSMOS.cyan,
        'sans',
      ),

      // Column 3: LoRA (parallel B·A inside weights)
      glassCell(cols[2], 25, 515, 490, hlo > 0.2 ? COSMOS.gold : '#334268', {
        fill: '#1e1911',
        glow: hlo > 0.2 ? 11 * pulse : 3,
      }),
      txt('3. LORA ADAPTERS', cols[2], -180, 26, COSMOS.gold, 'mono'),
      glassCell(cols[2] - 105, 18, 210, 178, COSMOS.blue, { fill: '#12203d', glow: 5 }),
      txt('FROZEN', cols[2] - 105, -14, 26, COSMOS.blue, 'mono'),
      txt('W_0', cols[2] - 105, 34, 42, COSMOS.blue, 'mono'),
      glassCell(cols[2] + 115, -34, 170, 74, COSMOS.gold, {
        fill: '#2c2210',
        glow: hlo > 0.2 ? 10 : 3,
      }),
      txt('A', cols[2] + 115, -34, 34, COSMOS.gold, 'mono'),
      glassCell(cols[2] + 115, 72, 170, 74, COSMOS.emerald, {
        fill: '#0f2729',
        glow: hlo > 0.2 ? 10 : 3,
      }),
      txt('B', cols[2] + 115, 72, 34, COSMOS.emerald, 'mono'),
      arrow([cols[2] + 115, 6], [cols[2] + 115, 32], { stroke: COSMOS.gold, width: 3.5, tip: 10 }),
      txt(
        sc > 0.2 ? 'Saves: projection A, B factors' : 'Adds directly to projection',
        cols[2],
        215,
        26,
        COSMOS.gold,
        'sans',
      ),

      // Bottom comparison strip
      glassCell(0, 368, 1660, 114, sc > 0.2 ? COSMOS.emerald : COSMOS.muted, {
        fill: '#10182d',
        glow: sc > 0.2 ? 9 : 3,
      }),
      glowDot(-780, 368, { radius: 6, color: sc > 0.2 ? COSMOS.emerald : COSMOS.gold }),
      txt(
        sc > 0.2
          ? 'Open the checkpoint: placement changes context budget, serving cost, and mergeability'
          : 'Same ticket tokens · same frozen base · three different trainable locations',
        0,
        368,
        28,
        sc > 0.2 ? COSMOS.emerald : COSMOS.ink,
        'sans',
      ),
    ];
    return group(...nodes);
  });

  s.add(bgAura, title, live);
  runPhase(s, c, phase, 14);

  c.on('prompt-prefix-1', () => s.play(hlPrompt.to(1, { duration: 0.4 })));
  c.on('prompt-vectors', () => s.play(showPromptVecs.to(1, { duration: 0.45 })));
  c.on('prompt-prefix-2', () => s.play(hlPrefix.to(1, { duration: 0.4 })));
  c.on('prefix-layer-state', () => s.play(showPrefixKV.to(1, { duration: 0.45 })));
  c.on('prefix-lora-placement', () => s.play(showLoraSite.to(1, { duration: 0.45 })));
  c.on('prompt-prefix-3', () =>
    s.play(showCheckpoint.to(1, { duration: remainDuration(c, 'prompt-prefix-3', 0.45) })),
  );
}
