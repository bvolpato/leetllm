import { assertEqual, dot, group, line, place, rect } from 'vizmatic/stage';
import { heading, label, mono, note } from '../../kit-narrated.mjs';
import { BODY, CANDIDATES, FOOT, TOP } from '../parts.mjs';

const floor = 0.975;
const byteLimit = 1200;
function outcome({ bytes, recall }) {
  if (
    !Number.isInteger(bytes) ||
    bytes <= 0 ||
    !Number.isFinite(recall) ||
    recall < 0 ||
    recall > 1
  )
    return 'invalid';
  if (bytes > byteLimit) return 'over budget';
  if (recall < floor) return 'below recall';
  return 'eligible';
}

export default function releaseExperiment(s, c) {
  const title = heading(c.title);
  const source = place(note('Example measurements on the same judged policy queries'), TOP);
  const [head, ...rows] = BODY.rows([0.8, 1, 1, 1, 1], 'normal');
  const split = (r) => r.columns([1.15, 2.45, 1, 2.45, 0.95, 1.35], 'tight');
  const [, byteTitle, , recallTitle] = split(head);
  const byteX = (r, v) => r.left + (r.width * (Math.log2(v) - 3)) / 10;
  const recallX = (r, v) => r.left + (r.width * (v - 0.93)) / 0.07;
  const heads = [
    place(label('≤ 1,200 B', { color: 'yellow', size: 37 }), byteTitle),
    place(label('Recall@10 ≥ 0.975', { color: 'yellow', size: 35 }), recallTitle),
  ];
  const frames = rows.map((r, i) => {
    const [name, byteRail, byteValue, recallRail, recallValue, result] = split(r);
    const v = CANDIDATES[i];
    const track = (region, threshold, leftPasses) => {
      const y = region.cy;
      return group(
        line([region.left, y], [region.right, y], { stroke: 'dim', width: 3 }),
        line(
          [leftPasses ? region.left : threshold, y],
          [leftPasses ? threshold : region.right, y],
          { stroke: 'ink', width: 7 },
        ),
        line([threshold, y - 20], [threshold, y + 20], { stroke: 'yellow', width: 4 }),
      );
    };
    const score = (recall) =>
      Number.isFinite(recall)
        ? [
            dot(13, 'cyan').moveTo([recallX(recallRail, recall), recallRail.cy]),
            place(mono(recall.toFixed(3), { size: 33 }), recallValue),
          ]
        : [place(mono('∞', { size: 46 }), recallValue)];
    const decision = (record) =>
      place(
        label(outcome(record), {
          size: 30,
          color: outcome(record) === 'eligible' ? 'green' : 'red',
        }),
        result,
      );
    return {
      rails: [
        place(label(v.name, { size: 38 }), name, 'left'),
        track(byteRail, byteX(byteRail, byteLimit), true),
        track(recallRail, recallX(recallRail, floor), false),
      ],
      bytes: [
        dot(13, 'cyan').moveTo([byteX(byteRail, v.bytes), byteRail.cy]),
        place(mono(v.bytes.toLocaleString('en-US'), { size: 33 }), byteValue),
      ],
      score: score(v.recall),
      result: decision(v),
      ...(v.name === 'native'
        ? { invalidScore: score(Infinity), invalidResult: decision({ ...v, recall: Infinity }) }
        : {}),
    };
  });
  const valid = CANDIDATES.filter((v) => outcome(v) === 'eligible');
  const nativeIndex = CANDIDATES.findIndex((v) => v.name === 'native');
  const replay = CANDIDATES.map((v, i) => (i === nativeIndex ? { ...v, recall: Infinity } : v));
  assertEqual(valid.map((v) => v.name).join(), 'native', 'worksheet survivors');
  assertEqual(replay.filter((v) => outcome(v) === 'eligible').length, 0, 'invalid recall replay');
  const native = frames[nativeIndex];
  const ask = place(
    label('Which candidate qualifies for a held-out test?', { color: 'yellow' }),
    FOOT,
  );
  const picked = place(label('Test the native 256-coordinate index.', { color: 'green' }), FOOT);
  const retry = place(
    label('With this recall report, which candidate qualifies?', { color: 'yellow' }),
    FOOT,
  );
  const none = place(
    label('Keep the current index. Remeasure native recall.', { color: 'yellow' }),
    FOOT,
  );
  const proof = place(
    note('Read bytes on a log scale. The thick part of each rail meets its limit.'),
    FOOT,
  );
  s.add(
    title,
    source,
    heads,
    frames.map((v) => v.rails),
    proof,
  );
  c.show(
    'gate-bytes',
    frames.map((v) => v.bytes),
  );
  c.show(
    'gate-recalls',
    frames.map((v) => v.score),
  );
  c.swap('gate-ask', proof, ask);
  c.swap('gate-native', ask, picked, { after: true });
  c.show(
    'gate-native',
    frames.map((v) => v.result),
    { after: true },
  );
  c.hide('gate-replay', [picked, ...frames.map((v) => v.result)]);
  c.swap('gate-invalid', native.score, native.invalidScore, { after: true });
  c.show('gate-retry', retry);
  c.swap('gate-none', retry, none, { after: true });
  c.show(
    'gate-none',
    frames.map((v, i) => (i === nativeIndex ? native.invalidResult : v.result)),
    { after: true },
  );

  const [before, prefix, packed] = [1536 * 4, 256 * 4, 256];
  const raw = [before, prefix, packed];
  assertEqual(before / packed, 24, 'raw array saving');
  const resources = place(label('Raw coordinate storage per vector', { size: 47 }), TOP);
  const byteRows = BODY.rows(3, 'wide');
  const strips = raw.map((v, i) => {
    const [name, strip, value] = byteRows[i].columns([2.7, 4, 1.3], 'wide');
    const width = (strip.width * v) / before;
    return [
      place(label(['1,536 × float32', '256 × float32', '256 × int8'][i]), name, 'left'),
      rect(width, 46, { fill: i === 2 ? 'yellow' : 'cyan' }).moveTo([
        strip.left + width / 2,
        strip.cy,
      ]),
      place(mono(v.toLocaleString('en-US') + ' B', { size: 38 }), value, 'left'),
    ];
  });
  const costs = place(
    label('Also measure the graph, full-vector store, fetches and latency.', { size: 37 }),
    FOOT,
  );
  c.swap(
    'gate-payload',
    [
      source,
      heads,
      frames.map((v) => v.rails),
      frames.map((v) => v.bytes),
      frames.map((v, i) => (i === nativeIndex ? v.invalidScore : v.score)),
      frames.map((v, i) => (i === nativeIndex ? v.invalidResult : v.result)),
      none,
    ],
    [resources, strips[0]],
  );
  c.show('gate-prefix', strips[1]);
  c.show('gate-code', strips[2]);
  c.show('gate-costs', costs);
}
