// Scene 08: Compute the block-rounded hit and remaining logits work (floor(min(shared, L-1)/4)*4: 6->4/5, 7->4/5, 8->8/1, APC 6-slot step, then L=8 shared=8 -> cap 7 -> skip 4, recompute last block for logits!).
import {
  COSMOS,
  ROLE,
  aura,
  glassCell,
  glowTex,
  group,
  guardedDynamic,
  heroTitle,
  reuse,
  txt,
  wireStepCues,
} from '../parts.mjs';

export default function prefixLimit(s, c) {
  // step:
  // 0 = op-0 formula rule
  // 1 = op-1 / match-six (shared=6, L=9 -> skip 4, compute 5)
  // 2 = match-seven (shared=7, L=9 -> skip 4, compute 5)
  // 3 = match-eight (shared=8, L=9 -> skip 8, compute 1)
  // 4 = apc-step / apc-input (APC in 6-slot step: 1 R0 decode + 5 R1 prompt = 6)
  // 5 = op-2 / prompt-eight (L=8, shared=8 -> cap 7 -> skip 4, compute 4 for logits!)
  const step = s.value(0);
  const apcPulse = s.value(0);

  const bgAura = aura(0, 20, 620, '#6ee7b71a', '#5ce1e61a');
  const title = heroTitle(['Block-Rounded Hits &', 'The Final Logits Guard'], {
    x: -855,
    y: -430,
    size: 54,
    lineHeight: 62,
    accent: ROLE.kv,
    eyebrow: 'APC FORMULA · SKIP = FLOOR(MIN(SHARED, L - 1) / B) × B',
  });

  const live = guardedDynamic(1, () => {
    const st = Math.round(step.value);
    const isApcStep = st === 4;
    const isLen8 = st >= 5;
    const length = isLen8 ? 8 : 9;
    const shared = isLen8 ? 8 : st === 3 ? 8 : st === 2 ? 7 : 6;
    const skipped = reuse(shared, length, 4);
    const compute = length - skipped;
    const newBlocks = Math.ceil(compute / 4);

    const cache = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
    const prompt = isLen8
      ? cache
      : ['A', 'B', 'C', 'D', 'E', 'F', shared >= 7 ? 'G' : 'X', shared >= 8 ? 'H' : 'Y', 'Z'];

    const nodes = [
      txt('CACHED BLOCKS (ADAPTER A · BLOCK SIZE 4)', -855, -255, 26, ROLE.r0, 'mono', 'left'),
    ];

    // Row 1: Cached 8 tokens
    const cw = 152;
    const cg = 14;
    cache.forEach((tok, i) => {
      const bGap = i >= 4 ? 26 : 0;
      const cx = -855 + cw * 0.5 + i * (cw + cg) + bGap;
      nodes.push(
        glassCell(cx, -190, cw, 74, ROLE.r0, { fill: '#10203a', glow: 5 }),
        txt(tok, cx, -190, 30, COSMOS.ink, 'mono'),
      );
    });

    // Row 2: Incoming prompt tokens
    nodes.push(
      txt(
        `INCOMING PROMPT (L = ${length} · SHARED = ${shared} · CAP = MIN(${shared}, ${length - 1}) = ${Math.min(shared, length - 1)})`,
        -855,
        -100,
        26,
        ROLE.r1,
        'mono',
        'left',
      ),
    );
    prompt.forEach((tok, i) => {
      const bGap = Math.floor(i / 4) * 26;
      const cx = -855 + cw * 0.5 + i * (cw + cg) + bGap;
      const isSkipped = st >= 1 && i < skipped;
      const col = isSkipped ? ROLE.good : ROLE.r1;
      nodes.push(
        glassCell(cx, -35, cw, 74, col, {
          fill: isSkipped ? '#0d2b24' : '#1f1636',
          glow: isSkipped ? 9 : 4,
        }),
        txt(tok, cx, -35, 30, isSkipped ? ROLE.good : COSMOS.ink, 'mono'),
      );
    });

    // Row 3: Either APC 6-slot step or Formula + 3 result cells
    if (isApcStep) {
      nodes.push(
        txt(
          'APC ENABLED IN 6-TOKEN STEP (1 R0 DECODE + 5 R1 REMAINING = 6 / 6)',
          -855,
          76,
          26,
          ROLE.good,
          'mono',
          'left',
        ),
      );
      const sw = 266;
      const sg = 20;
      for (let i = 0; i < 6; i++) {
        const cx = -855 + sw * 0.5 + i * (sw + sg);
        const col = i === 0 ? ROLE.r0 : ROLE.good;
        nodes.push(
          glassCell(cx, 154, sw, 92, col, {
            fill: i === 0 ? '#10223d' : '#0d2b24',
            glow: apcPulse.value > 0.5 ? 11 : 7,
          }),
          txt(i === 0 ? 'R0 decode' : `R1 tail ${i}`, cx, 154, 28, COSMOS.ink, 'mono'),
        );
      }
      nodes.push(
        txt(
          'Skipping 4 cached prefix tokens lets R1 finish its remaining 5 tokens in one step!',
          0,
          266,
          26,
          ROLE.good,
          'sans',
        ),
      );
    } else if (st === 0) {
      nodes.push(
        glowTex(
          String.raw`\text{skip} = \left\lfloor \frac{\min(\text{shared},\, L - 1)}{B} \right\rfloor \cdot B`,
          { x: 0, y: 120, size: 42, color: COSMOS.gold, glow: 7 },
        ),
        txt(
          'Remaining work = L - skip   |   New blocks = ceil((L - skip) / B)',
          0,
          230,
          28,
          ROLE.kv,
          'mono',
        ),
      );
    } else {
      nodes.push(
        glassCell(-570, 130, 520, 128, ROLE.good, { fill: '#0d2922', glow: 9 }),
        txt('SKIPPED POSITIONS', -570, 96, 26, ROLE.good, 'mono'),
        txt(`${skipped} tokens`, -570, 152, 38, COSMOS.ink, 'mono'),

        glassCell(0, 130, 520, 128, COSMOS.gold, { fill: '#251e0e', glow: 9 }),
        txt('REMAINING COMPUTE', 0, 96, 26, COSMOS.gold, 'mono'),
        txt(`${compute} input${compute === 1 ? '' : 's'}`, 0, 152, 38, COSMOS.ink, 'mono'),

        glassCell(570, 130, 520, 128, ROLE.kv, { fill: '#0e2432', glow: 9 }),
        txt('NEW BLOCKS NEEDED', 570, 96, 26, ROLE.kv, 'mono'),
        txt(`${newBlocks} block${newBlocks === 1 ? '' : 's'}`, 570, 152, 38, COSMOS.ink, 'mono'),

        txt(
          isLen8
            ? 'All 8 cached, but KV holds no sampling logits -> cap at 7 -> skip 4, recompute last block!'
            : st === 3
              ? 'Shared 8 crosses second block boundary -> skip 8, compute 1 (only Z)'
              : st === 2
                ? 'Shared 7 still rounds down to 4 -> skip 4, compute 5'
                : 'Shared 6 rounds down to 4 -> skip 4, compute 5',
          0,
          264,
          26,
          isLen8 ? COSMOS.gold : ROLE.good,
          'sans',
        ),
      );
    }

    nodes.push(
      txt(
        isLen8
          ? '1-token prompt skips 0; sliding-window, hybrid/SSM & offloaded paths use their own contracts'
          : 'Full-attention APC reuses complete aligned blocks only',
        0,
        382,
        26,
        COSMOS.muted,
        'sans',
      ),
    );
    return group(...nodes);
  });

  s.add(bgAura, title, live);
  wireStepCues(s, c, step, [
    ['vv-prefix-limit-op-0', 0],
    ['vv-prefix-limit-op-1', 1],
    ['vv-prefix-limit-match-six', 1],
    ['vv-prefix-limit-match-seven', 2],
    ['vv-prefix-limit-match-eight', 3],
    ['vv-prefix-limit-apc-step', 4],
    ['vv-prefix-limit-op-2', 5],
    ['vv-prefix-limit-prompt-eight', 5],
  ]);
  c.on('vv-prefix-limit-apc-input', () => s.play(apcPulse.to(1, { duration: 0.3 })));
}
