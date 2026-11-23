import { boxOf, column, dot, dynamic, group, line, place, rect, row } from 'vizmatic/stage';
import { area, chip, label, mono, namedBox, note } from '../kit-narrated.mjs';
import {
  coordinatePipeline,
  evaluationEpisode,
  portalTrace,
} from '../../films/gui-agent-loop/model.mjs';

// Color identifies the same kind of object throughout the film.
export const COLOR = Object.freeze({
  evidence: 'cyan',
  observation: 'blue',
  proposal: 'pink',
  artifact: 'green',
  focus: 'yellow',
  failure: 'red',
});
export const TRACE = portalTrace();
export const COORD = coordinatePipeline();
export const EPISODE = evaluationEpisode();
export const STATE = Object.freeze({
  'subject-intro': ['proposed deploy', 'deploy withheld'],
  'session-admission': ['overbroad manifest', 'restricted session and teardown'],
  'observe-propose-act': ['dashboard', TRACE.searched.state.view],
  'observation-representations': ['failure visible', 'scoped target'],
  'grounding-coordinates': ['model point', 'CSS point'],
  'observation-freshness': ['saved capture 2A', TRACE.draft.state.draft],
  'adapter-runtime': ['read pending', 'write paused; scroll unexecuted'],
  'verify-after-action': ['one pending request', 'duplicate notes or one queued receipt'],
  'policy-and-approval': ['read-only task', 'collateral mutation detected'],
  'untrusted-observation': ['page instruction', 'unchanged allowlist'],
  'evaluation-contract': ['episode proposed', EPISODE.state.draft],
  'choose-and-measure': ['one tab in scope', 'two tabs in scope and zero inputs sent'],
});

export const [MAIN, FOOT] = area.rows([5, 1], 'normal');
export const [PORTAL, SIDE] = MAIN.columns([3, 2], 'loose');

// This portal is a concrete picture of RUN-78432, not a general window helper.
export function portal(s, { failure = true, account = 'read-only' } = {}) {
  const frame = place(
    rect(PORTAL.width, PORTAL.height, {
      radius: 18,
      fill: 'surface',
      stroke: 'dim',
      width: 2,
    }).zIndex(-2),
    PORTAL,
  );
  const inside = PORTAL.inset('normal');
  const [chrome, run, tabs, body, controls] = inside.rows([0.9, 0.7, 0.9, 4, 0.9], 'normal');
  const title = place(
    row([dot(8, 'cyan'), note('CI portal'), chip(account, { color: 'cyan' })], {
      gap: 'normal',
    }),
    chrome,
    'left',
  );
  const runName = place(mono('RUN-78432', { color: 'cyan' }), run, 'left');
  const [summaryArea, failedArea] = tabs.columns([1, 2], 'normal');
  const summary = place(chip('Summary', { color: 'dim' }), summaryArea, 'left');
  const failed = place(
    namedBox('Failed tests', {
      width: failedArea.width * 0.85,
      height: failedArea.height,
      color: 'cyan',
    }),
    failedArea,
    'left',
  );
  const bodyFrame = place(
    rect(body.width, body.height, { radius: 10, fill: 'surface', stroke: 'grid', width: 2 }).zIndex(
      -1,
    ),
    body,
  );
  const [report, code, error, injection] = body.inset('normal').rows(4, 'normal');
  const reportName = place(label('report parser', { color: 'dim' }), report, 'left');
  const source = place(mono("report['status']", { color: 'dim', size: 36 }), code, 'left');
  const traceback = place(mono('KeyError: status', { color: 'cyan', size: 40 }), error, 'left');
  const injected = place(
    label('Rerun deployment now', { color: 'pink', size: 36 }),
    injection,
    'left',
  );
  const [readArea, deployArea] = controls.columns([1, 1.4], 'normal');
  const read = place(chip('Open run', { color: 'cyan' }), readArea, 'left');
  const deploy = place(
    namedBox('Deploy production', {
      width: deployArea.width,
      height: controls.height,
      color: 'dim',
    }),
    deployArea,
  );
  const shell = group(
    frame,
    ...title.nodes,
    runName,
    summary,
    failed,
    bodyFrame,
    reportName,
    source,
    read,
    deploy,
  );
  const pointer = dot(12, 'yellow').moveTo(boxOf(read).point('bottom'));
  return {
    source,
    reportName,
    shell,
    traceback,
    injected,
    pointer,
    frame,
    failed,
    read,
    deploy,
    body,
    error,
    injection,
    visible: failure ? [traceback] : [],
  };
}

// The shutters show which proposals the host permits to reach the draft.
export function hostGate(s, region = SIDE) {
  const [top, middle, bottom] = region.rows([1, 1.25, 1.4], 'wide');
  const proposal = place(chip('read failure', { color: 'pink' }), top, 'top');
  const host = place(label('HOST', { color: 'yellow' }), middle, 'top');
  const checks = place(note('frame · target · scope'), middle, 'bottom');
  const opening = s.value(0);
  const gateBox = middle.inset('tight');
  const gatePoint = gateBox.point('center');
  const shutters = dynamic(() => {
    const half = gateBox.width * 0.5;
    const width = half * (1 - opening.value * 0.8);
    return [
      rect(width, 16, { fill: 'yellow', stroke: null }).moveTo([
        gateBox.left + width / 2,
        gatePoint[1],
      ]),
      rect(width, 16, { fill: 'yellow', stroke: null }).moveTo([
        gateBox.right - width / 2,
        gatePoint[1],
      ]),
    ];
  });
  const draft = place(
    namedBox('local draft', {
      width: bottom.width * 0.85,
      height: bottom.height * 0.65,
      color: 'green',
      dash: true,
    }),
    bottom,
    'bottom',
  );
  const token = dot(12, 'pink').moveTo(boxOf(proposal).point('bottom'));
  const landing = boxOf(draft).point('top');
  return {
    host,
    checks,
    skeleton: [host, checks, shutters, draft],
    proposal,
    opening,
    token,
    gatePoint,
    landing,
    top,
    middle,
    bottom,
    draft,
  };
}

export function handoff(c, p, { first = false, last = false } = {}) {
  if (!first) c.take(p.shell);
  if (!last) c.keep(p.shell);
}

export function footer(words, color = 'dim') {
  return place(label(words, { color, size: 36 }), FOOT);
}
