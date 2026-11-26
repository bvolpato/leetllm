// Scene 18: causal-repair - Upper-left SDPA mask bug (1 vs 4) + 2-query chunk boundary leak & repair.
import {
  COSMOS,
  ROLE,
  cinemaAtmosphere,
  group,
  guardedDynamic,
  heroTitle,
  lumBar,
  meanVisible,
  playCue,
  rule,
  runPhase,
  txt,
} from '../parts.mjs';

export default function causalRepair(s, c) {
  const vals = [1, 2, 9];
  const exactMean = meanVisible(vals); // 4

  const phase = s.value(0);
  const leftStage = s.value(0); // 0=init, 1=sdpa, 2=bad, 3=wrong, 4=repair(ask), 5=correct, 6=mean, 7=flash
  const chunkStage = s.value(0); // 0=empty, 1=chunk(valid), 2=leak(q3 sees k4!), 3=boundary(sealed), 4=compare

  const title = heroTitle(['Which values can the', 'latest query see?'], {
    x: -855,
    y: -445,
    size: 50,
    lineHeight: 58,
    accent: ROLE.alert,
    eyebrow: 'NON-SQUARE CAUSAL MASKS · DECODE & CHUNKS',
  });

  const live = guardedDynamic(1, () => {
    const ls = Math.round(leftStage.value);
    const cs = Math.round(chunkStage.value);
    const nodes = [rule(15, -310, 15, 390, COSMOS.rule, 1.6).opacity(0.6)];

    // --- LEFT: Single latest query at absolute position 2 over values [1, 2, 9] ---
    nodes.push(
      txt(
        'CACHED VALUES · ALL SCORES = 0 · QUERY AT POS 2',
        -430,
        -258,
        26,
        COSMOS.muted,
        'mono',
        'center',
      ),
    );

    const cardW = 195;
    const cardH = 126;
    const xs = [-675, -430, -185];
    const cy = -115;

    for (let k = 0; k < 3; k++) {
      const masked = ls >= 2 && ls < 5 && k > 0;
      const repaired = ls >= 5;
      const col = masked ? ROLE.alert : repaired ? ROLE.value : ROLE.key;
      nodes.push(
        lumBar(xs[k], cy, cardW, cardH, {
          color: col,
          fillOpacity: masked ? 0.14 : repaired ? 0.34 : 0.24,
          strokeWidth: masked ? 2.4 : 2.6,
          dash: masked ? [7, 5] : undefined,
          glow: masked ? 5 : repaired ? 10 : 5,
          radius: 10,
          opacity: masked ? 0.55 : 1,
        }),
        txt(`key ${k}`, xs[k], cy - 34, 26, COSMOS.muted, 'mono', 'center'),
        txt(
          masked ? `${vals[k]}  (×)` : String(vals[k]),
          xs[k],
          cy + 16,
          40,
          masked ? ROLE.alert : COSMOS.ink,
          'mono',
          'center',
        ),
      );
    }

    // Weights & output readouts (strictly withholding [1/3,1/3,1/3] and 4 until c.after('correct') / c.after('mean')!)
    const weightText =
      ls >= 5
        ? 'Visible weights:  [ ⅓ ,  ⅓ ,  ⅓ ]'
        : ls >= 2
          ? 'Upper-left mask weights:  [ 1 ,  0 ,  0 ]'
          : 'Equal raw scores  →  softmax weights visible keys equally';
    const weightCol = ls >= 5 ? ROLE.query : ls >= 2 ? ROLE.alert : COSMOS.muted;
    nodes.push(txt(weightText, -430, 32, 30, weightCol, ls >= 2 ? 'mono' : 'sans', 'center'));

    if (ls === 3 || ls === 4) {
      nodes.push(
        txt(
          `Upper-left SDPA output = ${vals[0]}  (blind to k1, k2!)`,
          -430,
          118,
          34,
          ROLE.alert,
          'mono',
          'center',
        ).glow(8, ROLE.alert),
      );
    }
    if (ls === 4) {
      nodes.push(
        txt(
          'Using absolute pos 2: which values belong?',
          -430,
          206,
          32,
          ROLE.gold,
          'serif',
          'center',
        ).glow(8, ROLE.gold),
      );
    }
    if (ls >= 6) {
      nodes.push(
        txt(
          `Full-prefix output = (1 + 2 + 9) / 3 = ${exactMean}`,
          -430,
          126,
          36,
          ROLE.gold,
          'mono',
          'center',
        ).glow(9, ROLE.gold),
      );
    }
    if (ls >= 7) {
      nodes.push(
        txt(
          'FlashAttention uses bottom-right alignment · verify your kernel',
          -430,
          218,
          26,
          ROLE.value,
          'sans',
          'center',
        ),
      );
    }

    // --- RIGHT: 2x5 Chunk Visibility Matrix (q3, q4 vs keys 0..4) ---
    const rx0 = 185;
    const ry0 = -155;
    const cw = 112;
    const ch = 104;
    const gap = 14;
    const qRows = ['q3', 'q4'];

    nodes.push(
      txt(
        '2-TOKEN CHUNK MASK · ABSOLUTE KEY POSITION',
        480,
        -258,
        26,
        COSMOS.muted,
        'mono',
        'center',
      ),
    );

    for (let col = 0; col < 5; col++) {
      const cx = rx0 + col * (cw + gap) + cw / 2;
      nodes.push(txt(`k${col}`, cx, ry0 - 34, 26, COSMOS.muted, 'mono', 'center'));
    }

    for (let r = 0; r < 2; r++) {
      const my = ry0 + r * (ch + gap) + ch / 2;
      nodes.push(txt(qRows[r], rx0 - 30, my, 32, ROLE.query, 'mono', 'right'));
      for (let col = 0; col < 5; col++) {
        const cx = rx0 + col * (cw + gap) + cw / 2;
        const isFutureCell = r === 0 && col === 4;
        let fillOp = 0.08;
        let colHex = COSMOS.dim;
        let mark = '';
        let glow = 0;

        if (cs === 1 || cs >= 3) {
          if (!isFutureCell) {
            fillOp = 0.36;
            colHex = ROLE.key;
            mark = '✓';
            glow = 6;
          } else {
            fillOp = 0.14;
            colHex = ROLE.value;
            mark = '−∞';
            glow = cs >= 3 ? 8 : 2;
          }
        } else if (cs === 2) {
          if (isFutureCell) {
            fillOp = 0.48;
            colHex = ROLE.alert;
            mark = 'LEAK';
            glow = 12;
          } else {
            fillOp = 0.3;
            colHex = ROLE.key;
            mark = '✓';
            glow = 4;
          }
        }

        nodes.push(
          lumBar(cx, my, cw, ch, {
            color: colHex,
            fillOpacity: fillOp,
            strokeWidth: isFutureCell && cs >= 2 ? 3 : 1.8,
            glow,
            radius: 8,
          }),
        );
        if (mark) {
          nodes.push(txt(mark, cx, my, mark === 'LEAK' ? 28 : 34, colHex, 'mono', 'center'));
        }
      }
    }

    if (cs === 2) {
      nodes.push(
        txt(
          'Omitting mask lets q3 read future key k4!',
          480,
          148,
          32,
          ROLE.alert,
          'sans',
          'center',
        ).glow(8, ROLE.alert),
      );
    } else if (cs >= 3) {
      nodes.push(
        txt(
          'Per-row cutoff:  q3 ≤ k3   ·   q4 ≤ k4',
          480,
          148,
          32,
          ROLE.value,
          'mono',
          'center',
        ).glow(7, ROLE.value),
      );
    }
    if (cs >= 4) {
      nodes.push(
        txt(
          'Verify both chunk rows match full-prefix recomputation',
          480,
          224,
          26,
          ROLE.gold,
          'sans',
          'center',
        ),
      );
    }

    // Bottom floating status
    const footText =
      cs >= 4
        ? 'Check single-query and multi-token chunk masks against full-prefix parity'
        : ls === 1
          ? 'PyTorch SDPA is_causal=True aligns rectangular masks to the upper-left'
          : ls >= 5 && cs === 0
            ? 'Omit mask only for a single unpadded latest query with no future keys'
            : 'Build masks from absolute query position (k_pos ≤ q_pos) and valid length';
    nodes.push(txt(footText, 0, 440, 28, COSMOS.muted, 'sans', 'center'));

    return group(...nodes);
  });

  s.add(cinemaAtmosphere(ROLE.alert, ROLE.value), title, live);
  runPhase(s, c, phase, 14);

  playCue(s, c, 'sdpa', (d) => s.play(leftStage.to(1, { duration: Math.min(0.25, d) })), {
    dur: 0.3,
  });
  playCue(s, c, 'bad', (d) => s.play(leftStage.to(2, { duration: Math.min(0.25, d) })), {
    dur: 0.3,
  });
  playCue(s, c, 'wrong', (d) => s.play(leftStage.to(3, { duration: Math.min(0.25, d) })), {
    after: true,
    dur: 0.3,
  });
  playCue(s, c, 'repair', (d) => s.play(leftStage.to(4, { duration: Math.min(0.25, d) })), {
    dur: 0.3,
  });
  playCue(s, c, 'correct', (d) => s.play(leftStage.to(5, { duration: Math.min(0.25, d) })), {
    after: true,
    dur: 0.3,
  });
  playCue(s, c, 'mean', (d) => s.play(leftStage.to(6, { duration: Math.min(0.25, d) })), {
    after: true,
    dur: 0.3,
  });
  playCue(s, c, 'flash', (d) => s.play(leftStage.to(7, { duration: Math.min(0.25, d) })), {
    dur: 0.3,
  });
  playCue(s, c, 'chunk', (d) => s.play(chunkStage.to(1, { duration: Math.min(0.25, d) })), {
    after: true,
    dur: 0.35,
  });
  playCue(s, c, 'leak', (d) => s.play(chunkStage.to(2, { duration: Math.min(0.25, d) })), {
    dur: 0.3,
  });
  playCue(s, c, 'boundary', (d) => s.play(chunkStage.to(3, { duration: Math.min(0.25, d) })), {
    dur: 0.3,
  });
  playCue(s, c, 'compare', (d) => s.play(chunkStage.to(4, { duration: Math.min(0.25, d) })), {
    dur: 0.3,
  });
}
