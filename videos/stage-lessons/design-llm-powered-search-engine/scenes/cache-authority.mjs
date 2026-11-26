// Scene 26: cache-authority - Revalidate the evidence dependencies on reuse
// Stored semantic-cache candidate ringed by 5 dependency checks; registry advances to policy@3 ->
// real `quoteReceipt.valid` flips false -> rejects stale hit and opens authorized miss route (no async stale leak!).
import { group, rect } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  SEARCH_TEXT,
  aura,
  cinemaHeader,
  clampDur,
  driftValue,
  guardedDynamic,
  quoteReceipt,
  txt,
} from '../parts.mjs';

export default function cacheAuthority(s, c) {
  const pulse = s.value(0);
  const startOn = s.value(0);
  const beat1On = s.value(0);
  const invalidOn = s.value(0);
  const beat2On = s.value(0);
  const missOn = s.value(0);

  const header = cinemaHeader('CACHE REVALIDATION', 'Revalidate every', 'dependency on reuse', {
    accent: ROLE.deny,
    size: 46,
  });

  const stageAura = aura(0, 40, 700, '#ffd16618', '#ff6b8b1a');

  const view = guardedDynamic(
    () => 1,
    () => {
      const inv = invalidOn.value > 0.5;
      const b2 = beat2On.value > 0.5;
      const ms = missOn.value > 0.5;

      const curRev = inv || b2 ? 3 : 2;
      const rec = quoteReceipt(SEARCH_TEXT.policy, 2, { current: curRev });
      const stale = !rec.valid;
      const nodes = [];

      // Top capsule: Stored Semantic Cache Candidate
      const capCol = stale ? ROLE.deny : ROLE.focus;
      nodes.push(
        rect(1680, 146, { fill: '#111424', stroke: capCol, width: 3, radius: 14 })
          .at(0, -172)
          .glow(8, capCol)
          .opacity(0.65 + 0.35 * startOn.value),
        txt(
          stale ? 'STORED CACHE CANDIDATE: INVALIDATED' : 'STORED SEMANTIC CACHE CANDIDATE',
          -800,
          -208,
          26,
          capCol,
          'mono',
          'left',
        ),
        txt(
          '"60 days with security approval"   [policy@2, exception@1]',
          -800,
          -144,
          34,
          COSMOS.ink,
          'serif',
          'left',
        ),
      );

      // 5 dependency check rows
      const checks = [
        ['Authenticated scope', 'workspace-a / engineering', true],
        ['Policy revision', `cached policy@2  vs  current policy@${curRev}`, !stale],
        ['Model & prompt', 'same model + system prompt version', true],
        ['Evidence identity', 'policy@2 + exception@1 + previews', true],
        [
          'Reuse verdict',
          stale ? `REJECT HIT (quote.valid = ${rec.valid})` : 'awaiting current policy check',
          !stale,
        ],
      ];

      checks.forEach(([k, v, ok], i) => {
        const y = -30 + i * 74;
        const rowCol = ok ? ROLE.policy : ROLE.deny;
        nodes.push(
          txt(k, -840, y, 26, COSMOS.muted, 'mono', 'left'),
          rect(1160, 56, { fill: '#0d1527', stroke: rowCol, width: ok ? 2 : 3, radius: 10 })
            .at(260, y)
            .glow(ok ? 0 : 8, rowCol),
          txt(v, -295, y, 27, ok ? COSMOS.ink : ROLE.deny, 'mono', 'left'),
        );
      });

      // Bottom rule
      let msg =
        'Similarity finds a candidate; reuse still requires scope, policy rev, model, and freshness.';
      let msgCol = COSMOS.muted;
      if (ms || b2) {
        msg =
          'AUTHORIZED MISS: hold response until policy@3 lookup finishes (never leak stale private text!).';
        msgCol = ROLE.ok;
      } else if (stale) {
        msg = 'Cached bytes are unchanged, yet dependency policy@2 -> policy@3 invalidates reuse.';
        msgCol = ROLE.deny;
      } else if (beat1On.value > 0.5) {
        msg = 'A warm-tier key alone cannot prove current policy or active permissions.';
        msgCol = ROLE.focus;
      }

      nodes.push(
        txt(msg, -840, 382, 28, msgCol, 'serif', 'left').glow(stale || b2 ? 6 : 0, msgCol),
      );

      return group(...nodes);
    },
  );

  s.add(stageAura, header, view);
  driftValue(s, c, pulse, 4.5, { startOffset: 0.1, endMargin: 0.5 });

  c.on('se-cache-authority-0', () => {
    s.play(startOn.to(1, { duration: clampDur(c, c.cue('se-cache-authority-0').start, 0.35) }));
  });
  c.on('se-cache-authority-1', () => {
    s.play(beat1On.to(1, { duration: clampDur(c, c.cue('se-cache-authority-1').start, 0.3) }));
  });
  c.on('se-cache-authority-invalidate', () => {
    s.play(
      invalidOn.to(1, {
        duration: clampDur(c, c.cue('se-cache-authority-invalidate').start, 0.35),
      }),
    );
  });
  c.on('se-cache-authority-2', () => {
    s.play(beat2On.to(1, { duration: clampDur(c, c.cue('se-cache-authority-2').start, 0.3) }));
  });
  c.on('se-cache-authority-miss', () => {
    s.play(missOn.to(1, { duration: clampDur(c, c.cue('se-cache-authority-miss').start, 0.35) }));
  });
}
