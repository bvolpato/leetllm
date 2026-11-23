import { place, rect, assertEqual } from 'vizmatic/stage';
import { area, label, note } from '../kit-narrated.mjs';
import {
  CASES,
  PROGRAMS,
  PAIRS,
  RELEASES,
  exposureCases,
  probes,
} from '../../films/benchmark-audits/fixtures.mjs';
import { scoreCases, checkProbe, freshAuditDecision } from '../../films/benchmark-audits/model.mjs';
export {
  CASES,
  PROGRAMS,
  PAIRS,
  RELEASES,
  exposureCases,
  probes,
  scoreCases,
  checkProbe,
  freshAuditDecision,
};
export {
  subsetCoverage,
  wilsonInterval,
  exactPairedP,
  binomialChoose,
  preferenceProbability,
  rankedPrecision,
  strictMetricRecord,
} from '../../films/benchmark-audits/arithmetic.mjs';

// Cyan is A or source evidence. Blue is B or candidate output. Green is verified support.
// Red is failure. Pink is exposure. Yellow is the operation or the current result.
export const COLOR = Object.freeze({
  A: 'cyan',
  B: 'blue',
  pass: 'green',
  fail: 'red',
  exposed: 'pink',
  focus: 'yellow',
});
export const [DOCK, VIEW] = area.columns([1, 3], 'loose');
export const [MAIN, FOOT] = VIEW.rows([7, 1], 'wide');
// The library examples reuse the same case IDs whenever the report is opened.
export const STATE = Object.freeze({
  first: 'intro',
  carryFrom: 'contract',
  carryThrough: 'synthesis',
  ends: Object.freeze({
    'intro': {
      'board': 'Ordinary pass counts beside the ten aligned renewal cases.',
      'A': 90,
      'B': 90,
      'cases': 100,
      'result': 'Equal totals retain different failed identities.',
    },
    'contract': {
      'board': 'The unchanged library board remains in the left dock.',
      'A': 90,
      'B': 90,
      'cases': 100,
      'result': 'The scope changes to a system comparison.',
    },
    'gold-contract': {
      'board': 'The unchanged library board remains in the left dock.',
      'A': 90,
      'B': 90,
      'cases': 100,
      'result': 'Gold defects are repaired before grading.',
    },
    'checker': {
      'board': 'The complete answer sits above its literal check and reviewed deadline.',
      'A': 90,
      'B': 90,
      'cases': 100,
      'result': 'The same words can yield a false positive or false negative.',
    },
    'rag-stage': {
      'board': 'The unchanged library board remains in the left dock.',
      'A': 90,
      'B': 90,
      'cases': 100,
      'result': 'Retrieval, generation and citation checks remain separate.',
    },
    'rag-metrics': {
      'board': 'The unchanged library board remains in the left dock.',
      'A': 90,
      'B': 90,
      'cases': 100,
      'result': 'Precision, recall and faithfulness produce different results.',
    },
    'knowledge-contract': {
      'board': 'The unchanged library board remains in the left dock.',
      'A': 90,
      'B': 90,
      'cases': 100,
      'result': 'Public task contracts stay distinct from private compliance.',
    },
    'math-frontier': {
      'board': 'The unchanged library board remains in the left dock.',
      'A': 90,
      'B': 90,
      'cases': 100,
      'result': 'A parser, proof and dataset version identify the experiment.',
    },
    'code-contract': {
      'board': 'The loan-period patch passes the two selected tests and fails the omitted textbook assertion.',
      'A': 90,
      'B': 90,
      'cases': 100,
      'result': 'Resolved describes the selected harness only.',
    },
    'benchmark-audit': {
      'board': 'The unchanged library board remains in the left dock.',
      'A': 90,
      'B': 90,
      'cases': 100,
      'result': 'Audit scope and date remain visible.',
    },
    'preference-ratings': {
      'board': 'The unchanged library board remains in the left dock.',
      'A': 90,
      'B': 90,
      'cases': 100,
      'result': 'Half-credit ties and support labels retain their meanings.',
    },
    'slices': {
      'board': 'The two renewal rows share question numbers and show the offsetting ordinary losses.',
      'A': 90,
      'B': 90,
      'cases': 100,
      'result': 'A passes two and B nine of the same ten.',
    },
    'candidates': {
      'board': 'Each pair has one square. The lower-index selector returns a pass in eight squares.',
      'A': 90,
      'B': 90,
      'cases': 100,
      'result': 'Candidate coverage differs from selected success.',
    },
    'sample-estimator': {
      'board': 'Sixteen cross-problem pairs account for the gap between the pooled and per-problem scores.',
      'A': 90,
      'B': 90,
      'cases': 100,
      'result': 'Subset counting and per-problem averaging preserve identities.',
    },
    'judge-controls': {
      'board': 'The unchanged library board remains in the left dock.',
      'A': 90,
      'B': 90,
      'cases': 100,
      'result': 'Slot-A wins map to different names, so the pair stays unresolved.',
    },
    'exposure': {
      'board': 'The unchanged library board remains in the left dock.',
      'A': 90,
      'B': 90,
      'cases': 100,
      'result': 'The April used case follows the February used case.',
    },
    'exposure-screen': {
      'board': 'The unchanged library board remains in the left dock.',
      'A': 90,
      'B': 90,
      'cases': 100,
      'result': 'Canary and date evidence do not certify independence.',
    },
    'uncertainty': {
      'board': 'The unchanged library board remains in the left dock.',
      'A': 90,
      'B': 90,
      'cases': 100,
      'result': 'The exact all-pass probability falls.',
    },
    'wilson-construction': {
      'board': 'Three Wilson intervals share a common release floor.',
      'A': 90,
      'B': 90,
      'cases': 100,
      'result': 'Three calculated lower bounds preserve their sample sizes.',
    },
    'paired-diagnosis': {
      'board': 'The unchanged library board remains in the left dock.',
      'A': 90,
      'B': 90,
      'cases': 100,
      'result': 'Paired tail counts and the retained Q82 to Q88 regressions answer separate questions.',
    },
    'gates': {
      'board': 'The unchanged library board remains in the left dock.',
      'A': 90,
      'B': 90,
      'cases': 100,
      'result': 'Only Balanced clears these point-estimate checks.',
    },
    'finite-report': {
      'board': 'The unchanged library board remains in the left dock.',
      'A': 90,
      'B': 90,
      'cases': 100,
      'result': 'Only valid data reaches release gates.',
    },
    'reproducible-package': {
      'board': 'The unchanged library board remains in the left dock.',
      'A': 90,
      'B': 90,
      'cases': 100,
      'result': 'A matched manifest cannot replace missing outputs.',
    },
    'synthesis': {
      'board': 'Q100 stays with the renewal report as its retained miss.',
      'A': 90,
      'B': 90,
      'cases': 100,
      'result': 'The report stays inspectable.',
    },
    'fresh-report': {
      'board': 'The archive decision sends F031 to regression and reserves untouched cases for the next evaluation.',
      'A': 180,
      'B': 188,
      'cases': 200,
      'result': 'The candidate is held and both broken identities remain.',
    },
  }),
  libraryCases: CASES.length,
  renewalIds: CASES.filter((r) => r.category === 'renewal').map((r) => r.id),
});
assertEqual(scoreCases('A').correct, scoreCases('B').correct, 'equal opening totals');
assertEqual(PAIRS.length, (PROGRAMS.length * (PROGRAMS.length - 1)) / 2, 'distinct program pairs');
export function caseGrid(region, model, { quiet = false } = {}) {
  const side = Math.min(region.width, region.height) / 10;
  const cells = CASES.map((r, i) => {
    const cell = rect(side * 0.74, side * 0.74, {
      fill: quiet ? 'dim' : r[model] ? COLOR[model] : 'red',
      stroke: null,
    });
    const top = region.point('top left');
    cell.moveTo([top[0] + side * (Math.floor(i / 10) + 0.5), top[1] + side * ((i % 10) + 0.5)]);
    return cell;
  });
  return { cells, renewals: cells.slice(90), ordinary: cells.slice(0, 90) };
}
export function caseBoard() {
  const slots = DOCK.rows(2, 'wide');
  const nodes = [],
    grids = {};
  for (const [i, model] of ['A', 'B'].entries()) {
    const [top, body, foot] = slots[i].rows([1, 5, 1], 'tight');
    const title = place(
      label(`${model} · ${scoreCases(model).correct}/${CASES.length}`, { color: COLOR[model] }),
      top,
    );
    const g = caseGrid(body.inset('tight'), model);
    const caption = place(note('Library · Q1 to Q100'), foot);
    grids[model] = g;
    nodes.push(title, ...g.cells, caption);
  }
  return { nodes, grids };
}
export const POLICY = Object.freeze([
  { id: 'P1', question: 'freeze deployment', fact: 'commander approval' },
  { id: 'P2', question: 'threshold breach', fact: 'rollback runbook' },
  { id: 'P3', question: 'exposed tokens', fact: 'revoke within 15 min' },
]);
