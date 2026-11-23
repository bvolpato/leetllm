import { arrow, line, place } from 'vizmatic/stage';
import { area, label, mono, namedBox } from '../kit-narrated.mjs';

const files = ['config.txt', 'output.csv'];
const lower = { 'config.txt': 'base text' };
const whiteout = Symbol('whiteout');

export function scratchView() {
  const [owner, header, config, output, footer] = area.rows([0.7, 0.65, 1.9, 1.9, 0.8], 'normal');
  const widths = [0.98, 1.2, 1.3, 1.35];
  const ownerTag = (words, color) => place(label(words, { size: 42, color }), owner);
  const oldOwner = ownerTag('Tenant A   /   J4   /   generation 4', 'cyan');
  const heads = header
    .columns(widths, 'normal')
    .map((r, i) =>
      place(
        label(['Filename', 'Read-only image', 'Private upper', 'Guest view'][i], {
          size: 37,
          color: ['dim', 'green', 'cyan', 'ink'][i],
        }),
        r,
      ),
    );
  const cells = [config, output].map((r) =>
    r.rows([2.2, 0.65], 'normal')[0].columns(widths, 'normal'),
  );
  const names = files.map((f, i) => place(mono(f, { size: 38 }), cells[i][0]));
  const tile = (file, col, words, color = 'dim') => {
    const r = cells[file][col];
    return place(
      namedBox(words, {
        width: r.width - 18,
        height: 94,
        size: 38,
        color,
        dash: color === 'dim',
      }),
      r,
    );
  };
  const upper = (file, value) =>
    value === whiteout
      ? tile(file, 2, 'whiteout', 'yellow')
      : tile(file, 2, value ?? 'empty', value === undefined ? 'dim' : 'cyan');
  const read = (file, value) => {
    const merged = value === whiteout ? undefined : (value ?? lower[files[file]]);
    return tile(
      file,
      3,
      merged ?? 'absent',
      merged === undefined ? 'dim' : value === undefined ? 'green' : 'cyan',
    );
  };
  const frame = [
    ...heads,
    ...names,
    tile(0, 1, lower['config.txt'], 'green'),
    tile(1, 1, 'absent'),
  ];
  const receipt = (words, color = 'yellow') => place(label(words, { size: 40, color }), footer);
  // A separate lane below the file holds the lookup path, clear of the values.
  const lookup = (file, destination) => {
    const from = cells[file][3].point('bottom'),
      to = cells[file][destination].point('bottom');
    const lane = [config, output][file].bottom - 12;
    return [
      line(from, [from[0], lane], { stroke: 'yellow', width: 4 }),
      line([from[0], lane], [to[0], lane], { stroke: 'yellow', width: 4 }),
      arrow([to[0], lane], to, { stroke: 'yellow', width: 4, pad: 4 }),
    ];
  };
  const upperEdit = upper(0, 'A’s edit'),
    readEdit = read(0, 'A’s edit');
  const upperFile = upper(1, '1,99'),
    readFile = read(1, '1,99');
  const running = [oldOwner, ...frame, upperEdit, readEdit, upperFile, readFile];
  return {
    frame,
    oldOwner,
    ownerTag,
    receipt,
    upper,
    read,
    tile,
    lookup,
    whiteout,
    upperEdit,
    readEdit,
    upperFile,
    readFile,
    running,
  };
}
