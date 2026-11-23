// What the scenes of `sandbox-execution` share: the example, the job of each color, and the
// pictures that two scenes show.
//
// The example is one run of one generated parser. `parse.py` reads `report.xml`, a JUnit report
// with four test cases, inside the cell of `worker-A`, generation 7. The cell has a wall. A scene
// sends something at the wall, and the picture shows where it stops.
import { codeBlock, dynamic, line, recolor, rect, to, zone } from 'vizmatic/stage';
import { parseReport } from '../../films/sandbox-execution/arithmetic.mjs';
import { REPORT } from '../../films/sandbox-execution/construction.mjs';
import { FRESH_REPORT_XML, REPORT_XML } from '../../films/sandbox-execution/fixtures.mjs';
import { label } from '../kit-narrated.mjs';

/** One color has one job through the lesson. */
export const COLOR = {
  /** The candidate: generated code, its worker and its wall. Not trusted. */
  candidate: 'pink',
  /** The supervisor and the host: the kernel, a control, a limit, a policy. Trusted. */
  host: 'cyan',
  /** The report and the evidence: XML, a traceback, an output row, bytes that travel. */
  evidence: 'blue',
  /** The validator, and a check that holds: pass, allowed, verified. */
  pass: 'green',
  /** What the voice names now, and the one result of a scene. */
  mark: 'yellow',
  /** A failure, a denial, a trap, a danger. */
  fail: 'red',
  /** A part that is done, a header, a thing that is absent. */
  quiet: 'dim',
};

/** The name of the worker of the example, and of the worker that takes its slot later. */
export const WORKER = 'worker-A · g7';
export const NEXT_WORKER = 'worker-A · g8';

/** A test case as the scenes show it: its id, its identity, and the tags of its direct children. */
const shown = (test) => ({
  id: test.id,
  className: test.className,
  name: test.name,
  identity: `${test.className}::${test.name}`,
  children: test.children.map((child) => child.tag),
});

/** The four test cases of `report.xml`, X1 to X4. */
export const CASES = REPORT.map(shown);
/** The four test cases of the fresh report of the last scene. */
export const FRESH_CASES = parseReport(FRESH_REPORT_XML).map(shown);

/** The size of the name on a wall. */
const WALL_TITLE = 31;

/**
 * The wall of a cell, with its name on the border: `wall(region, 'worker-A · g7')`. The border is
 * the edge of the region. A wall with no name takes `null`. The wall holds nothing: a scene places what is inside by the layout, so
 * each part inside shows and fades by itself. `wall.frame` is the border, for `draw`.
 */
export function wall(region, title, { color = COLOR.candidate, dash = false, fill = null } = {}) {
  const room = rect(region.width, region.height, { stroke: null, fill: null }).at(
    region.cx,
    region.cy,
  );
  return zone(room, {
    title: title ?? undefined,
    color,
    dash,
    fill,
    padding: 0,
    titleSize: WALL_TITLE,
    radius: 18,
    borderWidth: 4,
  });
}

/** The size of the XML of a report. The longest line of the two reports then fits the frame. */
const XML_SIZE = 26;

/**
 * A report as its real XML in a panel, with the parts that the parser reads: `reportPanel(REPORT_XML, CASES)`.
 * `report.line(i)` is the line of test case i, `report.identity(i)` are the glyphs of its class and
 * name, `report.children(i)` are the glyphs of its child elements, and `report.namespace` are the
 * glyphs of the namespace of the root. `report.focus(i)` moves the scan bar to a test case.
 */
