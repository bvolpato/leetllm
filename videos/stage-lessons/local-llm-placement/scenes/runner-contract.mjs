// Scene 16: runner-contract: GGUF/GGML native binary, KV cache types (no generic fp8), Ollama Modelfile/HTTP/auth & MLX-LM.
import {
  COSMOS,
  ROLE,
  aura,
  bindCueBeat,
  chipPill,
  group,
  guardedDynamic,
  heroTitle,
  playCue,
  txt,
} from '../parts.mjs';

export default function runnerContract(s, c) {
  const showCacheTypes = s.value(0);
  const showOllama = s.value(0);
  const accent = s.value(0);

  const bgAura = aura(0, 0, 740, '#14335c28', '#20184422');
  const title = heroTitle(['Local Runner Contracts:', 'GGUF, Cache Types & APIs'], {
    x: -855,
    y: -430,
    size: 50,
    lineHeight: 58,
    accent: ROLE.vram,
  });

  const stageVis = s.value(1);
  const layer = guardedDynamic(stageVis, (alpha) => {
    const ct = showCacheTypes.value;
    const ol = showOllama.value;

    const nodes = [
      txt('1. ARTIFACT & EXECUTOR', -855, -220, 26, ROLE.vram, 'mono', 'left').opacity(alpha),
      chipPill(
        'GGUF shards + metadata -> GGML / llama.cpp binary (mmap sets addresses, faults load pages)',
        0,
        -135,
        {
          w: 1620,
          h: 72,
          color: ROLE.vram,
          size: 26,
          opacity: alpha,
        },
      ),

      txt(
        '2. WEIGHT TYPE vs KV CACHE TYPE (SEPARATE OPTIONS!)',
        -855,
        -20,
        26,
        ROLE.gold,
        'mono',
        'left',
      ).opacity(alpha * (0.45 + 0.55 * ct)),
      chipPill('KV types: f16, bf16, q8_0, q4_0... (NO generic fp8!)', -380, 65, {
        w: 880,
        h: 72,
        color: ct > 0.3 ? ROLE.gold : COSMOS.rule,
        size: 26,
        opacity: alpha * (0.45 + 0.55 * ct),
      }),
      chipPill('Re-run quality checks after KV quant', 475, 65, {
        w: 710,
        h: 72,
        color: ct > 0.3 ? ROLE.work : COSMOS.rule,
        size: 26,
        opacity: alpha * (0.45 + 0.55 * ct),
      }),

      txt('3. SERVER & APPLE SILICON RUNTIME', -855, 180, 26, ROLE.ok, 'mono', 'left').opacity(
        alpha * (0.45 + 0.55 * ol),
      ),
      chipPill('Ollama HTTP / Modelfile: auth at gateway (dummy key != auth)', -335, 265, {
        w: 980,
        h: 72,
        color: ol > 0.3 ? ROLE.ok : COSMOS.rule,
        size: 26,
        opacity: alpha * (0.45 + 0.55 * ol),
      }),
      chipPill('Apple: MLX arrays + mlx-lm', 505, 265, {
        w: 630,
        h: 72,
        color: ol > 0.3 ? ROLE.kv : COSMOS.rule,
        size: 26,
        opacity: alpha * (0.45 + 0.55 * ol),
      }),
    ];

    return group(...nodes);
  });

  s.add(bgAura, title, layer);
  playCue(s, c, 'pl-runner-contract-1-0', (d) => s.play(showCacheTypes.to(1, { duration: d })));
  playCue(s, c, 'pl-runner-contract-2-0', (d) => s.play(showOllama.to(1, { duration: d })));
  bindCueBeat(s, c, accent, [
    'pl-runner-contract-0-0',
    'pl-runner-contract-0-1',
    'pl-runner-contract-0-2',
    'pl-runner-contract-1-1',
    'pl-runner-contract-1-2',
    'pl-runner-contract-1-3',
    'pl-runner-contract-2-1',
    'pl-runner-contract-2-2',
    'pl-runner-contract-2-3',
    'pl-runner-contract-2-4',
  ]);
}
