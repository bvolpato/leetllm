import { cacheFixture, cacheChunkInSlots } from '../../../films/rope/model.mjs';
import { CACHE_K, CACHE_POSITIONS, CACHE_Q } from '../../../films/rope/fixtures.mjs';
import { rotateHead, rotatePair, dot, softmax } from '../../../films/rope/arithmetic.mjs';
import {
  C,
  inks,
  mix,
  fmt,
  vec,
  beat,
  cue,
  box,
  line,
  path,
  disk,
  label,
  num,
  title,
  pairLabel,
  dial,
  instrument,
  strip,
  plate,
  arrow,
} from './drawing.mjs';

const fixture = cacheFixture();
function cached(c, t) {
  const b = beat(t),
    ready = cue(t, 3, 'full causal pass', 0),
    reset = cue(t, 3, 'Resetting the final query', 0);
  title(
    c,
    b < 3 ? 'Read the identity on the stored key' : 'Compare the full row with its cached row',
  );
  if (b < 3) {
    label(c, 'Physical slots', 101, 242, 37, C.mute);
    CACHE_POSITIONS.forEach((p, i) => {
      const x = 100 + i * 587;
      box(c, x, 354, 542, 345, C.ink);
      plate(c, x + 18, 373, 506, 304, [C.qLight, C.gold, C.mint][i]);
      label(c, 'K at position ' + p, x + 43, 447, 48, C.ink, 'left', 'Serif');
      num(c, vec(fixture.keys[i].slice(0, 2)), x + 43, 541, 37);
      num(c, vec(fixture.keys[i].slice(2)), x + 43, 602, 37);
      num(c, 'slot ' + i, x + 271, 764, 38, C.mute, 'center');
    });
    if (b === 2) label(c, 'Stored pairs already include R(position).', 103, 899, 46, C.green);
  } else {
    label(
      c,
      'Identity values     ·     rotary rates [1, 0.01]     ·     fixed Q and K',
      101,
      220,
      36,
      C.mute,
    );
    const headers = ['Query ID', 'Full causal output', 'Cached output'];
    headers.forEach((v, i) => label(c, v, [104, 440, 1185][i], 348, 41, C.mute));
    CACHE_POSITIONS.forEach((p, i) => {
      const y = 473 + i * 134;
      num(c, p, 104, y, 52, C.q);
      num(c, vec(fixture.full[i], 4), 440, y, 38);
      num(
        c,
        ready ? vec(reset && i === 2 ? fixture.reset : fixture.incremental[i], 4) : '?',
        1185,
        y,
        38,
        ready ? (reset && i === 2 ? C.red : C.green) : C.ink,
      );
    });
    label(
      c,
      reset ? 'Cached Q for the last row used rotation ID 0.' : 'Each query reads its own prefix.',
      105,
      897,
      43,
      reset ? C.red : C.green,
    );
  }
}
export const slotOrder = [2, 0, 1];
function heard(t, n, words) {
  const activeBeat = beat(t);
  return activeBeat > n || (activeBeat === n && t.elapsed >= t.wordCue(words).end);
}

