import { createHash } from 'node:crypto';
import {
  reportRequest,
  reportRuns,
} from '../../../films/local-agent-sandboxing-seatbelt-landlock/fixtures.mjs';
import {
  helperAllows,
  resolveFixture,
  seatbeltStartup,
  syscallAllowed,
} from '../../../films/local-agent-sandboxing-seatbelt-landlock/model.mjs';
import { reportWalk } from '../../../films/local-agent-sandboxing-seatbelt-landlock/report-board.mjs';

export const experiment = reportRuns.map((run) => ({ ...run, ...reportWalk(run) }));
export { reportRequest, seatbeltStartup };
export const testCase = { input: 4, expected: 8, path: 'tests/case.txt', output: 'src/report.txt' };
export function runTest(fixture) {
  const actual = fixture.input * 2;
  return { actual, outputByte: actual === fixture.expected ? 'x' : '' };
}
export function append(contents, byte, allowed) {
  return allowed ? contents + byte : contents;
}
export function grantWrites(root, file) {
  const actual = resolveFixture('/workspace/' + file, {}).actual;
  const base = root === 'project' ? '/workspace' : '/workspace/' + root;
  return actual === base || actual.startsWith(base + '/');
}
export const dirs = ['tests', 'src', '.git'];
export function grantRows(root, childRead) {
  return dirs.map((dir) => ({
    dir,
    write: grantWrites(root, dir + '/file'),
    readGrant: childRead && dir === '.git',
  }));
}
export const filesystemRights = [
  { name: 'Write an existing file', since: 1 },
  { name: 'Truncate a file', since: 3 },
];
export const extendedRights = [
  { name: 'TCP port controls', since: 4 },
  { name: 'Signals across Landlock domains', since: 6 },
];
export function probe(abi, required = filesystemRights) {
  const covered = required.map((right) => abi >= right.since);
  return { covered, canStart: covered.every(Boolean) };
}
export const helperFiles = ['.env', '.env.local', '.git/config', '.git/config.bak'].map((name) => ({
  name,
  helper: helperAllows('/workspace/' + name, {}),
  grant: grantWrites('src', name),
}));
export function readGates(file) {
  const syscall = syscallAllowed('openat');
  const resource = resolveFixture('/workspace/' + file, {}).actual.startsWith('/workspace/tests/');
  return { syscall, resource, read: syscall && resource };
}
export const reads = [testCase.path, 'private/note.txt'].map((file) => ({
  file,
  ...readGates(file),
}));
export const brokerScope = {
  method: 'GET',
  repo: 'owner/repo',
  number: 42,
  caller: 'test',
  args: '',
};
export const upstreamReply = { number: 42, state: 'open', debug: 'fixture detail' };
export function dispatch(request) {
  const allowed = Object.keys(brokerScope).every((key) => request[key] === brokerScope[key]);
  return {
    allowed,
    upstream: Number(allowed),
    reply: allowed ? { number: upstreamReply.number, state: upstreamReply.state } : null,
  };
}
export const wheelDigest = createHash('sha256')
  .update('teaching fixture: approved package bytes')
  .digest('hex');
export const lockedDigest = 'bb01ce1c87a44cc8e21bfd4adfa58cf3dba438b535a837626c99aac3f013ef58';
export function inspectReceipt(run) {
  const destination = run.resolved.split('/')[0];
  const predicted = { src: 0, archive: 0 };
  predicted[destination] = Buffer.byteLength(append('', 'x', run.allowed));
  return {
    predicted,
    observed: { src: run.sourceBytes, archive: run.archiveBytes },
    exit: run.exit,
    message: run.stderr.split(': ').at(-1),
  };
}
export function editorRun(protectedSettings, saved, exited, opened, approved, consumed) {
  const taskOnDisk = saved && !protectedSettings;
  return {
    saved,
    taskOnDisk,
    exited,
    opened,
    approved,
    formatter: taskOnDisk && exited && opened && approved && consumed,
  };
}
export function exerciseMarker() {
  const before = 'clean';
  return {
    before,
    after: append(before, 'x', grantWrites('src', 'settings/marker')),
    report: append('', 'x', grantWrites('src', testCase.output)),
  };
}
