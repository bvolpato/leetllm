import { incidentQuery, incidentSelection, lexicalRows } from '../incident-example.mjs';
import { card, connector, line, text } from '../defaults.mjs';

const id = 'incident-comparison';
const centers = [375, 960, 1545];
export function drawIncidentComparison(ctx, scene, state, api) {
  const { C } = api;
  const cue = (name) => state.cues?.[id + '-' + name];
  const after = (name) => cue(name)?.phase === 'after';
  const p = (name) => cue(name)?.progress ?? 0;
  const ranked = after('baseline');
  const changedClaim = p('replace') > 0;
  const readPolicy = !after('revoke');
  const complete = changedClaim ? after('same-three') : after('third-note');
  const hops = changedClaim ? (complete ? 1 : 0) : complete ? 2 : p('dependency') > 0 ? 1 : 0;
  const selected = incidentSelection({ hops, changedClaim, readPolicy });
  const drawText = (s, x, y, size, color, align = 'left') =>
    text(ctx, api, id, s, x, y, size, color, align);
  const atAudit = p('quote') > 0;
  api.focus.target(id + '-notes', () => {
    drawText('Search terms', 100, 250, 31, C.muted);
    drawText(incidentQuery, 365, 250, 42, C.ink);
    lexicalRows.forEach((row, i) => {
      const x = centers[i] - 265;
      const admitted = ranked && selected.has(row.id);
      const revoked = !readPolicy && row.id === 2031;
      const color = revoked ? C.pink : admitted ? C.blue : C.muted;
      api.rect(ctx, x, 304, 530, 236, C.panel, color, 8);
      drawText('#' + row.id, x + 24, 354, 36, color);
      drawText(revoked ? 'Content withheld' : row.topic, x + 24, 416, 39, C.ink);
      drawText(
        revoked ? 'Access withdrawn' : row.matches.length + ' matching terms',
        x + 24,
        471,
        32,
        revoked ? C.pink : C.muted,
      );
      if (!revoked && row.matches.length)
        drawText(row.matches.join('   ·   '), x + 24, 514, 28, C.ink);
    });
  });
  if (ranked) {
    api.focus.target(id + '-evidence', () => {
      const collection = readPolicy
        ? selected.size + ' / 3 annotated notes retrieved'
        : selected.size + ' permitted notes retrieved';
      drawText(collection, 100, 590, 39, C.blue);
    });
  }
  if (p('dependency') > 0) {
    api.focus.target(id + '-path', () => {
      // The replay keeps the reviewed dependency. Only the edge carrying note 2031 changes.
      if (changedClaim) {
        drawText('depends_on  →  redis-cache  [1842]', 100, 690, 32, C.muted);
        card(ctx, api, id, 'inference-api', 105, 730, 340, 78, C.ink, 33);
        if (readPolicy) {
          drawText('will_cause   [2031]', 720, 722, 33, C.yellow, 'center');
          connector(ctx, api, 460, 769, 980, 769, p('replace'), C.yellow);
          card(ctx, api, id, 'future SLO breach', 1000, 730, 540, 78, C.yellow, 34);
        } else {
          drawText('Source access withdrawn', 720, 795, 36, C.pink);
        }
      } else {
        ['inference-api', 'redis-cache', 'old maxmemory policy'].forEach((v, i) => {
          if (i < 2 || p('policy') > 0)
            card(ctx, api, id, v, centers[i] - 192, 731, 384, 78, i === 2 ? C.yellow : C.ink, 32);
        });
        const drawHop = (i, name, label) => {
          if (p(name) === 0) return;
          const x1 = centers[i] + 200,
            x2 = centers[i + 1] - 200;
          drawText(label, (x1 + x2) / 2, 705, 31, C.cyan, 'center');
          connector(ctx, api, x1, 770, x2, 770, p(name), C.cyan);
        };
        drawHop(0, 'dependency', 'depends_on  [1842]');
        drawHop(1, 'policy', complete ? 'uses_policy  [2031]' : 'uses_policy  [?]');
      }
    });
  }
  api.focus.target(id + '-reading', () => {
    if (!readPolicy) {
      drawText('Withhold note 2031 and the report that uses it.', 960, 930, 41, C.pink, 'center');
    } else if (after('third-note')) {
      line(ctx, api, 100, 850, 1810, 850, C.yellow, 2);
      drawText('2031', 105, 915, 33, C.yellow);
      drawText(
        '“redis-cache in us-east-1 still uses the old maxmemory policy.”',
        248,
        915,
        37,
        C.ink,
      );
      let interpretation = 'The migration is still blocked by a compatibility test.';
      if (changedClaim) interpretation = 'Same note and quotation';
      if (atAudit) interpretation = 'Would you report that another breach is likely?';
      if (after('leave-open'))
        interpretation = 'Investigate the cache. Recurrence is still unknown.';
      drawText(
        interpretation,
        960,
        1004,
        36,
        atAudit && !after('leave-open') ? C.yellow : C.ink,
        'center',
      );
    } else {
      let prompt = 'Which note will a top-two search leave out?';
      if (ranked) prompt = 'The policy note shares no search terms.';
      if (p('dependency') > 0) prompt = 'First hop: a source already in the result';
      if (p('policy') > 0) prompt = 'Which note does this second hop add?';
      drawText(prompt, 960, 943, 40, C.ink, 'center');
    }
  });
}
export default {
  id,
  draw: drawIncidentComparison,
  cues: [
    'look',
    'baseline',
    'dependency',
    'policy',
    'third-note',
    'replace',
    'same-three',
    'quote',
    'leave-open',
    'revoke',
  ].map((name) => id + '-' + name),
};
