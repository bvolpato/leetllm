import { assertEqual, dynamic, place, rect } from 'vizmatic/stage';
import { area, heading, label, mono, note } from '../kit-narrated.mjs';
import { paddedWorkingSet } from '../../films/deep-dive-deepspeed/construction.mjs';

function cell(slot, name, color, { outline = false, padding = false } = {}) {
  return [
    rect(slot.width - 5, 64, {
      fill: outline || padding ? 'surface' : color,
      stroke: color,
      width: 2,
      ...(padding ? { dash: [8, 5] } : {}),
    }).moveTo(slot.point('center')),
    ...(name
      ? [
          mono(name, { size: 32, color: outline || padding ? color : 'surface' }).moveTo(
            slot.point('center'),
          ),
        ]
      : []),
  ];
}

export function gatherBoard(s, c, lengths) {
  const ranks = 4;
  const A = 0,
    B = 1;
  const model = paddedWorkingSet(lengths, ranks, [A, B]);
  const width = model.shards[A];
  const size = model.padded[A];
  const even = lengths[A] === size;
  const [premise, owners, kept, destA, destB, count, action] = area
    .inset('normal')
    .rows([0.8, 1.6, 1, 1, 1, 0.9, 0.8], 'tight');
  const split = (region) => region.columns([1.5, 7], 'normal');
  const ownerColors = ['blue', 'cyan', 'pink', 'yellow'];
  const [ownerTitle, source] = split(owners);
  const [rankNames, chips] = source.rows([0.7, 1], 'tight');
  const groups = chips.columns(ranks, 'normal');
  const sources = groups.flatMap((group) => group.columns(width, 'tight'));
  const rows = [kept, destA, destB].map((region) => split(region));
  const slots = rows.map(([, region]) =>
    region.columns(Math.max(model.resident, size, model.padded[B]), 'tight'),
  );
  const residentNames = model.shards.flatMap((n, layer) =>
    Array.from({ length: n }, (_, i) => String.fromCharCode(65 + layer) + i),
  );
  const names = (layer) =>
    Array.from({ length: model.padded[layer] }, (_, i) =>
      i < lengths[layer] ? String.fromCharCode(65 + layer) + i : 'pad',
    );
  const aNames = names(A),
    bNames = names(B);

  const shardWidth = s.value(even ? width : 1);
  const dealt = s.value(even ? size : 0);
  const resident = s.value(even ? model.resident : 0);
  const aLive = s.value(0),
    bLive = s.value(0);
  const aPairs = s.value(0),
    bPairs = s.value(0);
  const message = s.value(0);
  const notes = even
    ? [
        'Each owner keeps two weights from each layer.',
        'Find A0 and A1 in both the owner row and rank zero’s storage.',
        'How many new slots must the gather reserve?',
        'The destination has space for the local pair and all three peer pairs.',
        'A0 and A1 now have two addresses on rank zero.',
        'A is ready when all four pairs are present.',
        'A and B have separate destinations while their lifetimes overlap.',
        'After A’s last use, only its full buffer can go.',
      ]
    : [
        'Try one slot for each owner.',
        'A4 still needs a slot. How wide must each shard be?',
        'Four equal pairs give each owner a place.',
        'Padding takes a slot, too.',
        'Rank zero keeps two slots from A and two from B.',
        'A’s full destination is reserved before it is filled.',
        'R0 copies its own pair.',
        'Each peer supplies a whole pair, including any padding.',
        '5 logical weights    ·    6 peer slots received    ·    8 destination slots',
        'A and B each occupy eight slots alongside the four resident slots.',
      ];
  const sourcesPicture = dynamic(() => {
    if (shardWidth.value === 1)
      return groups.flatMap((group, rank) =>
        cell(group.inset(20, 0), 'A' + rank, ownerColors[rank], { outline: true }),
      );
    return sources.flatMap((slot, i) => {
      const filled = i < Math.round(dealt.value);
      return cell(slot, filled ? aNames[i] : '', ownerColors[Math.floor(i / width)], {
        outline: true,
        padding: filled && i >= lengths[A],
      });
    });
  });
  const localPicture = dynamic(() =>
    residentNames.slice(0, resident.value).flatMap((name, i) => cell(slots[0][i], name, 'blue')),
  );
  const buffer = (index, allocated, pairs, values, colors) =>
    dynamic(() => {
      if (!allocated.value) {
        const track = rows[index][1];
        return [
          rect(track.width, 64, { fill: 'surface', stroke: 'grid', dash: [12, 8] }).moveTo(
            track.point('center'),
          ),
          note('Unallocated', { color: 'dim', size: 32 }).moveTo(track.point('center')),
        ];
      }
      const filled = Math.round(pairs.value) * model.shards[index - 1];
      return values.flatMap((name, i) =>
        cell(
          slots[index][i],
          i < filled ? name : '',
          i < filled ? colors[Math.floor(i / model.shards[index - 1])] : 'dim',
          { outline: i >= filled, padding: i < filled && name === 'pad' },
        ),
      );
    });
  const counts = dynamic(() => {
    const live = resident.value + aLive.value * size + bLive.value * model.padded[B];
    const received = Math.max(0, Math.round(aPairs.value) - 1) * width;
    const columns = count.columns([1, 1], 'wide');
    return [
      place(
        mono('Rank 0 live slots   ' + (resident.value ? live : '?'), { color: 'ink', size: 47 }),
        columns[0],
      ),
      place(mono('A slots received   ' + received, { color: 'cyan', size: 41 }), columns[1]),
    ];
  });
  const title = even
    ? 'A, B, C, D    ·    8 weights each    ·    4 ranks'
    : 'A = 5 weights    ·    B = 7 weights    ·    4 ranks';
  s.add(
    heading(c.title),
    place(label(title), premise),
    dynamic(() => {
      if (even || message.value !== 1)
        return place(label('A owners', { size: 36 }), ownerTitle, 'left');
      const [caption, spare] = ownerTitle.rows([0.7, 1], 'tight');
      return [
        place(note('No slot for', { size: 32 }), caption),
        ...cell(spare.inset(26, 0), 'A4', 'yellow', { outline: true }),
      ];
    }),
    rankNames
      .columns(ranks, 'normal')
      .map((region, i) => place(mono('R' + i, { size: 34, color: ownerColors[i] }), region)),
    rows.map(([region], i) =>
      place(label(['R0 keeps', 'Full A buffer', 'Full B buffer'][i], { size: 35 }), region, 'left'),
    ),
    sourcesPicture,
    localPicture,
    buffer(1, aLive, aPairs, aNames, ownerColors),
    buffer(2, bLive, bPairs, bNames, ownerColors),
    counts,
    dynamic(() => label(notes[message.value], { size: 36 }).moveTo(action.point('center'))),
  );
  assertEqual(model.total, even ? 24 : 20, 'resident plus both full allocations');

  return {
    message,
    shardWidth,
    dealt,
    resident,
    width,
    size,
    model,
    aLive,
    bLive,
    aPairs,
    bPairs,
    ranks,
  };
}
