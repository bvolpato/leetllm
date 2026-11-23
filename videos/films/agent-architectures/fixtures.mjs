export const REPLAN_SCENE_START = 269.8666666666667;
export const REPLAN_BEAT_START = 34.507999999999996;
export const REPLAN_BEAT_END = 52.242;
export const REPLAN_CUE_LEAD = 0.01;
export const REPLAN_QUESTION_PROGRESS =
  (310.0622 - REPLAN_CUE_LEAD - (REPLAN_SCENE_START + REPLAN_BEAT_START)) /
  (REPLAN_BEAT_END - REPLAN_BEAT_START);
export const REPLAN_ANSWER_PROGRESS =
  (312.1122 - REPLAN_CUE_LEAD - (REPLAN_SCENE_START + REPLAN_BEAT_START)) /
  (REPLAN_BEAT_END - REPLAN_BEAT_START);
export const VISIT_HOURS = Object.freeze({
  id: 'hours-24',
  venue: 'History',
  day: 'today',
  opens: 780,
  closes: 1080,
});
export const BUS_ROUTE = Object.freeze({
  id: 'route-31',
  venue: 'History',
  day: 'today',
  depart: 850,
  minutes: 25,
});
export const LATER_BUS_ROUTE = Object.freeze({ ...BUS_ROUTE, id: 'route-32', depart: 920 });
export const AGENT_DAG = Object.freeze({
  ci: [],
  diff: [],
  health: [],
  decision: ['ci', 'diff', 'health'],
  effect: ['decision'],
});
export const AA_ORIGINAL = new Set([
  'subject-intro',
  'state-record',
  'react-loop',
  'workflow-choice',
  'explicit-plan',
  'replan',
  'bounded-context',
  'transfer',
]);
