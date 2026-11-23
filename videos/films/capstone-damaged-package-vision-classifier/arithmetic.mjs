import { visionBaseBundle, visionDevelopment } from './fixtures.mjs';
export const clip = (p) => Math.max(0, Math.min(1, p));
export function route(row) {
  return !row.visible || row.brightness < 0.2 || row.blur > 0.45
    ? 'New photo'
    : row.damage >= 0.7
      ? 'Priority review'
      : 'Normal review';
}
export function confusion(rows) {
  return rows.reduce(
    (a, r) => {
      a[r.score >= 0.7 ? (r.gold ? 'TP' : 'FP') : r.gold ? 'FN' : 'TN']++;
      return a;
    },
    {
      TP: 0,
      FP: 0,
      FN: 0,
      TN: 0,
    },
  );
}
export function cropSnapshot(beat, progress) {
  const moving = beat > 0 ? 1 : clip((progress - 0.08) / 0.42);
  return {
    x: Math.round(430 + 190 * moving),
    y: Math.round(390 + 30 * moving),
    w: Math.round(720 - 220 * moving),
    h: Math.round(480 - 30 * moving),
    moving,
  };
}
export function parcelGeometry(x, y, w, dark = false, torn = true) {
  const h = w * 0.65,
    color = dark ? '#35435c' : '#78a7ff';
  const point = (a, b) => ({
    x: x + w * a,
    y: y + h * b,
  });
  const box = (a, b, width, height, fill, stroke) => ({
    points: [point(a, b), point(a + width, b), point(a + width, b + height), point(a, b + height)],
    closed: true,
    fill,
    color: stroke ?? fill,
    width: stroke ? 3 : 0,
  });
  return [
    box(0.2, 0.2, 0.6, 0.6, dark ? '#292c32' : '#9b754b', color),
    box(0.47, 0.2, 0.06, 0.6, dark ? '#3a3940' : '#d1b286'),
    {
      points: [point(0.2, 0.2), point(0.33, 0.08), point(0.88, 0.08), point(0.8, 0.2)],
      color,
      width: 3,
    },
    {
      points: [point(0.8, 0.2), point(0.88, 0.08), point(0.88, 0.68), point(0.8, 0.8)],
      color,
      width: 3,
    },
    box(0.59, 0.47, 0.14, 0.17, dark ? '#424650' : '#e0dfd7'),
    ...Array.from(
      {
        length: 6,
      },
      (_, k) => ({
        points: [point(0.604 + 0.018 * k, 0.5), point(0.604 + 0.018 * k, 0.6)],
        color: dark ? '#262b35' : '#253044',
        width: k % 2 ? 2 : 3,
      }),
    ),
    ...(torn
      ? [
          {
            points: [point(0.2, 0.2), point(0.28, 0.37), point(0.2, 0.48)],
            color: dark ? '#485066' : '#f28bb6',
            width: 7,
          },
        ]
      : []),
  ];
}
export const visionClamp = (value) => Math.max(0, Math.min(1, value));
export const visionSum = (values) => values.reduce((sum, value) => sum + value, 0);
export const visionSigmoid = (value) =>
  value >= 0 ? 1 / (1 + Math.exp(-value)) : Math.exp(value) / (1 + Math.exp(value));
export const visionBce = (logit, target) =>
  Math.max(logit, 0) - logit * target + Math.log1p(Math.exp(-Math.abs(logit)));
