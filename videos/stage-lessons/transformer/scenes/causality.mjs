// Scene 8: causality: "Which way can a change travel?"
// Perturbations (+4 to coord 1) injected first at last token "the", then at first token "function".
// Strictly withholds comparison deltas until compare-future (after) and compare-past (after),
// pairing a glowing lower-triangular signal graph on the left with Euclidean change bars on the right.
import { line } from 'vizmatic/stage';
import {
  COSMOS,
  glowDot,
  glowingTrail,
  guardedDynamic,
  heroTitle,
  txt,
} from '../../cinematic-kit.mjs';
import {
  INPUT,
  MODEL,
  ROLE,
  WORDS,
  cinemaAtmosphere,
  compute,
  fmt,
  lumBar,
  playCue,
  sum,
} from '../parts.mjs';

export default function causality(s, c) {
  const title = heroTitle(['Causality check:', 'which way can signal flow?'], {
    x: -850,
    y: -430,
    size: 48,
    lineHeight: 56,
    accent: ROLE.attn,
  });

  // Precompute both perturbed block outputs via imported compute()
  const futInput = INPUT.map((r) => [...r]);
  futInput[2][0] += 4;
  const futModel = compute(futInput);
  const futDeltas = WORDS.map((_, i) =>
    Math.sqrt(sum(futModel.Z[i].map((v, j) => (v - MODEL.Z[i][j]) ** 2))),
  );

  const pastInput = INPUT.map((r) => [...r]);
  pastInput[0][0] += 4;
  const pastModel = compute(pastInput);
  const pastDeltas = WORDS.map((_, i) =>
    Math.sqrt(sum(pastModel.Z[i].map((v, j) => (v - MODEL.Z[i][j]) ** 2))),
  );

  const mode = s.value(0); // 0 = perturb last ("the"), 1 = perturb first ("function")
  const deltaAmt = s.value(0); // 0 -> 4 perturbation magnitude
  const showFutCmp = s.value(0); // STRICTLY AFTER compare-future!
  const showPastCmp = s.value(0); // STRICTLY AFTER compare-past!
  const pulse = s.value(0);
  const stageVis = s.value(1);

  const mainLayer = guardedDynamic(stageVis, (alpha) => {
    const isPast = mode.value > 0.5;
    const selected = isPast ? 0 : 2;
    const amt = deltaAmt.value;
    const revealed = isPast ? showPastCmp.value : showFutCmp.value;
    const deltas = isPast ? pastDeltas : futDeltas;
    const accent = isPast ? ROLE.mask : ROLE.query;
    const baseVal = INPUT[selected][0];
    const curVal = baseVal + amt;
    const nodes = [];

    // Top-right perturbation readout
    nodes.push(
      txt(
        isPast ? 'Test 2: perturb FIRST token ("function")' : 'Test 1: perturb LAST token ("the")',
        260,
        -355,
        32,
        accent,
        'mono',
        'center',
      )
        .glow(7, accent)
        .opacity(alpha),
      txt(
        `${WORDS[selected]} coord 1:   ${fmt(baseVal, 2)}  ->  ${fmt(curVal, 2)}  (+${fmt(amt, 1)})`,
        260,
        -292,
        30,
        COSMOS.ink,
        'mono',
        'center',
      ).opacity(alpha),
    );

    // LEFT: Lower-triangular causal routing grid (rows = readers, cols = keys)
    const gridX = -610;
    const gridY = -105;
    const step = 128;
    nodes.push(
      txt(
        'Causal mask paths',
        gridX + step,
        gridY - 115,
        28,
        COSMOS.muted,
        'mono',
        'center',
      ).opacity(alpha),
    );
    WORDS.forEach((w, idx) => {
      nodes.push(
        txt(
          w,
          gridX + idx * step,
          gridY - 58,
          26,
          idx === selected ? accent : COSMOS.dim,
          'mono',
          'center',
        ).opacity(alpha),
        txt(w, gridX - 88, gridY + idx * step, 26, COSMOS.muted, 'mono', 'right').opacity(alpha),
      );
    });

    const pPhase = (pulse.value * 5) % 1;
    for (let r = 0; r < 3; r++) {
      for (let k = 0; k < 3; k++) {
        const cx = gridX + k * step;
        const cy = gridY + r * step;
        const legal = k <= r;
        const hit = legal && k === selected && amt > 0.2;
        const col = !legal ? ROLE.rule : hit ? accent : ROLE.stream;
        nodes.push(
          lumBar(cx, cy, 88, 72, {
            color: col,
            fillOpacity: !legal ? 0.06 : hit ? 0.42 : 0.16,
            strokeWidth: hit ? 3 : 1.6,
            glow: hit ? 11 : 3,
            opacity: alpha,
          }),
          txt(
            !legal ? 'x' : hit ? 'hit' : 'ok',
            cx,
            cy,
            26,
            !legal ? COSMOS.dim : hit ? COSMOS.ink : col,
            'mono',
            'center',
          ).opacity(alpha),
        );
        if (hit && revealed > 0.2 && k === selected) {
          const px = -280 + pPhase * 110;
          nodes.push(
            glowDot(px, cy, {
              radius: 6,
              color: ROLE.attn,
              glow: 10,
              opacity: (1 - pPhase) * alpha,
            }),
          );
        }
      }
    }

    // RIGHT: Euclidean output-row difference meters ||Z'_i - Z_i||_2
    const barLeft = 20;
    const barMaxW = 470;
    const maxScale = 5.0;
    nodes.push(
      txt(
        "Block output change  ||Z' - Z||",
        barLeft + barMaxW / 2,
        -165,
        28,
        COSMOS.muted,
        'mono',
        'center',
      ).opacity(alpha),
    );

    WORDS.forEach((word, i) => {
      const y = gridY + i * step;
      const d = deltas[i];
      const unchanged = d < 1e-12;
      nodes.push(txt(word, barLeft - 28, y, 28, ROLE.stream, 'mono', 'right').opacity(alpha));
      if (revealed > 0.15) {
        const w = Math.min(barMaxW, (d / maxScale) * barMaxW * revealed);
        if (w > 4) {
          nodes.push(
            lumBar(barLeft + w / 2, y, w, 46, {
              color: ROLE.attn,
              fillOpacity: 0.45,
              strokeWidth: 2.5,
              glow: 10,
              opacity: alpha,
            }),
          );
        }
        nodes.push(
          txt(
            unchanged ? '0.000  (unchanged)' : `delta = ${fmt(d, 3)}`,
            unchanged ? barLeft + 20 : barLeft + w + 24,
            y,
            28,
            unchanged ? ROLE.valid : ROLE.attn,
            'mono',
            'left',
          )
            .glow(6, unchanged ? ROLE.valid : ROLE.attn)
            .opacity(revealed * alpha),
        );
      } else {
        nodes.push(
          txt(
            'predict before compare:  ?',
            barLeft + 20,
            y,
            28,
            ROLE.query,
            'mono',
            'left',
          ).opacity(alpha),
        );
      }
    });

    // Axis ticks below meters
    const axisY = 235;
    nodes.push(
      line([barLeft, axisY], [barLeft + barMaxW, axisY], { stroke: '#556894', width: 2 }).opacity(
        alpha,
      ),
    );
    [0, 1, 2, 3, 4, 5].forEach((tick) => {
      const tx = barLeft + (tick / maxScale) * barMaxW;
      nodes.push(
        txt(String(tick), tx, axisY + 36, 26, COSMOS.dim, 'mono', 'center').opacity(alpha),
      );
    });

    // Bottom insight
    const note =
      !isPast && revealed > 0.5
        ? 'Earlier rows stay identically 0.000  ·  future cannot leak backward'
        : isPast && revealed > 0.5
          ? 'Earlier change reaches all later rows through legal causal reads'
          : 'Hold your prediction while the whole block recomputes';
    nodes.push(
      txt(note, 0, 395, 28, revealed > 0.5 ? ROLE.valid : ROLE.query, 'sans', 'center')
        .glow(revealed > 0.5 ? 5 : 0, ROLE.valid)
        .opacity(alpha),
    );

    return nodes;
  });

  s.add(cinemaAtmosphere(ROLE.attn, ROLE.mask), title, mainLayer);

  const fullSpan = Math.max(1, c.end - c.start - 0.6);
  c.at(0.1, () => {
    s.play(pulse.to(1, { duration: fullSpan }));
  });

  // Beat 0: perturb final row "the" by +4 (withhold comparison!)
  playCue(s, c, 'change-future', (d) => s.play(deltaAmt.to(4, { duration: d })), { dur: 0.9 });

  // Beat 1: reveal comparison AFTER compare-future, then switch to perturbing first token (withhold!)
  playCue(s, c, 'compare-future', (d) => s.play(showFutCmp.to(1, { duration: d })), {
    after: true,
    dur: 0.55,
  });
  playCue(
    s,
    c,
    'change-past',
    (d) => s.play(mode.to(1, { duration: Math.min(0.2, d) }), deltaAmt.to(4, { duration: d })),
    { dur: 0.7 },
  );

  // Beat 2: reveal past-to-future propagation AFTER compare-past
  playCue(s, c, 'compare-past', (d) => s.play(showPastCmp.to(1, { duration: d })), {
    after: true,
    dur: 0.6,
  });
  void glowingTrail;
}
