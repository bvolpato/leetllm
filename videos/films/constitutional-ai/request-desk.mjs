import { accessResult } from './arithmetic.mjs';

// A slip is a request to read the source. The receipt decides how far it travels.
function readTrack(ctx, api, y, progress, allowed, color, resumeAtGate = false) {
  const { C } = api;
  const gate = 990;
  const stopped = gate - 96;
  const start = resumeAtGate ? stopped : 714;
  const end = allowed ? 1128 : stopped;
  const x = start + (end - start) * progress;
  api.line(ctx, 695, y + 43, 1230, y + 43, C.muted, 2);
  api.line(ctx, gate, y - 52, gate, y - 36, C.yellow, 4);
  api.line(ctx, gate, y + 30, gate, y + 53, C.yellow, 4);
  if (!allowed && progress > 0) api.line(ctx, gate, y - 36, gate, y + 30, C.yellow, 4);
  api.components.card({
    x,
    y: y - 33,
    width: 88,
    height: 59,
    label: 'READ',
    fontSize: 24,
    padding: 6,
    fill: C.panel,
    stroke: color,
    textColor: color,
  });
}

export function drawRequestDesk(ctx, api, desk) {
  const { C } = api;
  const t = (s, x, y, size, color = C.ink) => api.text(ctx, s, x, y, size, color);
  const field = (id, draw) => api.focus.target(id, draw);
  const context = { record: desk.record, destination: desk.destination };
  const publicRead = accessResult({ ...context, privateRecord: false });
  const privateRead = accessResult(context);
  api.line(ctx, 105, 218, 105, 389, C.blue, 6);
  t(
    desk.channel ? 'Engineer  /  message to the public channel' : 'Engineer  /  private workspace',
    140,
    245,
    30,
    C.blue,
  );
  field('public-request', () => t('Can we edit the docs during the freeze?', 140, 315, 43));
  if (desk.second)
    field('private-request', () => t('And can I see the incident timeline?', 140, 379, 43));
  field('permission-gate', () => {
    t('Application receipt  /  signed in', 1100, 245, 31, C.yellow);
    if (desk.scope) {
      t('INC-8821 read grant     ' + (desk.record ? 'Present' : 'Absent'), 1100, 315, 34);
      t(
        desk.destination
          ? 'Destination     Approved workspace'
          : 'Public channel     Outside incident scope',
        1100,
        373,
        32,
      );
    }
  });
  api.line(ctx, 105, 431, 1815, 431, C.muted, 2);
  t('Requested source', 120, 497, 31, C.muted);
  t('Application check', 835, 497, 31, C.muted);
  t('Reply to the engineer', 1280, 497, 31, C.muted);

  field('public-source', () => {
    t('Public freeze runbook', 120, 597, 41, C.cyan);
    if (desk.runbook) t('“Doc edits may continue.”', 120, 652, 34);
  });
  const publicLane = () => {
    readTrack(ctx, api, 603, desk.publicStep, publicRead.fetched, C.cyan);
    if (desk.publicStep === 1) t('Yes, you can edit the docs.', 1280, 614, 37, C.green);
    else t('…', 1280, 614, 39, C.muted);
  };
  if (desk.publicStep > 0) field('public-answer', publicLane);
  else publicLane();

  if (desk.second) {
    t('Incident timeline', 120, 785, 41, C.blue);
    t('INC-8821  /  restricted', 120, 842, 32, C.muted);
    field('private-read', () =>
      readTrack(ctx, api, 792, desk.privateStep, privateRead.fetched, C.blue, desk.resume),
    );
    field('private-reply', () => {
      if (!desk.explain) t('…', 1280, 803, 39, C.muted);
      else if (privateRead.delivered) {
        t('Timeline available here.', 1280, 789, 37, C.green);
        t('One authorized read', 1280, 846, 30, C.muted);
      } else {
        t(
          desk.channel ? 'Use the private workspace.' : 'Request access in the portal.',
          1280,
          789,
          35,
          C.yellow,
        );
        t('Private records fetched   0', 1280, 846, 30, C.muted);
      }
    });
  }
  if (desk.note) field('reply-question', () => t(desk.note, 120, 985, 38, C.ink));
}
