import { gpuFrame, gpuIncident, readmission } from '../arithmetic.mjs';
import { admissionChecks } from '../fixtures.mjs';
import { diagram, drawAdmissionRoute } from '../incident-diagram.mjs';

const owner = 'fresh-32 / P22';
const key = 'fresh-32 / device incident';
const held = gpuIncident([], { key, kind: 'fault' });
const gateNames = ['Identity', 'Idle', 'Output', 'Memory', 'Device', 'Fabric', 'Power / heat', 'Soak'];

function draw(ctx, scene, state, api) {
  const f = gpuFrame(state);
  const { C } = api;
  const { label, line, dot } = diagram(ctx, api);
  const fabric = f.completed('readmit-fabric', 2);
  const approval = {
    workload: f.completed('readmit-workload', 3),
    platform: f.completed('readmit-platform', 3),
  };
  const receipts = admissionChecks.filter(name => name !== 'fabric' || fabric)
    .map(check => ({ owner, check, status: 'Pass' }));
  const result = readmission(receipts, owner, approval);
  const transition = f.completed('readmit-open', 3);
  const records = gpuIncident(held, transition ? { key, kind: 'readmit', owner, receipts, approval } : { key, kind: 'quiet' });
  const released = !records[0].quarantined;
  const decide = f.completed('readmit-gap', 1);
  label('Replacement process P22    /    fresh-32', 145, 244, 36);
  label('Evidence groups   ' + result.gates.filter(Boolean).length + ' / ' + admissionChecks.length, 1770, 244, 34, C.ink, 'right');
  api.focus.target('readmit-evidence', () => {
    result.gates.forEach((pass, i) => {
      const x = 203 + i * 214;
      const color = pass ? C.green : C.yellow;
      label(gateNames[i], x, 325, 29, C.ink, 'center');
      if (pass) dot(x, 370, 12, C.green);
      else api.circle(ctx, x, 370, 12, C.panel, color);
      label(pass ? 'Pass' : 'Pending', x, 423, 28, color, 'center');
    });
  });
  api.focus.target('readmit-router', () => drawAdmissionRoute(ctx, api, {
    gate: released ? 'open' : 'closed',
    gateLabel: released ? 'Small share enabled' : decide ? 'Quarantine held' : 'Existing quarantine',
    worker: 'P22 · repaired',
    peer: 'healthy peer',
    path: released ? 'worker' : 'peer',
    progress: released ? f.progress('readmit-send', 3) : f.progress('readmit-peer', 1),
    token: released ? 'Arrival B' : 'Arrival A',
    priorPeerArrival: released ? 'Arrival A' : undefined,
  }));
  api.focus.target('readmit-authority', () => {
    line(150, 918, 1770, 918, C.muted, 2);
    if (f.b >= 3) {
      label('Workload owner   ' + (approval.workload ? 'approved' : 'pending'), 155, 985, 32, approval.workload ? C.green : C.muted);
      label('Platform owner   ' + (approval.platform ? 'approved' : 'pending'), 930, 985, 32, approval.platform ? C.green : C.muted);
    } else {
      const testing = f.started('readmit-probe', 1);
      const passed = f.completed('readmit-result', 2);
      label('Peer bandwidth', 155, 995, 40);
      label('GPU 0', 703, 993, 33, C.ink, 'right');
      label('GPU 1', 1260, 993, 33);
      const from = 735, to = 1225, y = 981;
      if (testing) {
        line(from, y, to, y, passed ? C.green : C.cyan, 5);
        dot(from + (to - from) * f.progress('readmit-probe', 1), y, 13, C.cyan);
      } else {
        for (let x = from; x < to; x += 48) line(x, y, Math.min(x + 21, to), y, C.muted, 3);
      }
      const status = passed ? 'Pass' : testing ? 'Testing' : 'Skipped';
      label(status, 1765, 997, 44, passed ? C.green : testing ? C.cyan : C.yellow, 'right');
    }
  });
}
export default { id: 'readmit', draw, cues: ['readmit-gap', 'readmit-peer', 'readmit-probe', 'readmit-result', 'readmit-fabric', 'readmit-workload', 'readmit-platform', 'readmit-open', 'readmit-send'] };
