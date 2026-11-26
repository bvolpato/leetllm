// Scene 26: actual-sampler: "Run the status sampler twice"
// View 1 (Beat 0): Raw logits [2.4, 2.1, 1.2, 0.3] (history contains degraded) -> penalty drops
//   degraded 2.4 -> 2.0 (dec-sampler-penalty) -> T = 0 greedy returns "in" (AFTER dec-sampler-zero).
// View 2 (Beat 1): Same penalized logits at T = 1 -> sorted softmax strip (dec-sampler-probabilities)
//   -> top-p = 0.90 retains in, degraded, on (93.3% mass, AFTER dec-sampler-support).
// View 3 (Beats 2-3): Renormalized 3-token strip + Python seed(0) draw u = 0.844 (dec-sampler-mark),
//   strictly withholding "on" until AFTER dec-sampler-seed!
import { COSMOS, guardedDynamic, heroTitle, txt } from '../../cinematic-kit.mjs';
import {
  ROLE,
  SAMPLER_NAMES,
  SAMPLER_RAW,
  SAMPLER_SEED0_U,
  cinemaAtmosphere,
  decodeRepetition,
  decodeSoftmax,
  decodeSupport,
  fmt,
  lumBar,
  playCue,
  probStrip,
  swapVis,
} from '../parts.mjs';

