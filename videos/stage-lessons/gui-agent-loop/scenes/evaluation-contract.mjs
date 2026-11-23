import { assertEqual, place } from 'vizmatic/stage';
import { heading, label, mono, note } from '../../kit-narrated.mjs';
import { EPISODE, MAIN, footer } from '../parts.mjs';
import { outline } from '../inspection-desk.mjs';

export default function evaluation(s, c) {
  const [log, score] = MAIN.columns([1.2, 1], 'wide');
  const logRows = log.inset('normal').rows(6, 'normal');
  const scoreRows = score.inset('normal').rows(5, 'normal');
  const head = (str, r) => place(label(str, { size: 42 }), r, 'left');
  const logTitle = head('Local episode E1', logRows[0]);
  const receipts = head('What did the host establish?', scoreRows[0]);
  const outcomes = {
    dispatched: 'click sent',
    'stale-observation': 'stale, held',
    'saved-locally': 'saved locally',
    'outside-task-scope': 'blocked',
  };
  const actions = EPISODE.rows.map((step, i) => {
    const [n, task, status] = logRows[i + 1].columns([0.3, 1.5, 1.2], 'tight');
    return [
      place(mono(String(step.step), { color: 'dim', size: 34 }), n, 'left'),
      place(label(step.target, { size: 36 }), task, 'left'),
      place(
        note(outcomes[step.decision], {
          color: step.executed || step.decision === 'saved-locally' ? 'green' : 'pink',
        }),
        status,
        'left',
      ),
    ];
  });
  const metric = (i, description, text, color) => {
    const [name, fraction] = scoreRows[i].columns([2.4, 1], 'normal');
    return [
      place(note(description, { size: 32 }), name, 'left'),
      place(mono(text, { size: 40, color }), fraction, 'right'),
    ];
  };
  const hits = metric(
    1,
    'Hits / dispatched click',
    EPISODE.targetHits + ' / ' + EPISODE.dispatchedClicks,
    'cyan',
  );
  const goal = metric(2, 'Draft goals / episode', Number(EPISODE.goal) + ' / 1', 'green');
  const attempts = metric(
    3,
    'Forbidden / proposal',
    EPISODE.forbiddenAttempts + ' / ' + EPISODE.steps,
    'pink',
  );
  const violations = metric(
    4,
    'Violations / sent click',
    EPISODE.forbiddenExecutions + ' / ' + EPISODE.dispatchedClicks,
    'pink',
  );
  assertEqual(
    EPISODE.rows.filter((r) => r.forbidden && !r.executed).length,
    1,
    'one blocked forbidden proposal',
  );
  const benchmarkTitle = head('Benchmark', logRows[0]);
  const benchmark = ['WebArena', 'OSWorld', 'Mind2Web', 'GAIA', 'AgentDojo'].map((name, i) =>
    place(label(name, { size: 38, color: 'blue' }), logRows[i + 1], 'left'),
  );
  const evidence = [
    'Live web state',
    'Desktop and app state',
    'Recorded pages',
    'Assistant answers',
    'Tool injection',
  ].map((name, i) => place(note(name, { size: 32 }), logRows[i + 1], 'right'));
  const tests = [
    'Grounding and final state',
    'Blocked and executed actions',
    'Time, cost and reviewer load',
    'Cleanup and operator stop',
  ];
  const actual = tests.map((v, i) => place(note(v, { size: 34 }), scoreRows[i + 1], 'left'));
  s.add(heading(c.title), outline(log, 'dim'), outline(score, 'dim'), logTitle, receipts);
  c.show('open', actions[0]);
  c.show('stale', actions[1]);
  c.show('fresh', actions[2]);
  c.show('saved', actions[3]);
  c.show('deploy', actions[4]);
  c.show('hits', hits, { after: true });
  c.show('goal', goal, { after: true });
  c.show('attempts', attempts, { after: true });
  c.show('violations', violations, { after: true });
  const costs = footer(
    'Track calls, time, cost, review load and cleanup on the actual dashboard.',
    'blue',
  );
  c.show('costs', costs);
  c.swap(
    'bench',
    [logTitle, actions, receipts, hits, goal, attempts, violations],
    [
      benchmarkTitle,
      benchmark[0],
      evidence[0],
      head('Evidence from the CI pilot', scoreRows[0]),
      actual,
    ],
  );
  ['desktop', 'recorded', 'answers', 'injection'].forEach((cue, i) =>
    c.show(cue, [benchmark[i + 1], evidence[i + 1]]),
  );
  c.swap(
    'pilot',
    costs,
    footer('Read-only pilot   ·   measure the model on the actual CI dashboard', 'yellow'),
  );
}
