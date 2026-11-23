import { C, mix, smooth } from './studio.mjs';
import { saved, instructionLines, modelFor, safety, safetyMarks, release, billingCase } from './examples.mjs';
import { permits, pair } from './policy.mjs';

function programCartridge(
  p,
  x,
  y,
  w,
  h,
  { inside = true, model, kind = 'file' } = {},
) {
  p.poly(
    [
      [x, y],
      [x + w - 60, y],
      [x + w, y + 60],
      [x + w, y + h],
      [x, y + h],
    ],
    C.ivory,
  );
  const headings = { compiled: 'COMPILED PROGRAM', loaded: 'LOADED PROGRAM', file: 'PROMPT STATE' };
  p.lab(headings[kind], x + 31, y + 52);
  p.title(kind === 'file' ? 'compiled.json' : 'DeployAnswerer', x + 31, y + 119, 49, C.ink);
  p.edge(x + 31, y + 148, w - 62);
  if (inside) {
    p.lab('PREDICTOR', x + 31, y + 193);
    p.mono('decide', x + 176, y + 194, 32);
    const left = x + 57;
    p.line(x + 33, y + 214, x + 33, y + h - 33, C.teal, 3);
    p.lab('SIGNATURE INSTRUCTION', left, y + 234);
    instructionLines.forEach((line, i) => p.txt(line, left, y + 269 + i * 33, 29));
    p.lab('DEMONSTRATIONS', left, y + 345);
    saved.decide.demos.forEach((d, i) => {
      const row = y + 358 + i * 47;
      p.rect(left, row, w - 89, 40, '#dde3ce');
      p.mono(d.route + '  /  ' + (d.record_id || '""'), left + 12, row + 29, 25);
    });
  }
  if (model) {
    p.lab('ATTACHED MODEL', x + 57, y + h - 37);
    p.mono(model, x + w - 53, y + h - 31, 42, C.rust, 'right');
  }
}
export function archive(p) {
  const { beat, cue, title, txt } = p;
  p.background();
  title('Save the two-example program', 65, 111);
  programCartridge(p, 68, 174, 644, 540, {
    model: cue(1, 'Attach model A') ? saved.decide.lm.model : null,
    kind: 'compiled',
  });
  const save = cue(1, 'save the state as JSON', 0.9);
  if (save) {
    p.arrow(732, 419, 732 + 129 * save, 419, C.mint);
    if (save === 1) {
      programCartridge(p, 889, 174, 635, 540, {
        inside: beat === 2,
        model: beat === 2 ? saved.decide.lm.model : null,
      });
      if (beat === 1) txt('Which fields survive?', 926, 462, 40, C.ink, 'Serif');
    }
  }
  if (beat === 2) {
    txt('Field prefix', 946, 648, 25, C.teal);
    p.mono(saved.decide.signature.fields.at(-1).prefix, 1105, 648, 27);
    txt('Load into the matching class.', 69, 795, 38, C.ivory, 'Serif');
  }
}
const start = { x: 622, y: 400 },
  split = { x: 855, y: 400 };