export function reportPanel(xml, cases) {
  const lines = xml.split('\n');
  const block = codeBlock(xml, { language: 'plain', size: XML_SIZE });
  for (const glyph of block.chars) glyph.color(COLOR.evidence);
  // The line of each test case, in the order of the report.
  const lineOf = lines.flatMap((line, index) => (line.includes('<testcase') ? [index] : []));
  const inner = (index) => {
    const line = lines[lineOf[index]];
    return line.slice(line.indexOf('>') + 1, line.lastIndexOf('</testcase>'));
  };
  return {
    block,
    lineOf,
    line: (index) => block.line(lineOf[index]),
    identity: (index) =>
      block.find(
        `classname="${cases[index].className}" name="${cases[index].name}"`,
        lineOf[index],
      ),
    children: (index) => block.find(inner(index), lineOf[index]),
    namespace: block.find(lines[0].slice(lines[0].indexOf('xmlns'), -1), 0),
    focus: (index, options) => block.focus(lineOf[index], options),
    unfocus: (options) => block.unfocus(options),
  };
}

/** The XML of the two reports, for `reportPanel`. */
export { FRESH_REPORT_XML, REPORT_XML };

/**
 * A gauge: a track that fills from the left to a cap, by a value of the scene. `gauge(s, region, { cap: 0.8 })`
 * draws in the region. `gauge.level` is the value, from 0 to 1 of the track. The part over the cap is red.
 * The scene adds `gauge.track`, `gauge.fill` and `gauge.limit`.
 */
export function gauge(
  s,
  region,
  { cap = 1, color = COLOR.host, over = COLOR.fail, start = 0 } = {},
) {
  const level = s.value(start);
  const x = (value) => region.left + Math.max(0, Math.min(1, value)) * region.width;
  const bar = (from, to, fill) =>
    rect(to - from, region.height - 10, { fill, stroke: null, radius: 4, opacity: 0.85 }).at(
      (from + to) / 2,
      region.cy,
    );
  const track = rect(region.width, region.height, {
    radius: 8,
    stroke: COLOR.quiet,
    fill: 'surface',
    width: 2,
  }).at(region.cx, region.cy);
  const fill = dynamic(() => {
    const value = level.value;
    const parts = [];
    if (value > 0.004)
      parts.push(bar(x(0) + 5, Math.max(x(0) + 6, x(Math.min(value, cap)) - 1), color));
    if (value > cap + 0.004) parts.push(bar(x(cap) + 1, x(value) - 5, over));
    return parts;
  });
  const limit = line([x(cap), region.top - 12], [x(cap), region.bottom + 12], {
    stroke: 'ink',
    width: 4,
  });
  return { level, track, fill, limit, x, cap };
}

/**
 * Give a chip another color: its border and its label, and not its fill. `recolor(chip)` paints the
 * fill too, and the label is then lost on it. It returns animations for `s.play(...tintChip(chip, 'red'))`.
 */
export function tintChip(chip, color, options = { duration: 0.4 }) {
  return [
    recolor(chip.text, color, options),
    to(chip.frame, (frame) => frame.stroke(color), options),
  ];
}

/**
 * Slot A as a lane of time: `slotLane(track)` draws in the region. Generation 7 holds the first span
 * and generation 8 the second one, with the checks of the cleanup between them. `lane.x(part)` is a
 * place on the lane, from 0 to 1. The scene adds `lane.rail`, and the bar and the name of each span.
 */
export function slotLane(track, { old = [0.02, 0.5], next = [0.6, 0.98], size = 34 } = {}) {
  const x = (part) => track.left + part * track.width;
  const rail = rect(track.width, track.height, {
    radius: 10,
    stroke: COLOR.quiet,
    fill: 'surface',
    width: 2,
  }).at(track.cx, track.cy);
  const span = ([from, until], name) => ({
    from,
    until,
    bar: rect(x(until) - x(from), track.height - 14, {
      radius: 8,
      stroke: COLOR.candidate,
      fill: 'surface',
      width: 4,
    }).at((x(from) + x(until)) / 2, track.cy),
    name: label(name, { size, color: COLOR.candidate }).moveTo([
      (x(from) + x(until)) / 2,
      track.cy,
    ]),
  });
  return { x, rail, old: span(old, WORKER), next: span(next, NEXT_WORKER) };
}
