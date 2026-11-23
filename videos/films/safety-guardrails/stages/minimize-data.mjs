import { guardCue, redactContact } from '../model.mjs';

const email = 'alice@example.com';
const phone = '+1-555-123-4567';

export function paintMinimizeData(ctx, scene, state, api) {
  const { C, text, rect, line } = api;
  const emailProgress = guardCue(state, 'minimize-email', 1, 0.04, 0.42);
  const phoneProgress = guardCue(state, 'minimize-phone', 1, 0.45, 0.88);
  const send = guardCue(state, 'minimize-send', 2);
  const y = 310 + 420 * send;
  const width = 775,
    height = 233;
  const incident = 'Incident INC-2048 needs follow-up.';
  const mailLabel = emailProgress === 1 ? redactContact(email) : email;
  const phoneLabel = phoneProgress === 1 ? redactContact(phone) : phone;

  function letter(id, x, top, mail, tel, copy) {
    api.focus.target(id, () => {
      rect(ctx, x, top, width, height, C.panel, copy ? C.cyan : C.muted, 10);
      text(ctx, incident, x + 35, top + 63, 38, C.ink);
      text(
        ctx,
        'Contact ' + mail,
        x + 35,
        top + 135,
        36,
        copy && emailProgress === 1 ? C.cyan : C.ink,
      );
      text(
        ctx,
        'at ' + tel + '.',
        x + 35,
        top + 195,
        36,
        copy && phoneProgress === 1 ? C.cyan : C.ink,
      );
      if (copy && emailProgress > 0 && emailProgress < 1)
        line(ctx, x + 176, top + 146, x + 176 + 350 * emailProgress, top + 146, C.yellow, 4);
      if (copy && phoneProgress > 0 && phoneProgress < 1)
        line(ctx, x + 82, top + 206, x + 82 + 310 * phoneProgress, top + 206, C.yellow, 4);
    });
  }

  text(ctx, 'Restricted host record', 130, 263, 34, C.muted);
  text(ctx, 'Copy for review', 1005, 263, 34, C.cyan);
  letter('local-message', 130, 310, email, phone, false);
  const boundary = 650;
  line(ctx, 120, boundary, 971, boundary, C.yellow, 4);
  if (y > boundary + 6 || y + height < boundary - 6)
    line(ctx, 971, boundary, 1790, boundary, C.yellow, 4);
  text(ctx, 'Remote service boundary', 130, boundary - 23, 29, C.yellow);
  text(ctx, 'Classifier inbox', 130, 800, 46, C.ink);
  text(
    ctx,
    send === 1 ? 'One minimized note' : 'Awaiting the minimized note',
    130,
    869,
    34,
    send === 1 ? C.green : C.muted,
  );
  letter('outgoing-message', 1005, y, mailLabel, phoneLabel, true);
  if ((state.beat ?? 0) === 0)
    api.focus.target('privacy-question', () =>
      text(ctx, 'Which fields does the classifier need?', 960, 993, 37, C.ink, 'center'),
    );
}
export { paintMinimizeData as drawMinimizeData };
export default {
  id: 'minimize-data',
  draw: paintMinimizeData,
  cues: [
    'minimize-record',
    'minimize-question',
    'minimize-email',
    'minimize-phone',
    'minimize-send',
  ],
};
