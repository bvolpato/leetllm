import {
  C,
  text,
  mono,
  serif,
  rect,
  line,
  dot,
  arrow,
  head,
  note,
  rack,
  areas,
  mix,
  clip,
} from './artwork.mjs';
import { cue, ink } from './clip-scenes.mjs';
import {
  actor,
  archive,
  allowedRecords,
  cachedImageAllowed,
  imageLedgerSnapshot,
  chooseCandidate,
  initialPrompts,
  revisedPrompts,
  scoreFloor,
  marginFloor,
  patchAttention,
  PATCH_KV,
  workerSchedule,
  prefixCosts,
  pairLogisticLoss,
  reductionDecision,
  relevant,
  hits,
  tagReads,
  recall,
  exact,
  boxScore,
  gates,
} from './comparisons.mjs';

const section = 'Inspection archive';
const f2 = (n) => n.toFixed(2);
const box = (g, s, x, y, w, h, fill = C.white, col = C.ink) => {
  rect(g, x, y, w, h, fill, C.line);
  text(g, s, x + w / 2, y + h / 2 + 10, 28, col, { align: 'center' });
};
function tagStrip(g, x, y, w) {
  rack(g, x, y, w, w * 0.19, null, [0.25, 0.696, 0.42, 0.108]);
}
function grid(g, x, y, w, h, n, color = '#edf5db9a') {
  for (let i = 1; i < n; i++) {
    line(g, x + (w * i) / n, y, x + (w * i) / n, y + h, color, 1.3);
    line(g, x, y + (h * i) / n, x + w, y + (h * i) / n, color, 1.3);
  }
}
export function service(g, k) {
  const b = k.beat.beatIndex;
  head(
    g,
    b === 0 ? 'Can this upload reuse its receipt?' : 'Who can open the cached photograph?',
    section,
  );
  const denied =
    Boolean(cue(k, 3, 'Deny the read', 0)) &&
    !cachedImageAllowed({ ...actor, sites: [] }, archive[0]);
  if (denied) {
    rect(g, 80, 277, 606, 408, C.white);
    rect(g, 86, 283, 594, 396, C.dark);
    serif(g, 'Image unavailable', 383, 488, 41, C.white, 'center');
    text(g, 'Access to East was revoked.', 383, 552, 26, C.light, { align: 'center' });
  } else rack(g, 86, 283, 594, 396);
  if (b === 0) {
    const same = cue(k, 0, 'An identical retry', 0),
      changed = cue(k, 0, 'Changed metadata', 0),
      conflict = k.elapsed >= k.speechDuration,
      initial = cue(k, 0, 'Bind a retry key', 0);
    const state = imageLedgerSnapshot(conflict ? 3 : same ? 2 : initial ? 1 : 0);
    text(g, 'Immutable image reference', 779, 294, 29, C.muted);
    mono(g, 'Ops/image17@v1', 779, 350, 38);
    line(g, 777, 399, 1508, 399);
    text(g, 'Tenant / key', 780, 460, 26, C.muted);
    mono(g, 'Ops / ingest-17', 1100, 460, 29);
    text(g, 'Metadata schema', 780, 521, 26, C.muted);
    mono(g, changed ? '2  (stored 1)' : '1', 1100, 521, 29);
    text(g, 'Ledger entries', 780, 582, 26, C.muted);
    mono(g, state.count, 1100, 582, 29);
    serif(
      g,
      changed && !conflict ? 'Compare fingerprints' : (state.result?.status ?? 'Check the upload'),
      779,
      690,
      49,
      conflict ? C.red : C.teal,
    );
    note(g, 'Keep the immutable photo version, its tenant, site and request fingerprint together.');
    return;
  }
  const revoked = Boolean(cue(k, 2, 'Revoke East access', 0));
  const deny = denied;
  const who = revoked ? { ...actor, sites: [] } : actor;
  const allowed = allowedRecords(who, ['East', 'West'], 13);
  text(g, 'Requested sites', 778, 287, 26, C.muted);
  mono(g, 'East + West', 1105, 287, 30);
  text(g, 'Current permission', 778, 346, 26, C.muted);
  mono(g, revoked ? 'No sites' : 'East', 1105, 346, 30);
  text(g, 'Paired index generation', 778, 405, 26, C.muted);
  mono(g, '13', 1267, 405, 30);
  line(g, 777, 442, 1510, 442);
  archive.forEach((r, i) => {
    const y = 501 + i * 71;
    mono(g, r.id, 779, y, 28);
    text(g, r.site, 867, y, 29);
    mono(g, 'gen ' + r.generation, 1005, y, 26, C.muted);
    const cached = r.id === '17' && revoked;
    text(
      g,
      cached
        ? deny
          ? cachedImageAllowed(who, r)
            ? 'Allow read'
            : 'Read denied'
          : 'Cached · open?'
        : allowed.includes(r)
          ? 'Searchable'
          : 'Excluded',
      1506,
      y,
      29,
      cached && deny ? C.red : allowed.includes(r) ? C.teal : C.muted,
      { align: 'right' },
    );
  });
  note(
    g,
    b === 3
      ? 'Recheck current access on a cached hit and again before analysis.'
      : 'Photo 17   ·   East   ·   immutable version 1',
  );
}
export function capacity(g, k) {
  const capped = cue(k, 1, 'Limit analysis to one worker', 0);
  const work = workerSchedule(capped ? 1 : 2),
    results = Boolean(cue(k, 2, 'One hundred and two hundred', 0));
  const settled = capped ? results : Boolean(cue(k, 0, 'Our search target', 0));
  head(g, 'Can a search finish while analysis runs?', section);
  const x = 322,
    s = 0.556,
    limit = x + 300 * s;
  text(g, 'Analysis jobs: 1,000 ms each', 86, 254, 26, C.muted);
  text(g, 'Searches: 100 ms each', 700, 254, 26, C.muted);
  text(g, '300 ms target', limit, 344, 24, C.red, { align: 'center' });
  line(g, limit, 356, limit, 646, C.red, 3);
  for (let i = 0; i < 2; i++) {
    const y = 414 + i * 122;
    text(g, 'Worker ' + (i + 1), 91, y + 36, 30);
    line(g, x, y + 60, x + 2000 * s, y + 60, C.line, 2);
  }
  work.forEach((job) => {
    const y = 414 + 122 * job.worker,
      left = x + s * job.start,
      width = s * (job.end - job.start);
    if (capped && job.type === 'search' && !results) return;
    rect(g, left, y, width - 1, 56, job.type === 'analysis' ? '#adc4b7' : '#dfb086', C.paper, 2);
    text(g, job.id, left + width / 2, y + 36, job.type === 'analysis' ? 30 : 24, C.ink, {
      align: 'center',
    });
  });
  [0, 500, 1000, 1500, 2000].forEach((t) => {
    line(g, x + s * t, 636, x + s * t, 644, C.muted);
    mono(g, t, x + s * t, 677, 23, C.muted, 'center');
  });
  mono(g, 'Time since arrival (ms)', 819, 731, 26, C.muted, 'center');
  if (settled) {
    const ends = work.filter((j) => j.type === 'search').map((j) => j.end);
    note(
      g,
      'Search completions   ' +
        ends.join(' ms and ') +
        ' ms     ·     Analysis completes at ' +
        Math.max(...work.filter((j) => j.type === 'analysis').map((j) => j.end)) +
        ' ms',
    );
  } else
    note(
      g,
      capped
        ? 'Same four jobs, same arrivals. Where do the two searches finish?'
        : 'A1 and A2 are analysis jobs. S1 and S2 are the waiting searches.',
    );
}
export function evidence(g, k) {
  const b = k.beat.beatIndex,
    localized = cue(k, 1, 'ask a grounding model', 0),
    read = cue(k, 2, 'It says RACK seventeen', 0);
  head(g, 'What evidence belongs on this inspection?', section);
  rack(g, 88, 250, 730, 487, localized ? 'vent' : null);
  if (!localized) {
    text(g, 'Search result', 927, 318, 29, C.muted);
    serif(g, 'Photo 17', 923, 424, 80, C.teal);
    text(g, '“Blocked vent on rack door”', 926, 508, 34);
    text(g, 'Can you point to the covered grille?', 925, 629, 30);
  } else {
    text(g, 'Grounding region', 927, 271, 27, C.teal);
    rack(g, 930, 300, 490, 191, 'vent', [0.36, 0.25, 0.45, 0.26]);
    if (b >= 2) {
      text(g, 'OCR source strip', 926, 549, 27, C.muted);
      tagStrip(g, 930, 573, 390);
      if (read) mono(g, 'RACK-17', 929, 710, 42, C.teal);
    } else {
      text(g, 'Box on the original photo', 927, 562, 29);
      text(g, 'Count distinct verified detections.', 927, 629, 28, C.muted);
    }
  }
  note(
    g,
    b === 0
      ? 'The retrieval hit identifies one whole image.'
      : b === 1
        ? 'A grounded region has four edges in the original image coordinates.'
        : 'Photo 17, version 1   ·   Keep the tag reading and vent region with their pixels.',
  );
}
export function pairs(g, k) {
  const b = k.beat.beatIndex;
  head(
    g,
    b === 2
      ? 'How does SigLIP count these four terms?'
      : 'What label does the other view’s caption get?',
    section,
  );
  if (b < 2) {
    rack(g, 83, 273, 563, 372);
    rack(g, 745, 273, 558, 372, null, [0.2, 0.18, 0.63, 0.55]);
    text(g, 'Front view', 84, 683, 26, C.muted);
    serif(g, '“The vent is covered”', 84, 735, 36);
    text(g, 'Close-up of the same grille', 747, 683, 26, C.muted);
    serif(g, '“A cover blocks the grille”', 747, 735, 36);
    const flag = cue(k, 1, 'A negative label', 0);
    if (flag) {
      rect(g, 738, 266, 572, 386, null, C.red, 4);
      line(g, 84, 745, 401, 745, C.red, 3);
    }
    note(
      g,
      flag
        ? 'Front-view caption × close-up photo   ·   Label is negative despite a shared obstruction.'
        : 'Compare the front-view caption with the close-up. How does the batch label that pair?',
      flag ? C.red : C.ink,
    );
  } else {
    const val = pairLogisticLoss(0, true),
      sum = 4 * val,
      full = cue(k, 2, 'The loss is about', 0);
    text(g, 'Supplied logit = 0 for each pair', 90, 269, 29, C.muted);
    for (let i = 0; i < 4; i++) {
      const x = 93 + (i % 2) * 234,
        y = 315 + Math.floor(i / 2) * 157,
        positive = i === 0 || i === 3;
      rect(g, x, y, 211, 131, positive ? '#c5d9c7' : '#e8cdba');
      text(g, positive ? 'Paired (+)' : 'Other (−)', x + 16, y + 43, 26);
      mono(g, pairLogisticLoss(0, positive).toFixed(3), x + 16, y + 99, 36);
    }
    text(g, 'Independent binary losses', 704, 308, 31, C.muted);
    serif(g, '4 × ln(2)', 700, 400, 73);
    line(g, 697, 452, 1450, 452);
    text(g, 'Batch size = 2', 705, 512, 32);
    if (full) mono(g, 'Sum / 2 = ' + (sum / 2).toFixed(3), 703, 603, 48, C.teal);
    if (k.elapsed >= k.speechDuration)
      mono(g, 'Pair mean = sum / 4 ≈ ' + (sum / 4).toFixed(3), 705, 688, 28, C.muted);
    note(g, 'Each pair contributes log(1 + exp(−label × logit)).  Labels are +1 or −1.');
  }
}
export function patches(g, k) {
  const b = k.beat.beatIndex;
  head(
    g,
    b >= 3
      ? 'What example would teach this response format?'
      : 'Which spatial features reach the decoder?',
    section,
  );
  if (b <= 1) {
    rack(g, 88, 237, 491, 491, null, [0.19, 0.035, 0.64, 0.96]);
    const patch = cue(k, 0, 'splits an image into patches', 0.6);
    ink(g, patch, () => grid(g, 88, 237, 491, 491, 14));
    if (b === 0) {
      text(g, '224 × 224 pixels   ·   16 × 16 pixels per patch', 660, 292, 28, C.muted);
      const built = cue(k, 0, 'there are fourteen rows', 1.1);
      const seen = Math.floor(196 * built);
      for (let i = 0; i < 196; i++) {
        const x = 667 + (i % 14) * 38,
          y = 335 + Math.floor(i / 14) * 24;
        rect(g, x, y, 32, 18, i < seen ? (i % 14 === 6 ? C.teal : '#9bbcaf') : '#d5d8c8');
      }
      mono(g, seen + ' patch features', 663, 731, 34, C.teal);
      note(g, 'Keep the patch rows to retain a spatial path back to the tag.');
    } else {
      text(g, 'Vision Transformer', 674, 292, 31);
      text(g, 'Attention can connect distant patch positions.', 674, 344, 28, C.muted);
      const loc = [
        [747, 480],
        [902, 421],
        [1045, 511],
        [1244, 452],
        [1420, 537],
      ];
      loc.slice(1).forEach(([x, y]) => line(g, loc[0][0], loc[0][1], x, y, '#86a69c', 3));
      loc.forEach(([x, y]) => dot(g, x, y, 12, C.teal));
      text(g, 'ResNet', 674, 625, 31);
      text(g, 'Neighboring features mix through successive layers.', 674, 679, 28, C.muted);
      note(g, 'Backbone and preprocessing determine the feature bank a connector receives.');
    }
    return;
  }
  if (b === 2) {
    const projected = cue(k, 2, 'Each row keeps', 0.75);
    text(g, 'Vision features', 107, 292, 29);
    text(g, 'Projected features', 883, 292, 29);
    for (let r = 0; r < 5; r++) {
      const y = 331 + r * 66;
      for (let j = 0; j < 4; j++) rect(g, 108 + j * 49, y, 44, 43, r === 2 ? '#cb8e70' : '#8daea3');
      ink(g, projected, () => {
        for (let j = 0; j < 10; j++)
          rect(g, 891 + j * 49, y, 43, 43, r === 2 ? '#cb8e70' : '#8daea3');
      });
    }
    arrow(g, 385, 483, 807, 483, C.teal, 5);
    serif(g, 'Projector', 595, 442, 43, C.ink, 'center');
    note(g, 'Five example rows enter. Five rows leave. The learned map changes the width.');
    return;
  }
  tagStrip(g, 90, 357, 566);
  text(g, 'Evidence at the decoder', 93, 319, 29, C.muted);
  text(g, 'Question', 769, 305, 25, C.muted);
  serif(g, '“Return the tag as JSON.”', 763, 378, 48);
  line(g, 766, 432, 1506, 432);
  text(g, 'Observed response', 767, 483, 26, C.muted);
  text(g, 'The tag reads RACK-17.', 767, 535, 36);
  if (cue(k, 4, 'Check the dialogue template', 0)) {
    text(g, 'Instruction target', 767, 604, 26, C.teal);
    mono(g, '{"tag":"RACK-17"}', 767, 665, 36, C.teal);
  }
  note(
    g,
    b === 3
      ? 'The answer contains the right tag. What behavior still needs a training signal?'
      : 'Use instruction-response pairs and evaluate the new format on held-out images.',
  );
}
const queries = [
  [Math.SQRT2, 0],
  [0, Math.SQRT2],
];
export function slots(g, k) {
  const b = k.beat.beatIndex;
  head(
    g,
    b === 3
      ? 'Where does the text attend to an image?'
      : 'What fits through a learned visual slot?',
    section,
  );
  if (b < 2) {
    const slotA = cue(k, 1, 'The tag key gets', 0),
      slotB = cue(k, 1, 'Now the vent', 0);
    const patches = {
      tag: { label: 'Tag stroke', x: 333, y: 450, color: C.gold },
      vent: { label: 'Vent edge', x: 325, y: 238, color: C.teal },
      frame: { label: 'Frame', x: 117, y: 408, color: C.blue },
    };
    rack(g, 81, 292, 435, 290);
    for (const { x, y, color } of Object.values(patches))
      dot(g, 81 + 435 * x / 900, 292 + 290 * y / 600, 11, null, color, 4);
    text(g, 'Source patches', 81, 649, 31);
    const basex = 587;
    ['Patch', 'Key', 'Value'].forEach((s, i) =>
      text(g, s, basex + [0, 199, 378][i], 277, 26, C.muted),
    );
    if (slotA) text(g, 'Slot 1', 1174, 277, 26, C.teal);
    if (slotB) text(g, 'Slot 2', 1360, 277, 26, C.red);
    const att = queries.map(patchAttention);
    PATCH_KV.forEach(({ id, key, value }, i) => {
      const y = 351 + i * 87;
      line(g, 584, y + 23, 1509, y + 23);
      dot(g, basex - 19, y - 10, 6, patches[id].color);
      text(g, patches[id].label, basex, y, 29);
      mono(g, '[' + key.join(', ').replace('-', '−') + ']', basex + 199, y, 26);
      mono(g, '[' + value.join(', ') + ']', basex + 378, y, 26);
      if (slotA) mono(g, att[0].weights[i].toFixed(2), 1174, y, 31, C.teal);
      if (slotB) mono(g, att[1].weights[i].toFixed(2), 1360, y, 31, C.red);
    });
    if (slotA) {
      text(g, 'Slot 1   q = [√2, 0]', 584, 628, 27, C.teal);
      mono(g, '[' + att[0].output.map(f2).join(', ') + ']', 584, 687, 32, C.teal);
    }
    if (slotB) {
      text(g, 'Slot 2   q = [0, √2]', 1092, 628, 27, C.red);
      mono(g, '[' + att[1].output.map(f2).join(', ') + ']', 1092, 687, 32, C.red);
    }
    note(g, 'Weights = softmax(query · key / √2)   ·   Each slot sums weighted patch values.');
    return;
  }
  if (b === 2) {
    text(g, 'Spatial feature bank', 100, 289, 30);
    const larger = cue(k, 2, 'The number of query slots', 0);
    const widths = larger ? Array(7).fill(11) : Array(7).fill(8);
    widths.forEach((n, i) => {
      for (let j = 0; j < n; j++) rect(g, 100 + j * 26, 333 + i * 42, 21, 33, '#9fb9aa');
    });
    arrow(g, 565, 467, 841, 467, C.teal, 5);
    serif(g, 'Q-Former', 702, 414, 41, C.ink, 'center');
    mono(g, widths.length * widths[0] + ' input patches', 100, 654, 33, C.muted);
    const active = cue(k, 2, 'It supplies thirty-two visual vectors', 0.6);
    ink(g, active, () => {
      for (let i = 0; i < 32; i++)
        rect(g, 915 + (i % 8) * 60, 335 + Math.floor(i / 8) * 59, 49, 47, C.teal);
      mono(g, '32 output slots', 915, 654, 37, C.teal);
    });
    note(g, 'The learned query count fixes the output length for a compatible input bank.');
    return;
  }
  const second = cue(k, 3, 'With two images', 0.55);
  [0, 1].forEach((i) =>
    ink(g, i ? second : 1, () => {
      const y = 296 + i * 226;
      rack(g, 100, y, 217, 145, null, i ? [0.23, 0.65, 0.5, 0.2] : null);
      arrow(g, 360, y + 72, 491, y + 72, C.teal);
      for (let j = 0; j < 64; j++)
        rect(
          g,
          543 + (j % 16) * 26,
          y + 15 + Math.floor(j / 16) * 29,
          20,
          22,
          i ? '#ce9e82' : '#91b8a9',
        );
      text(g, 'Bank ' + (i + 1) + '   ·   64 latents', 543, y + 170, 26, C.muted);
    }),
  );
  const y = second ? 583 : 369;
  line(g, 1008, y, 1145, y, C.teal, 5);
  line(g, 1145, y, 1145, 469, C.teal, 5);
  arrow(g, 1145, 469, 1232, 469, C.teal);
  box(g, 'Language state', 1245, 419, 263, 101);
  note(g, 'Flamingo cross-attends to a resampled visual bank. Each item has its own bank.');
}
export function budget(g, k) {
  const b = k.beat.beatIndex,
    full = prefixCosts(),
    small = 64 + 180;
  head(g, 'How many prefix positions does this question need?', section);
  const photoX = 124,
    photoY = 228,
    w = 431,
    h = 431;
  rack(g, photoX, photoY, w, h, null, [0.14, 0, 2 / 3, 1]);
  grid(g, photoX, photoY, w, h, 2, '#fff9d5');
  for (let i = 0; i < 4; i++) {
    const x = photoX + (Math.floor(i % 2) * w) / 2,
      y = photoY + (Math.floor(i / 2) * h) / 2;
    rect(g, x + 5, y + 6, 32, 33, C.white);
    mono(g, i + 1, x + 20, y + 31, 23, C.ink, 'center');
  }
  text(g, 'Four crops   ·   each resized to 336 × 336', 85, 706, 26);
  if (b === 2) {
    text(g, 'Conventional full-attention KV cache', 695, 289, 29, C.muted);
    mono(g, '80 layers × 8 heads × 128', 695, 374, 33);
    mono(g, '× 2 bytes × 2 (key and value)', 695, 434, 30);
    text(g, 'Per prefix position', 696, 532, 28, C.muted);
    if (cue(k, 2, 'three hundred twenty KiB', 0))
      mono(g, full.bytesPerToken / 1024 + ' KiB', 1102, 532, 36);
    if (cue(k, 2, 'seven hundred twenty MiB', 0))
      mono(g, 'Visual portion   ' + full.visualMiB + ' MiB', 691, 658, 43, C.teal);
    note(
      g,
      'Visual prefix only   ·   2,304 positions   ·   exclude text, weights and allocator overhead.',
    );
    return;
  }
  const visual = cue(k, 1, "That's five hundred seventy-six", 0),
    result = cue(k, 1, 'Add the question', 0),
    settled = cue(k, 1, 'The prefix has', 0);
  text(
    g,
    b === 3 ? 'One compressor over all four crops' : 'Width-only projector',
    693,
    292,
    34,
    C.teal,
  );
  if (b === 3) {
    text(g, 'Projected patches', 694, 373, 28, C.muted);
    mono(g, String(full.visual), 1322, 373, 33, C.ink, 'right');
    text(g, 'Compressed visual tokens', 694, 443, 28, C.muted);
    mono(g, '64', 1322, 443, 33, C.ink, 'right');
    text(g, 'Question', 694, 513, 28, C.muted);
    mono(g, '180', 1322, 513, 33, C.ink, 'right');
    line(g, 694, 557, 1412, 557);
    const done = cue(k, 3, 'two hundred forty-four', 0);
    mono(g, done ? small + ' positions' : '64 + 180', 690, 655, 50, C.teal);
    note(g, 'Measure whether compression preserves the printed tag and the vent boundaries.');
    return;
  }
  mono(g, '336 ÷ 14', 695, 373, 39);
  text(g, 'patches along one side', 971, 374, 28, C.muted);
  mono(g, visual ? '24 × 24 = 576' : '? × ? patches per crop', 695, 462, 34);
  mono(g, result ? '4 × 576 + 180' : '4 × patches per crop + 180', 695, 549, 33, C.muted);
  if (settled) serif(g, full.total.toLocaleString('en-US') + ' positions', 688, 670, 63, C.teal);
  note(
    g,
    'Each patch supplies one position. Ignore separators and special tokens in this calculation.',
  );
}
export function reduction(g, k) {
  const b = k.beat.beatIndex,
    review = cue(k, 2, 'Send this case to review', 0),
    raised = cue(k, 2, 'raise the cap to three', 0);
  const cap = raised ? 3 : 2,
    state = reductionDecision(cap);
  head(g, 'Can this crop set fit the fast path?', section);
  rack(g, 85, 256, 646, 431);
  if (b > 0) {
    for (const id of state.selected) {
      const [x, y, w, h] = areas[id];
      rect(
        g,
        85 + x * 646,
        256 + y * 431,
        w * 646,
        h * 431,
        null,
        id === 'tag' ? '#ffd173' : id === 'layout' ? '#e2e5d3' : '#8bf0d5',
        4,
      );
    }
  }
  text(g, 'Protected evidence', 808, 279, 29, C.muted);
  const needs = ['Covered vent', 'Printed tag', 'Door layout'];
  needs.forEach((s, i) => {
    const y = 344 + i * 100;
    serif(g, s, 808, y + 10, 40);
    if (b > 0) {
      const fits = i < cap;
      rect(g, 1190, y - 33, 306, 56, fits ? '#bbd9c8' : '#dfdacc');
      text(
        g,
        fits ? 'Slot ' + (i + 1) : review ? 'Needs a slot' : '?',
        1341,
        y + 5,
        27,
        fits ? C.teal : C.ink,
        {
          align: 'center',
        },
      );
    }
  });
  if (b > 0) {
    line(g, 808, 586, 1499, 586);
    mono(g, 'Cap   ' + cap + ' slots', 809, 647, 30);
    if (review)
      serif(g, raised ? 'Admit' : 'Review', 1492, 649, 43, raised ? C.teal : C.red, 'right');
  }
  note(
    g,
    b === 0
      ? 'In this fixture each protected region requires a distinct slot.'
      : 'The cap applies to every request. All three evidence requirements still apply.',
  );
}
export function evaluation(g, k) {
  const b = k.beat.beatIndex;
  head(
    g,
    b < 2 ? 'How would you score this inspection?' : 'Can the full inspection workflow ship?',
    section,
  );
  if (b === 0) {
    text(g, 'Search', 95, 279, 32, C.teal);
    text(g, 'Relevant photos', 95, 355, 29);
    mono(g, relevant.join('   '), 95, 412, 39);
    text(g, 'Returned in top three', 95, 507, 29);
    mono(g, hits.join('   '), 95, 561, 39);
    mono(g, 'Recall@3   ' + recall.toFixed(3), 95, 688, 35, C.teal);
    line(g, 695, 268, 695, 705);
    text(g, 'Printed tags', 772, 279, 32, C.red);
    text(g, 'Reference', 773, 355, 26, C.muted);
    text(g, 'OCR read', 1145, 355, 26, C.muted);
    tagReads.forEach(([a, z], i) => {
      mono(g, a, 773, 429 + i * 83, 33);
      mono(g, z, 1145, 429 + i * 83, 33, a === z ? C.teal : C.red);
    });
    mono(g, 'Exact match   ' + exact.toFixed(2), 771, 688, 34, C.red);
    note(g, 'Use labeled outcomes for each route. The denominators answer different questions.');
    return;
  }
  if (b === 1) {
    const p = cue(k, 1, 'Shift the prediction', 1.4),
      m = boxScore(0.2 * p),
      x = 91,
      y = 243,
      w = 488;
    rect(g, x, y, w, w, '#e0e0d0', C.line, 2);
    rect(g, x + 0.08 * w, y + 0.08 * w, 0.6 * w, 0.6 * w, '#b0cbbf', C.teal, 4);
    const a = x + (0.08 + m.offset) * w,
      h = y + (0.08 + m.offset) * w;
    rect(g, a, h, 0.6 * w, 0.6 * w, null, C.red, 5);
    rect(g, a + 2, h + 2, (0.6 - m.offset) * w - 4, (0.6 - m.offset) * w - 4, '#417d706e');
    text(g, 'Reference box', 663, 297, 28, C.teal);
    text(g, 'Predicted box', 1021, 297, 28, C.red);
    for (const [i, [s, v]] of [
      ['Intersection', m.intersection],
      ['Union', m.union],
      ['Intersection / union', m.iou],
    ].entries()) {
      const yy = 402 + i * 108;
      text(g, s, 666, yy, 32);
      mono(g, i === 2 ? v.toFixed(3) : f2(v), 1415, yy, 42, i === 2 ? C.teal : C.ink, 'right');
    }
    note(g, 'Both boxes measure 0.6 × 0.6.   Current offset on each axis = ' + f2(m.offset));
    return;
  }
  const verdict = cue(k, 3, 'Hold the full workflow', 0);
  text(g, 'Inspection route', 99, 285, 27, C.muted);
  text(g, 'Example score', 952, 285, 27, C.muted, { align: 'center' });
  text(g, 'Minimum', 1139, 285, 27, C.muted);
  gates.forEach(({ label, value, floor, pass }, i) => {
    const y = 364 + i * 119;
    line(g, 96, y + 40, 1507, y + 40);
    serif(g, label, 98, y, 40);
    mono(g, f2(value), 905, y, 39);
    mono(g, f2(floor), 1153, y, 39);
    if (verdict)
      text(g, pass ? 'Pass' : 'Hold', 1504, y, 32, pass ? C.teal : C.red, { align: 'right' });
  });
  note(
    g,
    verdict
      ? 'Hold the full workflow. OCR failed its own minimum.'
      : 'All three routes must meet their minimum on the same release candidate.',
    verdict ? C.red : C.ink,
  );
}
export function transfer(g, k) {
  const b = k.beat.beatIndex;
  const replacement = cue(k, 1, 'Vent is clear beside the cover', 0),
    set = replacement ? revisedPrompts : initialPrompts;
  const decision = chooseCandidate(set),
    showGap =
      b === 0
        ? cue(k, 0, 'The lead is', 0)
        : b === 1
          ? !replacement
          : cue(k, 2, 'The gap is', 0);
  const showVerdict =
    b === 0
      ? cue(k, 0, 'Keep the first label', 0)
      : b === 1
        ? !replacement
        : cue(k, 2, 'Send it for review', 0);
  head(
    g,
    b === 3 ? 'What can the reviewer verify on photo 17?' : 'Should this label go to review?',
    section,
  );
  if (b === 3) {
    rack(g, 89, 247, 696, 464, 'vent');
    text(g, 'Photo 17   ·   East   ·   version 1', 93, 739, 25, C.muted);
    text(g, 'Grounded obstruction', 879, 264, 27, C.teal);
    rack(g, 882, 293, 542, 192, 'vent', [0.365, 0.245, 0.445, 0.283]);
    text(g, 'Asset tag source', 880, 548, 26, C.muted);
    tagStrip(g, 882, 570, 406);
    mono(g, 'RACK-17', 883, 710, 39);
    note(
      g,
      'Review requested   ·   top cosine ' +
        f2(decision.best.score) +
        '   ·   lead ' +
        f2(decision.gap) +
        '   ·   required lead ' +
        f2(marginFloor),
    );
    return;
  }
  rack(g, 88, 307, 458, 305);
  text(g, 'Photo 17   ·   same image', 89, 674, 26, C.muted);
  const x = 654,
    range = 937;
  const floorX = x + range * scoreFloor;
  text(g, 'Cosine floor ' + f2(scoreFloor), floorX, 275, 26, C.muted, { align: 'center' });
  line(g, floorX, 291, floorX, 624, C.gold, 3);
  set.forEach((r, i) => {
    const y = 350 + i * 113;
    text(g, r.text, x, y, 30, C.ink);
    rect(g, x, y + 19, range * 0.8, 14, '#dbdac8');
    rect(g, x, y + 19, r.score * range, 14, i === 0 ? C.teal : i === 1 ? C.red : '#9ba69a');
    mono(g, f2(r.score), 1488, y + 33, 33, i === 0 ? C.teal : C.ink, 'right');
  });
  const left = x + decision.second.score * range,
    right = x + decision.best.score * range;
  if (replacement) {
    const previous = chooseCandidate(initialPrompts).second.score;
    const mark = x + previous * range;
    line(g, mark, 472, mark, 505, C.ink, 2);
    text(g, 'previous ' + f2(previous), mark, 531, 20, C.muted, { align: 'right' });
  }
  if (showGap) {
    line(g, left, 652, right, 652, C.ink, 3);
    for (const a of [left, right]) line(g, a, 638, a, 661, C.ink, 3);
    mono(g, 'Lead  ' + f2(decision.gap), 652, 708, 32);
  }
  if (showVerdict)
    text(
      g,
      decision.passes ? 'Keep candidate' : 'Send for review',
      1497,
      713,
      38,
      decision.passes ? C.teal : C.red,
      { align: 'right' },
    );
  note(
    g,
    'Candidate rule   ·   top cosine ≥ ' +
      f2(scoreFloor) +
      '   and   top-two lead ≥ ' +
      f2(marginFloor),
  );
}
