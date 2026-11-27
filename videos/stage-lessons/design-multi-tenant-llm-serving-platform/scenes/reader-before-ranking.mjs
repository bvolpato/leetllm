// Scene 23: reader-before-ranking - Choose the best evidence from the authorized candidate set
// Three passages inside trusted retrieval: B-secret (0.99), A-private (0.95 Carol), A-public (0.80 Alice).
// Beat 0: Filter authorized set FIRST -> Alice receives A-public 0.80.
// Beat 1: Explicit restart: broad top-1-then-filter -> grabs B-secret, discards -> empty + boundary leak.
// Beat 2: PostgreSQL RLS verification (actual service role, superuser/bypass, FORCE ROW LEVEL SECURITY).
import { group, rect } from 'vizmatic/stage';
import {
  COSMOS,
  RETRIEVAL_DOCS,
  ROLE,
  aura,
  beamWithPhotons,
  cinemaHeader,
  guardedDynamic,
  stepAfter,
  stepOn,
  txt,
} from '../parts.mjs';

export default function readerBeforeRanking(s, c) {
  const b0On = s.value(0);
  const docBOn = s.value(0);
  const docCOn = s.value(0);
  const docAOn = s.value(0);
  const filterReady = s.value(0);
  const b1On = s.value(0);
  const emptyOn = s.value(0);
  const revalOn = s.value(0);
  const b2On = s.value(0);

  const stageAura = aura(-120, 20, 760, '#60a5fa1a', '#6ee7b716');
  const header = cinemaHeader(
    'PRE-RANKING READER AUTHORIZATION',
    'Choose the best evidence from',
    'the authorized candidate set',
    { x: -860, y: -450, accent: ROLE.A, size: 46 },
  );

  const docFlags = [docBOn, docCOn, docAOn];

  const view = guardedDynamic(
    () => 1,
    () => {
      const filt = filterReady.value > 0.5;
      const b1 = b1On.value > 0.5;
      const emp = emptyOn.value > 0.5;
      const reval = revalOn.value > 0.5;
      const b2 = b2On.value > 0.5;

      const nodes = [];

      // Left trusted retrieval boundary box containing the 3 candidate passages
      nodes.push(
        rect(1030, 560, { fill: '#0a1224', stroke: ROLE.A, width: 2.8, radius: 18 }).at(-330, 45),
        txt(
          'TRUSTED RETRIEVAL BOUNDARY  ·  CALLER: ALICE (A)',
          -805,
          -192,
          26,
          ROLE.A,
          'mono',
          'left',
        ),
      );

      RETRIEVAL_DOCS.forEach((doc, idx) => {
        const y = -85 + idx * 165;
        const allowed = doc.tenant === 'A' && doc.reader === 'Alice';
        const hi = docFlags[idx].value > 0.5 || b1 || b2;
        const col = allowed ? ROLE.ok : doc.tenant === 'B' ? ROLE.B : ROLE.warn;

        nodes.push(
          rect(610, 128, {
            fill: allowed ? '#0b1e1b' : '#121526',
            stroke: hi ? col : '#2c3d66',
            width: hi ? 2.8 : 1.8,
            radius: 14,
          })
            .at(-495, y)
            .glow(hi ? 7 : 0, col),
          txt(
            `${doc.id}   ·   score ${doc.score.toFixed(2)}`,
            -770,
            y - 24,
            30,
            hi ? col : COSMOS.muted,
            'mono',
            'left',
          ),
          txt(
            `Tenant ${doc.tenant}  /  Reader: ${doc.reader}`,
            -770,
            y + 26,
            26,
            COSMOS.ink,
            'sans',
            'left',
          ),
        );

        // Status tag inside trusted boundary
        if (filt && !b1) {
          nodes.push(
            txt(
              allowed ? 'PERMITTED' : 'STAYS INSIDE',
              -20,
              y,
              26,
              allowed ? ROLE.ok : COSMOS.muted,
              'mono',
              'center',
            ),
          );
        } else if (b1 && idx === 0) {
          nodes.push(txt('GLOBAL TOP-1', -20, y, 26, ROLE.fail, 'mono', 'center'));
        }
      });

      // Right-hand outcome column (x = 550)
      if (!b1 && !b2) {
        // Beat 0: Correct pre-filter -> Alice receives A-public 0.80
        if (filt) {
          nodes.push(
            beamWithPhotons(
              [
                [192, 245],
                [305, 245],
              ],
              ROLE.ok,
              0,
              { width: 4.5, glow: 10 },
            ),
          );
        }
        nodes.push(
          rect(510, 260, {
            fill: filt ? '#0b221c' : '#0b1224',
            stroke: filt ? ROLE.ok : '#2c3d66',
            width: 3.0,
            radius: 18,
          })
            .at(585, 165)
            .glow(filt ? 10 : 0, ROLE.ok),
          txt('RETURNED TO ALICE', 585, 92, 26, filt ? ROLE.ok : COSMOS.muted, 'mono', 'center'),
          txt(
            filt ? 'A-public · 0.80' : 'Filtering first...',
            585,
            162,
            38,
            filt ? COSMOS.ink : COSMOS.dim,
            'mono',
            'center',
          ),
          txt(
            filt ? 'Forbidden docs stay inside' : 'Filter authorized set first',
            585,
            228,
            26,
            COSMOS.muted,
            'sans',
            'center',
          ),
        );
      } else if (b1 && !b2) {
        // Beat 1: Wrong order (broad top-1 then post-filter) -> empty + leak!
        nodes.push(
          rect(510, 190, { fill: '#260f1a', stroke: ROLE.fail, width: 3.0, radius: 16 })
            .at(585, -75)
            .glow(9, ROLE.fail),
          txt('RESTART: TOP-1 FIRST', 585, -124, 26, ROLE.fail, 'mono', 'center'),
          txt('B-secret · 0.99', 585, -68, 36, COSMOS.ink, 'mono', 'center'),
          txt('Crossed boundary before filter!', 585, -14, 26, ROLE.fail, 'sans', 'center'),

          rect(510, 210, {
            fill: emp ? '#28101b' : '#0b1224',
            stroke: emp ? ROLE.fail : '#2c3d66',
            width: 3.0,
            radius: 16,
          })
            .at(585, 185)
            .glow(emp ? 9 : 0, ROLE.fail),
          txt('POST-FILTER RESULT', 585, 130, 26, ROLE.fail, 'mono', 'center'),
          txt(
            emp ? 'EMPTY (0 docs)' : 'discarding...',
            585,
            188,
            36,
            emp ? ROLE.fail : COSMOS.dim,
            'mono',
            'center',
          ),
          txt(
            reval ? 'Revalidate grants at content fetch' : 'Alice’s A-public was missed!',
            585,
            244,
            26,
            COSMOS.ink,
            'sans',
            'center',
          ),
        );
      } else {
        // Beat 2: PostgreSQL RLS verification
        nodes.push(
          rect(510, 210, { fill: '#19150b', stroke: ROLE.focus, width: 2.8, radius: 16 })
            .at(585, -60)
            .glow(8, ROLE.focus),
          txt('POSTGRESQL RLS', 585, -112, 28, ROLE.focus, 'mono', 'center'),
          txt('Deny by default if no policy', 585, -56, 26, COSMOS.ink, 'sans', 'center'),
          txt('Reinforces service boundary', 585, -12, 26, COSMOS.muted, 'sans', 'center'),

          rect(510, 220, { fill: '#240f19', stroke: ROLE.warn, width: 2.8, radius: 16 })
            .at(585, 195)
            .glow(8, ROLE.warn),
          txt('VERIFY ACTUAL ROLE', 585, 138, 28, ROLE.warn, 'mono', 'center'),
          txt('Superusers & BYPASSRLS escape', 585, 192, 26, COSMOS.ink, 'sans', 'center'),
          txt('Owners escape unless FORCED', 585, 240, 26, ROLE.fail, 'sans', 'center'),
        );
      }

      nodes.push(
        txt(
          'Forbidden IDs, scores, and text must never cross outside the trusted retrieval service.',
          0,
          412,
          28,
          COSMOS.muted,
          'sans',
          'center',
        ),
      );

      return group(...nodes);
    },
  );

  s.add(stageAura, header, view);
  stepOn(s, c, 'mt-reader-before-ranking-b0', b0On, 1);
  stepAfter(s, c, 'mt-reader-before-ranking-s0-0', docBOn, 1);
  stepAfter(s, c, 'mt-reader-before-ranking-s0-1', docCOn, 1);
  stepAfter(s, c, 'mt-reader-before-ranking-s0-2', docAOn, 1);
  stepAfter(s, c, 'mt-reader-before-ranking-s0-3', filterReady, 1);
  stepOn(s, c, 'mt-reader-before-ranking-b1', b1On, 1);
  stepAfter(s, c, 'mt-reader-before-ranking-s1-0', emptyOn, 1);
  stepOn(s, c, 'mt-reader-before-ranking-s1-2', revalOn, 1);
  stepOn(s, c, 'mt-reader-before-ranking-b2', b2On, 1);
}