export function visionRoute(photo, output, bundle = visionBaseBundle) {
  for (const name of ['damage_probability', 'blur_score', 'brightness']) {
    if (
      typeof output[name] !== 'number' ||
      !Number.isFinite(output[name]) ||
      output[name] < 0 ||
      output[name] > 1
    )
      throw new Error('Invalid numeric model output: ' + name);
  }
  if (typeof output.box_visible !== 'boolean')
    throw new Error('Package visibility must be Boolean');
  let action, reason;
  if (!output.box_visible) [action, reason] = ['request_new_photo', 'package_not_visible'];
  else if (output.blur_score > bundle.max_blur || output.brightness < bundle.min_brightness)
    [action, reason] = ['request_new_photo', 'image_quality_gate'];
  else if (output.damage_probability >= bundle.damage_threshold)
    [action, reason] = ['priority_damage_review', 'damage_threshold'];
  else [action, reason] = ['normal_review', 'below_threshold'];
  return {
    route_id: bundle.bundle_id + ':' + photo.photo_id,
    photo_id: photo.photo_id,
    case_id: photo.case_id,
    routed_day: photo.capture_day,
    source: photo.source,
    packaging: photo.packaging,
    bundle_id: bundle.bundle_id,
    previous_bundle: bundle.previous_bundle,
    preprocessing: bundle.preprocessing,
    label_guideline: bundle.label_guideline,
    route_policy: bundle.route_policy,
    damage_threshold: bundle.damage_threshold,
    max_blur: bundle.max_blur,
    min_brightness: bundle.min_brightness,
    damage_probability: output.damage_probability,
    blur_score: output.blur_score,
    brightness: output.brightness,
    box_visible: output.box_visible,
    action,
    reason,
  };
}
export function visionCaseAction(traces) {
  if (!traces.length) throw new Error('A case requires served traces');
  const actions = traces.map((row) => row.action);
  if (
    actions.some(
      (action) =>
        !['priority_damage_review', 'normal_review', 'request_new_photo'].includes(action),
    )
  )
    throw new Error('Unsupported served action');
  return actions.includes('priority_damage_review')
    ? 'priority_damage_review'
    : actions.includes('normal_review')
      ? 'normal_review'
      : 'request_new_photo';
}
export function visionReplay(trace, photo, output, retainedBundle = visionBaseBundle) {
  const expected = visionRoute(photo, output, retainedBundle);
  const keys = Object.keys(expected).sort();
  return (
    Object.keys(trace).sort().join('|') === keys.join('|') &&
    keys.every((key) => typeof trace[key] === typeof expected[key] && trace[key] === expected[key])
  );
}
export function visionJoin(rows, traces, outcomes, cutoff, guideline = 'visible-damage-v1') {
  if (!Number.isInteger(cutoff) || cutoff < 1) throw new Error('Invalid readout cutoff');
  if (new Set(outcomes.map((row) => row.case_id)).size !== outcomes.length)
    throw new Error('Duplicate specialist outcome');
  const usable = new Set(
    rows.filter((row) => row.photo.quality_label === 'usable').map((row) => row.photo.case_id),
  );
  const joined = [];
  for (const outcome of outcomes) {
    const photos = rows.filter((row) => row.photo.case_id === outcome.case_id);
    const caseTraces = traces.filter((row) => row.case_id === outcome.case_id);
    if (
      !usable.has(outcome.case_id) ||
      !photos.length ||
      !caseTraces.length ||
      outcome.available_day > cutoff ||
      outcome.guideline_version !== guideline ||
      outcome.reviewed_day <= Math.max(...photos.map((row) => row.photo.capture_day))
    )
      continue;
    const action = visionCaseAction(caseTraces),
      priority = action === 'priority_damage_review';
    joined.push({
      ...outcome,
      action,
      cell: priority
        ? outcome.confirmed_damage
          ? 'TP'
          : 'FP'
        : outcome.confirmed_damage
          ? 'FN'
          : 'TN',
    });
  }
  const counts = Object.fromEntries(
    ['TP', 'FP', 'FN', 'TN'].map((cell) => [
      cell,
      joined.filter((row) => row.cell === cell).length,
    ]),
  );
  const precision = counts.TP + counts.FP ? counts.TP / (counts.TP + counts.FP) : null;
  const recall = counts.TP + counts.FN ? counts.TP / (counts.TP + counts.FN) : null;
  return {
    joined,
    counts,
    precision,
    recall,
    expected: usable.size,
    complete: joined.length === usable.size,
    servedActions: Object.fromEntries(
      [...usable].map((id) => [id, visionCaseAction(traces.filter((row) => row.case_id === id))]),
    ),
  };
}
export function visionStencil(scale = 1) {
  const pixels = Array.from(
    {
      length: 5,
    },
    () => [0, 0, scale, scale, scale],
  );
  const responses = [];
  for (let y = 1; y < 4; y++)
    for (let x = 1; x < 4; x++)
      responses.push(
        pixels[y - 1][x] +
          pixels[y + 1][x] +
          pixels[y][x - 1] +
          pixels[y][x + 1] -
          4 * pixels[y][x],
      );
  const mean = visionSum(responses) / responses.length;
  const squared = responses.map((value) => (value - mean) ** 2);
  return {
    scale,
    pixels,
    responses,
    mean,
    squared,
    variance: visionSum(squared) / responses.length,
  };
}
export function visionHead({
  features = [2, -1],
  weights = [0.25, 0.5],
  bias = -1,
  target = 1,
  rate = 0.1,
} = {}) {
  const products = features.map((value, i) => value * weights[i]);
  const logit = visionSum(products) + bias,
    probability = visionSigmoid(logit),
    loss = visionBce(logit, target);
  const logitGradient = probability - target,
    gradients = features.map((value) => logitGradient * value);
  const nextWeights = weights.map((value, i) => value - rate * gradients[i]),
    nextBias = bias - rate * logitGradient;
  const nextLogit = visionSum(features.map((value, i) => value * nextWeights[i])) + nextBias;
  return {
    features: [...features],
    weights: [...weights],
    bias,
    target,
    rate,
    products,
    logit,
    probability,
    loss,
    logitGradient,
    gradients,
    nextWeights,
    nextBias,
    nextLogit,
    nextProbability: visionSigmoid(nextLogit),
    nextLoss: visionBce(nextLogit, target),
  };
}
export function visionMasked(logits = [0, 2, -1], targets = [1, 0, null]) {
  const mask = targets.map((value) => (value === null ? 0 : 1)),
    observed = visionSum(mask),
    probabilities = logits.map(visionSigmoid);
  const losses = logits.map((value, i) => (mask[i] ? visionBce(value, targets[i]) : null));
  return {
    logits: [...logits],
    targets: [...targets],
    mask,
    observed,
    probabilities,
    losses,
    total: visionSum(losses.filter((value) => value !== null)),
    mean: observed ? visionSum(losses.filter((value) => value !== null)) / observed : null,
    gradients: logits.map((_, i) =>
      mask[i] && observed ? (probabilities[i] - targets[i]) / observed : 0,
    ),
  };
}
export function visionThreshold(rows = visionDevelopment, threshold = 0.7) {
  const TP = rows.filter(([score, gold]) => score >= threshold && gold).length,
    FP = rows.filter(([score, gold]) => score >= threshold && !gold).length;
  const FN = rows.filter(([score, gold]) => score < threshold && gold).length,
    TN = rows.length - TP - FP - FN;
  return {
    threshold,
    TP,
    FP,
    FN,
    TN,
    slots: TP + FP,
    precision: TP + FP ? TP / (TP + FP) : null,
    recall: TP + FN ? TP / (TP + FN) : null,
  };
}
export function visionFresh(cutoff = 21) {
  const rows = [
    ...[
      ['R-511', true, 0.8],
      ['R-512', true, 0.9],
      ['R-513', false, 0.8],
      ['R-514', false, 0.2],
    ].map(([id, gold, score]) => ({
      photo: {
        case_id: id,
        photo_id: id + '-a',
        capture_day: 20,
        split: 'test',
        source: 'customer_phone',
        packaging: 'corrugated',
        quality_label: 'usable',
        confirmed_damage: gold,
      },
      output: {
        damage_probability: score,
        blur_score: 0.1,
        brightness: 0.6,
        box_visible: true,
      },
    })),
    {
      photo: {
        case_id: 'R-520',
        photo_id: 'R-520-a',
        capture_day: 20,
        split: 'test',
        source: 'customer_phone',
        packaging: 'corrugated',
        quality_label: 'unusable',
        confirmed_damage: null,
      },
      output: {
        damage_probability: 0.97,
        blur_score: 0.1,
        brightness: 0.18,
        box_visible: true,
      },
    },
    {
      photo: {
        case_id: 'R-520',
        photo_id: 'R-520-b',
        capture_day: 20,
        split: 'test',
        source: 'customer_phone',
        packaging: 'corrugated',
        quality_label: 'usable',
        confirmed_damage: true,
      },
      output: {
        damage_probability: 0.69,
        blur_score: 0.1,
        brightness: 0.6,
        box_visible: true,
      },
    },
  ];
  const traces = rows.map((row) => visionRoute(row.photo, row.output));
  const outcomes = [
    ['R-511', true],
    ['R-512', true],
    ['R-513', false],
    ['R-514', false],
    ['R-520', true],
  ].map(([case_id, confirmed_damage]) => ({
    case_id,
    confirmed_damage,
    reviewed_day: 21,
    available_day: case_id === 'R-520' ? 22 : 21,
    guideline_version: 'visible-damage-v1',
  }));
  return {
    rows,
    traces,
    outcomes,
    cutoff,
    ...visionJoin(rows, traces, outcomes, cutoff),
  };
}
