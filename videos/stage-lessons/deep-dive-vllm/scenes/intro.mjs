// Scene 01: Can the next word run? R0 needs 1 decode slot; R1 brings 9 uncached words; 1 KV block holds 4 -> "on" waits until Block 2 arrives!
import {
  COSMOS,
  R1_WORDS,
  ROLE,
  aura,
  glassCell,
  glowDot,
  group,
  guardedDynamic,
  heroTitle,
  runPhase,
  txt,
  wireStepCues,
} from '../parts.mjs';

export default function intro(s, c) {
  const phase = s.value(0);
  // step:
  // 0 = intro-word ("on" -> 6th GPU place?)
  // 1 = intro-whole-step (6-input GPU step)
  // 2 = intro-reserve (R0 decode reserved)
  // 3 = intro-storage (R1 has 1 block of 4 -> HOLD prediction: Where would "on" go?)
  // 4 = intro-wait (AFTER: block full, 4 run, 5 wait, 6th slot empty)
  // 5 = intro-second-block (AFTER: give R1 Block 2)
  // 6 = intro-fifth (AFTER: "on" fits! 1 decode + 5 prompt = 6)
  const step = s.value(0);

  const bgAura = aura(0, 20, 640, '#5ce1e61e', '#a78bfa18');
  const title = heroTitle(['Can the Next Word Run?'], {
    x: -855,
    y: -435,
    size: 54,
    lineHeight: 62,
    accent: ROLE.kv,
    eyebrow: 'DUAL-RESOURCE SCHEDULING · GPU STEP + KV BLOCKS',
  });

  const live = guardedDynamic(1, () => {
    const st = Math.round(step.value);
    const p = phase.value;
    const nodes = [];

    const count = st >= 6 ? 5 : 4;
    const blocked = st === 4;
    const hasSecondBlock = st >= 5;

    // Row 1: R1's 9-token prompt strip
    nodes.push(
      txt(
        'R1 PROMPT (9 UNCACHED TOKENS · PREFIX REUSE OFF)',
        -855,
        -268,
        26,
        ROLE.r1,
        'mono',
        'left',
      ),
    );
    const wCell = 172;
    const wGap = 16;
    const wStart = -855 + wCell * 0.5;
    R1_WORDS.forEach((word, i) => {
      const cx = wStart + i * (wCell + wGap);
      const isFifth = i === 4;
      const admitted = i < count;
      const stroke = isFifth && !admitted ? COSMOS.gold : admitted ? ROLE.r1 : COSMOS.dim;
      const fill = isFifth && !admitted ? '#28200e' : admitted ? '#1f1636' : '#0b101d';
      nodes.push(
        glassCell(cx, -198, wCell, 78, stroke, { fill, glow: isFifth || admitted ? 8 : 2 }),
        txt(
          word,
          cx,
          -198,
          30,
          isFifth && !admitted ? COSMOS.gold : admitted ? COSMOS.ink : COSMOS.muted,
          'mono',
        ),
      );
    });

    // Row 2: 6-input GPU step rail
    nodes.push(
      txt('GPU STEP (6 INPUT PLACES)', -855, -88, 26, ROLE.r0, 'mono', 'left'),
      txt('R0 KV READY', 855, -88, 26, ROLE.r0, 'mono', 'right'),
    );
    const sCell = 266;
    const sGap = 20;
    const sStart = -855 + sCell * 0.5;
    for (let i = 0; i < 6; i++) {
      const cx = sStart + i * (sCell + sGap);
      const isR0 = i === 0;
      const isSixth = i === 5;
      let label = '';
      let col = COSMOS.dim;
      let fill = '#0b101d';
      if (isR0) {
        label = 'R0 decode';
        col = ROLE.r0;
        fill = '#10223d';
      } else if (i <= count && st >= 1) {
        label = R1_WORDS[i - 1];
        col = isSixth ? ROLE.good : ROLE.r1;
        fill = isSixth ? '#0e2924' : '#1f1636';
      } else if (isSixth) {
        label = blocked ? 'empty' : st >= 5 ? 'open' : '"on" ?';
        col = blocked ? ROLE.bad : COSMOS.gold;
        fill = blocked ? '#2b121f' : '#261f0e';
      }
      nodes.push(
        glassCell(cx, -16, sCell, 88, col, { fill, glow: isSixth || isR0 ? 9 : 4 }),
        txt(label || `slot ${i + 1}`, cx, -16, 28, label ? COSMOS.ink : COSMOS.dim, 'mono'),
      );
    }

    // Row 3: R1 KV Block Storage (4 cells per block)
    nodes.push(
      txt(
        hasSecondBlock
          ? 'R1 KV STORAGE: 2 BLOCKS (8 CELLS)'
          : 'R1 KV STORAGE: 1 BLOCK ONLY (4 CELLS)',
        -855,
        102,
        26,
        ROLE.kv,
        'mono',
        'left',
      ),
    );
    const blockCount = hasSecondBlock ? 2 : 1;
    const bCell = 178;
    const bGap = 14;
    for (let b = 0; b < blockCount; b++) {
      const bx = -855 + b * 880;
      const bStroke = b === 1 ? ROLE.good : ROLE.kv;
      nodes.push(txt(`BLOCK ${b + 1}`, bx, 146, 26, bStroke, 'mono', 'left'));
      for (let j = 0; j < 4; j++) {
        const idx = b * 4 + j;
        const cx = bx + bCell * 0.5 + j * (bCell + bGap);
        const filled = idx < count;
        const isOn = idx === 4 && filled;
        nodes.push(
          glassCell(cx, 212, bCell, 80, isOn ? ROLE.good : filled ? bStroke : COSMOS.dim, {
            fill: isOn ? '#0e2c26' : filled ? '#0e2430' : '#0a0f1c',
            glow: isOn ? 11 : filled ? 6 : 2,
          }),
          txt(
            filled ? R1_WORDS[idx] : 'free',
            cx,
            212,
            28,
            isOn ? ROLE.good : filled ? COSMOS.ink : COSMOS.dim,
            'mono',
          ),
        );
      }
    }

    // Right-side indicator when only 1 block exists so right half stays visually balanced
    if (!hasSecondBlock) {
      nodes.push(
        glassCell(430, 212, 760, 80, blocked ? ROLE.bad : COSMOS.gold, {
          fill: blocked ? '#2b121f' : '#241c0d',
          glow: 9,
        }),
        txt(
          blocked
            ? 'NO SECOND BLOCK · 6TH GPU PLACE STAYS EMPTY'
            : 'CANDIDATE WORD "on" NEEDS A KV CELL',
          430,
          212,
          26,
          blocked ? ROLE.bad : COSMOS.gold,
          'mono',
        ),
      );
    }

    // Bottom status bar (strict Rule A8 caption-graphic agreement & prediction withholding!)
    const caption =
      st >= 6
        ? 'Block 2 stores "on": worker runs 1 R0 decode + 5 R1 prompt inputs (6 / 6)'
        : st === 5
          ? 'Block 2 allocated'
          : st === 4
            ? 'Block 1 is full: 4 R1 prompt inputs run beside R0, and 5 wait'
            : 'Predict: Block 1 has 4 cells for 4 words. Where would "on" store its KV?';

    const u = (p * 0.65) % 1;
    nodes.push(
      glowDot(-780 + u * 1560, 315, { radius: 6, color: st >= 6 ? ROLE.good : COSMOS.gold }),
      txt(caption, 0, 376, 28, st >= 6 ? ROLE.good : blocked ? ROLE.bad : COSMOS.gold, 'sans'),
    );
    return group(...nodes);
  });

  s.add(bgAura, title, live);
  runPhase(s, c, phase, 14);
  wireStepCues(s, c, step, [
    ['intro-word', 0],
    ['intro-whole-step', 1],
    ['intro-reserve', 2],
    ['intro-storage', 3],
    ['intro-wait', 4, true],
    ['intro-second-block', 5],
    ['intro-fifth', 6, true],
  ]);
}
