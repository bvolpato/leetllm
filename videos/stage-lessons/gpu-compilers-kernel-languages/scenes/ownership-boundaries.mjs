// Scene 17: What does a full block test miss? Inclusive guard <= n at n=256 (passes) -> n=257 (leaks 257!), strict < fix, NaN poison, INT32 overflow.
import {
  COSMOS,
  INT32_MAX,
  ROLE,
  TAIL_257,
  WIDE_BLOCKS,
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

export default function ownershipBoundaries(s, c) {
  const phase = s.value(0);
  // tailStage: 0=256 full, 1=256 pass, 2=257 predict!, 3=257 leak, 4=strict < fix, 5=257 valid + 255 masked
  const tailStage = s.value(0);
  const poison = s.value(0);
  const missed = s.value(0);
  const wrapper = s.value(0);
  const wide = s.value(0);
  const wideCeil = s.value(0);

  const bgAura = aura(0, 20, 640, '#ff6b8b1c', '#6ee7b716');
  const title = heroTitle(['What Does a Full-Block', 'Test Miss?'], {
    x: -855,
    y: -415,
    size: 54,
    lineHeight: 64,
    accent: ROLE.fail,
    eyebrow: 'EDGE GUARDS · <= vs < · INT32 CEILING',
  });

  const live = guardedDynamic(1, () => {
    const p = phase.value;
    const st = Math.round(tailStage.value);
    const ps = poison.value;
    const ms = missed.value;
    const wr = wrapper.value;
    const wi = wide.value;
    const wc = wideCeil.value;
    const pulse = 0.72 + 0.28 * Math.sin(p * 3.8);

    const is257 = st >= 2;
    const isStrict = st >= 4;
    const slots = [254, 255, 256, 257, 258];

    const nodes = [
      txt(
        isStrict
          ? 'GUARD: i < n  (n = 257, block = 256)'
          : is257
            ? 'GUARD: i <= n  (n = 257, 2 blocks)'
            : 'GUARD: i <= n  (n = 256, 1 full block)',
        0,
        -210,
        28,
        isStrict ? ROLE.cubin : is257 ? ROLE.warn : ROLE.ir,
        'mono',
      ),
    ];

    slots.forEach((idx, i) => {
      const cx = -560 + i * 280;
      const exists = is257 ? idx < 257 : idx < 256;
      const inGrid = is257 ? true : idx < 256;
      const isBad257 = st === 3 && idx === 257;
      const isMasked = st >= 4 && idx >= 257;
      const stroke = isBad257
        ? ROLE.fail
        : isMasked
          ? COSMOS.dim
          : exists
            ? ROLE.cubin
            : !inGrid
              ? COSMOS.dim
              : COSMOS.gold;

      const tag = !inGrid
        ? 'no thread'
        : exists
          ? 'valid'
          : st === 2
            ? '?'
            : isBad257
              ? 'OOB LEAK!'
              : 'masked';

      nodes.push(
        glassCell(cx, -100, 236, 118, stroke, {
          fill: isBad257 ? '#31101d' : exists ? '#0d2623' : '#0c1120',
          dash: !inGrid || isMasked ? [8, 6] : undefined,
          glow: isBad257 ? 13 * pulse : exists ? 6 : 0,
        }),
        txt(`idx ${idx}`, cx, -126, 30, stroke, 'mono'),
        txt(tag, cx, -76, 26, isBad257 ? ROLE.fail : exists ? ROLE.cubin : COSMOS.gold, 'mono'),
      );
    });

    // Mid verdict banner (strictly withhold 257 until bad-inclusive cue!)
    const midMsg =
      st === 0
        ? '1 block ends at 255 · never tests i == 256'
        : st === 1
          ? 'n = 256 passes every address (bug hidden!)'
          : st === 2
            ? 'n = 257 launches block 1 at 256: which OOB index slips through?'
            : st === 3
              ? 'INDEX 257 SLIPS THROUGH (257 <= 257 is true!)'
              : st === 4
                ? 'Fix: i < n on BOTH loads and store'
                : `${TAIL_257.valid} valid + ${TAIL_257.masked} masked · every index exact once`;
    const midCol = st === 3 ? ROLE.fail : st >= 4 ? ROLE.cubin : st === 2 ? COSMOS.gold : ROLE.ir;
    nodes.push(txt(midMsg, 0, 28, 30, midCol, 'mono').glow(6, midCol));

    // Lower left: NaN output poisoning + Triton wrapper checks
    nodes.push(
      glassCell(-425, 195, 780, 178, ps > 0.5 ? ROLE.ir : COSMOS.dim, {
        fill: '#0e1b30',
        glow: ps > 0.5 ? 8 : 2,
      }),
      txt('GPU VERIFICATION GUARDS', -425, 138, 26, ROLE.ir, 'mono'),
      txt(
        ms > 0.5
          ? 'Pre-fill out with NaN → skipped store leaves NaN'
          : 'Distinct finite inputs vs reference',
        -425,
        192,
        26,
        ms > 0.5 ? ROLE.fail : COSMOS.ink,
        'mono',
      ),
      txt(
        wr > 0.5
          ? 'Wrapper checks device, shape, dtype, grad, strides'
          : 'Require every output finite & matched',
        -425,
        242,
        26,
        wr > 0.5 ? ROLE.cubin : COSMOS.muted,
        'sans',
      ),
    );

    // Lower right: INT32_MAX overflow-safe grid ceiling
    nodes.push(
      glassCell(435, 195, 760, 178, wi > 0.5 ? ROLE.warn : COSMOS.dim, {
        fill: '#201720',
        glow: wi > 0.5 ? 8 : 2,
      }),
      txt(
        'WIDE INDEX & OVERFLOW-SAFE CEILING',
        435,
        138,
        26,
        wi > 0.5 ? ROLE.warn : COSMOS.muted,
        'mono',
      ),
      txt(
        wi > 0.5
          ? `(n + 255) overflows int32 at ${INT32_MAX}`
          : 'Divide first: n / 256 + (n % 256 != 0)',
        435,
        192,
        26,
        wi > 0.5 ? ROLE.fail : COSMOS.ink,
        'mono',
      ),
      txt(
        wc > 0.5
          ? `${WIDE_BLOCKS.toLocaleString()} blocks · i64 idx · 1 masked`
          : 'Avoids signed 32-bit overflow before division',
        435,
        242,
        26,
        wc > 0.5 ? ROLE.cubin : COSMOS.muted,
        'mono',
      ),
    );

    const u = (p * 0.65) % 1;
    nodes.push(glowDot(-780 + u * 1560, 342, { radius: 6, color: midCol }));

    return group(...nodes);
  });

  s.add(bgAura, title, live);
  runPhase(s, c, phase, 14);

  c.on('full-shape', () => s.play(tailStage.to(0, { duration: 0.3 })));
  c.after('full-pass', () => s.play(tailStage.to(1, { duration: 0.35 })));
  c.on('tail-257', () => s.play(tailStage.to(2, { duration: 0.4 })));
  c.on('second-block', () => s.play(tailStage.to(2, { duration: 0.35 })));
  c.after('bad-inclusive', () => s.play(tailStage.to(3, { duration: 0.4 })));
  c.on('fix-guard', () => s.play(tailStage.to(4, { duration: 0.4 })));
  c.after('fixed-counts', () => s.play(tailStage.to(5, { duration: 0.4 })));
  c.on('poison-write', () => s.play(poison.to(1, { duration: 0.4 })));
  c.on('missed-store', () => s.play(missed.to(1, { duration: 0.4 })));
  c.on('wrapper-guards', () => s.play(wrapper.to(1, { duration: 0.4 })));
  c.on('wide-overflow', () => s.play(wide.to(1, { duration: 0.4 })));
  c.on('wide-ceiling', () => s.play(wideCeil.to(1, { duration: 0.4 })));
}
