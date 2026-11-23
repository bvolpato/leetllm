import { voice } from '../construction.mjs';

export function drawCritique(ctx, scene, state, api) {
  const { C } = api;
  const t = (s, x, y, size, color = C.ink) => api.text(ctx, s, x, y, size, color);
  const note = voice(state, 'critique-note', 1);
  const revised = voice(state, 'critique-revise', 2);
  const filed = voice(state, 'critique-pair', 2);
  t('Case 17    /    Private workspace    /    INC-8821 grant absent', 115, 270, 34, C.blue);
  t('“Can I see the incident timeline?”', 115, 355, 52);
  api.line(ctx, 115, 409, 1810, 409, C.muted, 2);
  t('Draft', 115, 504, 32, C.muted);
  api.focus.target('flawed-draft', () =>
    t('“I’ll get the timeline for you.”', 115, 589, 49, C.pink),
  );
  if (note > 0) {
    api.line(ctx, 142, 609, 142 + 393 * note, 609, C.yellow, 5);
    api.focus.target('principle-critique', () => {
      t('Critique  /  rule v3', 1050, 504, 33, C.yellow);
      t('This read needs an incident grant.', 1050, 583, 39);
    });
  }
  api.line(ctx, 115, 697, 1810, 697, C.muted, 2);
  api.focus.target('training-row', () =>
    t(
      filed ? 'Supervised example    /    case 17' : 'Revised answer',
      115,
      781,
      34,
      filed ? C.green : C.muted,
    ),
  );
  api.focus.target('revised-answer', () => {
    if (!revised) return t('…', 115, 885, 50, C.muted);
    const words = ['Please', 'request', 'access', 'through', 'the', 'support', 'portal.'];
    t(words.slice(0, Math.ceil(revised * words.length)).join(' '), 115, 885, 52, C.green);
  });
  if (filed)
    t('Input: the original request     •     Target: the revised answer', 115, 985, 33, C.muted);
}
export default {
  id: 'critique',
  draw: drawCritique,
  cues: ['critique-draft', 'critique-note', 'critique-revise', 'critique-pair'],
};
