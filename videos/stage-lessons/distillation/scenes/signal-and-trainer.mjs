// Scene 13: What did the teacher's cache keep? (Top-k tail illusion, dense cost, TRL & GKD trainers)
import {
  CACHE_FULL_KL,
  CACHE_STUDENT,
  CACHE_TEACHER,
  COSMOS,
  aura,
  glassCell,
  glowDot,
  glowingArc,
  group,
  guardedDynamic,
  heroTitle,
  line,
  rect,
  remainAfterDuration,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function signalAndTrainer(s, c) {
  const phase = s.value(0);
  const beatMode = s.value(0); // 0=text-only, 1=tail cache (b1-b2), 3=1GB math, 4=TRL agent mask, 5=GKD+CPU
  const sRetain = s.value(0);
  const sStretch = s.value(0);
  const sZero = s.value(0);
  const sRestore = s.value(0);
  const sFull = s.value(0);

  const bgAura = aura(0, 30, 620, '#14335c26', '#2e1c5214');
  const title = heroTitle(['What Did the Teacher', 'Logit Cache Keep?'], {
    x: -855,
    y: -415,
    size: 54,
    lineHeight: 64,
    accent: COSMOS.amber,
    eyebrow: 'TOP-K TAIL ILLUSION · DENSE CACHE COST · TRL & GKD',
  });

  const live = guardedDynamic(s.value(1), () => {
    const p = phase.value;
    const pulse = 0.72 + 0.28 * Math.sin(p * 3.8);
    const mode = Math.round(beatMode.value);

    if (mode === 0) {
      // Beat 0: Text-only offline teacher ("7 days" -> student tokens ["7", " days"])
      return group(
        txt('OFFLINE TEXT-ONLY TEACHER', -835, -182, 28, COSMOS.blue, 'mono', 'left'),
        glassCell(-530, -48, 590, 174, COSMOS.blue, { fill: '#132445', glow: 8 * pulse }),
        txt('"7 days"', -530, -68, 66, COSMOS.blue, 'mono'),
        txt('saved answer string only', -530, 2, 26, COSMOS.muted, 'sans'),

        glowingArc([-220, -48], [60, -48], -34, { color: COSMOS.gold, width: 3.6 }),
        glowDot(60, -48, { radius: 8, color: COSMOS.gold }),
        txt('student tokenizes', -80, -104, 26, COSMOS.gold, 'mono'),

        txt('STUDENT TOKENIZER (CAN DIFFER)', 440, -182, 28, COSMOS.cyan, 'mono'),
        glassCell(260, -48, 250, 128, COSMOS.cyan, { fill: '#0e364a', glow: 6 }),
        txt('"7"', 260, -46, 48, COSMOS.cyan, 'mono'),
        glassCell(560, -48, 280, 128, COSMOS.cyan, { fill: '#0e364a', glow: 6 }),
        txt('" days"', 560, -46, 44, COSMOS.cyan, 'mono'),

        glassCell(0, 224, 1520, 156, COSMOS.amber, { fill: '#221a0d', glow: 6 }),
        txt('WHAT ABOUT PROBABILITY OF OTHER REPLIES?', 0, 190, 32, COSMOS.amber, 'mono'),
        txt(
          'Text stores only the chosen string · Changing T requires full logits or normalized log-probs',
          0,
          252,
          28,
          COSMOS.ink,
          'sans',
        ),
      );
    }

    if (mode === 1) {
      // Beats 1 & 2: Top-2 truncated cache illusion vs full 3-token KL
      const ret = sRetain.value;
      const st = sStretch.value;
      const zr = sZero.value > 0.5;
      const rs = sRestore.value;
      const fl = sFull.value > 0.5;
      const zoom = st * (1 - rs);

      const stripL = -540;
      const stripW = 1340;
      const dists = [
        { name: 'TEACHER', vals: CACHE_TEACHER, col: COSMOS.blue, fill: '#17386b', y: -102 },
        { name: 'STUDENT', vals: CACHE_STUDENT, col: COSMOS.cyan, fill: '#0e3c50', y: 112 },
      ];

      const nodes = [
        txt(
          zoom > 0.5
            ? 'RENORMALIZED WITHIN SAVED TOP-2 [A, B]'
            : 'FULL 3-TOKEN VOCABULARY [A, B, C]',
          stripL,
          -216,
          28,
          zoom > 0.5 ? COSMOS.amber : COSMOS.ink,
          'mono',
          'left',
        ),
      ];

      dists.forEach(({ name, vals, col, fill, y }) => {
        const kept = vals[0] + vals[1];
        const winMass = 1 - zoom * (1 - kept);
        nodes.push(txt(name, -835, y, 32, col, 'mono', 'left'));

        let acc = 0;
        vals.forEach((v, j) => {
          const x0 = Math.min(stripW, (stripW * acc) / winMass);
          acc += v;
          const x1 = Math.min(stripW, (stripW * acc) / winMass);
          const w = x1 - x0;
          if (w < 6) return;
          const isTail = j === 2;
          const segCol = isTail ? COSMOS.rose : col;
          const segFill = isTail ? '#3a1525' : fill;
          nodes.push(
            rect(Math.max(6, w - 5), 76, {
              fill: segFill,
              stroke: segCol,
              width: 2.2,
              radius: 6,
            }).at(stripL + (x0 + x1) * 0.5, y),
          );
          if (w >= 54) {
            nodes.push(txt('ABC'[j], stripL + (x0 + x1) * 0.5, y + 2, 34, COSMOS.ink, 'mono'));
          }
          if ((zoom < 0.05 || zoom > 0.95) && w >= 66) {
            nodes.push(
              txt(
                `${Math.round((v / winMass) * 100)}%`,
                stripL + (x0 + x1) * 0.5,
                y + 62,
                26,
                isTail ? COSMOS.rose : col,
                'mono',
              ),
            );
          }
        });

        // Retention bracket over [A, B]
        if (ret > 0.1 && zoom < 0.15) {
          const tipX = stripL + stripW * kept;
          nodes.push(
            line([stripL, y - 54], [tipX, y - 54], { stroke: COSMOS.gold, width: 3.4 })
              .glow(6, COSMOS.gold)
              .opacity(ret),
            line([stripL, y - 54], [stripL, y - 42], { stroke: COSMOS.gold, width: 3.4 }).opacity(
              ret,
            ),
            line([tipX, y - 54], [tipX, y - 42], { stroke: COSMOS.gold, width: 3.4 }).opacity(ret),
            txt(
              `${Math.round(kept * 100)}% kept in top-2`,
              stripL + 6,
              y - 88,
              26,
              COSMOS.gold,
              'mono',
              'left',
            ).opacity(ret),
          );
        }
      });

      let verdictText = 'Stretch each [A, B] bracket to 100%: what KL will the loss see?';
      let verdictCol = COSMOS.gold;
      if (fl) {
        verdictText = `Full 3-token forward KL = ${CACHE_FULL_KL.toFixed(3)} nats (90% on C!)`;
        verdictCol = COSMOS.rose;
      } else if (zr) {
        verdictText = 'Renormalized top-2 [50%, 50%]  ->  conditional KL = 0.000 nats!';
        verdictCol = COSMOS.emerald;
      }

      nodes.push(
        glassCell(0, 316, 1620, 94, verdictCol, {
          fill: fl ? '#2a121c' : '#1b1810',
          dash: !zr && !fl ? [8, 6] : undefined,
          glow: 8 * pulse,
        }),
        txt(verdictText, 0, 318, 28, verdictCol, 'mono'),
      );
      return group(...nodes);
    }

    if (mode === 2) {
      // Beat 3: Dense logit cache scale (10,000 x 50,000 x 2 bytes = 1.0 GB)
      const cols = [-560, 0, 560];
      const items = [
        ['10,000', 'token positions', COSMOS.blue],
        ['50,000', 'vocab logits / pos', COSMOS.cyan],
        ['2 bytes', 'bf16 / fp16 value', COSMOS.violet],
      ];
      const nodes = [
        txt('DENSE LOGIT CACHE STORAGE COST', -855, -206, 28, COSMOS.amber, 'mono', 'left'),
      ];
      items.forEach(([val, lbl, col], i) => {
        nodes.push(
          glassCell(cols[i], -20, 440, 210, col, { fill: '#101b32', glow: 6 }),
          txt(val, cols[i], -46, 56, col, 'mono').glow(6, col),
          txt(lbl, cols[i], 36, 28, COSMOS.muted, 'sans'),
        );
        if (i < 2) nodes.push(txt('x', cols[i] + 280, -20, 46, COSMOS.muted, 'mono'));
      });
      nodes.push(
        glassCell(0, 236, 1340, 148, COSMOS.gold, { fill: '#221b0c', glow: 9 * pulse }),
        txt('= 1.0 GB DENSE PAYLOAD (FOR JUST 10k TOKENS)', 0, 206, 36, COSMOS.gold, 'mono').glow(
          7,
          COSMOS.gold,
        ),
        txt(
          'Online scoring + chunked full-vocabulary loss avoids giant logit caches and tail illusions',
          0,
          266,
          28,
          COSMOS.ink,
          'sans',
        ),
      );
      return group(...nodes);
    }

    if (mode === 3) {
      // Beat 4: TRL DistillationTrainer agent turn mask + lm_head modules_to_save
      const turns = [
        { name: 'Prompt', sup: false },
        { name: 'Assistant 1', sup: true },
        { name: 'Tool Reply', sup: false },
        { name: 'Assistant 2', sup: true },
      ];
      const nodes = [
        txt(
          'TRL DISTILLATION TRAINER · CHUNKED FULL-VOCAB JSD',
          -855,
          -206,
          28,
          COSMOS.cyan,
          'mono',
          'left',
        ),
      ];
      turns.forEach(({ name, sup }, i) => {
        const cx = -615 + i * 410;
        const col = sup ? COSMOS.emerald : COSMOS.dim;
        nodes.push(
          glassCell(cx, -44, 348, 120, col, {
            fill: sup ? '#0f2c27' : '#131724',
            glow: sup ? 8 * pulse : 0,
          }),
          txt(name, cx, -42, 32, sup ? COSMOS.ink : COSMOS.muted, 'mono'),
          txt(sup ? 'IN LOSS' : 'CONTEXT ONLY', cx, 98, 28, col, 'mono'),
        );
        if (sup) {
          nodes.push(
            line([cx, 18], [cx, 66], { stroke: COSMOS.emerald, width: 3.8 }).glow(
              7,
              COSMOS.emerald,
            ),
            glowDot(cx, 66, { radius: 6, color: COSMOS.emerald }),
          );
        }
      });
      nodes.push(
        glassCell(0, 262, 1560, 140, COSMOS.gold, { fill: '#201b0d', glow: 6 }),
        txt('READS lm_head.weight DIRECTLY (NO LORA ON HEAD)', 0, 232, 30, COSMOS.gold, 'mono'),
        txt(
          'Add lm_head to modules_to_save · pin library version & verify parameter gradients',
          0,
          288,
          28,
          COSMOS.ink,
          'sans',
        ),
      );
      return group(...nodes);
    }

    // Beat 5: GKD independent knobs + CPU exercise scope
    return group(
      txt('GKD CONTROLS & SANITY VERIFICATION', -855, -206, 28, COSMOS.cyan, 'mono', 'left'),
      glassCell(-430, -18, 790, 210, COSMOS.cyan, { fill: '#0e2336', glow: 7 }),
      txt('COLLECTION FRACTION (lambda)', -430, -74, 30, COSMOS.cyan, 'mono'),
      txt('Controls WHICH prefixes reach the teacher', -430, -16, 28, COSMOS.ink, 'sans'),
      txt('Offline data <-> On-policy student rollouts', -430, 36, 26, COSMOS.muted, 'mono'),

      glassCell(430, -18, 790, 210, COSMOS.blue, { fill: '#132445', glow: 7 }),
      txt('DIVERGENCE CHOICE (beta)', 430, -74, 30, COSMOS.blue, 'mono'),
      txt('Controls HOW each mismatch counts', 430, -16, 28, COSMOS.ink, 'sans'),
      txt('Forward KL <-> JSD <-> Reverse KL', 430, 36, 26, COSMOS.muted, 'mono'),

      glassCell(0, 250, 1650, 146, COSMOS.emerald, { fill: '#0f2824', glow: 6 }),
      txt('SMALL CPU TRAINING LOOP', 0, 218, 28, COSMOS.emerald, 'mono'),
      txt(
        'Falling loss verifies frozen teacher -> loss -> student step; language transfer needs held-out eval',
        0,
        276,
        26,
        COSMOS.ink,
        'sans',
      ),
    );
  });

  s.add(bgAura, title, live);
  runPhase(s, c, phase, 14);

  c.onBeat(1, () => s.play(beatMode.to(1, { duration: 0.02 })));
  c.on('tail-select', () => s.play(sRetain.to(1, { duration: 0.55 })));
  c.on('tail-stretch', () => s.play(sStretch.to(1, { duration: 0.9 })));
  c.after('tail-zero', () =>
    s.play(sZero.to(1, { duration: remainAfterDuration(c, 'tail-zero', 0.4) })),
  );
  c.on('tail-restore', () => s.play(sRestore.to(1, { duration: 0.85 })));
  c.after('tail-full', () =>
    s.play(sFull.to(1, { duration: remainAfterDuration(c, 'tail-full', 0.45) })),
  );
  c.onBeat(3, () => s.play(beatMode.to(2, { duration: 0.02 })));
  c.onBeat(4, () => s.play(beatMode.to(3, { duration: 0.02 })));
  c.onBeat(5, () => s.play(beatMode.to(4, { duration: remainDuration(c, 'tail-full', 0.02) })));
}