const sockets = { A: { x: 1170, y: 276 }, B: { x: 1170, y: 559 } };
function wire(p, to, progress, color) {
  const target = { x: sockets[to].x + 15, y: sockets[to].y };
  const nodes = [start, split, { x: split.x, y: target.y }, target];
  const distances = nodes
    .slice(1)
    .map((point, i) => Math.hypot(point.x - nodes[i].x, point.y - nodes[i].y));
  let rem = distances.reduce((a, b) => a + b, 0) * progress,
    tip = start;
  for (let i = 0; i < distances.length; i++) {
    const t = Math.min(1, rem / distances[i]),
      a = nodes[i],
      b = nodes[i + 1];
    if (t <= 0) break;
    tip = { x: mix(a.x, b.x, t), y: mix(a.y, b.y, t) };
    p.line(a.x, a.y, tip.x, tip.y, color, 7);
    rem -= distances[i];
  }
  return tip;
}
export function restore(p) {
  const { beat, cue, title, lab, mono, txt, page, edge, rect, dot } = p;
  p.background();
  if (beat <= 2) {
    const bound = !!cue(2, 'The next call');
    title(bound ? 'First call after rebinding' : 'First call after reload', 66, 103);
    const explained = !!cue(2, 'which takes precedence');
    const attached = bound ? 'B' : saved.decide.lm.model;
    const target = modelFor(attached, 'B');
    const loaded = cue(1, 'then reload the saved state', 0.6);
    if (loaded > 0)
      programCartridge(p, 63, 168, 559, 550, {
        inside: true,
        model: explained ? attached : null,
        kind: 'loaded',
      });
    else {
      page(64, 168, 559, 258);
      lab('SAVED STATE', 102, 227);
      mono('compiled.json', 102, 326, 44);
    }
    lab('GLOBAL DEFAULT  /  MODEL B', 931, 152, C.mint);
    for (const id of ['A', 'B']) {
      const pos = sockets[id];
      page(pos.x, pos.y - 59, 336, 120, id === 'A' ? '#e6d2b0' : '#c2dccd');
      mono('model ' + id, pos.x + 65, pos.y + 17, 45);
      dot(pos.x + 15, pos.y, 11, C.ink);
    }
    if (loaded) {
      wire(p, 'A', 1, '#6b8483');
      wire(p, 'B', 1, '#6b8483');
    }
    const travel = smooth(
      bound
        ? cue(2, 'The next call now goes to B', 1.15)
        : cue(2, 'Trace the call through the junction', 1.55),
    );
    if (travel > 0) {
      const point = wire(p, target, travel, C.yellow);
      dot(point.x, point.y, 11, C.yellow);
      if (travel === 1)
        lab(
          bound ? 'NEXT REQUEST RECEIVED' : 'FIRST REQUEST RECEIVED',
          sockets[target].x + 18,
          sockets[target].y + 96,
          C.yellow,
          20,
        );
    }
    if (bound) mono('program.set_lm(model_b)', 69, 792, 35, C.ivory);
    return;
  }
  if (beat === 3) {
    title('Inspect the serialized fields', 69, 103);
    const opened = cue(3, 'Open the nested configuration');
    page(70, 174, 1454, 539);
    lab('compiled.json   /   decide.lm   /   DSPy 3.4.0 fixture', 111, 240);
    mono('api_key', 112, 338, 42);
    txt('omitted', 891, 338, 41, C.teal);
    edge(111, 374, 1364);
    mono('extra_headers', 112, 457, 44);
    if (opened) {
      p.line(149, 476, 149, 541, C.rule, 4);
      p.line(149, 541, 196, 541, C.rule, 4);
      mono('Authorization', 225, 557, 39);
      mono(saved.decide.lm.extra_headers.Authorization, 889, 557, 40, C.rust);
      lab('Placeholder value preserved', 889, 617, C.rust);
    }
    if (cue(3, 'Read the demonstrations'))
      txt('Inspect instructions and demos for sensitive text, too.', 77, 792, 37, C.ivory, 'Serif');
    return;
  }
  title('Keep a reloadable, reviewed release', 70, 105);
  page(72, 175, 1454, 543);
  const parts = [
    ['State-only JSON', 'Compatible program class and dependencies'],
    ['Whole program', 'cloudpickle requires trusted provenance'],
    ['Evaluation', 'Effective model and engine, data and scorer'],
    ['Rollback', 'Retained approved files and checked target'],
  ];
  parts.forEach(([k, v], i) => {
    const y = 269 + i * 113;
    lab(k, 112, y, C.teal, 27);
    txt(v, 475, y, 37);
    edge(111, y + 36, 1372);
  });
  if (beat === 5)
    txt(
      'The digest identifies the bytes. Record who approved those bytes.',
      78,
      792,
      36,
      C.ivory,
      'Serif',
    );
}
export function releaseGate(p) {
  const { beat, cue, end, lab, page, mono, txt, title, rect } = p;
  p.background();
  if (beat <= 2) {
    permits(p, { billing: true, w: 705 });
    page(821, 70, 707, 579);
    lab('FROZEN PROMPT  /  INTENDED MODEL', 861, 131);
    const expected = !!cue(2, 'The action matches'),
      served = !!cue(2, 'Count that reply');
    const record = billingCase.recordId;
    pair(p, 860, 233, 626, 'Reviewed answer', expected ? { route: 'ABSTAIN', recordId: '' } : null);
    if (expected)
      pair(
        p,
        860,
        405,
        626,
        'Candidate reply',
        served ? { route: 'SERVE', recordId: record } : null,
        C.blue,
      );
    if (served) p.stamp('FORBIDDEN SERVE', 860, 527, 415, C.rust);
    return;
  }
  title('Requests that require abstention', 66, 106);
  const count = !!cue(3, 'Its mean score'),
    rule = !!cue(3, 'The release rule');
  page(66, 169, 838, 551);
  lab('SAFETY SAMPLE', 100, 226);
  mono(safety.relevant + ' cases', 552, 230, 35);

  for (let i = 0; i < safety.relevant; i++) {
    const x = 101 + (i % 10) * 77,
      y = 264 + Math.floor(i / 10) * 51;
    const error = i === 70 || (count && safetyMarks[i]);
    rect(x, y, 61, 35, error ? C.rust : count ? '#b3ccb7' : '#e4dcc7');
    if (error) {
      p.line(x + 21, y + 8, x + 40, y + 27, C.paper, 3);
      p.line(x + 40, y + 8, x + 21, y + 27, C.paper, 3);
    }
  }
  lab(
    count ? safety.forbidden + ' forbidden serves' : 'Marked case: billing-service',
    102,
    695,
    C.rust,
    25,
  );
  lab('RELEASE RULE', 974, 235, C.mint);
  if (rule) {
    mono('≤ ' + safety.capPercent + '%', 973, 335, 81, C.ivory);
    txt('forbidden serves', 976, 392, 35, C.ivory);
  }
  if (cue(4, 'Hold this release')) {
    mono(
      safety.forbidden + ' / ' + safety.relevant + ' = ' + release.percent + '%',
      969,
      525,
      53,
      C.yellow,
    );
  }
  if (cue(4, 'Look back')) p.stamp(release.verdict, 976, 587, 337, C.orange);
  if (beat === 3 && cue(3, 'Ship or hold')) txt('Ship or hold?', 977, 583, 55, C.ivory, 'Serif');
  if (cue(4, 'freeze it with its model'))
    txt('Revised prompt + bound model → fresh evaluation', 74, 803, 38, C.ivory, 'Serif');
}
