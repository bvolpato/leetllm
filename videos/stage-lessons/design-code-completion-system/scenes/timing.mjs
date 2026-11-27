// Scene 14: timing - Measure from the edit to a usable suggestion
// Immediate path (12 + 55 + 28 + 78 + 10 = 183 ms <= 200 ms) vs Debounced path (+150 ms = 333 ms > 200 ms)
// computed directly from phaseDurations in fixtures.mjs!
import { group, line, rect } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  aura,
  cinemaHeader,
  clampDur,
  guardedDynamic,
  phaseDurations,
  sum,
  txt,
} from '../parts.mjs';

export default function timing(s, c) {
  const debOn = s.value(0);

  const immTotal = sum(phaseDurations); // 183
  const debTotal = immTotal + 150; // 333

  const header = cinemaHeader(
    'EDIT-TO-PAINT LATENCY',
    'Measure from edit to',
    'a usable suggestion',
    {
      x: -860,
      y: -445,
      accent: ROLE.ed,
      size: 46,
    },
  );

  const bgAura = aura(40, 20, 680, '#5ce1e61a', '#f43f5e16');

  const view = guardedDynamic(
    () => 1,
    () => {
      const db = debOn.value;
      const nodes = [];

      // Shared ms ruler: 0 .. 380 ms across x = [-740 .. +740]
      const x0 = -740;
      const x1 = 740;
      const mapMs = (ms) => x0 + (ms / 380) * (x1 - x0);
      const x200 = mapMs(200);

      const cols = [ROLE.ed, ROLE.gpu, ROLE.model, ROLE.ok, ROLE.focus];
      const names = ['12', 'Net 55', 'Ctx 28', 'Gen 78', '10'];

      // Row 1: Immediate trigger (183 ms <= 200 ms)
      const y1 = -105;
      nodes.push(
        txt(
          `IMMEDIATE TRIGGER: ${immTotal} ms  (17 ms SPARE UNDER 200 ms!)`,
          x0,
          y1 - 62,
          26,
          ROLE.ok,
          'mono',
          'left',
        ),
      );
      let acc = 0;
      phaseDurations.forEach((d, i) => {
        const xa = mapMs(acc);
        const xb = mapMs(acc + d);
        nodes.push(
          rect(xb - xa - 3, 46, { fill: cols[i], stroke: '#ffffff', width: 1.2, radius: 5 })
            .at((xa + xb) * 0.5, y1)
            .opacity(0.9),
          txt(
            names[i],
            (xa + xb) * 0.5,
            y1 + (i === 0 || i === 4 ? 44 : 0),
            26,
            i === 0 || i === 4 ? cols[i] : '#070910',
            'mono',
            'center',
          ),
        );
        acc += d;
      });

      // Row 2: Debounced ordinary typing (+150 ms = 333 ms > 200 ms!)
      const y2 = 65;
      const dAlpha = 0.4 + db * 0.6;
      const x150 = mapMs(150);
      nodes.push(
        txt(
          `DEBOUNCED (+150 ms): ${debTotal} ms  (EXCEEDS 200 ms!)`,
          x0,
          y2 - 58,
          26,
          ROLE.fail,
          'mono',
          'left',
        ).opacity(dAlpha),
        rect(x150 - x0 - 4, 46, { fill: ROLE.warn, stroke: '#ffffff', width: 1.5, radius: 5 })
          .at((x0 + x150) * 0.5, y2)
          .opacity(dAlpha * 0.9),
        txt('DEBOUNCE 150 ms', (x0 + x150) * 0.5, y2, 26, '#070910', 'mono', 'center').opacity(
          dAlpha,
        ),
        rect(mapMs(debTotal) - x150, 46, {
          fill: ROLE.fail,
          stroke: '#ffffff',
          width: 1.5,
          radius: 5,
        })
          .at((x150 + mapMs(debTotal)) * 0.5, y2)
          .glow(db > 0.4 ? 8 : 0, ROLE.fail)
          .opacity(dAlpha * 0.9),
        txt(
          `SAME ${immTotal} ms PATH`,
          (x150 + mapMs(debTotal)) * 0.5,
          y2,
          26,
          '#070910',
          'mono',
          'center',
        ).opacity(dAlpha),
      );

      // 200 ms SLO line (stops cleanly above ticks!)
      const axisY = 165;
      nodes.push(
        line([x0, axisY], [x1, axisY], { stroke: '#344770', width: 4 }),
        line([x200, y1 - 36], [x200, axisY - 10], {
          stroke: ROLE.focus,
          width: 4,
          dash: [10, 8],
        }).glow(9, ROLE.focus),
        txt('200 ms SLO', x200, axisY + 84, 26, ROLE.focus, 'mono', 'center'),
      );
      for (const t of [0, 100, 183, 200, 333]) {
        const tx = mapMs(t);
        nodes.push(
          line([tx, axisY - 8], [tx, axisY + 8], { stroke: '#5c74a8', width: 2 }),
          txt(
            `${t}`,
            tx,
            axisY + 38,
            26,
            t === 183 ? ROLE.ok : t === 333 ? ROLE.fail : COSMOS.dim,
            'mono',
            'center',
          ),
        );
      }

      nodes.push(
        txt('COMPLETE TRACES ONLY', 480, -425, 26, ROLE.focus, 'mono', 'center'),
        txt('Never sum stage percentiles!', 480, -378, 26, ROLE.warn, 'mono', 'center'),
        txt(
          'Include stale drops & timeouts; set separate pause-to-suggestion objective for debounced typing',
          0,
          295,
          26,
          COSMOS.muted,
          'mono',
          'center',
        ),
      );

      return group(...nodes);
    },
  );

  s.add(bgAura, header, view);
  c.on('timing-beat-2-focus-1', () => {
    s.play(debOn.to(1, { duration: clampDur(c, c.cue('timing-beat-2-focus-1').start, 0.4) }));
  });
}
