// Scene 18: Replay the learned merge order on the actual word pieces: Live BPE merge replay (25 -> 16 pieces) + UTF-8 bytes & revision rebuild.
import { delay, par } from 'vizmatic/stage';
import {
  BPE_RULES,
  BPE_SAMPLE_WORDS,
  COSMOS,
  aura,
  bpeReplay,
  glassCell,
  group,
  guardedDynamic,
  heroTitle,
  remainDuration,
  txt,
} from '../parts.mjs';

export default function bpeWork(s, c) {
  const showPart1 = s.value(1);
  const initShown = s.value(0);
  const corpusShown = s.value(0);
  const sampleShown = s.value(0);

  const showPart2 = s.value(0);
  const ruleIdx = s.value(0); // 0..8

  const showPart3 = s.value(0);
  const bytesOn = s.value(0);
  const revOn = s.value(0);

  const bgAura = aura(0, 0, 640, '#17264f2a', '#5ce1e614');

  // Part 1: Initial 25 character+end pieces across the 4 words
  const part1Live = guardedDynamic(showPart1, (a) => {
    const ini = initShown.value;
    const crp = corpusShown.value;
    const smp = sampleShown.value;

    const initialGroups = bpeReplay([...BPE_SAMPLE_WORDS], []);
    const nodes = [
      heroTitle(['BPE Merge', 'Replay'], {
        x: -855,
        y: -435,
        size: 56,
        lineHeight: 66,
        accent: COSMOS.cyan,
        eyebrow: 'TOY CHARACTER BPE · 8 LEARNED MERGE RULES',
      }).opacity(a),
    ];

    // Draw the 4 words in 2 clean rows of 2 words so every character tile is spacious and >= 26px!
    const positions = [
      { x0: -810, y: -135 },
      { x0: 110, y: -135 },
      { x0: -810, y: 45 },
      { x0: 110, y: 45 },
    ];
    initialGroups.forEach((pieces, wi) => {
      const { x0, y } = positions[wi];
      const cellW = 86;
      nodes.push(txt(BPE_SAMPLE_WORDS[wi], x0, y - 72, 28, COSMOS.cyan, 'mono', 'left').opacity(a));
      pieces.forEach((p, pi) => {
        const isEnd = p === '</w>';
        const col = isEnd ? COSMOS.gold : COSMOS.blue;
        const cx = x0 + pi * (cellW + 8) + cellW * 0.5;
        nodes.push(
          glassCell(cx, y, cellW, 68, col, { fill: '#0f172b', glow: 5, opacity: a }),
          txt(isEnd ? 'end' : p, cx, y + 2, 28, col, 'mono').opacity(a),
        );
      });
    });

    // Bottom corpus & sample counts
    if (ini > 0.02) {
      nodes.push(
        glassCell(-550, 245, 500, 96, COSMOS.blue, { fill: '#10182d', glow: 6, opacity: ini * a }),
        txt('Corpus start: 94 symbols', -550, 247, 30, COSMOS.blue, 'mono').opacity(ini * a),
      );
    }
    if (crp > 0.02) {
      nodes.push(
        glassCell(0, 245, 520, 96, COSMOS.cyan, { fill: '#0e1f30', glow: 7, opacity: crp * a }),
        txt('After 8 merges: 68 symbols', 0, 247, 30, COSMOS.cyan, 'mono').opacity(crp * a),
      );
    }
    if (smp > 0.02) {
      nodes.push(
        glassCell(550, 245, 500, 96, COSMOS.gold, { fill: '#1f1a12', glow: 8, opacity: smp * a }),
        txt('4-word sample: 25 pieces', 550, 247, 30, COSMOS.gold, 'mono').opacity(smp * a),
      );
    }

    nodes.push(
      txt('Characters plus </w> end-of-word marker', 0, 395, 28, COSMOS.muted, 'sans').opacity(a),
    );
    return group(...nodes);
  });

  // Part 2: Live step-by-step replay on "after" and "rotate" across all 8 rules
  const part2Live = guardedDynamic(showPart2, (a) => {
    const step = Math.max(0, Math.min(BPE_RULES.length, Math.round(ruleIdx.value)));
    const pieces = bpeReplay([...BPE_SAMPLE_WORDS], BPE_RULES.slice(0, step));
    const totalCount = pieces.flat().length;
    const current = step > 0 ? BPE_RULES[step - 1] : null;

    const nodes = [
      txt(
        `MERGE RULES APPLIED: ${step} / ${BPE_RULES.length}`,
        -855,
        -425,
        28,
        COSMOS.cyan,
        'mono',
        'left',
      ).opacity(a),
      txt('Ordered Left-to-Right Replay', -855, -350, 52, COSMOS.ink, 'serif', 'left').opacity(a),
    ];

    if (current) {
      const ruleBadge =
        step === 2 || step === 3
          ? 't + a -> ta  ·  r + o -> ro'
          : step === 6 || step === 7
            ? 'afte + r -> after  ·  +end'
            : (() => {
                const aLbl = current[0] === '</w>' ? 'end' : current[0];
                const bLbl = current[1] === '</w>' ? 'end' : current[1];
                const mLbl = (current[0] + current[1]).replace('</w>', '·end');
                return `${aLbl} + ${bLbl}  ->  ${mLbl}`;
              })();
      nodes.push(
        glassCell(485, -370, 720, 100, COSMOS.gold, { fill: '#1e1912', glow: 10, opacity: a }),
        txt(ruleBadge, 485, -368, 34, COSMOS.gold, 'mono').opacity(a),
      );
    }

    // Two featured rows: "after" (index 2) and "rotate" (index 0) preserving column width per original unit
    const featured = [
      { idx: 2, label: 'after', y: -110, color: COSMOS.cyan },
      { idx: 0, label: 'rotate', y: 110, color: COSMOS.blue },
    ];
    featured.forEach(({ idx, label, y, color }) => {
      nodes.push(txt(label, -810, y + 2, 42, color, 'mono', 'left').opacity(a));
      let cursorX = -560;
      const unitW = 195;
      pieces[idx].forEach((tok) => {
        const display = tok.replace('</w>', '·end').replace(/^·/, '');
        const units = tok.replace('</w>', '|').length;
        const w = units * unitW;
        const isMerged = units > 1;
        const col = isMerged ? COSMOS.emerald : color;
        nodes.push(
          glassCell(cursorX + w * 0.5, y, w - 12, 118, col, {
            fill: isMerged ? '#0f2424' : '#10182d',
            glow: isMerged ? 9 : 4,
            opacity: a,
          }),
          txt(display, cursorX + w * 0.5, y + 2, 38, col, 'mono').opacity(a),
        );
        cursorX += w;
      });
    });

    nodes.push(
      txt(
        `4-word sample total: ${totalCount} pieces (from 25 -> 16)`,
        0,
        305,
        42,
        totalCount === 16 ? COSMOS.emerald : COSMOS.gold,
        'mono',
      )
        .glow(8, totalCount === 16 ? COSMOS.emerald : COSMOS.gold)
        .opacity(a),
      txt(
        'Each rule merges non-overlapping adjacent pairs · new prompts reuse this exact order',
        0,
        395,
        28,
        COSMOS.muted,
        'sans',
      ).opacity(a),
    );

    return group(...nodes);
  });

  // Part 3: Unicode char vs 4 UTF-8 bytes, whitespace collapse, and tokenizer revision rebuild
  const part3Live = guardedDynamic(showPart3, (a) => {
    const by = bytesOn.value;
    const rv = revOn.value;
    const hexBytes = ['F0', '9F', '98', '80'];

    const nodes = [
      txt('ENCODING & REVISION CONTRACTS', -855, -425, 26, COSMOS.cyan, 'mono', 'left').opacity(a),
      txt('Characters vs UTF-8 Bytes', -855, -350, 54, COSMOS.ink, 'serif', 'left').opacity(a),

      glassCell(-460, -110, 620, 128, COSMOS.blue, { fill: '#10192e', glow: 8, opacity: a }),
      txt('1 Unicode emoji character', -460, -108, 34, COSMOS.blue, 'sans').opacity(a),
    ];

    hexBytes.forEach((b, i) => {
      nodes.push(
        glassCell(110 + i * 185, -110, 155, 112, COSMOS.cyan, {
          fill: '#0e2030',
          glow: 8,
          opacity: (0.25 + 0.75 * by) * a,
        }),
        txt(b, 110 + i * 185, -108, 36, COSMOS.cyan, 'mono').opacity((0.25 + 0.75 * by) * a),
      );
    });

    const byOp = (0.48 + 0.52 * by) * a;
    const rvOp = (0.48 + 0.52 * rv) * a;
    nodes.push(
      txt('4 UTF-8 bytes', 388, -16, 28, by > 0.3 ? COSMOS.cyan : COSMOS.muted, 'mono').opacity(
        byOp,
      ),
      glassCell(0, 105, 1320, 96, by > 0.3 ? COSMOS.amber : '#463f38', {
        fill: '#1d1614',
        glow: by > 0.3 ? 6 : 2,
        opacity: byOp,
      }),
      txt(
        'Whitespace split discards spacing: "rotate·keys"  ==  "rotate··keys"',
        0,
        107,
        32,
        by > 0.3 ? COSMOS.amber : COSMOS.muted,
        'mono',
      ).opacity(byOp),

      glassCell(-390, 290, 640, 104, '#3d4c70', {
        fill: '#0d101c',
        glow: 2,
        opacity: rvOp,
        dash: [8, 6],
      }),
      txt('Tokenizer v1 shard IDs (stale)', -390, 292, 30, COSMOS.muted, 'mono').opacity(rvOp),

      glassCell(390, 290, 640, 104, rv > 0.3 ? COSMOS.emerald : '#344c54', {
        fill: '#0e2422',
        glow: rv > 0.3 ? 9 : 3,
        opacity: rvOp,
      }),
      txt(
        'Tokenizer v2 -> rebuild shards',
        390,
        292,
        30,
        rv > 0.3 ? COSMOS.emerald : COSMOS.muted,
        'mono',
      ).opacity(rvOp),
    );

    return group(...nodes);
  });

  s.add(bgAura, part1Live, part2Live, part3Live);

  c.on('pt-bpe-work-initial', () =>
    s.play(initShown.to(1, { duration: remainDuration(c, 'pt-bpe-work-initial', 0.5) })),
  );
  c.on('pt-bpe-work-corpus', () =>
    s.play(corpusShown.to(1, { duration: remainDuration(c, 'pt-bpe-work-corpus', 0.5) })),
  );
  c.on('pt-bpe-work-sample', () =>
    s.play(sampleShown.to(1, { duration: remainDuration(c, 'pt-bpe-work-sample', 0.5) })),
  );

  c.onBeat(1, () => {
    s.play(
      par(showPart1.to(0, { duration: 0.2 }), delay(showPart2.to(1, { duration: 0.25 }), 0.22)),
    );
  });

  c.on('pt-bpe-work-first', () =>
    s.play(ruleIdx.to(1, { duration: remainDuration(c, 'pt-bpe-work-first', 0.45) })),
  );
  c.on('pt-bpe-work-rotate', () =>
    s.play(ruleIdx.to(3, { duration: remainDuration(c, 'pt-bpe-work-rotate', 0.9) })),
  );
  c.on('pt-bpe-work-pair', () =>
    s.play(ruleIdx.to(4, { duration: remainDuration(c, 'pt-bpe-work-pair', 0.45) })),
  );
  c.on('pt-bpe-work-join', () =>
    s.play(ruleIdx.to(5, { duration: remainDuration(c, 'pt-bpe-work-join', 0.45) })),
  );
  c.on('pt-bpe-work-finish', () =>
    s.play(ruleIdx.to(7, { duration: remainDuration(c, 'pt-bpe-work-finish', 0.9) })),
  );
  c.on('pt-bpe-work-last', () =>
    s.play(ruleIdx.to(8, { duration: remainDuration(c, 'pt-bpe-work-last', 0.5) })),
  );

  c.onBeat(2, () => {
    s.play(
      par(showPart2.to(0, { duration: 0.2 }), delay(showPart3.to(1, { duration: 0.25 }), 0.22)),
    );
  });
  c.on('pt-bpe-work-bytes', () =>
    s.play(bytesOn.to(1, { duration: remainDuration(c, 'pt-bpe-work-bytes', 0.6) })),
  );
  c.on('pt-bpe-work-revision', () =>
    s.play(revOn.to(1, { duration: remainDuration(c, 'pt-bpe-work-revision', 0.6) })),
  );
}
