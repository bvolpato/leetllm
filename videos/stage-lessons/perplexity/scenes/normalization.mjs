// Scene 10: normalization: "What survives the trip from text to tokens?"
// View 1 (Beat 0): Luminous optical convergence river: three raw strings ("Ａ··a", "A·a", "a·a")
//   flow through NFKC -> Casefold -> Collapse spaces into one single output "a·a".
// View 2 (Beats 1-2): Raw 6 UTF-8 bytes vs scored 3 UTF-8 bytes for 1.2 nats -> 0.289 vs 0.577 BPB,
//   strictly withholding rates until spoken and highlighting scored 3 bytes AFTER choose-normalized.
// View 3 (Beat 3): Two tokenizations of "a·a" (["a", "·a"] vs ["a", "·", "a"]) under a sliding
//   2-token history window showing how tokenizer cuts change effective byte memory!
import { line } from 'vizmatic/stage';
import {
  COSMOS,
  glowDot,
  glowingTrail,
  guardedDynamic,
  heroTitle,
  txt,
} from '../../cinematic-kit.mjs';
import { ROLE, cinemaAtmosphere, fmt, lumBar, playCue, swapVis, utf8Bytes } from '../parts.mjs';

export default function normalization(s, c) {
  const title = heroTitle(['What survives the trip', 'from text to tokens?'], {
    x: -850,
    y: -435,
    size: 48,
    lineHeight: 56,
    accent: ROLE.prob,
  });

  const vRiver = s.value(1);
  const vBytes = s.value(0);
  const vHistory = s.value(0);

  // View 1 state
  const stageWidth = s.value(0); // NFKC
  const stageCase = s.value(0); // lowercase
  const stageSpace = s.value(0); // collapse spaces
  const branch2 = s.value(0); // "A·a"
  const branch3 = s.value(0); // "a·a"
  const outGlow = s.value(0);

  // View 2 state
  const showRawCount = s.value(0);
  const showRawRate = s.value(0); // AFTER normalized-bpb (0.289)
  const showScoredRate = s.value(0); // AFTER retained-bpb (0.577)
  const chooseScored = s.value(0); // AFTER choose-normalized

  // View 3 state
  const joinedCut = s.value(0);
  const separateCut = s.value(0);
  const histWindow = s.value(0); // slides 2-token history caliper

  // VIEW 1: Converging Unicode normalization flow (zero stacked prose cards!)
  const riverLayer = guardedDynamic(vRiver, (alpha) => {
    const nodes = [];
    const sw = stageWidth.value;
    const sc = stageCase.value;
    const ss = stageSpace.value;
    const b2 = branch2.value;
    const b3 = branch3.value;

    const colXs = [-680, -230, 220, 665];
    const rowYs = [-145, 55, 255];
    const headers = ['Raw text', 'NFKC', 'Casefold', 'Collapse spaces'];

    headers.forEach((h, i) => {
      nodes.push(
        txt(h, colXs[i], -265, 28, i === 3 ? ROLE.prob : COSMOS.muted, 'mono', 'center').opacity(
          alpha,
        ),
      );
    });

    // Subtle vertical filter planes
    [colXs[1], colXs[2], colXs[3]].forEach((fx) => {
      nodes.push(
        line([fx, -225], [fx, 315], { stroke: '#25355e', width: 1.8, dash: [6, 6] }).opacity(
          0.55 * alpha,
        ),
      );
    });

    const rows = [
      { vals: ['A··a', 'A··a', 'a··a'], wideFirst: true, vis: 1, col: ROLE.context },
      { vals: ['A·a', 'A·a', 'a·a'], wideFirst: false, vis: b2, col: ROLE.masked },
      { vals: ['a·a', 'a·a', 'a·a'], wideFirst: false, vis: b3, col: ROLE.good },
    ];

    rows.forEach((row, rIdx) => {
      const ry = rowYs[rIdx];
      // Raw input token always visible on col 0 (render wide fullwidth A cleanly via horizontal scale)
      if (row.wideFirst) {
        nodes.push(
          txt('A', colXs[0] - 54, ry - 2, 54, row.col, 'serif', 'center')
            .glow(7, row.col)
            .opacity(alpha),
          txt('··a', colXs[0] + 22, ry, 42, row.col, 'mono', 'center').opacity(alpha),
        );
      } else {
        nodes.push(txt(row.vals[0], colXs[0], ry, 42, row.col, 'mono', 'center').opacity(alpha));
      }
      if (rIdx === 0) {
        nodes.push(
          txt('U+FF21 (wide)', colXs[0], ry + 48, 26, COSMOS.dim, 'mono', 'center').opacity(alpha),
        );
      }

      // Col 0 -> Col 1 (NFKC)
      const t1 = Math.min(sw, row.vis);
      if (t1 > 0.04) {
        const x1 = colXs[0] + 105;
        const x2 = colXs[1] - 105;
        nodes.push(
          glowingTrail(
            [
              [x1, ry],
              [x1 + (x2 - x1) * t1, ry],
            ],
            { color: row.col, width: 3.6, glow: 8, opacity: alpha },
          ),
        );
        if (t1 > 0.75) {
          nodes.push(txt(row.vals[1], colXs[1], ry, 42, row.col, 'mono', 'center').opacity(alpha));
          if (rIdx === 0) {
            nodes.push(
              txt('U+0041', colXs[1], ry + 48, 26, COSMOS.dim, 'mono', 'center').opacity(alpha),
            );
          }
        }
      }

      // Col 1 -> Col 2 (Casefold)
      const t2 = Math.min(sc, row.vis);
      if (t2 > 0.04) {
        const x1 = colXs[1] + 105;
        const x2 = colXs[2] - 105;
        nodes.push(
          glowingTrail(
            [
              [x1, ry],
              [x1 + (x2 - x1) * t2, ry],
            ],
            { color: row.col, width: 3.6, glow: 8, opacity: alpha },
          ),
        );
        if (t2 > 0.75) {
          nodes.push(txt(row.vals[2], colXs[2], ry, 42, row.col, 'mono', 'center').opacity(alpha));
          if (rIdx === 0) {
            nodes.push(
              txt('U+0061', colXs[2], ry + 48, 26, COSMOS.dim, 'mono', 'center').opacity(alpha),
            );
          }
        }
      }

      // Col 2 -> Col 3 (Converge into single "a·a" node!)
      const t3 = Math.min(ss, row.vis);
      if (t3 > 0.04) {
        const x1 = colXs[2] + 105;
        const x2 = colXs[3] - 110;
        const cy = rowYs[1];
        nodes.push(
          glowingTrail(
            [
              [x1, ry],
              [x1 + (x2 - x1) * t3, ry + (cy - ry) * t3],
            ],
            { color: ROLE.prob, width: 4, glow: 10, opacity: alpha },
          ),
        );
      }
    });

    // Converged output beacon at col 3
    if (ss > 0.5) {
      const og = outGlow.value;
      nodes.push(
        lumBar(colXs[3], rowYs[1], 190, 96, {
          color: ROLE.prob,
          fillOpacity: 0.32 + 0.16 * og,
          strokeWidth: 3.2,
          glow: 14,
          radius: 14,
          opacity: ss * alpha,
        }),
        txt('a·a', colXs[3], rowYs[1], 48, ROLE.prob, 'mono', 'center')
          .glow(10, ROLE.prob)
          .opacity(ss * alpha),
      );
    }

    nodes.push(
      txt(
        ss > 0.5 && b3 > 0.5
          ? 'Many-to-one: given "a·a", which original string produced it?'
          : 'Each dot marks one space  ·  lossy normalization merges distinct inputs',
        0,
        390,
        30,
        ROLE.observed,
        'serif',
        'center',
      ).opacity(alpha),
    );

    return nodes;
  });

  // VIEW 2: Raw 6 UTF-8 bytes vs Scored 3 UTF-8 bytes (1.2 nats -> 0.289 vs 0.577 BPB)
  const bytesLayer = guardedDynamic(vBytes, (alpha) => {
    const nodes = [];
    const rawArr = utf8Bytes('Ａ  a'); // 6 bytes: EF BC A1 20 20 61
    const keptArr = utf8Bytes('a a'); // 3 bytes: 61 20 61
    const totalNats = 1.2;
    const rawBpb = totalNats / (rawArr.length * Math.LN2); // 0.289
    const keptBpb = totalNats / (keptArr.length * Math.LN2); // 0.577
    const sr = showRawRate.value;
    const sk = showScoredRate.value;
    const ch = chooseScored.value;

    nodes.push(
      txt(
        'Same model prediction of "a·a"  ·  total loss = 1.2 nats',
        0,
        -255,
        32,
        ROLE.observed,
        'mono',
        'center',
      ).opacity(alpha),
    );

    const rows = [
      {
        title: 'Original raw text',
        bytes: rawArr,
        y: -75,
        col: ROLE.context,
        rateLabel: 'bits / raw byte',
        rateVal: sr > 0.5 ? fmt(rawBpb, 3) : '…',
        chosen: false,
      },
      {
        title: 'Normalized scored text',
        bytes: keptArr,
        y: 165,
        col: ROLE.prob,
        rateLabel: 'bits / scored byte',
        rateVal: sk > 0.5 ? fmt(keptBpb, 3) : '…',
        chosen: ch > 0.5,
      },
    ];

    rows.forEach((row) => {
      nodes.push(
        txt(row.title, -830, row.y - 22, 34, row.col, 'serif', 'left').opacity(alpha),
        txt(
          `${row.bytes.length} UTF-8 bytes`,
          -830,
          row.y + 30,
          28,
          COSMOS.muted,
          'mono',
          'left',
        ).opacity((0.55 + 0.45 * showRawCount.value) * alpha),
      );

      // Hex byte cells
      row.bytes.forEach((b, j) => {
        const bx = -320 + j * 116;
        nodes.push(
          lumBar(bx, row.y, 96, 84, {
            color: row.col,
            fillOpacity: 0.28,
            strokeWidth: 2.4,
            glow: 7,
            radius: 8,
            opacity: alpha,
          }),
          txt(
            b.toString(16).toUpperCase().padStart(2, '0'),
            bx,
            row.y,
            34,
            row.col,
            'mono',
            'center',
          ).opacity(alpha),
        );
      });

      // Right-hand BPB readout
      const rx = 625;
      nodes.push(
        txt(row.rateLabel, rx, row.y - 42, 26, COSMOS.muted, 'mono', 'center').opacity(alpha),
        txt(row.rateVal, rx, row.y + 20, 50, row.chosen ? ROLE.good : row.col, 'mono', 'center')
          .glow(row.chosen ? 12 : 6, row.chosen ? ROLE.good : row.col)
          .opacity(alpha),
      );
      if (row.chosen) {
        nodes.push(
          glowingTrail(
            [
              [rx - 105, row.y + 58],
              [rx + 105, row.y + 58],
            ],
            { color: ROLE.good, width: 5, glow: 12, opacity: ch * alpha },
          ),
        );
      }
    });

    nodes.push(
      txt(
        ch > 0.5
          ? 'Lowercase benchmark: divide both models by the same 3 scored bytes.'
          : 'Which byte denominator belongs on a lowercase, single-spaced benchmark?',
        0,
        365,
        32,
        ch > 0.5 ? ROLE.good : ROLE.observed,
        'serif',
        'center',
      )
        .glow(7, ch > 0.5 ? ROLE.good : ROLE.observed)
        .opacity(alpha),
    );

    return nodes;
  });

  // VIEW 3: Two cuts of "a·a" under a 2-token history window
  const historyLayer = guardedDynamic(vHistory, (alpha) => {
    const nodes = [];
    const jc = joinedCut.value;
    const sc = separateCut.value;
    const hw = histWindow.value;

    const left = -280;
    const unit = 195;

    nodes.push(
      txt(
        'Same 3 bytes "a·a"  ·  compare a 2-token history limit',
        0,
        -245,
        32,
        ROLE.prob,
        'mono',
        'center',
      ).opacity(alpha),
    );

    const configs = [
      {
        name: 'Joined space',
        pieces: ['a', ' a'],
        y: -75,
        col: ROLE.context,
        cut: jc,
        keepBytes: 3,
      },
      {
        name: 'Separate space',
        pieces: ['a', ' ', 'a'],
        y: 175,
        col: ROLE.prob,
        cut: sc,
        keepBytes: 2,
      },
    ];

    configs.forEach((cfg) => {
      const excluded = 3 - cfg.keepBytes;
      nodes.push(
        txt(cfg.name, -820, cfg.y, 38, cfg.col, 'serif', 'left').opacity(alpha),
        lumBar(left + 1.5 * unit, cfg.y, 3 * unit, 92, {
          color: '#344775',
          fillOpacity: 0.16,
          strokeWidth: 2,
          glow: 4,
          radius: 10,
          opacity: alpha,
        }),
      );

      let pos = 0;
      cfg.pieces.forEach((piece, pIdx) => {
        for (const ch of piece) {
          const lost = hw > 0.65 && pos < excluded;
          nodes.push(
            txt(
              ch === ' ' ? '·' : ch,
              left + (pos + 0.5) * unit,
              cfg.y,
              52,
              lost ? COSMOS.dim : COSMOS.ink,
              'mono',
              'center',
            ).opacity((lost ? 0.35 : 1) * alpha),
          );
          pos++;
        }
        if (pIdx < cfg.pieces.length - 1 && cfg.cut > 0.04) {
          const cx = left + pos * unit;
          nodes.push(
            line([cx, cfg.y + 46], [cx, cfg.y + 46 - 92 * cfg.cut], {
              stroke: cfg.col,
              width: 4.5,
            })
              .glow(10, cfg.col)
              .opacity(alpha),
          );
        }
      });

      // Sliding 2-token history rail beneath the bytes
      if (cfg.cut > 0.8) {
        const railStart = left + hw * excluded * unit;
        const railEnd = left + 3 * unit;
        nodes.push(
          glowingTrail(
            [
              [railStart, cfg.y + 72],
              [railEnd, cfg.y + 72],
            ],
            { color: cfg.col, width: 5, glow: 11, opacity: alpha },
          ),
          glowDot(railStart, cfg.y + 72, { radius: 6, color: cfg.col, glow: 10, opacity: alpha }),
          txt(
            hw > 0.65 ? `${cfg.keepBytes} of 3 bytes in view` : `${cfg.pieces.length} tokens`,
            555,
            cfg.y,
            34,
            hw > 0.65 && excluded > 0 ? ROLE.warn : cfg.col,
            'mono',
            'center',
          ).opacity(alpha),
        );
      }
    });

    nodes.push(
      txt(
        hw > 0.65
          ? 'Different tokenizers change effective byte history; train with a shared tokenizer to fix cuts.'
          : 'Each checkpoint scores the segmentation path its own tokenizer learned.',
        0,
        375,
        28,
        ROLE.observed,
        'serif',
        'center',
      ).opacity(alpha),
    );

    return nodes;
  });

  s.add(cinemaAtmosphere(ROLE.prob, ROLE.context), title, riverLayer, bytesLayer, historyLayer);

  // Beat 0: optical convergence river
  playCue(s, c, 'normalizer-width', (d) => s.play(stageWidth.to(1, { duration: d })), {
    dur: 0.65,
  });
  playCue(s, c, 'normalizer-case', (d) => s.play(stageCase.to(1, { duration: d })), { dur: 0.65 });
  playCue(s, c, 'normalizer-spaces', (d) => s.play(stageSpace.to(1, { duration: d })), {
    dur: 0.65,
  });
  playCue(s, c, 'normalizer-output', (d) => s.play(outGlow.to(1, { duration: d })), { dur: 0.5 });
  playCue(s, c, 'normalizer-other-inputs', (d) => s.play(branch2.to(1, { duration: d })), {
    dur: 0.7,
  });
  playCue(s, c, 'normalizer-last', (d) => s.play(branch3.to(1, { duration: d })), { dur: 0.65 });

  // Beat 1-2: swap to 6 vs 3 UTF-8 bytes & BPB rates (strict withholding!)
  c.onBeat(1, () => s.play(swapVis(vRiver, vBytes, 0.55)));
  playCue(s, c, 'raw-byte-count', (d) => s.play(showRawCount.to(1, { duration: d })), { dur: 0.5 });
  playCue(s, c, 'normalized-bpb', (d) => s.play(showRawRate.to(1, { duration: d })), {
    after: true,
    dur: 0.45,
  });
  playCue(s, c, 'retained-bpb', (d) => s.play(showScoredRate.to(1, { duration: d })), {
    after: true,
    dur: 0.45,
  });
  playCue(s, c, 'choose-normalized', (d) => s.play(chooseScored.to(1, { duration: d })), {
    after: true,
    dur: 0.5,
  });

  // Beat 3: swap to 2-token history cuts
  c.onBeat(3, () => s.play(swapVis(vBytes, vHistory, 0.55)));
  playCue(s, c, 'joined-cut', (d) => s.play(joinedCut.to(1, { duration: d })), { dur: 0.6 });
  playCue(s, c, 'separate-cut', (d) => s.play(separateCut.to(1, { duration: d })), { dur: 0.6 });
  playCue(s, c, 'history-limit', (d) => s.play(histWindow.to(1, { duration: d })), { dur: 0.8 });
}