function chunk(c, t) {
  const b = beat(t),
    compare = cue(t, 2, 'Compare each key position', 0),
    open = cue(t, 4, 'Remove the mask', 0),
    restore = cue(t, 5, 'Restore the logical-position mask', 0),
    solo = cue(t, 6, 'Keep only the final query', 0);
  const masked = !open || restore,
    queryIds = solo ? [2] : [1, 2],
    model = cacheChunkInSlots(queryIds, slotOrder, masked);
  const firstMask = heard(t, 2, 'must hide slot zero'),
    secondMask = heard(t, 2, 'can use all three'),
    outputReady = heard(t, 2, 'Compare the outputs with the full pass'),
    leakKnown = heard(t, 4, 'comes from a future token'),
    zeroRestored = heard(t, 5, 'gives the future key zero again'),
    identity = heard(t, 3, 'how much weight went to key eight hundred two');

  title(
    c,
    solo
      ? 'The final query sees its entire prefix'
      : !compare
        ? 'Which slot must query 801 hide?'
        : masked
          ? 'Read positions before setting the mask'
          : 'What changes when the mask is off?',
  );
  const slots = [355, 572, 789];
  const weights = [1172, 1415, 1658];
  label(c, 'Physical order', 96, 237, 39, C.mute);
  label(c, 'Cached output in logical key order', 1072, 237, 39, C.mute);
  line(c, 976, 228, 976, 801);
  slotOrder.forEach((id, j) => {
    const x = slots[j];
    num(c, 'slot ' + j, x, 309, 31, C.mute, 'center');
    plate(c, x - 94, 344, 188, 90, [C.qLight, C.gold, C.mint][id]);
    num(c, 'K' + CACHE_POSITIONS[id], x, 389, 40, C.ink, 'center');
  });
  CACHE_POSITIONS.forEach((id, i) => {
    const x = weights[i];
    if (i === 2 && identity) box(c, x - 106, 331, 212, solo ? 252 : 418, C.pale, C.rule);
    num(c, 'K' + id, x, 389, 40, C.ink, 'center');
  });
  queryIds.forEach((id, i) => {
    const y = 532 + i * 169,
      known = id === 1 ? firstMask : secondMask,
      live = outputReady && (id === 2 || (masked ? !restore || zeroRestored : leakKnown));
    num(c, 'Q' + CACHE_POSITIONS[id], 96, y, 44, C.q);
    model.permissions[i].forEach((allowed, j) => {
      const x = slots[j];
      const decided = solo || open || known;
      const keyPosition = CACHE_POSITIONS[slotOrder[j]];
      const queryPosition = CACHE_POSITIONS[id];
      box(c, x - 94, y - 39, 188, 78, decided ? (allowed ? C.mint : C.rose) : C.pale);
      label(
        c,
        decided ? (allowed ? 'allow' : 'hide') : compare ? String(keyPosition) + (keyPosition > queryPosition ? ' > ' : ' ≤ ') + queryPosition : '?',
        x, y, decided ? 34 : 31, decided && !allowed ? C.red : C.ink, 'center',
      );
    });
    model.outputs[i].forEach((value, j) => {
      const ref = model.reference[i][j],
        color = Math.abs(value - ref) > 1e-9 ? C.red : identity && j === 2 ? C.green : C.ink;
      num(c, live ? fmt(value) : '—', weights[j], y - 8, 45, live ? color : C.mute, 'center');
      if (outputReady) num(c, 'full ' + fmt(ref), weights[j], y + 42, 34, C.mute, 'center');
    });
  });
  if (compare)
    label(
      c,
      solo ? 'Every key is in query 802’s prefix.'
        : masked ? 'Allow a key when its position is at or before the query.'
        : 'Only visibility changed. The keys, values and rotations stayed fixed.',
      96, 824, 34, masked ? C.green : C.red,
    );
}
export function adaptedRow() {
  const old = [1, 0.01],
    next = [1, 0.005];
  const keys = fixture.keys.map((k, i) =>
    rotateHead(rotateHead(k, -CACHE_POSITIONS[i], old), CACHE_POSITIONS[i], next),
  );
  return softmax(keys.map((k) => dot(fixture.newQuery, k) / 2));
}
export const contract = { tokens: 12288, short: 0.9, long: 0.84, secondRate: 0.005 };
export const candidates = [
  {
    name: 'Cedar',
    prompt: 9216,
    generate: 2048,
    short: 0.94,
    long: 0.89,
    cachedRate: 0.01,
    queryRate: 0.005,
  },
  {
    name: 'Elm',
    prompt: 10240,
    generate: 2048,
    short: 0.91,
    long: 0.84,
    cachedRate: 0.005,
    queryRate: 0.005,
  },
];
export function meets(v) {
  return (
    v.prompt + v.generate <= contract.tokens &&
    v.short >= contract.short &&
    v.long >= contract.long &&
    v.queryRate === contract.secondRate &&
    v.cachedRate === contract.secondRate
  );
}
function scheduleChange(c, t) {
  const b = beat(t);
  if (b >= 5) {
    const elmVerdict = cue(t, 6, 'Elm qualifies', 0);
    const cedarVerdict = cue(t, 6, 'its prefix was built', 0);
    title(c, 'Which candidate meets the serving contract?');
    label(
      c,
      'Total ≤ ' +
        contract.tokens.toLocaleString('en-US') +
        ' tokens     ·     short ≥ ' +
        fmt(contract.short, 2) +
        '     ·     long ≥ ' +
        fmt(contract.long, 2),
      99,
      235,
      35,
      C.mute,
    );
    label(
      c,
      'First rate stays at 1. Evaluated second rate = ' +
        fmt(contract.secondRate) +
        ' rad / step for prefix and query.',
      99,
      300,
      36,
    );
    ['Run', 'Prompt + generation', 'Short / long', 'Prefix rate', 'Query rate'].forEach((v, i) =>
      label(c, v, [98, 360, 911, 1285, 1575][i], 433, 36, C.mute),
    );
    candidates.forEach((v, i) => {
      const y = 545 + i * 195;
      label(c, v.name, 99, y, 69, C.ink, 'left', 'Serif');
      num(c, v.prompt + ' + ' + v.generate + ' = ' + (v.prompt + v.generate), 358, y, 38);
      num(c, fmt(v.short, 2) + ' / ' + fmt(v.long, 2), 910, y, 41);
      num(c, fmt(v.cachedRate), 1285, y, 46);
      num(c, fmt(v.queryRate), 1575, y, 46);
      if (meets(v) ? elmVerdict : cedarVerdict)
        label(
          c,
          meets(v) ? 'Meets all four conditions' : 'Prefix uses the old rate',
          1285,
          y + 67,
          33,
          meets(v) ? C.green : C.red,
        );
    });
    return;
  }
  const fixed = cue(t, 2, 'In exact arithmetic', 0),
    later = b >= 3;
  title(
    c,
    later ? 'A later layer inherits different features' : 'Change one frequency in a cached layer',
  );
  if (later) {
    label(c, 'Take the first two output coordinates as the next key.', 105, 241, 41);
    [
      ['Old full pass', fixture.full[2]],
      ['New full pass', fixture.repaired],
    ].forEach(([s, row], i) => {
      const x = 106 + i * 890;
      label(c, s, x, 377, 48, inks[i], 'left', 'Serif');
      num(c, vec(row, 5), x, 505, 40);
      arrow(c, x + 99, 573, -Math.PI / 2, 75, C.rule, 6);
      num(c, 'K = ' + vec(row.slice(0, 2), 5), x, 739, 46, inks[i]);
    });
    label(
      c,
      'Recompute the prefix to reproduce the new earlier-layer features.',
      103,
      918,
      40,
      C.mute,
    );
  } else {
    label(c, 'Q at 802 uses rates [1, 0.005]', 99, 228, 44, C.q);
    label(c, 'Stored keys', 100, 370, 38, C.mute);
    num(
      c,
      fixed ? 'Rnew(p) Rold(−p) Kold' : 'Rold(p) K     ·     rates [1, 0.01]',
      102,
      462,
      55,
      fixed ? C.green : C.k,
    );
    line(c, 101, 563, 1810, 563);
    num(
      c,
      'cache   ' + vec(fixed ? adaptedRow() : fixture.mixed, 5),
      102,
      675,
      59,
      fixed ? C.green : C.red,
    );
    num(c, 'new full   ' + vec(fixture.repaired, 5), 102, 803, 59);
    label(c, 'Fixed unrotated features and logical IDs in this layer.', 101, 945, 35, C.mute);
  }
}
function rebuilt(c, t) {
  const tried = cue(t, 3, 'Try the old key', 0),
    fixed = cue(t, 4, 'rotate it at eleven', 0),
    show = tried || fixed;
  title(
    c,
    fixed ? 'Rebuild the key at position eleven' : 'Can the old key reproduce this full pass?',
  );
  const positions = [11, fixed ? 11 : 3];
  positions.forEach((pos, i) => {
    const x = 466 + 939 * i,
      known = !i || show;
    label(c, i ? 'Cache builder' : 'Full pass', x, 236, 50, C.ink, 'center', 'Serif');
    if (known) instrument(c, x, 533, 207, 13 * 0.5, pos * 0.5);
    else {
      dial(c, x, 533, 207);
      arrow(c, x, 533, 13 * 0.5, 163, C.q, 11);
      label(c, '?', x, 624, 63, C.ink, 'center');
    }
    label(c, 'dogs · Q 13      cats · K ' + pos, x, 808, 37, C.mute, 'center');
    num(
      c,
      known ? fmt(Math.cos((pos - 13) * 0.5)) : '?',
      x,
      900,
      62,
      known ? (i && !fixed ? C.k : C.green) : C.ink,
      'center',
    );
  });
}
export function cachedPair(q = 21, k = 18, again = 0) {
  const original = rotatePair([1, 0], 0.4 * k),
    read = rotatePair(original, again * 0.4 * k),
    query = rotatePair([1, 0], q * 0.4);
  return {
    stored: original,
    read,
    query,
    qa: q * 0.4,
    ka: k * 0.4 * (1 + again),
    score: dot(query, read),
  };
}
function keyTray(c, travel, stored) {
  const y = 750,
    w = 456,
    xs = [176, 732, 1288],
    dy = -63 * Math.sin(Math.PI * travel);
  box(c, 111, y - 20, 1698, 182, '#c5cecc', C.mute, 3);
  xs.forEach((x, i) => {
    box(c, x, y + 8, w, 125, '#52646b');
    num(c, 'slot ' + i, x + w / 2, y + 189, 34, C.mute, 'center');
  });
  const x = mix(xs[2], xs[0], travel),
    keyY = y + 15 + dy;
  plate(c, x + 8, keyY, w - 16, 107, C.gold, C.k);
  label(c, 'K  ·  position 18', x + 26, keyY + 28, 31, C.ink);
  num(c, vec(stored), x + 26, keyY + 73, 39);
}
function finalTrial(c, t) {
  const b = beat(t),
    built = cue(t, 2, 'Use eighteen', 0),
    moving = cue(t, 2, 'Now move both logical positions', 0),
    shift = Math.round(40 * cue(t, 2, 'Now move both logical positions', 2.5));
  const wrong = cue(t, 3, 'try the slot number', 0),
    fixed = cue(t, 3, 'Rebuild the key at eighteen', 0);
  const logicalQ = b === 2 ? 21 + shift : 21,
    logicalK = b === 2 ? 18 + shift : 18;
  const rotation = wrong && !fixed ? 2 : logicalK;
  const trial = cachedPair(logicalQ, rotation),
    copy = cue(t, 5, 'Copy the stored vector', 2.4);
  const extra = cue(t, 5, 'Rotating it again', 1.75);
  const inTray = b >= 4;
  title(
    c,
    b === 1
      ? 'Build the key from scratch'
      : b === 2
        ? moving
          ? 'Move both logical positions'
          : 'Build with logical position 18'
        : b === 3
          ? fixed
            ? 'Rebuild with logical position 18'
            : wrong
              ? 'Try physical slot 2 as the rotation index'
              : 'Return to query 21 and key 18'
          : b === 4
            ? 'Which operation preserves the score?'
            : extra > 0
              ? 'Compare the two reads'
              : copy < 1 ? 'Copy the stored pair' : 'Read from slot zero',
  );
  if (!inTray) {
    const x = 492,
      y = 535,
      r = 255;
    if (built) instrument(c, x, y, r, trial.qa, trial.ka);
    else {
      dial(c, x, y, r);
      arrow(c, x, y, 0, 205, C.q, 13);
      arrow(c, x, y, 0, 205, C.gold, 7);
    }
    label(
      c,
      `Query ID ${logicalQ}      key ID ${logicalK}      slot 2`,
      950,
      307,
      40,
    );
    num(
      c,
      'key angle = ' + (built ? rotation : '___') + ' × 0.4',
      950,
      440,
      47,
      C.k,
    );
    label(c, 'Dot product with query', 950, 595, 39, C.mute);
    const slotTrial = wrong && !fixed;
    const scoreSpoken = slotTrial
      ? cue(t, 3, 'point two five one', 0)
      : cue(t, 2, 'point three six two', 0);
    const scoreReady = slotTrial
      ? cue(t, 3, 'That misses the reference', 0)
      : cue(t, 2, 'Keep that reference score', 0);
    num(
      c,
      scoreReady ? fmt(trial.score) : scoreSpoken ? '…' : '?',
      950,
      704,
      97,
      scoreReady ? (slotTrial ? C.red : C.green) : C.ink,
    );
    const phaseReady = slotTrial
      ? cue(t, 3, 'Its cosine is about', 0)
      : cue(t, 2, 'Its cosine is about', 0);
    if (phaseReady) num(c, 'relative phase = ' + fmt(trial.ka - trial.qa, 2) + ' rad', 950, 855, 40);
    if (b === 3) num(c, 'Full pass · ' + fmt(cachedPair().score), 950, 958, 36, C.mute);
  } else {
    const ref = cachedPair(),
      other = cachedPair(21, 18, extra);
    instrument(c, 424, 431, 194, ref.qa, ref.ka);
    label(c, 'Full pass   Q 21 · K 18', 424, 191, 35, C.mute, 'center');
    num(c, fmt(ref.score), 424, 681, 50, C.green, 'center');
    if (b >= 5) {
      const copiedScoreSpoken = cue(t, 5, 'point three six two', 0);
      const copiedScoreReady = cue(t, 5, 'It matches the full pass', 0);
      if (extra > 0) {
        instrument(c, 1075, 431, 190, other.qa, other.ka);
        label(c, 'Extra rotation on a copy', 1075, 191, 36, C.red, 'center');
        const extraScoreSpoken = cue(t, 5, 'point nine six zero', 0);
        const extraScoreReady = b > 5 || t.elapsed >= t.speechDuration;
        num(c, extraScoreReady ? fmt(other.score) : extraScoreSpoken ? '…' : '?',
          1075, 681, 50, extraScoreReady ? C.red : C.ink, 'center');
      }
      label(c, 'Stored K · Q 21', 1430, 353, 40, C.ink);
      num(c, copiedScoreReady ? fmt(ref.score) : copiedScoreSpoken ? '…' : '?',
        1430, 449, 70, copiedScoreReady ? C.green : C.ink);
    } else {
      label(c, 'Slot 2 → slot 0', 970, 331, 56, C.ink, 'left', 'Serif');
      label(c, 'Copy the pair?', 970, 454, 43, C.ink);
      label(c, 'Rotate the pair again?', 970, 545, 43, C.ink);
    }
    keyTray(c, copy, ref.stored);
  }
}
export const cacheScenes = [cached, chunk, scheduleChange, rebuilt, finalTrial];
