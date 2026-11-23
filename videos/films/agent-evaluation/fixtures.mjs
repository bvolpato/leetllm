export const TRIALS = [
  {
    task: 'Catalog',
    pass: [true, true, true],
    cost: [0.01, 0.012, 0.011],
    seconds: [2, 3, 2.5],
  },
  {
    task: 'Hold',
    pass: [true, false, true],
    cost: [0.03, 0.04, 0.035],
    seconds: [4, 7, 5],
  },
  {
    task: 'Private account',
    pass: [true, true, false],
    cost: [0.02, 0.02, 0.025],
    seconds: [3, 4, 8],
  },
];
export const ECONOMIC_RUNS = Object.freeze(
  TRIALS.flatMap((task, taskIndex) =>
    task.cost.map((cost, trial) => ({
      id: 'R' + (taskIndex * 3 + trial + 1),
      task: task.task,
      cost,
      pass: task.pass[trial],
      seconds: task.seconds[trial],
    })),
  ),
);
export const JUDGE_ROWS = Object.freeze([
  {
    human: 'A',
    forward: 'A',
    swap: 'A',
  },
  {
    human: 'B',
    forward: 'B',
    swap: 'A',
  },
  {
    human: 'A',
    forward: 'A',
    swap: 'A',
  },
  {
    human: 'B',
    forward: 'A',
    swap: 'B',
  },
]);
