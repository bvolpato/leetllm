import { sources } from './fixtures.mjs';
import { createHash } from 'node:crypto';
export const hash = (value) =>
  createHash('sha256')
    .update(typeof value === 'string' ? value : JSON.stringify(value))
    .digest('hex');
export const originalArtifact = JSON.stringify({
  run: 'RUN-842',
  trace: 'trace-17',
  finding: 'authentication error',
});
export const originalInputs = {
  deploy: JSON.stringify(sources['deploy-record']),
};
export const receipt = {
  artifact: hash(originalArtifact),
  inputs: {
    deploy: hash(originalInputs.deploy),
  },
};
export function verifyReceipt(artifact, inputs, trustedReceipt = receipt) {
  const inputSet =
    Object.keys(inputs).sort().join() === Object.keys(trustedReceipt.inputs).sort().join();
  const artifactMatch = hash(artifact) === trustedReceipt.artifact;
  const inputMatch =
    inputSet &&
    Object.entries(inputs).every(([id, value]) => hash(value) === trustedReceipt.inputs[id]);
  return {
    inputSet,
    artifactMatch,
    inputMatch,
    passed: inputSet && artifactMatch && inputMatch,
  };
}
export function completeResume(tasks, files, receipts) {
  const ids = new Set(tasks.map((t) => t.id));
  if (
    ids.size !== tasks.length ||
    tasks.some(
      (t) =>
        typeof t.id !== 'string' ||
        !t.id.trim() ||
        !Array.isArray(t.depends) ||
        new Set(t.depends).size !== t.depends.length ||
        t.depends.some((d) => !ids.has(d)) ||
        !['done', 'pending'].includes(t.status),
    )
  )
    throw new Error('invalid task graph');
  const map = new Map(tasks.map((t) => [t.id, t])),
    visiting = new Set(),
    visited = new Set();
  const visit = (id) => {
    if (visiting.has(id)) throw new Error('dependency cycle');
    if (visited.has(id)) return;
    visiting.add(id);
    map.get(id).depends.forEach(visit);
    visiting.delete(id);
    visited.add(id);
  };
  tasks.forEach((t) => visit(t.id));
  const completed = new Set();
  for (const task of tasks.filter((t) => t.status === 'done')) {
    const r = receipts[task.receipt];
    if (
      !r ||
      r.task !== task.id ||
      r.passed !== true ||
      r.evaluator !== 'incident-evidence-check' ||
      r.contract !== (task.contract ?? 'incident-v1')
    )
      throw new Error('receipt does not certify task: ' + task.id);
    if (typeof files[r.artifact] !== 'string' || hash(files[r.artifact]) !== r.sha256)
      throw new Error('artifact changed: ' + task.id);
    const expected = task.inputs ?? [],
      actual = Object.keys(r.inputSha256 ?? {});
    if (expected.length !== actual.length || expected.some((id) => !actual.includes(id)))
      throw new Error('receipt input set differs: ' + task.id);
    for (const [id, digest] of Object.entries(r.inputSha256))
      if (typeof files[id] !== 'string' || hash(files[id]) !== digest)
        throw new Error('input changed: ' + task.id);
    completed.add(task.id);
  }
  for (const task of tasks)
    if (completed.has(task.id) && task.depends.some((d) => !completed.has(d)))
      throw new Error('done task has unfinished dependencies');
  const next =
    tasks.find((t) => t.status === 'pending' && t.depends.every((d) => completed.has(d)))?.id ??
    null;
  return {
    completed: [...completed],
    next,
  };
}
export function contextResumeFixture() {
  const files = {
    'report.json': '{"trace":"R17","observed":403}',
    'deploy.json': '{"revision":7}',
    'authorization.json': '{"role":"incident lead"}',
  };
  const tasks = [
    {
      id: 'collect',
      depends: [],
      status: 'done',
      receipt: 'collect-receipt',
      inputs: ['deploy.json'],
    },
    {
      id: 'verify cause',
      depends: ['collect'],
      status: 'pending',
      inputs: [],
    },
    {
      id: 'write report',
      depends: ['verify cause'],
      status: 'pending',
      inputs: [],
    },
  ];
  const receipts = {
    'collect-receipt': {
      task: 'collect',
      passed: true,
      evaluator: 'incident-evidence-check',
      contract: 'incident-v1',
      artifact: 'report.json',
      sha256: hash(files['report.json']),
      inputSha256: {
        'deploy.json': hash(files['deploy.json']),
      },
    },
  };
  return {
    files,
    tasks,
    receipts,
  };
}
export function contextFreshResumeFixture() {
  const fixture = contextResumeFixture();
  fixture.files['trace.json'] = '{"trace":"R17","revision":1,"status":403}';
  fixture.tasks[0].inputs = ['trace.json', 'authorization.json'];
  fixture.receipts['collect-receipt'].inputSha256 = Object.fromEntries(
    fixture.tasks[0].inputs.map((id) => [id, hash(fixture.files[id])]),
  );
  return fixture;
}
export function contextOperationLedger(events) {
  const keys = new Set();
  let effects = 0,
    highestFence = 12;
  return events.map((event) => {
    if (event.fence < highestFence)
      return {
        ...event,
        status: 'stale fence',
        effects,
      };
    highestFence = event.fence;
    if (keys.has(event.key))
      return {
        ...event,
        status: 'already pending; reconcile',
        effects,
      };
    keys.add(event.key);
    if (event.confirmed) effects++;
    return {
      ...event,
      status: event.confirmed ? 'confirmed' : 'unknown; reconcile',
      effects,
    };
  });
}
