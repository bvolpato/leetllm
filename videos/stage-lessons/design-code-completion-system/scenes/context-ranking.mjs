// Scene 10: context-ranking - Compute symbol overlap after filtering allowed files
// Jaccard overlap math after ACL permission check: scope_rules 2/4 = 0.50 (SELECT),
// policy_graph 1/4 = 0.25 (SELECT), metrics 0/5 = 0.00 (DROP) at threshold >= 0.25.
import { group, line, rect } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  aura,
  cinemaHeader,
  clampDur,
  driftValue,
  glowDot,
  guardedDynamic,
  txt,
} from '../parts.mjs';

export default function contextRanking(s, c) {
  const phase = s.value(0);
  const scoreOn = s.value(0);
  const selectOn = s.value(0);
  const bm25On = s.value(0);

  const header = cinemaHeader(
    'AUTHORIZED CONTEXT RANKING',
    'Compute symbol overlap',
    'after ACL filter',
    {
      x: -860,
      y: -445,
      accent: ROLE.ok,
      size: 46,
    },
  );

  const bgAura = aura(40, 20, 680, '#6ee7b71a', '#5ce1e618');

  const view = guardedDynamic(
    () => 1,
    () => {
      const p = phase.value;
      const sc = scoreOn.value;
      const sl = selectOn.value;
      const bm = bm25On.value;
      const nodes = [];

      const rows = [
        { name: 'scope_rules.py', frac: '2 / 4 = 0.50', val: 0.5, keep: true, y: -120 },
        { name: 'policy_graph.py', frac: '1 / 4 = 0.25', val: 0.25, keep: true, y: -25 },
        { name: 'metrics.py', frac: '0 / 5 = 0.00', val: 0.0, keep: false, y: 70 },
      ];

      const xBar = -260;
      const maxW = 680;
      const xThresh = xBar + 0.25 * maxW;

      nodes.push(
        txt(
          'JACCARD OVERLAP ON PERMITTED FILES (THRESHOLD >= 0.25)',
          -840,
          -195,
          26,
          ROLE.ed,
          'mono',
          'left',
        ),
        line([xThresh, -162], [xThresh, 118], {
          stroke: ROLE.focus,
          width: 3.5,
          dash: [8, 6],
        }).glow(8, ROLE.focus),
        txt('MIN 0.25', xThresh, 152, 26, ROLE.focus, 'mono', 'center'),
      );

      rows.forEach((r) => {
        const col = sl > 0.4 ? (r.keep ? ROLE.ok : ROLE.fail) : ROLE.ed;
        const bw = Math.max(12, r.val * maxW);
        nodes.push(
          txt(r.name, -840, r.y, 26, col, 'mono', 'left'),
          rect(bw, 44, { fill: col, stroke: '#ffffff', width: 1.5, radius: 6 })
            .at(xBar + bw * 0.5, r.y)
            .glow(r.keep && sl > 0.4 ? 8 : 4, col)
            .opacity(r.val === 0 ? 0.35 : 0.9),
          txt(r.frac, Math.max(xBar + bw + 26, xThresh + 26), r.y, 26, col, 'mono', 'left').opacity(
            0.45 + sc * 0.55,
          ),
          txt(
            sl > 0.4 ? (r.keep ? 'SELECT' : 'SKIP') : '',
            640,
            r.y,
            26,
            r.keep ? ROLE.ok : ROLE.fail,
            'mono',
            'left',
          ),
        );
      });

      nodes.push(
        txt('CHECK EVERY BUFFER', 480, -425, 26, ROLE.focus, 'mono', 'center'),
        txt(
          'Permission-check unsaved + retrieved files',
          480,
          -378,
          26,
          COSMOS.muted,
          'mono',
          'center',
        ),
        line([-840, 205], [840, 205], { stroke: '#25355a', width: 2 }).opacity(0.65),
        txt(
          bm > 0.4
            ? 'BM25 / dense retrieval: time retrieval + reranker + assembly together (iterative loops = slow path!)'
            : 'If a known definition is missing, inspect extraction, ACL & index freshness before growing prompt',
          0,
          285,
          26,
          bm > 0.4 ? ROLE.ed : COSMOS.muted,
          'mono',
          'center',
        ),
        glowDot(-780 + ((p * 110) % 220), 435, {
          radius: 4.5,
          color: ROLE.ok,
          glow: 8,
          opacity: 0.7,
        }),
      );

      return group(...nodes);
    },
  );

  s.add(bgAura, header, view);
  driftValue(s, c, phase, 4.2);

  c.on('cc-jaccard-half', () => {
    s.play(scoreOn.to(1, { duration: clampDur(c, c.cue('cc-jaccard-half').start, 0.35) }));
  });
  c.on('cc-jaccard-select', () => {
    s.play(selectOn.to(1, { duration: clampDur(c, c.cue('cc-jaccard-select').start, 0.35) }));
  });
  c.on('cc-context-ranking-2', () => {
    s.play(bm25On.to(1, { duration: clampDur(c, c.cue('cc-context-ranking-2').start, 0.4) }));
  });
}
