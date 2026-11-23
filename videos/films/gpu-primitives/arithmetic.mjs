export function reductionLevels(values) {
  const levels = [[...values]];
  while (levels.at(-1).length > 1) {
    const previous = levels.at(-1);
    levels.push(
      Array.from(
        {
          length: Math.ceil(previous.length / 2),
        },
        (_, index) => previous[2 * index] + (previous[2 * index + 1] ?? 0),
      ),
    );
  }
  return levels;
}
export function scanLevels(values) {
  const levels = [[...values]];
  let additions = 0;
  for (let stride = 1; stride < values.length; stride *= 2) {
    const previous = levels.at(-1);
    levels.push(
      previous.map((value, index) =>
        index < stride ? value : (additions++, value + previous[index - stride]),
      ),
    );
  }
  return {
    levels,
    additions,
  };
}
export function shuffleLevels(values) {
  const levels = [[...values]];
  for (let stride = 1; stride < values.length; stride *= 2) {
    const previous = levels.at(-1);
    levels.push(previous.map((value, lane) => value + previous[lane ^ stride]));
  }
  return levels;
}
export function shuffleRead(values, lane, stride, active) {
  const peer = lane ^ stride;
  return active.has(lane) && active.has(peer) ? values[peer] : undefined;
}
export function onlineSoftmax(groups) {
  let maximum = -Infinity,
    denominator = 0;
  for (const group of groups) {
    const next = Math.max(maximum, ...group);
    denominator =
      denominator * Math.exp(maximum - next) +
      group.reduce((sum, value) => sum + Math.exp(value - next), 0);
    maximum = next;
  }
  return {
    maximum,
    denominator,
  };
}
export const f = Math.fround;
export const A = f(1e20);
export const B = f(-1e20);
export const R = f(3.14);
export function exclusive(values) {
  let sum = 0;
  return values.map((value) => {
    const before = sum;
    sum += value;
    return before;
  });
}
export function hierarchyCounts(length, width = 512) {
  const rows = [];
  do {
    length = Math.ceil(length / width);
    rows.push(length);
  } while (length > 1);
  return rows;
}
export function scanWork(length) {
  const stages = Math.log2(length);
  return {
    hillis: length * stages - (length - 1),
    blelloch: 2 * length - 2,
    hillisStages: stages,
    blellochStages: 2 * stages,
  };
}
export function blellochTrace(values = [3, -1, 4, 1]) {
  const a = [...values],
    states = [
      {
        label: 'Input',
        values: [...a],
      },
    ];
  for (let stride = 1; stride < a.length; stride *= 2) {
    for (let i = 2 * stride - 1; i < a.length; i += 2 * stride) a[i] += a[i - stride];
    states.push({
      label: 'Up stride ' + stride,
      values: [...a],
    });
  }
  const total = a.at(-1);
  a[a.length - 1] = 0;
  states.push({
    label: 'Root ← identity',
    values: [...a],
  });
  for (let stride = a.length / 2; stride >= 1; stride /= 2) {
    for (let i = 2 * stride - 1; i < a.length; i += 2 * stride) {
      const old = a[i - stride];
      a[i - stride] = a[i];
      a[i] += old;
    }
    states.push({
      label: 'Down stride ' + stride,
      values: [...a],
    });
  }
  return {
    states,
    total,
  };
}
