import { secureEligibility, sourceRecord } from '../arithmetic.mjs';
import { PRINCIPAL, SECURE_SOURCES } from '../fixtures.mjs';
import { drawLine, drawRectangle, drawText } from '../defaults.mjs';
import { voice } from '../voice.mjs';

const matches = [
  { source: SECURE_SOURCES[2], score: 0.94, readers: 'Security group', copy: 'Runbook' },
  { source: SECURE_SOURCES[0], score: 0.71, readers: 'Everyone in A', copy: 'Checklist' },
];

export function drawSubjectIntro(ctx, scene, state, api) {
  const c = api.C;
  const cue = voice(scene, state);
  const replay = cue('intro-membership').phase === 'after';
  const principal = replay
    ? { ...PRINCIPAL, groups: [...PRINCIPAL.groups, 'security'] }
    : PRINCIPAL;
  const firstKnown = cue('intro-first-answer').phase === 'after';
  const secondKnown = cue('intro-second-answer').phase === 'after';
  const title = (s, x, y, size, color = c.ink) => drawText(ctx, api, s, x, y, size, color);

  api.focus.target('request', () => {
    title('Verified reader', 125, 313, 34, c.muted);
    title('Tenant A   /   ' + principal.groups.join(' + '), 455, 313, 46, c.blue);
    drawLine(ctx, api, 125, 370, 1795, 370);
  });

  title('Trusted store', 125, 505, 38, c.blue);
  title('Readers', 615, 507, 29, c.muted);
  title('Match', 930, 507, 29, c.muted);
  matches.forEach(({ source, score, readers }, index) => {
    api.focus.target(index === 0 ? 'runbook' : 'checklist', () => {
      const y = 550 + index * 170;
      drawRectangle(ctx, api, 125, y, 970, 132, c.muted);
      title(source.title, 155, y + 79, 37);
      title(readers, 615, y + 78, 34);
      title(score.toFixed(2), 930, y + 67, 37, c.yellow);
      api.line(ctx, 930, y + 91, 1060, y + 91, c.muted, 5);
      api.line(ctx, 930, y + 91, 930 + score * 130, y + 91, c.yellow, 10);
    });
  });

  api.focus.target('prompt', () => {
    title('Read gate', 1140, 505, 31, c.muted);
    title('Model prompt', 1420, 505, 38, c.blue);
    matches.forEach(({ source, copy }, index) => {
      const y = 550 + index * 170;
      drawLine(ctx, api, 1390, y + 124, 1785, y + 124);
      const allowed = secureEligibility(sourceRecord(source), principal);
      const known = index === 0 && replay ? secondKnown : firstKnown;
      const progress = cue(index === 0 ? 'intro-key-copy' : 'intro-list-copy').progress;
      const gate = known && allowed ? api.ease(Math.min(1, progress * 3)) : 0;
      const angle = (gate * Math.PI) / 2;
      const color = known ? (allowed ? c.green : c.pink) : c.muted;
      api.line(
        ctx,
        1295,
        y + 7,
        1295 + 103 * Math.sin(angle),
        y + 7 + 103 * Math.cos(angle),
        color,
        6,
      );
      if (!known) return;
      if (!allowed) {
        title('Held', 1130, y + 78, 32, c.pink);
        return;
      }
      const travel = api.clamp((progress - 1 / 3) * 1.5, 0, 1);
      if (gate === 0) return;
      const x = 1105 + 405 * api.ease(travel);
      drawRectangle(ctx, api, x, y + 20, 177, 85, c.green);
      title(copy, x + 15, y + 77, 33, c.green);
    });
  });

  const status = replay
    ? secondKnown
      ? 'Same scores. Both passages have a current read grant.'
      : 'Which extra passage may enter now?'
    : firstKnown
      ? 'The checklist can enter this prompt.'
      : 'Which of these two passages may enter?';
  if (cue('intro-question').phase !== 'before')
    title(status, 125, 975, 40, (replay ? secondKnown : firstKnown) ? c.ink : c.yellow);
}

export default {
  id: 'subject-intro',
  draw: drawSubjectIntro,
  cues: [
    'intro-reader',
    'intro-runbook',
    'intro-checklist',
    'intro-question',
    'intro-first-answer',
    'intro-list-copy',
    'intro-membership',
    'intro-second-answer',
    'intro-key-copy',
  ],
};
