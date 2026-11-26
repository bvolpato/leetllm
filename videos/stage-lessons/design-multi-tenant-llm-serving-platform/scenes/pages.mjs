// Scene 12: pages - Where can B write next?
// Living 5-page interleaved KV pool (16 token slots per page) with A=[0,2,4] (47) and B=[1,3] (31).
// Strict prediction withholding: pos 32 stays pending until `c.after('pages-write-thirty-two')`;
// pos 33 stays pending and blocked verdict stays withheld until `c.after('pages-no-block')`.
import { group } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  aura,
  buildPagePoolStage,
  cinemaHeader,
  clampDur,
  driftValue,
  guardedDynamic,
  privateHistory,
  stepAfter,
  stepOn,
} from '../parts.mjs';

export default function pages(s, c) {
  const pulse = s.value(0);
  const readTables = s.value(0);
  const traceA = s.value(0);
  const traceB = s.value(0);
  const ask32 = s.value(0);
  const wrote32 = s.value(0);
  const ask33 = s.value(0);
  const blocked33 = s.value(0);

  const stageAura = aura(0, 60, 780, '#60a5fa1a', '#ff6b8b16');
  const header = cinemaHeader('PAGED KV-CACHE OWNERSHIP', 'Where can B write next?', null, {
    x: -860,
    y: -455,
    accent: ROLE.kv,
    size: 48,
  });

  const view = guardedDynamic(
    () => 1,
    () => {
      const p = pulse.value;
      const a32 = ask32.value > 0.5;
      const w32 = wrote32.value > 0.5;
      const a33 = ask33.value > 0.5;
      const blk = blocked33.value > 0.5;

      const history = privateHistory({ bTokens: w32 ? 32 : 31 });

      // Active traced page during A-chain or B-chain walkthroughs
      let tracedPage = -1;
      if (traceA.value > 0.01 && traceA.value < 0.99) {
        const idx = Math.min(2, Math.floor(traceA.value * 3));
        tracedPage = history.tables.A[idx];
      } else if (traceB.value > 0.01 && traceB.value < 0.99) {
        const idx = Math.min(1, Math.floor(traceB.value * 2));
        tracedPage = history.tables.B[idx];
      } else if (a33 && !blk) {
        tracedPage = 4; // highlight P4's tempting empty slot while asking!
      }

      const pendingPosition = a33 ? 33 : w32 ? null : a32 ? 32 : null;
      const markedPosition = w32 ? 32 : null;

      let note = '16 positions per page  ·  78 occupied  ·  2 empty slots';
      let noteColor = COSMOS.ink;
      if (readTables.value > 0.5 && !a32) {
        note = 'A maps P0 -> P2 -> P4 (47 tokens)  ·  B maps P1 -> P3 (31 tokens)';
      }
      if (a32 && !w32) {
        note = 'Two squares are empty. Where can B store position 32?';
        noteColor = ROLE.focus;
      }
      if (w32 && !a33) {
        note = 'Position 32 fills slot 16 of P3 (already owned by B). Both B pages are now full.';
        noteColor = ROLE.ok;
      }
      if (a33 && !blk) {
        note = 'P4 still has one empty square in this 5-page pool. Can B write position 33 there?';
        noteColor = ROLE.focus;
      }
      if (blk) {
        note =
          'B must wait for a whole page. P4 belongs to A; sharing it mixes two private histories.';
        noteColor = ROLE.warn;
      }

      return group(
        ...buildPagePoolStage({
          history,
          pendingPosition,
          markedPosition,
          tracedPage,
          note,
          noteColor,
          pulse: p,
        }),
      );
    },
  );

  s.add(stageAura, header, view);
  driftValue(s, c, pulse, 4.5);

  stepOn(s, c, 'pages-read-tables', readTables, 1);
  c.on('pages-a-chain', () => {
    const q = c.cue('pages-a-chain');
    s.play(traceA.to(1, { duration: clampDur(c, q.start, Math.max(0.4, q.end - q.start)) }));
  });
  c.on('pages-b-chain', () => {
    const q = c.cue('pages-b-chain');
    s.play(traceB.to(1, { duration: clampDur(c, q.start, Math.max(0.4, q.end - q.start)) }));
  });
  stepOn(s, c, 'pages-first-question', ask32, 1);
  // Strict prediction withholding: write position 32 ONLY after "Position thirty-two fills the last slot in page three".
  stepAfter(s, c, 'pages-write-thirty-two', wrote32, 1);
  stepOn(s, c, 'pages-next-position', ask33, 1);
  // Strict prediction withholding: reveal block verdict ONLY after "B has to wait for a whole page".
  stepAfter(s, c, 'pages-no-block', blocked33, 1);
}