export default function actualSampler(s, c) {
  const title = heroTitle(['Run the status sampler', 'at T = 0 and T = 1'], {
    x: -850,
    y: -435,
    size: 46,
    lineHeight: 54,
    accent: ROLE.active,
  });

  const penLogits = decodeRepetition(SAMPLER_RAW, [0], 1.2); // [2.0, 2.1, 1.2, 0.3]
  const probs = decodeSoftmax(penLogits);
  const rank = SAMPLER_NAMES.map((_, i) => i).sort((a, b) => penLogits[b] - penLogits[a]);
  const sup = decodeSupport(probs, 'p', 0.9);
  const boundary = sup.values[sup.ids[0]] + sup.values[sup.ids[1]]; // ~0.824

  const vGreedy = s.value(1);
  const vTopP = s.value(0);
  const vDraw = s.value(0);

  const penFrac = s.value(0);
  const zeroDone = s.value(0);
  const probVis = s.value(0);
  const supDone = s.value(0);
  const markVis = s.value(0);
  const seedDone = s.value(0);

  // VIEW 1 (Beat 0): History penalty -> T = 0 greedy
  const greedyLayer = guardedDynamic(vGreedy, (alpha) => {
    const nodes = [];
    const pf = penFrac.value;
    const zd = zeroDone.value > 0.4;

    nodes.push(
      txt(
        'History contains: { degraded }   ·   θ = 1.2',
        -845,
        -260,
        30,
        ROLE.alt,
        'mono',
        'left',
      ).opacity(alpha),
      txt('T = 0  (greedy)', 845, -260, 34, ROLE.winner, 'mono', 'right')
        .glow(7, ROLE.winner)
        .opacity(alpha),
    );

    const barL = -475;
    const scale = 340;
    SAMPLER_NAMES.forEach((name, i) => {
      const y = -135 + i * 112;
      const z = SAMPLER_RAW[i] + (penLogits[i] - SAMPLER_RAW[i]) * pf;
      const isWin = zd && i === rank[0];
      const col = isWin ? ROLE.valid : i === 0 && pf > 0.3 ? ROLE.alt : ROLE.base;
      const w = Math.max(12, z * scale);

      nodes.push(
        txt(name, barL - 30, y, 34, col, 'mono', 'right').opacity(alpha),
        lumBar(barL + w / 2, y, w, 50, {
          color: col,
          fillOpacity: isWin ? 0.56 : 0.34,
          strokeWidth: isWin ? 3 : 2.2,
          glow: isWin ? 12 : 7,
          radius: 7,
          opacity: alpha,
        }),
        txt(
          i === 0 && pf > 0.5 ? `2.4 / 1.2 = ${fmt(z, 1)}` : fmt(z, 1),
          barL + w + 28,
          y,
          30,
          isWin ? ROLE.valid : COSMOS.ink,
          'mono',
          'left',
        ).opacity(alpha),
      );
    });

    nodes.push(
      txt(
        zd ? 'T = 0 -> "in"' : 'Apply repetition penalty before argmax.',
        0,
        365,
        34,
        zd ? ROLE.valid : COSMOS.muted,
        'serif',
        'center',
      )
        .glow(zd ? 7 : 0, ROLE.valid)
        .opacity(alpha),
    );
    return nodes;
  });

  // VIEW 2 (Beat 1): Same penalized logits -> T = 1 softmax + top-p = 0.90
  const topPLayer = guardedDynamic(vTopP, (alpha) => {
    const nodes = [];
    const pv = probVis.value > 0.35;
    const sd = supDone.value > 0.4;

    nodes.push(
      txt(
        'Same penalized logits  ->  T = 1.0, top-p = 0.90',
        -760,
        -255,
        32,
        ROLE.active,
        'mono',
        'left',
      ).opacity(alpha),
      txt(
        sd ? `Retained mass = ${fmt(sup.mass, 3)} (3 tokens)` : 'Sorted descending',
        760,
        -255,
        30,
        sd ? ROLE.valid : COSMOS.muted,
        'mono',
        'right',
      ).opacity(alpha),
    );

    if (pv) {
      nodes.push(
        probStrip({
          left: -760,
          y: 15,
          width: 1520,
          height: 76,
          values: rank.map((i) => probs[i]),
          names: rank.map((i) => SAMPLER_NAMES[i]),
          kept: sd ? [0, 1, 2] : null,
          markerU: 0.9,
          markerLabel: 'Top-p 0.90',
          labelOffsetY: 112,
          pctOffsetY: 152,
          opacity: alpha,
        }),
      );
    } else {
      rank.forEach((id, k) => {
        const x = -540 + k * 360;
        nodes.push(
          lumBar(x, 15, 280, 94, {
            color: ROLE.base,
            fillOpacity: 0.24,
            strokeWidth: 2.2,
            glow: 8,
            radius: 12,
            opacity: alpha,
          }),
          txt(
            `${SAMPLER_NAMES[id]}: ${fmt(penLogits[id], 1)}`,
            x,
            15,
            32,
            COSMOS.ink,
            'mono',
            'center',
          ).opacity(alpha),
        );
      });
    }

    nodes.push(
      txt(
        sd
          ? 'in + degraded = 76.9% < 90%  |  adding "on" reaches 93.3% (broken excluded)'
          : 'Compute softmax probabilities and accumulate to 90%.',
        0,
        365,
        30,
        sd ? ROLE.winner : COSMOS.muted,
        'serif',
        'center',
      )
        .glow(sd ? 6 : 0, ROLE.winner)
        .opacity(alpha),
    );
    return nodes;
  });

  // VIEW 3 (Beats 2-3): Renormalized strip + seed(0) draw u = 0.844 -> "on"
  const drawLayer = guardedDynamic(vDraw, (alpha) => {
    const nodes = [];
    const mk = markVis.value > 0.35;
    const sd = seedDone.value > 0.4;

    nodes.push(
      txt(
        'Renormalized 3-token support (divided by 0.933)',
        -760,
        -245,
        30,
        ROLE.active,
        'mono',
        'left',
      ).opacity(alpha),
      txt('random.Random(0)', 760, -245, 30, ROLE.winner, 'mono', 'right').opacity(alpha),
      probStrip({
        left: -760,
        y: 25,
        width: 1520,
        height: 82,
        values: sup.ids.map((i) => sup.values[i]),
        names: sup.ids.map((i) => SAMPLER_NAMES[i]),
        kept: sd ? [2] : null,
        markerU: mk ? SAMPLER_SEED0_U : null,
        markerLabel: mk ? `u = ${fmt(SAMPLER_SEED0_U, 3)}` : '',
        markerColor: ROLE.winner,
        labelOffsetY: 116,
        pctOffsetY: 156,
        opacity: alpha,
      }),
      txt(
        sd
          ? `in + degraded end at ${fmt(boundary, 3)} < 0.844  ->  Python returns "on" (greedy returned "in")`
          : mk
            ? `Python seed 0 puts u = ${fmt(SAMPLER_SEED0_U, 3)}. Which word owns that point?`
            : 'Normalized survivors span [0, 1].',
        0,
        335,
        32,
        sd ? ROLE.valid : ROLE.winner,
        'serif',
        'center',
      )
        .glow(sd ? 7 : 0, sd ? ROLE.valid : ROLE.winner)
        .opacity(alpha),
      txt(
        'Invalid history IDs, NaN/+Inf, and all-masked rows are rejected before drawing.',
        0,
        405,
        26,
        COSMOS.muted,
        'sans',
        'center',
      ).opacity(alpha),
    );
    return nodes;
  });

  s.add(cinemaAtmosphere(ROLE.active, ROLE.valid), title, greedyLayer, topPLayer, drawLayer);

  playCue(s, c, 'dec-sampler-penalty', (d) => s.play(penFrac.to(1, { duration: d })), { dur: 0.8 });
  playCue(s, c, 'dec-sampler-zero', (d) => s.play(zeroDone.to(1, { duration: d })), {
    after: false,
    offset: 0.1,
    dur: 0.45,
  });

  c.onBeat(1, () => s.play(swapVis(vGreedy, vTopP, 0.55)));
  playCue(s, c, 'dec-sampler-probabilities', (d) => s.play(probVis.to(1, { duration: d })), {
    dur: 0.6,
  });
  playCue(s, c, 'dec-sampler-support', (d) => s.play(supDone.to(1, { duration: d })), {
    after: true,
    dur: 0.55,
  });

  c.onBeat(2, () => s.play(swapVis(vTopP, vDraw, 0.55)));
  playCue(s, c, 'dec-sampler-mark', (d) => s.play(markVis.to(1, { duration: d })), { dur: 0.65 });
  playCue(s, c, 'dec-sampler-seed', (d) => s.play(seedDone.to(1, { duration: d })), {
    after: true,
    dur: 0.55,
  });
}
