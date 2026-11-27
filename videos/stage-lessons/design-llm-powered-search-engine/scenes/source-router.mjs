// Scene 6: source-router - Keep freshness independent of route selection
// Real `searchRoutePlan` splits live build status vs hot/warm document search plus an orthogonal
// `current = true` flag; Beat 2 transitions to a luminous HyDE vector plane (`h = [0.5, 1]`).
import { group, line, rect } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  aura,
  beamWithPhotons,
  cinemaHeader,
  clampDur,
  glowDot,
  glowingTrail,
  guardedDynamic,
  quadArcPts,
  searchCosine,
  searchRoutePlan,
  txt,
} from '../parts.mjs';

export default function sourceRouter(s, c) {
  const beat0On = s.value(0);
  const beat1On = s.value(0);
  const liveOn = s.value(0);
  const docOn = s.value(0);
  const freshOn = s.value(0);
  const beat2On = s.value(0);
  const hydeVec = s.value(0);
  const hydeHit = s.value(0);

  const queryStr = 'build-1042 status and current migration policy';
  const plan = searchRoutePlan(queryStr);
  const cosExc = searchCosine([0.5, 1], [0.5, 1]);
  const cosPol = searchCosine([0.5, 1], [1, 0.5]);

  const header = cinemaHeader(
    'ROUTING & FRESHNESS',
    'Keep freshness separate',
    'from route choice',
    {
      accent: ROLE.query,
      size: 46,
    },
  );

  const stageAura = aura(260, 50, 680, '#5ce1e61c', '#ffd16616');

  const view = guardedDynamic(
    () => 1,
    () => {
      const b1 = beat1On.value > 0.5;
      const lv = liveOn.value > 0.5;
      const dc = docOn.value > 0.5;
      const fr = freshOn.value > 0.5;
      const b2 = beat2On.value > 0.5;
      const hv = hydeVec.value;
      const hh = hydeHit.value > 0.5;
      const nodes = [];

      // Query ribbon across top right
      nodes.push(
        rect(1180, 92, { fill: '#0c1528', stroke: ROLE.query, width: 2.6, radius: 14 }).at(
          260,
          -370,
        ),
        txt('QUERY:', -295, -370, 26, ROLE.query, 'mono', 'left'),
        txt(`"${queryStr}"`, -175, -370, 29, COSMOS.ink, 'mono', 'left'),
      );

      if (b2) {
        // Beat 2: Rewrite guard + HyDE hypothetical vector space
        nodes.push(
          txt('QUERY REWRITE PRESERVES:', -855, -185, 26, ROLE.query, 'mono', 'left'),
          txt('build-1042   ·   dates   ·   negations', -855, -135, 30, COSMOS.ink, 'mono', 'left'),

          rect(790, 146, { fill: '#0e1628', stroke: ROLE.focus, width: 2.6, radius: 14 }).at(
            -460,
            25,
          ),
          txt('HyDE HYPOTHETICAL DOCUMENT', -820, -14, 26, ROLE.focus, 'mono', 'left'),
          txt(
            '"Service-account migration exception..."',
            -820,
            48,
            30,
            COSMOS.ink,
            'serif',
            'left',
          ),

          txt(
            hh
              ? `cos(h, exception) = ${cosExc.toFixed(1)}   vs   cos(h, policy) = ${cosPol.toFixed(1)}`
              : 'Embed hypothetical document -> search real corpus',
            -855,
            188,
            28,
            hh ? ROLE.exception : COSMOS.muted,
            'mono',
            'left',
          ),
          txt(
            'Always cite the retrieved original passage, never the synthetic draft.',
            -855,
            262,
            28,
            COSMOS.muted,
            'sans',
            'left',
          ),
        );

        // Right 2D vector plane
        const ox = 220;
        const oy = 310;
        const sc = 370;
        nodes.push(
          line([ox - 40, oy], [ox + sc + 160, oy], { stroke: '#3a4f7c', width: 2.5 }),
          line([ox, oy + 40], [ox, oy - sc - 70], { stroke: '#3a4f7c', width: 2.5 }),
          txt('axis 1', ox + sc + 145, oy + 36, 26, COSMOS.dim, 'mono', 'right'),
          txt('axis 2', ox - 20, oy - sc - 52, 26, COSMOS.dim, 'mono', 'right'),

          // Policy [1, 0.5]
          glowingTrail(
            [
              [ox, oy],
              [ox + sc, oy - sc * 0.5],
            ],
            {
              color: ROLE.policy,
              width: 3.4,
              glow: 7,
            },
          ),
          glowDot(ox + sc, oy - sc * 0.5, { radius: 8, color: ROLE.policy, glow: 10 }),
          txt('Policy [1, 0.5]', ox + sc + 18, oy - sc * 0.5, 26, ROLE.policy, 'mono', 'left'),

          // Exception [0.5, 1]
          glowingTrail(
            [
              [ox, oy],
              [ox + sc * 0.5, oy - sc],
            ],
            {
              color: ROLE.exception,
              width: 3.8,
              glow: 9,
            },
          ),
          glowDot(ox + sc * 0.5, oy - sc, { radius: 9, color: ROLE.exception, glow: 12 }),
          txt(
            'Exception [0.5, 1]',
            ox + sc * 0.5 + 22,
            oy - sc - 8,
            26,
            ROLE.exception,
            'mono',
            'left',
          ),
        );

        // HyDE vector h = [0.5, 1] sweeping along exception
        if (hv > 0.05) {
          const hx = ox + sc * 0.5 * hv;
          const hy = oy - sc * hv;
          nodes.push(
            glowingTrail(
              [
                [ox, oy],
                [hx, hy],
              ],
              { color: ROLE.focus, width: 5, glow: 12 },
            ),
            glowDot(hx, hy, { radius: 7, color: '#ffffff', glow: 12 }),
            txt('h = [0.5, 1]', ox - 24, oy - sc * 0.55, 28, ROLE.focus, 'mono', 'right').glow(
              6,
              ROLE.focus,
            ),
          );
        }
      } else if (b1) {
        // Beat 1: Keyword-triggered dual routes + orthogonal current-revision flag
        const liveCol = lv ? ROLE.policy : COSMOS.dim;
        const docCol = dc ? ROLE.exception : COSMOS.dim;
        const freshCol = fr ? ROLE.focus : COSMOS.dim;

        nodes.push(
          beamWithPhotons(quadArcPts([40, -322], [-440, -108], -24), liveCol, 0, {
            width: 3.4,
            glow: lv ? 9 : 0,
            alpha: lv ? 0.95 : 0.3,
          }),
          beamWithPhotons(quadArcPts([480, -322], [440, -108], -24), docCol, 0, {
            width: 3.4,
            glow: dc ? 9 : 0,
            alpha: dc ? 0.95 : 0.3,
          }),

          rect(740, 210, { fill: '#0d1629', stroke: liveCol, width: lv ? 3.2 : 2, radius: 14 })
            .at(-440, 2)
            .glow(lv ? 9 : 2, liveCol),
          txt('TRIGGER: "build-1042"', -775, -52, 26, liveCol, 'mono', 'left'),
          txt(
            lv ? plan.routes[0] : 'Live API branch',
            -775,
            8,
            34,
            lv ? COSMOS.ink : COSMOS.dim,
            'serif',
            'left',
          ),
          txt('Alice permissions enforced', -775, 68, 26, COSMOS.muted, 'mono', 'left'),

          rect(740, 210, { fill: '#0d1924', stroke: docCol, width: dc ? 3.2 : 2, radius: 14 })
            .at(440, 2)
            .glow(dc ? 9 : 2, docCol),
          txt('TRIGGER: "migration" (default fallback)', 105, -52, 26, docCol, 'mono', 'left'),
          txt(
            dc ? plan.routes[1] : 'Document search branch',
            105,
            8,
            34,
            dc ? COSMOS.ink : COSMOS.dim,
            'serif',
            'left',
          ),
          txt('Alice permissions enforced', 105, 68, 26, COSMOS.muted, 'mono', 'left'),

          // Independent freshness flag bar
          rect(1620, 126, { fill: '#121626', stroke: freshCol, width: fr ? 3.2 : 2, radius: 14 })
            .at(0, 245)
            .glow(fr ? 10 : 2, freshCol),
          txt(
            fr
              ? `FRESHNESS FLAG (INDEPENDENT): require_current_revision = ${plan.current}`
              : 'FRESHNESS FLAG: checking policy / current / latest keywords...',
            0,
            245,
            30,
            freshCol,
            'mono',
            'center',
          ),
        );
      } else {
        // Beat 0: Live API vs Hot Index vs Warm Index
        const tiers = [
          {
            x: -560,
            title: 'LIVE BUILD API',
            sub1: 'Mutable job state',
            sub2: 'Is build-1042 still running?',
            col: ROLE.policy,
          },
          {
            x: 0,
            title: 'HOT INDEX',
            sub1: 'Fast-changing docs',
            sub2: 'Release notes & policy updates',
            col: ROLE.focus,
          },
          {
            x: 560,
            title: 'WARM INDEX',
            sub1: 'Stable reference docs',
            sub2: 'Manuals & historical reports',
            col: ROLE.exception,
          },
        ];
        tiers.forEach((t) => {
          nodes.push(
            rect(510, 240, { fill: '#0d1528', stroke: t.col, width: 2.8, radius: 14 })
              .at(t.x, 45)
              .glow(7, t.col),
            txt(t.title, t.x, -26, 28, t.col, 'mono', 'center'),
            txt(t.sub1, t.x, 42, 32, COSMOS.ink, 'serif', 'center'),
            txt(t.sub2, t.x, 108, 26, COSMOS.muted, 'sans', 'center'),
          );
        });
        nodes.push(
          txt(
            'A build report in any document index describes only when someone wrote it.',
            0,
            300,
            30,
            COSMOS.muted,
            'sans',
            'center',
          ).opacity(0.55 + 0.45 * beat0On.value),
        );
      }

      return group(...nodes);
    },
  );

  s.add(stageAura, header, view);
  c.on('se-source-router-0', () => {
    s.play(beat0On.to(1, { duration: clampDur(c, c.cue('se-source-router-0').start, 0.35) }));
  });
  c.on('se-source-router-1', () => {
    s.play(beat1On.to(1, { duration: clampDur(c, c.cue('se-source-router-1').start, 0.25) }));
  });
  c.on('se-source-router-both', () => {
    s.play(liveOn.to(1, { duration: clampDur(c, c.cue('se-source-router-both').start, 0.3) }));
  });
  c.on('se-source-router-policy', () => {
    s.play(docOn.to(1, { duration: clampDur(c, c.cue('se-source-router-policy').start, 0.3) }));
  });
  c.on('se-source-router-freshness', () => {
    s.play(
      freshOn.to(1, { duration: clampDur(c, c.cue('se-source-router-freshness').start, 0.3) }),
    );
  });
  c.on('se-source-router-2', () => {
    s.play(beat2On.to(1, { duration: clampDur(c, c.cue('se-source-router-2').start, 0.25) }));
  });
  c.on('se-source-router-hyde-construct', () => {
    s.play(
      hydeVec.to(1, {
        duration: clampDur(c, c.cue('se-source-router-hyde-construct').start, 0.8),
      }),
    );
  });
  c.on('se-source-router-hyde', () => {
    s.play(hydeHit.to(1, { duration: clampDur(c, c.cue('se-source-router-hyde').start, 0.3) }));
  });
}
