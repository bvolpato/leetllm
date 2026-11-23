import { filmClock } from '../clock.mjs';
import { releasePromotionTarget } from '../model.mjs';

const session = { principal: 'alice', project: 'search', can_promote: true };
const request = { release_id: 'reranker-v17' };

export function drawPromotionPolicy(ctx, scene, state, api) {
  const { C, focus } = api;
  const { started, after, progress } = filmClock(scene, state);
  const label = (value, x, y, size, color = C.ink, font = 'sans') =>
    api.text(ctx, String(value), x, y, size, color, 'left', font);
  const target = releasePromotionTarget();

  if (state.beat < 2) {
    const extra = state.beat === 1;
    const decision = extra && after('tu-promote-forgery')
      ? target.apply(session, { ...request, approved: true }, 'a') : null;
    focus.target('tu-promotion-policy-mechanism', () => {
      label('Proposed by the model', 135, 305, 44, C.ink, 'serif');
      api.rect(ctx, 130, 362, 775, 263, C.panel, C.blue, 8);
      label('promote_model', 165, 435, 44, C.blue, 'mono');
      label('release_id: ' + request.release_id, 165, 512, 33, C.ink, 'mono');
      if (extra) label('approved: true', 165, 580, 37, C.yellow, 'mono');
      if (decision && !decision.ok) {
        label('Extra field rejected', 135, 730, 43, C.yellow);
        label('Promotion effects: ' + decision.effects, 135, 805, 35);
      }
      label('Checked by the host', 1015, 305, 44, C.ink, 'serif');
      const guards = [
        ['Promotion role', 'true', 'tu-promote-role'],
        ['Project', session.project, 'tu-promote-project'],
        ['Release policy', 'passed', 'tu-promote-policy'],
      ];
      guards.forEach(([name, value, cue], i) => {
        const y = 432 + 79 * i;
        label(name, 1015, y, 36);
        label(extra || after(cue) ? value : '…', 1505, y, 38, C.cyan);
      });
      if (extra || started('tu-promote-approval')) {
        api.rect(ctx, 1010, 668, 790, 194, C.panel, C.cyan, 8);
        label('Human approval on file', 1045, 722, 36, C.cyan);
        label('Alice  /  search  /  promote', 1045, 778, 34);
        label('weights-17  /  P7  /  op-A', 1045, 831, 33, C.ink, 'mono');
      }
      if (!extra && after('tu-promote-before-ledger'))
        label('Only then look up the saved operation.', 1015, 958, 34, C.cyan);
    });
    return;
  }

  const saved = after('policy-record');
  const failed = after('policy-flips');
  const restored = after('policy-restore');
  const blocked = after('policy-block');
  const replayed = after('policy-replayed');
  if (saved) target.apply(session, request, 'a', { loseResponse: true });
  if (failed) target.setReleaseGate(request.release_id, false);
  const denial = blocked ? target.apply(session, request, 'a') : null;
  if (restored) target.setReleaseGate(request.release_id, true);
  const retry = replayed ? target.apply(session, request, 'a') : null;
  const ledger = target.snapshot();

  focus.target('policy-path', () => {
    label('Retry   /   same approval and key', 135, 300, 43, C.ink, 'serif');
    const checks = [
      ['Role and project', 'Alice  /  search'],
      ['Current release gate', failed && !restored ? 'failed' : 'passed'],
      ['Approval', 'Alice  /  weights-17'],
      ['Operation key', 'op-A'],
    ];
    const blockedHere = denial?.reason === 'release policy failed' && !restored;
    const distance = 138;
    const first = 427;
    const through = restored ? 1 + 2 * progress('policy-travel') : blockedHere ? 1 : 0;
    api.line(ctx, 161, first, 161, first + 3 * distance, C.muted, 2);
    if (through > 0) api.line(ctx, 161, first, 161, first + through * distance, C.blue, 6);
    checks.forEach(([name, value], i) => {
      const y = first + i * distance;
      const stop = i === 1 && failed && !restored;
      const color = stop ? C.yellow : i <= through ? C.cyan : C.muted;
      api.circle(ctx, 161, y, 12, color);
      label(name, 202, y + 12, 37);
      label(value, 600, y + 12, 34, color);
    });
    if (blockedHere) label('Retry stopped at the release gate.', 136, 978, 38, C.yellow);
  });
  focus.target('policy-ledger', () => {
    label('Target service ledger', 1090, 300, 43, C.ink, 'serif');
    api.rect(ctx, 1085, 371, 715, 314, C.panel, C.cyan, 8);
    label(saved ? 'op-A' : 'Awaiting record', 1122, 455, 52, C.cyan);
    if (saved) {
      label(ledger.ledger[0].result, 1122, 545, 38);
      label('Promotions on file   ' + ledger.effects, 1122, 630, 36);
    }
    if (retry?.replayed) {
      label('Receipt returned to Alice', 1090, 793, 39, C.cyan);
      label(retry.result, 1090, 864, 36);
    } else if (saved) label('Alice’s receipt   ?', 1090, 793, 39, C.yellow);
  });
}

export default {
  id: 'promotion-policy',
  draw: drawPromotionPolicy,
  cues: ['tu-promotion-policy-1', 'tu-promote-role', 'tu-promote-project', 'tu-promote-policy',
    'tu-promote-approval', 'tu-promote-before-ledger', 'tu-promotion-policy-2', 'tu-promote-forgery',
    'policy-record', 'policy-flips', 'policy-retry-question', 'policy-block', 'policy-restore',
    'policy-travel', 'policy-replayed'],
};
