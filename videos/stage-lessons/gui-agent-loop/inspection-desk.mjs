import { boxOf, circle, line, place, rect } from 'vizmatic/stage';
import { label, mono, namedBox, note } from '../kit-narrated.mjs';
import { MAIN } from './parts.mjs';

export const [screenArea, paperArea] = MAIN.columns([1.45, 1], 'wide');

export function outline(region, color, fill = 'surface') {
  return place(
    rect(region.width, region.height, { radius: 14, fill, stroke: color, width: 3 }),
    region,
  ).zIndex(-2);
}

function rule(region, color = 'grid') {
  return line(region.point('bottom left'), region.point('bottom right'), {
    stroke: color,
    width: 2,
  });
}

export function browserPane(region, location, rowWeights = [1, 7]) {
  const [chrome, body] = region.inset('normal').rows(rowWeights, 'normal');
  const address = place(note(location, { color: 'cyan', size: 32 }), chrome, 'left');
  const edge = line(chrome.point('bottom left'), chrome.point('bottom right'), {
    stroke: 'blue',
    width: 2,
  });
  return { shell: [outline(region, 'blue'), address, edge], body };
}

export function button(region, name, color = 'cyan') {
  return place(
    namedBox(name, {
      width: region.width,
      height: Math.min(94, region.height),
      color,
      size: 38,
    }),
    region,
  );
}

// The ring is an annotation on the observation. Its center sits inside the
// control, clear of the label so that the proposed target remains readable.
export function aimAt(node) {
  const bounds = boxOf(node);
  return [bounds.left + 28, bounds.point('center')[1]];
}

export function proposedPoint(node) {
  return circle(13, { fill: null, stroke: 'yellow', width: 5 }).moveTo(aimAt(node));
}

export function draftPaper() {
  const inside = paperArea.inset('wide');
  const [file, run, requested, evidence, reference, verify] = inside.rows(
    [0.9, 1, 0.9, 1.1, 1, 1.1],
    'normal',
  );
  const base = [
    outline(paperArea, 'dim'),
    place(note('LOCAL INCIDENT DRAFT', { color: 'dim', size: 30 }), file, 'left'),
    place(mono('RUN-78432', { color: 'ink', size: 46 }), run, 'left'),
    place(note('Parser traceback', { color: 'dim' }), requested, 'bottom left'),
    ...[evidence, reference].map((r) => rule(r)),
  ];
  const state = (words, color) => place(note(words, { color, size: 33 }), verify, 'left');
  return { base, state };
}

export function failedTestRows(body, controls) {
  const lanes = body.rows(controls.length, 'wide');
  return controls.map((control, i) => {
    const lane = lanes[i];
    const [owner, action] = lane.inset('normal').rows([0.8, 1.2], 'tight');
    const run = place(mono(control.run, { color: 'ink', size: 42 }), owner, 'left');
    const tab = button(action, control.label);
    const frame = outline(lane, 'grid');
    return { frame, run, tab, owner, nodes: [frame, run, tab] };
  });
}

export function scopedTabs(controls, run) {
  return controls.filter((control) => control.run === run && control.label === 'Failed tests');
}
