// Scene 25: cache-economics - Add disjoint input buckets before comparing call cost
// Disjoint token partition from voiceWorksheet(): 1000*$0.40 + 500*$2.50 + 200*$2.00 = 2050 / 1e6
// = $0.00205 input subtotal, clearly separated from text output & audio I/O billing units!
import { group, line, rect } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  WORKSHEET,
  aura,
  cinemaHeader,
  clampDur,
  glowTex,
  guardedDynamic,
  txt,
} from '../parts.mjs';

export default function cacheEconomics(s, c) {
  const multOn = s.value(0);
  const numOn = s.value(0);
  const costOn = s.value(0);
  const otherOn = s.value(0);

  const rows = WORKSHEET.costRows; // read(1000,0.4), write(500,2.5), ordinary(200,2)
  const numer = WORKSHEET.costNumerator; // 2050
  const totalUsd = (numer / 1e6).toFixed(5); // 0.00205

  const header = cinemaHeader(
    'DISJOINT TOKEN ECONOMICS',
    'Partition buckets',
    'before summing cost',
    {
      x: -860,
      y: -445,
      accent: ROLE.focus,
      size: 46,
    },
  );

  const bgAura = aura(40, 20, 680, '#ffd1661a', '#6ee7b716');
  const eq = glowTex(
    `\\text{Input} = \\frac{1000(0.40) + 500(2.50) + 200(2.00)}{10^6} = \\$${totalUsd}`,
    { size: 32, color: ROLE.focus, glow: 8 },
  ).at(360, -370);

  const view = guardedDynamic(
    () => 1,
    () => {
      const ml = multOn.value;
      const nm = numOn.value;
      const cs = costOn.value;
      const ot = otherOn.value;
      const nodes = [];

      // 3 disjoint horizontal bar towers (x = -760 .. +200, scaled to max product 1250)
      const cols = [ROLE.ok, ROLE.warn, ROLE.audio];
      const labels = ['CACHED READ', 'CACHE WRITE', 'ORDINARY IN'];
      const ys = [-145, -45, 55];

      rows.forEach((r, i) => {
        const prod = r.tokens * r.rate; // 400, 1250, 400
        const bw = (prod / 1250) * 580;
        const col = cols[i];
        const y = ys[i];
        nodes.push(
          txt(labels[i], -840, y, 26, col, 'mono', 'left'),
          txt(`${r.tokens} tok × $${r.rate.toFixed(2)}/M`, -540, y, 26, COSMOS.ink, 'mono', 'left'),
          rect(bw, 44, { fill: col, stroke: '#ffffff', width: 1.5, radius: 6 })
            .at(-140 + bw * 0.5, y)
            .glow(8, col)
            .opacity(0.45 + ml * 0.5),
          txt(`= ${prod}`, -140 + bw + 24, y, 28, col, 'mono', 'left').opacity(0.45 + ml * 0.55),
        );
      });

      // Right subtotal readout + separate billing bucket guard
      const rx = 560;
      nodes.push(
        txt('NUMERATOR', rx, -145, 26, COSMOS.muted, 'mono', 'center'),
        txt(`${numer}`, rx, -95, 42, ROLE.focus, 'mono', 'center').glow(
          nm > 0.4 ? 9 : 0,
          ROLE.focus,
        ),
        txt('INPUT SUBTOTAL', rx, -15, 26, COSMOS.muted, 'mono', 'center'),
        txt(`$${totalUsd}`, rx, 40, 42, ROLE.ok, 'mono', 'center')
          .glow(cs > 0.4 ? 10 : 0, ROLE.ok)
          .opacity(0.35 + cs * 0.65),
        txt('(invented worksheet rates)', rx, 98, 26, COSMOS.dim, 'mono', 'center'),
      );

      // Bottom separate billing guard (Text Output + Audio In + Audio Out)
      const botY = 235;
      const otAlpha = 0.4 + ot * 0.6;
      nodes.push(
        line([-840, 165], [840, 165], { stroke: '#25355a', width: 2 }).opacity(0.65),
        txt(
          'OUTSIDE THIS SUBTOTAL: ADD UNDER THEIR OWN BILLING UNITS',
          0,
          botY - 22,
          26,
          ROLE.cut,
          'mono',
          'center',
        ).opacity(otAlpha),
        txt(
          'Text Output Tokens   +   Audio Input   +   Audio Output   =   TOTAL CALL COST',
          0,
          botY + 32,
          26,
          COSMOS.ink,
          'mono',
          'center',
        ).opacity(otAlpha),
        txt(
          'Compare total cost, cache usage & both first-audio clocks with identical policy behavior',
          0,
          botY + 100,
          26,
          COSMOS.muted,
          'sans',
          'center',
        ),
      );

      return group(...nodes);
    },
  );

  s.add(bgAura, header, eq, view);
  c.on('va-cache-economics-0-1', () => {
    s.play(multOn.to(1, { duration: clampDur(c, c.cue('va-cache-economics-0-1').start, 0.35) }));
  });
  c.on('va-cache-economics-1-1', () => {
    s.play(numOn.to(1, { duration: clampDur(c, c.cue('va-cache-economics-1-1').start, 0.35) }));
  });
  c.on('va-cache-economics-1-input-cost', () => {
    s.play(
      costOn.to(1, { duration: clampDur(c, c.cue('va-cache-economics-1-input-cost').start, 0.4) }),
    );
  });
  c.on('va-cache-economics-1-3', () => {
    s.play(otherOn.to(1, { duration: clampDur(c, c.cue('va-cache-economics-1-3').start, 0.4) }));
  });
}
