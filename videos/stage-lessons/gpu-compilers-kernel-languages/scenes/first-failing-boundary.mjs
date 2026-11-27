// Scene 19: Where did the store stop? Finale: failure-boundary ladder (API -> Frontend -> ptxas -> Loader -> Runtime) + fresh 768->769 (block 128) transfer test!
import {
  COSMOS,
  ROLE,
  TAIL_769,
  aura,
  glassCell,
  group,
  guardedDynamic,
  heroTitle,
  remainDuration,
  txt,
} from '../parts.mjs';

export default function firstFailingBoundary(s, c) {
  // boundaryStep: 0=api, 1=frontend, 2=assembler, 3=loader, 4=runtime
  const boundaryStep = s.value(0);
  // freshStage: 0=hidden, 1=768 full, 2=769 new block @ 768 (HOLD prediction!), 3=769 OOB leak, 4=768 legal + 7 blocks(896), 5=strict < fix (127 masked), 6=verified
  const freshStage = s.value(0);

  const bgAura = aura(0, 20, 640, '#6ee7b71e', '#ffd16618');
  const title = heroTitle(['Where Did the', 'Store Stop?'], {
    x: -855,
    y: -415,
    size: 56,
    lineHeight: 66,
    accent: ROLE.cubin,
    eyebrow: 'FINALE · FAILURE BOUNDARIES & 769 TRANSFER',
  });

  const live = guardedDynamic(1, () => {
    const bs = Math.round(boundaryStep.value);
    const fs = Math.round(freshStage.value);

    const nodes = [];

    // Top horizontal failure-boundary triage chain (5 crisp stages)
    const stages = [
      { id: '1. API / JAX', note: 'match versions', x: -680, col: ROLE.triton },
      { id: '2. Frontend', note: 'min repro + log', x: -340, col: ROLE.host },
      { id: '3. ptxas', note: 'PTX hdr + ver', x: 0, col: ROLE.ptx },
      { id: '4. Loader', note: 'fatbin vs GPU', x: 340, col: ROLE.warn },
      { id: '5. Runtime', note: 'cubin + profile', x: 680, col: ROLE.cubin },
    ];
    stages.forEach((st, i) => {
      const active = bs === i;
      const done = bs > i;
      nodes.push(
        glassCell(st.x, -175, 290, 108, active ? st.col : done ? ROLE.ir : COSMOS.dim, {
          fill: active ? '#152238' : '#0b101d',
          glow: active ? 10 : 0,
        }),
        txt(st.id, st.x, -200, 26, active ? st.col : COSMOS.muted, 'mono'),
        txt(st.note, st.x, -150, 26, active ? COSMOS.ink : COSMOS.dim, 'sans'),
      );
    });

    // Bottom: Fresh 768 -> 769 transfer test (block = 128, strict prediction withholding!)
    const is769 = fs >= 2;
    const slots = [766, 767, 768, 769, 770];
    nodes.push(
      txt(
        fs === 0
          ? 'NEXT: FRESH 128-THREAD BLOCK GUARD TEST'
          : fs >= 5
            ? `REPAIRED: i < 769 · ${TAIL_769.blocks} blocks (${TAIL_769.positions} lanes) · ${TAIL_769.masked} masked`
            : is769
              ? 'FRESH TRANSFER: n = 769, block = 128, guard i <= n'
              : 'FULL SHAPE: n = 768 (6 blocks × 128), guard i <= n',
        0,
        -50,
        28,
        fs >= 5 ? ROLE.cubin : fs === 3 ? ROLE.fail : COSMOS.gold,
        'mono',
      ),
    );

    slots.forEach((idx, i) => {
      const cx = -560 + i * 280;
      const valid = is769 ? idx < 769 : idx < 768;
      const inGrid = is769 ? true : idx < 768;
      const isBad769 = fs >= 3 && fs < 5 && idx === 769;
      const isMasked = fs >= 5 && idx >= 769;
      const stroke =
        fs === 0
          ? COSMOS.dim
          : isBad769
            ? ROLE.fail
            : isMasked
              ? COSMOS.dim
              : valid
                ? ROLE.cubin
                : !inGrid
                  ? COSMOS.dim
                  : COSMOS.gold;

      const label =
        fs === 0
          ? 'ready'
          : !inGrid
            ? 'no lane'
            : valid
              ? idx === 768 && fs >= 4
                ? 'legal write'
                : 'valid'
              : fs === 2
                ? '?'
                : isBad769
                  ? 'OOB LEAK!'
                  : 'masked';

      nodes.push(
        glassCell(cx, 78, 236, 124, stroke, {
          fill: isBad769 ? '#31101d' : valid && fs > 0 ? '#0d2623' : '#0b101d',
          dash: !inGrid || isMasked ? [8, 6] : undefined,
          glow: isBad769 ? 13 : valid && fs > 0 ? 6 : 0,
        }),
        txt(`idx ${idx}`, cx, 50, 32, stroke, 'mono'),
        txt(
          label,
          cx,
          102,
          26,
          isBad769 ? ROLE.fail : valid && fs > 0 ? ROLE.cubin : COSMOS.gold,
          'mono',
        ),
      );
    });

    // Bottom verdict (strictly withhold 769 until fresh-illegal!)
    const foot =
      fs === 0
        ? 'Diagnose at the exact failing boundary before tuning'
        : fs === 1
          ? 'n = 768 ends at 767 · inclusive guard passes silently'
          : fs === 2
            ? 'Block 6 starts at 768: which index leaks outside n = 769?'
            : fs === 3
              ? 'INDEX 769 LEAKS PAST OUTPUT (769 <= 769)!'
              : fs === 4
                ? 'Slot 768 legal · 7 blocks = 896 lane positions'
                : fs === 5
                  ? 'Strict i < n: 1 valid lane + 127 masked in block 6'
                  : 'Verified 0..768 + GPU memcheck · Next: GEMM tiling!';
    const footCol = fs === 3 ? ROLE.fail : fs >= 5 ? ROLE.cubin : fs === 2 ? COSMOS.gold : ROLE.ir;
    nodes.push(txt(foot, 0, 278, 32, footCol, 'mono').glow(6, footCol));

    return group(...nodes);
  });

  s.add(bgAura, title, live);

  c.on('api-rejection', () => s.play(boundaryStep.to(0, { duration: 0.3 })));
  c.on('frontend-stop', () => s.play(boundaryStep.to(1, { duration: 0.3 })));
  c.on('assembler-stop', () => s.play(boundaryStep.to(2, { duration: 0.3 })));
  c.on('loader-stop', () => s.play(boundaryStep.to(3, { duration: 0.3 })));
  c.on('runtime-stop', () => s.play(boundaryStep.to(4, { duration: 0.3 })));
  c.on('fresh-premises', () => s.play(freshStage.to(1, { duration: 0.35 })));
  c.on('fresh-full', () => s.play(freshStage.to(1, { duration: 0.3 })));
  c.on('fresh-change', () => s.play(freshStage.to(2, { duration: 0.35 })));
  c.on('fresh-start', () => s.play(freshStage.to(2, { duration: 0.3 })));
  c.on('fresh-question', () => s.play(freshStage.to(2, { duration: 0.3 })));
  c.after('fresh-illegal', () => s.play(freshStage.to(3, { duration: 0.4 })));
  c.on('fresh-store', () => s.play(freshStage.to(4, { duration: 0.35 })));
  c.after('fresh-seven', () => s.play(freshStage.to(4, { duration: 0.35 })));
  c.on('fresh-repair', () => s.play(freshStage.to(5, { duration: 0.4 })));
  c.after('fresh-tail-complete', () => s.play(freshStage.to(5, { duration: 0.35 })));
  c.on('check-all', () => s.play(freshStage.to(6, { duration: 0.35 })));
  c.on('gpu-test', () => s.play(freshStage.to(6, { duration: 0.35 })));
}
