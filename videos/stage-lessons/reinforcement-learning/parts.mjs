import { openingActions } from '../../films/reinforcement-learning/arithmetic.mjs';
import {
  gamma as discount,
  returns as modelReturns,
} from '../../films/reinforcement-learning/fixtures.mjs';
import { assertEqual, graph, place, segmentedBar } from 'vizmatic/stage';
import { area, label, mono, note } from '../kit-narrated.mjs';
export {
  gamma,
  returns,
  mdpBefore,
  mdpEvent,
  explorationQ,
  explorationEpsilon,
  updatedPolicy,
  openingPolicyValues,
  openingGradient,
  openingBaseline,
} from '../../films/reinforcement-learning/fixtures.mjs';
export {
  evidenceValue,
  reviewValue,
  indifferenceProbability,
} from '../../films/reinforcement-learning/arithmetic.mjs';
export {
  explorationEpisodes,
  explorationLedger,
  valueIteration,
  observeEnvironment,
} from '../../films/reinforcement-learning/model.mjs';

const opening = openingActions({ closed: 0, evidence_ready: 0, review_queue: 0 });
export const REWARD = Object.freeze({
  approve: opening.approve,
  ask: opening.evidence,
  reviewCost: opening.review,
  evidence: (modelReturns.evidence - opening.evidence) / discount,
  review: (modelReturns.review - opening.review) / discount,
  extraReview: modelReturns.evidenceReadyHuman - (modelReturns.review - opening.review),
});
assertEqual(REWARD.evidence, 70, 'model evidence reward');
assertEqual(REWARD.review, 80, 'model review reward');
assertEqual(REWARD.extraReview, -10, 'model extra review cost');

// Each action keeps its color when it becomes a next-token candidate.
export const ACTIONS = ['Approve', 'Evidence', 'Review'];
export const COLORS = ['pink', 'green', 'blue'];
export const [BOARD, SIDE] = area.columns([3, 2], 'loose');
export const [TOP, MAP, FOOT] = BOARD.rows([1, 7, 1], 'normal');

// The tested graph API owns token travel, edge messages, and changes of node values.
export function requestGraph(s, { token = 'new', values = ['', '', '', ''] } = {}) {
  const w = MAP.width,
    h = MAP.height;
  const nodes = [
    { id: 'new', label: 'New request', at: [-w * 0.35, 0], color: 'cyan' },
    { id: 'evidence', label: 'Evidence ready', at: [0, -h * 0.35], color: 'green' },
    { id: 'review', label: 'Human review', at: [0, h * 0.35], color: 'blue' },
    { id: 'closed', label: 'Closed', at: [w * 0.35, 0], color: 'dim' },
  ].map((node, i) => ({ ...node, width: 280, height: 110, value: values[i] }));
  const g = place(
    graph(
      nodes,
      [
        { from: 'new', to: 'closed', label: String(REWARD.approve), color: 'red' },
        { from: 'new', to: 'evidence', label: String(REWARD.ask), color: 'green' },
        { from: 'evidence', to: 'closed', label: '+' + REWARD.evidence, color: 'green' },
        { from: 'new', to: 'review', label: String(REWARD.reviewCost), color: 'blue' },
        { from: 'evidence', to: 'review', label: String(REWARD.extraReview), color: 'blue' },
        { from: 'review', to: 'closed', label: '+' + REWARD.review, color: 'blue' },
      ],
      {
        layout: 'manual',
        token,
        tokenColor: 'cyan',
        labelSize: 34,
        valueSize: 38,
        edgeLabelSize: 34,
        fillOpacity: 0.12,
      },
    ),
    MAP,
  );
  for (const edge of g.edges) {
    const caption = edge.caption;
    if (!caption) continue;
    if (edge.from === 'evidence' && edge.to === 'review') caption.shift(80, 60);
    else
      caption.shift(
        edge.from === 'new' && edge.to === 'closed' ? -130 : 0,
        edge.to === 'review' || edge.from === 'review' ? 44 : -44,
      );
  }
  const id = place(mono('REQ-10234', { color: 'cyan' }), TOP);
  const foot = place(note('Synthetic reward units  ·  γ = 0.9'), FOOT);
  return { g, id, foot, nodes: [g, id, foot] };
}

export function actionRows(region, values = ['', '', '']) {
  const rows = region.rows(3, 'loose');
  const names = [],
    numbers = [];
  for (let i = 0; i < 3; i++) {
    const [name, number] = rows[i].columns([2, 1], 'normal');
    names.push(place(label(ACTIONS[i], { color: COLORS[i] }), name, 'left'));
    numbers.push(place(mono(values[i], { color: COLORS[i] }), number));
  }
  return { names, numbers, nodes: [...names, ...numbers], rows };
}

// The head build keeps each segment, its readout, and its leader together.
export function probabilityStrip(s, region, initial = [1 / 3, 1 / 3, 1 / 3], names = ACTIONS) {
  assertEqual(Math.abs(initial.reduce((a, b) => a + b) - 1) < 1e-10, true, 'probability sum');
  const bar = place(
    segmentedBar(
      names.map((name, i) => ({ name, value: initial[i], color: COLORS[i] })),
      {
        width: region.width - 20,
        height: region.height * 0.3,
        max: 1,
        size: 40,
        readout: false,
        format: (value) => value.toFixed(3),
      },
    ),
    region,
  );
  return {
    bar,
    nodes: [bar],
    update: (values, options) =>
      bar.resize(Object.fromEntries(names.map((name, i) => [name, values[i]])), options),
  };
}
