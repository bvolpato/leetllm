import { createHash } from 'node:crypto';
export const fixturePath = 'eval/access_requests.jsonl';
export const rows = [
  {
    prompt: 'Access request 101 status?',
    expected: 'approved',
    prediction: 'approved',
  },
  {
    prompt: 'Access request 102 status?',
    expected: 'blocked',
    prediction: 'escalated',
  },
  {
    prompt: 'Access request 103 status?',
    expected: 'restored',
    prediction: 'restored',
  },
];
export const wrongRow = {
  prompt: 'Access request 104 status?',
  expected: 'approved',
  prediction: 'blocked',
};
export const commitFixtures = Array.from(
  {
    length: 8,
  },
  (_, i) => (i < 5 ? rows : [...rows, wrongRow]),
);
export const job = {
  owner: 'learner',
  pid: 4281,
  started: '10:02:00',
  command: 'bash scripts/eval_loop.sh',
};
export const replacement = {
  owner: 'learner',
  pid: 4281,
  started: '10:08:12',
  command: 'python backup.py',
};
export const freshRows = Array.from(
  {
    length: 7,
  },
  (_, i) => ({
    prompt: `Fresh request ${201 + i}?`,
    expected: i % 2 ? 'blocked' : 'approved',
    prediction: i < 5 ? ` ${i % 2 ? 'BLOCKED' : 'APPROVED'} ` : 'escalated',
  }),
);
export const freshWrong = {
  prompt: 'Fresh request 208?',
  expected: 'approved',
  prediction: 'blocked',
};
export const lfsPayload = Uint8Array.from([0, 1, 2, 255, 10, 76, 70, 83]);
export const lfsDigest = createHash('sha256').update(lfsPayload).digest('hex');
export const lfsPointer = `version https://git-lfs.github.com/spec/v1\noid sha256:${lfsDigest}\nsize ${lfsPayload.length}\n`;
