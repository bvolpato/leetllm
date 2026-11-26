// Scene 6: selection - "Which candidates reach the decoder?"
// Prediction scene: five candidate bars stay visible under a TopK <= 2 cap; strictly withholds
// the winning slots (2 & 4) until selection-b1-1 completes! Then tests negative candidates,
// sweeping JumpReLU threshold line, 4-sentence firing tally waking rare slot 5, emerald residual
// projection for AuxK, and silent-column resampling onto a high-loss input.
import { arrow, assertEqual, dynamic, rect } from 'vizmatic/stage';
import { selectionHistory } from '../../../films/sparse-autoencoders/construction.mjs';
import { OBSERVATION_CONTEXTS, candidates } from '../../../films/sparse-autoencoders/fixtures.mjs';
import { topK } from '../../../films/sparse-autoencoders/model.mjs';
import {
  COSMOS,
  ROLE,
  SLOT_COLOR,
  cinemaAtmosphere,
  cinemaPlane,
  dictionary,
  glowCodeStrip,
  glowDot,
  glowTex,
  heroTitle,
  playCue,
  target,
  txt,
  vec,
} from '../parts.mjs';

const ORDER = [1, 3, 2, 0, 4];
const THETA = { low: 0.2, between: 1.65, window: 2 };

export default function selection(s, c) {
  const kept = topK(candidates, 2);
  assertEqual(kept, [0, 2.4, 0, 1.7, 0], 'TopK keeps slots 2 & 4 at full size');
  const history = selectionHistory({
    'selection-rare-context': { phase: 'after' },
    'selection-auxiliary-signal': { phase: 'after' },
  });
  assertEqual(history.counts, [0, 3, 0, 0, 1], 'window firing counts');
  const [first, second] = OBSERVATION_CONTEXTS.map((ctx) => ctx.pre);

  const atmo = cinemaAtmosphere(ROLE.other, ROLE.mark);
  const title = heroTitle(['Which candidates reach', 'the decoder?'], {
    x: -855,
    y: -435,
    size: 48,
    lineHeight: 56,
    accent: ROLE.mark,
  });

  const b = cinemaPlane(s, {
    cx: -365,
    cy: 95,
    width: 960,
    height: 700,
    x: [-1.3, 2.9],
    y: [-1.4, 1.8],
  });

  // Live selection mode: 0 = all positive, 1 = TopK(2), 2 = threshold > theta, 3 = AuxK residual view
  const mode = s.value(0);
  let z;
  const support = () => {
    const vals = z.z.map((v) => v.value);
    if (mode.value < 0.5) return vals.map((v) => v > 0);
    if (mode.value < 1.5) return topK(vals, 2).map((v) => v > 0);
    if (mode.value < 2.5) return vals.map((v) => v > z.threshold.value);
    return vals.map(() => false);
  };

  z = glowCodeStrip(s, {
    x: 515,
    y: -175,
    width: 650,
    height: 290,
    max: 3.2,
    colors: SLOT_COLOR,
    start: candidates,
    digits: 2,
    numbersOnTop: true,
    readKeep: (i) => (support()[i] ? 1 : 0),
  });
  const valOf = (i) => (support()[i] ? Math.max(0, z.z[i].value) : 0);

  const startOf = (k) =>
    ORDER.slice(0, k).reduce((sum, i) => vec.add(sum, vec.scale(dictionary[i], valOf(i))), [0, 0]);
  const chain = ORDER.map((i, k) =>
    b.arrowOf(
      () => startOf(k),
      () => startOf(k + 1),
      SLOT_COLOR[i],
      { width: 6.5 },
    ),
  );
  const rebuiltRing = b.ringOf(() => startOf(ORDER.length), ROLE.activation, 20, 4);

  s.add(atmo, title, b.node, chain, rebuiltRing, z.rail, z.glyphs, z.bars, z.numbers);

  const rx = 515;
  const tallyY = 20;
  const ruleY = 120;
  const factY = 225;
  const noteY = 330;

  // --- Beat 0-1: TopK prediction (strictly withheld until selection-b1-1 after!) ---
  const topkRule = txt(
    'Keep up to 2 positive entries',
    rx,
    ruleY,
    34,
    COSMOS.ink,
    'sans',
    'center',
  );
  const slotIds = dictionary.map((_, i) =>
    txt(String(i + 1), z.x(i), tallyY, 28, COSMOS.muted, 'mono', 'center'),
  );
  const question = txt(
    'Which two slots will write?',
    rx,
    noteY,
    36,
    ROLE.mark,
    'serif',
    'center',
  ).glow(7, ROLE.mark);
  const activeCount = dynamic(() => {
    const count = dictionary.filter((_, i) => valOf(i) > 1e-6).length;
    return txt(
      `Active: ${count} of ${dictionary.length}`,
      rx,
      factY,
      36,
      ROLE.mark,
      'mono',
      'center',
    ).glow(6, ROLE.mark);
  });
  const fullSize = txt(
    'Original magnitudes preserved (no L1 shrink)',
    rx,
    noteY,
    26,
    COSMOS.muted,
    'sans',
    'center',
  );
  const underCap = txt(
    '1 positive candidate, 2 slots available',
    rx,
    noteY,
    28,
    ROLE.other,
    'sans',
    'center',
  );

  c.show('sel-topk', topkRule);
  c.show('sel-question', [...slotIds, question]);
  c.hide('selection-b1-1', question);
  c.show('selection-b1-1', activeCount, { after: true });
  c.after('selection-b1-1', () => s.play(mode.to(1, { duration: 0.01 })));
  c.show('sel-original', fullSize);
  c.hide('sel-fewer', fullSize);
  c.show('sel-cap', underCap);
  playCue(
    s,
    c,
    'sel-fewer',
    (d) => s.play(...z.z.map((v, i) => v.to(i === 1 ? candidates[i] : -0.05, { duration: d }))),
    { offset: 0.35, dur: 0.95 },
  );

  // --- Beat 2: Fixed threshold & JumpReLU ---
  const threshReadout = dynamic(() =>
    txt(
      `Threshold  θ = ${z.threshold.value.toFixed(2)}`,
      rx,
      ruleY,
      36,
      ROLE.mark,
      'mono',
      'center',
    ).glow(6, ROLE.mark),
  );
  const jumpEq = glowTex('\\text{JumpReLU:}\\quad z = u \\cdot [\\,u > \\theta\\,]', {
    x: rx,
    y: noteY,
    size: 38,
    color: ROLE.other,
    glow: 6,
  });
  const estimatorNote = txt(
    'Step has zero slope: θ needs a gradient estimator',
    rx,
    noteY,
    26,
    COSMOS.muted,
    'sans',
    'center',
  );

  c.onBeat(2, () =>
    s.play(
      mode.to(2, { duration: 0.01 }),
      ...first.map((u, i) => z.z[i].to(u, { duration: 0.45 })),
      z.threshold.to(THETA.low, { duration: 0.45 }),
    ),
  );
  c.swap('sel-threshold', [topkRule, underCap, ...slotIds], [threshReadout, z.cut]);
  c.on('selection-b2-1', () => {
    s.play(z.threshold.to(0.45, { duration: 0.6 }));
    s.play(z.threshold.to(THETA.between, { duration: 1.1 }));
  });
  playCue(
    s,
    c,
    'sel-varies',
    (d) => s.play(...second.map((u, i) => z.z[i].to(u, { duration: d }))),
    { dur: 0.8 },
  );
  c.show('sel-jump', jumpEq);
  c.swap('sel-estimator', jumpEq, estimatorNote);

  // --- Beat 3: Observation window firing tally, rare windmill sentence, AuxK & resampling ---
  const counts = dictionary.map(() => s.value(0));
  const tallyDots = dynamic(() =>
    counts.flatMap((cnt, i) =>
      Array.from({ length: Math.round(cnt.value) }, (_, k) =>
        glowDot(z.x(i) + (k - (Math.round(cnt.value) - 1) / 2) * 24, tallyY, {
          radius: 8,
          color: SLOT_COLOR[i],
          glow: 10,
        }),
      ),
    ),
  );
  const tallyCaption = txt(
    'Firing count in window',
    rx,
    tallyY + 42,
    26,
    COSMOS.muted,
    'sans',
    'center',
  );

  const ctxIdx = s.value(0);
  const sentenceTxt = dynamic(() =>
    txt(
      `"${OBSERVATION_CONTEXTS[Math.round(ctxIdx.value)].text}"`,
      rx,
      ruleY + 25,
      38,
      COSMOS.ink,
      'serif',
      'center',
    ),
  );
  const colsPlane = dictionary.map((d, i) =>
    b.arrowOf([0, 0], d, () => (counts[i].value > 0.5 ? SLOT_COLOR[i] : '#435275'), {
      width: 5.5,
      glow: 6,
    }),
  );

  const feed = (idx) => {
    const pre = OBSERVATION_CONTEXTS[idx].pre;
    s.play(
      ctxIdx.to(idx, { duration: 0.01 }),
      ...pre.map((u, i) => z.z[i].to(u, { duration: 0.3 })),
    );
    const fired = pre.findIndex((u) => u > THETA.window);
    s.play(counts[fired].to(counts[fired].value + 1, { duration: 0.18 }));
  };

  c.swap(
    3,
    [threshReadout, estimatorNote, activeCount, ...chain, rebuiltRing],
    [...colsPlane, sentenceTxt],
  );
  c.onBeat(3, () => s.play(z.threshold.to(THETA.window, { duration: 0.3 })));
  c.show('selection-b3-1', [tallyDots, tallyCaption]);
  c.on('selection-b3-1', () => {
    feed(0);
    s.wait(0.6);
    feed(1);
    s.wait(0.6);
    feed(2);
  });

  const silentNote = txt(
    'Silent so far: slots 1, 3, 4, 5',
    rx,
    noteY,
    28,
    COSMOS.muted,
    'sans',
    'center',
  );
  const awakeNote = txt(
    'Slot 5 wakes on the windmill sentence!',
    rx,
    noteY,
    30,
    ROLE.mark,
    'sans',
    'center',
  ).glow(7, ROLE.mark);
  c.show('selection-b3-1', silentNote, { after: true, lead: -1.1 });
  c.on('selection-rare-context', () => feed(3), 0.7);
  c.swap('selection-rare-context', silentNote, awakeNote, { lead: -1.4 });

  // AuxK residual shadow onto silent columns
  const residualArrow = b.arrowOf([0, 0], history.residual, ROLE.residual, { width: 7.5 });
  const residualTag = b.tagOf(history.residual, 'residual', ROLE.residual, [-12, 42], {
    font: 'sans',
    size: 30,
  });
  const quiet = history.counts.map((cnt, i) => (cnt === 0 ? i : -1)).filter((i) => i >= 0);
  const resShadows = quiet
    .filter((i) => history.signals[i] > 0)
    .map((i) => b.shadowOf(history.residual, dictionary[i], ROLE.mark, 8));

  const sigVal = dictionary.map(() => s.value(0));
  const auxBars = dynamic(() =>
    sigVal.flatMap((sh, i) => {
      const h = history.signals[i] * sh.value * z.perUnit;
      if (h < 2) return [];
      return [
        rect(z.barWidth, h, {
          fill: null,
          stroke: ROLE.mark,
          width: 3.5,
          radius: 6,
        })
          .at(z.x(i), z.base - h / 2)
          .glow(8, ROLE.mark),
      ];
    }),
  );
  const auxNums = quiet
    .filter((i) => history.signals[i] > 0)
    .map((i) =>
      txt(
        history.signals[i].toFixed(1),
        z.x(i),
        z.base - history.signals[i] * z.perUnit - 24,
        28,
        ROLE.mark,
        'mono',
        'center',
      ),
    );

  const auxHead = txt(
    'AuxK: silent slots predict residual',
    rx,
    ruleY + 25,
    32,
    ROLE.mark,
    'sans',
    'center',
  ).glow(6, ROLE.mark);
  const auxSub = txt(
    'Main reconstruction keeps its support cap',
    rx,
    factY + 12,
    26,
    COSMOS.ink,
    'sans',
    'center',
  );
  const winTag = txt('Window: 10M tokens', rx - 145, noteY, 28, ROLE.other, 'mono', 'center');
  const wtTag = txt('AuxK weight: 1/32', rx + 170, noteY, 28, ROLE.other, 'mono', 'center');

  c.swap(
    'selection-auxiliary-signal',
    [sentenceTxt, awakeNote],
    [residualArrow, residualTag, ...resShadows, auxBars, auxHead],
  );
  playCue(
    s,
    c,
    'selection-auxiliary-signal',
    (d) =>
      s.play(
        b.ticksAlpha.to(0, { duration: Math.min(0.25, d) }),
        mode.to(3, { duration: 0.01 }),
        ...sigVal.map((sh) => sh.to(1, { duration: d })),
      ),
    { offset: 0.4, dur: 0.9 },
  );
  c.show('selection-auxiliary-signal', auxNums, { after: true });
  c.show('sel-auxk', auxSub);
  c.show('sel-window', winTag);
  c.show('sel-weight', wtTag);

  // Resampling: swing silent column 0 toward sampled high-loss input
  const aim = s.value(0);
  const unitInput = vec.scale(target, 1 / vec.length(target));
  const resetDir = () => {
    const ang = Math.atan2(unitInput[1], unitInput[0]) * aim.value;
    return [Math.cos(ang), Math.sin(ang)];
  };
  const resetArrow = b.arrowOf([0, 0], resetDir, ROLE.first, { width: 6.5 });
  const glyphX = z.x(0);
  const glyphY = z.base + 32;
  const resetGlyph = dynamic(() => {
    const d = resetDir();
    const reach = 19;
    return arrow(
      [glyphX - d[0] * reach, glyphY + d[1] * reach],
      [glyphX + d[0] * reach, glyphY - d[1] * reach],
      { stroke: ROLE.first, width: 4.5, tip: 14 },
    ).glow(6, ROLE.first);
  });
  const sampleDot = b.dotOf(target, ROLE.activation, 11, 14);
  const sampleTag = b.tagOf(target, 'high-loss input', ROLE.activation, [-20, -44], {
    font: 'sans',
    size: 28,
  });
  const aimLine = b.segmentOf(resetDir, target, COSMOS.dim, { dash: [9, 8], width: 3, glow: 0 });
  const resampleTxt = txt(
    'Resampling: reset silent column',
    rx,
    ruleY + 25,
    32,
    ROLE.first,
    'sans',
    'center',
  ).glow(6, ROLE.first);
  const spikeTxt = txt(
    'Can trigger a temporary loss spike',
    rx,
    factY + 12,
    30,
    ROLE.wrong,
    'sans',
    'center',
  ).glow(7, ROLE.wrong);

  c.swap(
    'sel-resample',
    [
      auxHead,
      colsPlane[0],
      z.glyphs[0],
      residualArrow,
      residualTag,
      ...resShadows,
      auxBars,
      ...auxNums,
    ],
    [resampleTxt, resetArrow, resetGlyph, sampleDot, sampleTag, aimLine],
  );
  c.hide('sel-resample', [auxSub, winTag, wtTag, z.cut]);
  playCue(
    s,
    c,
    'sel-resample',
    (d) => s.play(b.ticksAlpha.to(1, { duration: Math.min(0.3, d) }), aim.to(1, { duration: d })),
    { offset: 0.45, dur: 1.7 },
  );
  c.show('sel-spike', spikeTxt);
}
