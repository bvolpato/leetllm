import { captions, frame, record, ring, sharedQueue, signal, vertex, wire } from '../parts.mjs';

export default function policyDefinition(s, c) {
  frame(s, 'What counts as one action?', 'One ticket at its routing decision', 'Ticket record');
  const risk = vertex('Risk', 'cause'),
    action = vertex('Workflow', 'a', 'cyan'),
    outcome = vertex('Resolution', 'y', 'green');
  const spill = sharedQueue(action);
  const route = wire(risk, action),
    resolve = wire(action, outcome, 'cyan');
  const focus = ring(risk);
  s.add(risk, action, outcome, route, resolve);
  const [unit, version, window] = record(s, [
    ['Decision', 'One ticket'],
    ['Workflow', 'Assistant v1', 'cyan'],
    ['Outcome', 'Resolution'],
  ]);
  signal(s, c, 'routing', [route]);
  signal(s, c, 'window', [resolve]);
  window(c, 'window', 'Within 24 h', true);
  c.show('baseline', focus);
  version(c, 'new-prompt', 'Assistant v2', true);
  c.show('queue', spill.nodes);
  c.on('another', () => spill.trace(s));
  unit(c, 'another', 'Shared queue');
  captions(s, c, 'Record the action at the moment of routing.', [
    ['baseline', 'Measure risk before assigning the workflow.'],
    ['new-prompt', 'A prompt change can define a different workflow version.'],
    ['another', 'Routing one ticket can change the staff available to handle another.'],
  ]);
}
