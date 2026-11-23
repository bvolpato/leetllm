import { assertEqual, dot, fadeIn, line, moveTo, place, seq } from 'vizmatic/stage';
import { runtimeAccess } from '../../../films/sandbox-execution/model.mjs';
import { area, heading, label, mono, note } from '../../kit-narrated.mjs';
import { COLOR, REPORT_XML } from '../parts.mjs';

const routes = [
  { runtime: 'container', name: 'Container', via: 'Syscall filter', gate: 'Shared kernel / mount' },
  { runtime: 'gvisor', name: 'gVisor', via: 'Sentry', gate: 'Scoped filesystem' },
  { runtime: 'microvm', name: 'Firecracker', via: 'Guest kernel', gate: 'Attached volume' },
  { runtime: 'wasm', name: 'WebAssembly', via: 'Checked guest', gate: 'Linked report reader' },
];
const report = '/work/report.xml';
const notes = '/work/notes.txt';
const requestedBytes = 128;

export default function executionBoundaries(s, c) {
  const [request, routesBox, foot] = area.rows([1.2, 6, 1], 'normal');
  const [requestBox, grantBox] = request.columns([1, 1], 'normal');
  const path = (name) => place(mono(name, { size: 47, color: COLOR.evidence }), requestBox, 'left');
  const reportPath = path(report);
  const notesPath = path(notes);
  const scope = place(
    label('Read grant   /   report.xml only', { size: 39, color: COLOR.host }),
    grantBox,
    'left',
  );
  s.add(heading(c.title), reportPath, scope);

  const lanes = routes.map((route, i) => {
    const band = routesBox.rows(4, 'tight')[i];
    const [name, middle, output] = band.columns([4, 11, 3], 'normal');
    const [top, railBox] = middle.rows([3, 1], 'none');
    const [first, second] = top.columns([1, 1], 'wide');
    const via = place(label(route.via, { size: 37, color: COLOR.host }), first, 'left');
    const gate = place(label(route.gate, { size: 37, color: COLOR.host }), second, 'left');
    const routeName = place(label(route.name, { size: 40 }), name, 'left');
    const y = railBox.cy;
    const start = [middle.left, y];
    const finish = [middle.right, y];
    const decision = [second.left, y];
    const rail = line(start, finish, { stroke: 'faint', width: 4 });
    const marker = line([decision[0], y - 14], [decision[0], y + 14], {
      stroke: COLOR.host,
      width: 5,
    });
    const response = (path, expected) => {
      const { allowed } = runtimeAccess(route.runtime, path);
      assertEqual(allowed, expected, `${route.name}: ${path}`);
      const requestDot = dot(12, COLOR.evidence).moveTo(start);
      const animate = () =>
        s.play(
          seq(
            fadeIn(requestDot, { duration: 0.12 }),
            moveTo(requestDot, allowed ? finish : decision, { duration: 0.85 }),
          ),
        );
      const bytes = allowed
        ? Buffer.from(REPORT_XML, 'utf8').subarray(0, requestedBytes).length
        : 0;
      assertEqual(bytes, allowed ? requestedBytes : 0, 'bytes returned from the report fixture');
      const result = place(
        label(allowed ? `${bytes} bytes` : 'No read', {
          size: 37,
          color: allowed ? COLOR.pass : COLOR.fail,
        }),
        output,
        'left',
      );
      return { requestDot, animate, result };
    };
    s.add(routeName, rail);
    c.show(`eb-route-${i}`, [via, gate, marker]);
    return { yes: response(report, true), no: response(notes, false) };
  });
  const caption = (words) => place(note(words, { size: 34 }), foot, 'left');
  const schematic = caption(`Configured examples   /   request the first ${requestedBytes} bytes`);
  const ask = place(
    label('Which worker can read notes.txt?', { size: 45, color: COLOR.mark }),
    foot,
    'left',
  );
  const takeaway = caption('Check the granted resource in the configuration you plan to use.');
  s.add(schematic);
  for (const lane of lanes) {
    c.on('eb-read', lane.yes.animate);
    c.show('eb-allowed', lane.yes.result, { after: true });
  }
  c.swap('eb-change', reportPath, notesPath);
  c.hide(
    'eb-change',
    lanes.flatMap((lane) => [lane.yes.requestDot, lane.yes.result]),
  );
  c.swap('eb-predict', schematic, ask);
  for (const lane of lanes) {
    c.on('eb-deny', lane.no.animate);
    c.show('eb-deny', lane.no.result, { after: true });
  }
  c.swap('eb-check', ask, takeaway);
}
