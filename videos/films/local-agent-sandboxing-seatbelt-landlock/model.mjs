import { LINKS, attempts } from './fixtures.mjs';
import { clamp, motion } from './construction.mjs';
export function resolveFixture(path, links = LINKS) {
  if (!path.startsWith('/')) throw new Error('fixture paths must be absolute');
  let pending = path.split('/').filter(Boolean),
    parts = [],
    hops = 0;
  const steps = [
    {
      path: '/',
      kind: 'root',
    },
  ];
  while (pending.length) {
    const part = pending.shift();
    if (part === '.') continue;
    if (part === '..') parts.pop();
    else parts.push(part);
    const current = '/' + parts.join('/');
    steps.push({
      path: current,
      kind: part === '..' ? 'parent' : 'entry',
    });
    if (links[current]) {
      if (++hops > 16) throw new Error('symbolic-link cycle');
      const target = links[current];
      parts = target.startsWith('/') ? [] : parts.slice(0, -1);
      pending = target.split('/').filter(Boolean).concat(pending);
    }
  }
  return {
    actual: '/' + parts.join('/'),
    steps,
  };
}
export function resource(path) {
  return resolveFixture(path).actual;
}
export const canWrite = (path) => {
  const actual = resource(path);
  return actual.startsWith('/workspace/src/');
};
export function broker(method, repo) {
  return method === 'GET' && repo === 'owner/project';
}
export const syscallAllowed = (op) => ['read', 'write', 'openat', 'fstat'].includes(op);
export function seatbeltStartup(required, setup) {
  return {
    required,
    setup,
    launch: !required || setup === 'loaded',
    workersStarted: !required || setup === 'loaded' ? 1 : 0,
  };
}
export function pathSnapshot(beat, beatP) {
  const attempt = [0, 1, 3, 2][Math.min(3, beat)],
    resolution = resolveFixture(attempts[attempt].path);
  const spans = [16.28, 16.256, 16.856, 18.056],
    cues = [
      [0, 2.225, 3.35, 4.425],
      [0, 0.3, 1.1, 4.4375, 6.025, 8.2375, 8.7, 9.075, 11.6125],
      [0, 0.1, 0.5, 1.025, 6.4, 6.8, 7.2, 7.7],
      [0, 0.2, 0.5, 0.9, 1.35],
    ],
    seconds = clamp(beatP) * spans[beat];
  const index = Math.max(
    0,
    cues[beat].findLastIndex((cue) => seconds >= cue),
  );
  return {
    attempt,
    visibleCount: 4,
    resolution,
    currentStep: index,
    currentPath: resolution.steps[index].path,
    decisionReady: seconds >= [14.2375, 14.575, 15.1875, 4.7875][beat],
  };
}
export function hookSnapshot(beat, p) {
  const spans = [15.448, 16.384, 19.016],
    seconds = clamp(p) * spans[beat];
  const cues = [
    [
      [0, 0],
      [4.4875, 0.3],
      [5.8375, 1.2],
      [10.55, 3],
    ],
    [
      [0, 3],
      [2.4375, 6],
      [6.8625, 7],
      [8.8375, 8],
    ],
    [
      [0, 0],
      [4.925, 1.2],
      [5.825, 3],
      [6.325, 6],
      [8.2625, 8],
    ],
  ][beat];
  const i = Math.max(
      0,
      cues.findLastIndex((cue) => seconds >= cue[0]),
    ),
    from = cues[i],
    to = cues[i + 1];
  const time = to
    ? from[1] + (to[1] - from[1]) * clamp((seconds - from[0]) / (to[0] - from[0]))
    : from[1];
  const protectedMetadata = beat >= 2,
    hookPresent = !protectedMetadata && time >= 1.2,
    workerAlive = time < 3,
    hostStarted = time >= 6,
    childStarted = hostStarted && hookPresent && time >= 7;
  return {
    time,
    protectedMetadata,
    hookPresent,
    workerAlive,
    hostStarted,
    childStarted,
    plantDenied: protectedMetadata && time >= 1.2,
  };
}
export function sampleModel(id, state) {
  const b = Math.min(1, state.beat),
    q = motion(state.beatP),
    request =
      !b || state.beatP < 0.145
        ? {
            method: 'GET',
            repo: 'owner/project',
          }
        : state.beatP < 0.215
          ? {
              method: 'GET',
              repo: 'other/project',
            }
          : {
              method: 'POST',
              repo: 'owner/project',
            };
  return {
    b,
    q,
    time: q * 8,
    attempt: Math.min(3, Math.floor(q * 4)),
    ...(id === 'paths' ? pathSnapshot(state.beat, state.beatP) : {}),
    ...(id === 'hooks' ? hookSnapshot(state.beat, state.beatP) : {}),
    attempts: attempts.map((r) => ({
      ...r,
      actual: resource(r.path),
      allowed: canWrite(r.path),
    })),
    requiredAvailable: !(b && q > 0.7),
    request,
    brokerAllowed: broker(request.method, request.repo),
    hostEnforcement: false,
  };
}
export function helperAllows(path, links = {}) {
  const actual = resolveFixture(path, links).actual,
    root = '/workspace';
  if (actual !== root && !actual.startsWith(root + '/')) return false;
  return !['/.git/hooks', '/.git/config', '/.vscode', '/.env'].some(
    (suffix) => actual === root + suffix || actual.startsWith(root + suffix + '/'),
  );
}
export function layeredWrite(
  path,
  { broad = true, narrow = false, metadataReadOnly = false } = {},
) {
  const actual = resolveFixture(path, {}).actual,
    inProject = actual === '/workspace' || actual.startsWith('/workspace/');
  const inSource = actual.startsWith('/workspace/src/'),
    inOutput = actual.startsWith('/workspace/out/'),
    inMetadata = actual === '/workspace/.git' || actual.startsWith('/workspace/.git/');
  return (
    inProject &&
    (broad || inSource || inOutput) &&
    (!narrow || inSource || inOutput) &&
    (!metadataReadOnly || !inMetadata)
  );
}
export function exactBrokerRequest(method, repo, number) {
  return method === 'GET' && repo === 'owner/repo' && number === 42;
}
export function sanitizeBrokerReply(reply) {
  return {
    number: reply.number,
    state: reply.state,
  };
}
export function freshSandboxDecision() {
  const resolution = resolveFixture('/workspace/src/build-cache/config', {
    '/workspace/src/build-cache': '/workspace/.git',
  });
  return {
    ...resolution,
    allowed: layeredWrite(resolution.actual, {
      broad: false,
      narrow: true,
    }),
  };
}
