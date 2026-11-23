import {
  circle,
  column,
  dot,
  group,
  line,
  place,
  rect,
  table,
} from 'vizmatic/stage';
import { area, heading, label, mono, note, para } from '../kit-narrated.mjs';
import { packet, packetEvidenceFixture } from '../../films/capstone-production-llm-agent/model.mjs';

export const C = {
  ticket: 'cyan',
  stored: 'blue',
  review: 'pink',
  active: 'yellow',
  effect: 'green',
  blocked: 'red',
};
export const [ticketArea, bench] = area.columns([1, 4], 'loose');
export const evidence = packetEvidenceFixture();
export const short = (digest) => digest.slice(0, 8);
export const question = 'What is the access policy for a disabled production API key?';
export const after = { after: true };
export const countQuery = 'SELECT COUNT(*) FROM effects';
export const field = (region, text, color = 'ink', size = 38) =>
  place(label(text, { color, size }), region, 'left');

export function paper(region, color = 'grid') {
  return place(rect(region.width, region.height, {
    fill: 'surface', stroke: color, width: 3, radius: 14,
  }), region);
}

function ticket() {
  const paper = ticketArea.inset('tight');
  const face = place(
    rect(paper.width, paper.height, { radius: 18, fill: 'surface', stroke: C.ticket, width: 3 }),
    paper,
  );
  const inside = paper.inset('normal');
  const [stub, body, claim] = inside.rows([2, 4, 3], 'wide');
  const title = place(
    column([note('SUPPORT TICKET', { color: C.ticket }), mono(packet.ticket, { size: 60 })], {
      gap: 'tight',
      align: 'left',
    }),
    stub,
    'left',
  );
  const inquiry = place(
    column([note('Policy inquiry'), para(question, body.width, { size: 38 })], { align: 'left' }),
    body,
    'left',
  );
  const fields = place(
    column(
      [
        note('Read grant'),
        mono(packet.account, { color: C.ticket }),
        note('Support worker'),
        mono('support-1', { color: C.ticket, size: 32 }),
      ],
      { gap: 'tight', align: 'left' },
    ),
    claim,
    'left',
  );
  const seam = stub.bottom + (body.top - stub.bottom) / 2;
  const tear = line([paper.left, seam], [paper.right, seam], {
    stroke: C.ticket,
    width: 2,
    dash: [6, 8],
  });
  const holes = [paper.left, paper.right].map((x) =>
    circle(9, { fill: 'bg', stroke: C.ticket, width: 2 }).moveTo([x, seam]),
  );
  return group(face, tear, ...holes, ...title.nodes, ...inquiry.nodes, ...fields.nodes);
}

export function openBench(s, c, title) {
  const stub = ticket();
  if (c.id === 'intake') s.add(stub);
  else c.take(stub);
  if (c.id !== 'dispatch') c.keep(stub);
  s.add(heading(title));
}

export function records(region, headers, rows, options = {}) {
  const columns = headers.map(([key, title, share]) => ({
    key,
    label: title,
    width: region.width * share - 72,
    marks: false,
  }));
  return place(table(columns, rows, { size: 34, ...options }), region);
}

/** Each bar encodes one hex digit of the displayed digest prefix. */
export function fingerprint(region, name, digest, color, expiresAt) {
  const [header, bars, value] = region.inset('tight').rows([1, 1.5, 1], 'tight');
  const prefix = short(digest);
  const slots = bars.columns(prefix.length, 'tight');
  const pattern = slots.map((slot, i) => {
    const height = (slot.height * (parseInt(prefix[i], 16) + 1)) / 16;
    return place(
      rect(slot.width - 2, height, { fill: color, stroke: color, width: 1 }),
      slot,
      'bottom',
    );
  });
  const [digestSlot, expirySlot] = value.columns([1.1, 1], 'tight');
  const values =
    expiresAt === undefined
      ? [field(value, prefix + '…', color, 38)]
      : [
          field(digestSlot, prefix + '…', color, 35),
          field(expirySlot, 'Expiry ' + expiresAt, color, 31),
        ];
  return {
    header: field(header, name, color, 32),
    band: bars,
    print: group(...pattern, ...values),
  };
}

export const episodes = [
  { key: 'urgent', name: 'Urgent intake', steps: [] },
  { key: 'stale', name: 'Stale bundle', steps: [] },
  { key: 'draft', name: 'Grounded draft', steps: ['Policy', 'Lookup', 'Draft', 'Handoff'] },
  { key: 'injection', name: 'Private note', steps: ['Policy lookup', 'Handoff'] },
  { key: 'forbidden', name: 'Forbidden restore', steps: ['Restore'] },
  { key: 'replay', name: 'Approval replay', steps: [] },
];

export function episodeStrips(region) {
  const [cap, ...bands] = region.rows([0.65, 1, 1, 1, 1, 1, 1], 'tight');
  const split = (band) => band.columns([3, 6, 1.4], 'wide');
  const heads = split(cap).map((area, i) =>
    field(area, ['Episode', 'Planner trace', 'Effects'][i], 'dim', 31),
  );
  const strips = episodes.map((episode, i) => {
    const [nameArea, rail, effectArea] = split(bands[i]);
    const hasResult = episode.key === 'injection';
    const [dots, words, resultBand] = rail.rows(hasResult ? [1, 1, 1] : [1, 1], 'none');
    const points = dots.columns(4, 'tight').map((slot) => slot.point('center'));
    const baseline = line(points[0], points.at(-1), { stroke: 'grid', width: 3 });
    const ticks = points.map((p) =>
      circle(7, { fill: 'surface', stroke: 'dim', width: 2 }).moveTo(p),
    );
    const name = field(nameArea, episode.name, 'ink', 34);
    const marks = episode.steps.map((word, j) => {
      const bad = episode.key === 'forbidden';
      const mark = bad
        ? group(
            line([-9, -9], [9, 9], { stroke: C.blocked, width: 5 }),
            line([-9, 9], [9, -9], { stroke: C.blocked, width: 5 }),
          ).moveTo(points[j])
        : dot(12, C.stored).moveTo(points[j]);
      return [
        mark,
        place(note(word, { color: bad ? C.blocked : C.stored }), words.columns(4, 'tight')[j]),
        ...(hasResult && j === 0
          ? [place(note('↳ abstain', { size: 27 }), resultBand.columns(4, 'tight')[j])]
          : []),
      ];
    });
    const empty = place(
      note(episode.key === 'replay' ? 'Separate executor' : 'No planner steps'),
      words,
      'left',
    );
    const [symbol, number] = effectArea.columns([1, 2], 'normal');
    const count = episode.key === 'replay' ? 1 : 0;
    const effect = [
      place(
        circle(14, {
          stroke: count ? C.effect : 'dim',
          fill: count ? C.effect : 'surface',
          width: 3,
        }),
        symbol,
      ),
      field(number, String(count), count ? C.effect : 'dim'),
    ];
    return {
      name,
      nameArea,
      rail,
      words,
      points,
      effectArea,
      number,
      marks,
      empty,
      effect,
      skeleton: [baseline, ticks, name],
      observed: [marks.length ? marks : empty, effect],
    };
  });
  return { heads, strips };
}
