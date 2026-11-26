// Scene 30: diagnose: 3-branch triage (Quality drop -> check artifact/template; Decode slow -> check placement & kernel trace; Prefill slow -> compute vs attention vs queue).
import {
  COSMOS,
  ROLE,
  aura,
  chipPill,
  group,
  guardedDynamic,
  heroTitle,
  playCue,
  rect,
  txt,
} from '../parts.mjs';

export default function diagnose(s, c) {
  const step = s.value(0); // 0=quality, 1=decode, 2=prefill

  const bgAura = aura(0, 0, 740, '#14335c28', '#20184422');
  const title = heroTitle(['Production Triage:', 'Diagnosing Quality, Decode & Prefill Issues'], {
    x: -855,
    y: -430,
    size: 46,
    lineHeight: 54,
    accent: ROLE.gold,
  });

  const stageVis = s.value(1);
  const layer = guardedDynamic(stageVis, (alpha) => {
    const st = step.value;

    const nodes = [
      txt(
        'ISOLATE THE EXACT FAILURE MODE BEFORE BLAMING QUANTIZATION BITS',
        -855,
        -220,
        26,
        ROLE.grid,
        'mono',
        'left',
      ).opacity(alpha),

      rect(520, 265, {
        fill: st < 0.7 ? '#321420' : '#10182d',
        stroke: st < 0.7 ? ROLE.err : ROLE.weight,
        width: 2.8,
        radius: 14,
      })
        .at(-585, -15)
        .opacity(alpha),
      txt('1. QUALITY REGRESSION', -585, -108, 26, ROLE.err, 'mono', 'center').opacity(alpha),
      txt('Reload exact saved file', -585, -48, 26, COSMOS.ink, 'sans', 'center').opacity(alpha),
      txt('Match tokenizer & template', -585, 6, 26, ROLE.gold, 'sans', 'center').opacity(alpha),
      txt('Match decoding constraints', -585, 60, 26, COSMOS.muted, 'sans', 'center').opacity(
        alpha,
      ),

      rect(520, 265, {
        fill: st >= 0.7 && st < 1.7 ? '#261e10' : '#10182d',
        stroke: st >= 0.7 && st < 1.7 ? ROLE.gold : ROLE.grid,
        width: 2.8,
        radius: 14,
      })
        .at(0, -15)
        .opacity(alpha * (0.5 + 0.5 * Math.min(1, st))),
      txt('2. SLOW DECODE', 0, -108, 26, ROLE.gold, 'mono', 'center').opacity(alpha),
      txt('Check GPU vs CPU placement', 0, -48, 26, COSMOS.ink, 'sans', 'center').opacity(alpha),
      txt('Inspect kernel trace', 0, 6, 26, ROLE.gold, 'sans', 'center').opacity(alpha),
      txt('Catch unfused FP16 dequant!', 0, 60, 26, ROLE.err, 'sans', 'center').opacity(alpha),

      rect(520, 265, {
        fill: st >= 1.7 ? '#0f2d24' : '#10182d',
        stroke: st >= 1.7 ? ROLE.ok : ROLE.grid,
        width: 2.8,
        radius: 14,
      })
        .at(585, -15)
        .opacity(alpha * (0.5 + 0.5 * Math.min(1, st / 2))),
      txt('3. SLOW PREFILL / TTFT', 585, -108, 26, ROLE.ok, 'mono', 'center').opacity(alpha),
      txt('Separate compute vs queue', 585, -48, 26, COSMOS.ink, 'sans', 'center').opacity(alpha),
      txt('Try W8A8 / FP8 if compute', 585, 6, 26, ROLE.ok, 'sans', 'center').opacity(alpha),
      txt('Fix scheduling if queue-bound', 585, 60, 26, COSMOS.muted, 'sans', 'center').opacity(
        alpha,
      ),

      chipPill(
        st >= 1.7
          ? 'If queueing dominates TTFT, precision will not help; tune batching & scheduling!'
          : st >= 0.7
            ? 'Trace unpack time, KV reads & queue wait: a fallback unfused kernel erases all 4-bit bandwidth gains'
            : 'Template or decoding drift causes many false quantization failures; verify artifact & harness first',
        0,
        245,
        {
          w: 1620,
          h: 76,
          color: st >= 1.7 ? ROLE.ok : st >= 0.7 ? ROLE.gold : ROLE.err,
          size: 26,
          opacity: alpha,
        },
      ),
    ];

    return group(...nodes);
  });

  s.add(bgAura, title, layer);
  playCue(s, c, 'diagnose-build-0', (d) => s.play(step.to(0, { duration: d })));
  playCue(s, c, 'diagnose-build-1', (d) => s.play(step.to(1, { duration: d })));
  playCue(s, c, 'diagnose-build-2', (d) => s.play(step.to(2, { duration: d })));
}
