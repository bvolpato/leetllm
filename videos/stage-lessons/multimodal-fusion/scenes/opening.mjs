// Scene 01: opening: Cropped latency dashboard, pulled-down legend reveals Checkout, encoder-connector-decoder bridge.
import {
  COSMOS,
  ROLE,
  arrow,
  aura,
  chipPill,
  dashboardChartNodes,
  group,
  guardedDynamic,
  heroTitle,
  line,
  originalKey,
  playCue,
  rect,
  txt,
} from '../parts.mjs';

export default function opening(s, c) {
  const traceHour = s.value(3.0);
  const revealLegend = s.value(0);
  const matchCheckout = s.value(0);
  const litEncoder = s.value(0);
  const litConnector = s.value(0);
  const litDecoder = s.value(0);

  const bgAura = aura(-120, -20, 780, '#18345e2c', '#2a164c24');
  const title = heroTitle(['How a Multimodal Model', 'Reads a Dashboard'], {
    x: -855,
    y: -435,
    size: 50,
    lineHeight: 58,
    accent: ROLE.bridge,
  });

  const stageVis = s.value(1);
  const layer = guardedDynamic(stageVis, (alpha) => {
    const hr = traceHour.value;
    const rev = revealLegend.value;
    const mat = matchCheckout.value;
    const enc = litEncoder.value;
    const con = litConnector.value;
    const dec = litDecoder.value;

    const legX = 120;
    const legY = -230;
    const legW = 735;
    const legH = 380;
    const swatches = [
      { color: ROLE.text, name: originalKey[0] },
      { color: ROLE.ok, name: originalKey[1] },
      { color: ROLE.warn, name: originalKey[2] },
    ];

    const nodes = [
      // Left: Glowing afternoon latency dashboard chart
      dashboardChartNodes(-855, -230, 880, 380, {
        hour: hr,
        showReadings: hr > 5.7,
        highlightGreen: hr > 3.2,
        opacity: alpha,
        caption: 'LATENCY TRACE (3 PM TO 6 PM)',
      }),

      // Right: Legend frame with sliding lower crop reveal
      txt(
        rev > 0.4 ? 'LEGEND RESTORED FROM CROP' : 'CROPPED LEGEND',
        legX + legW * 0.5,
        legY - 26,
        26,
        rev > 0.4 ? ROLE.ok : ROLE.gold,
        'mono',
        'center',
      ).opacity(alpha),
      rect(legW, legH, {
        fill: '#0b1224',
        stroke: mat > 0.4 ? ROLE.ok : '#2b3f6b',
        width: mat > 0.4 ? 3 : 2.2,
        radius: 14,
      })
        .at(legX + legW * 0.5, legY + legH * 0.5)
        .opacity(alpha * 0.92),
    ];

    swatches.forEach((sw, i) => {
      const sy = legY + 88 + i * 102;
      const isCheckout = i === 1;
      nodes.push(
        line([legX + 44, sy], [legX + 128, sy], {
          stroke: sw.color,
          width: isCheckout && mat > 0.4 ? 10 : 7,
        })
          .glow(isCheckout && mat > 0.4 ? 12 : 4, sw.color)
          .opacity(alpha),
      );
      if (rev > 0.45) {
        nodes.push(
          txt(sw.name, legX + 166, sy, isCheckout && mat > 0.4 ? 42 : 36, sw.color, 'mono', 'left')
            .glow(isCheckout && mat > 0.4 ? 10 : 0, sw.color)
            .opacity(alpha * Math.min(1, (rev - 0.4) / 0.4)),
        );
      } else {
        nodes.push(
          txt('[ hidden below crop ]', legX + 166, sy, 28, COSMOS.muted, 'mono', 'left').opacity(
            alpha * (1 - rev * 1.4),
          ),
        );
      }
    });

    // Stationary crop edge marker above row 0 that fades away cleanly as legend unlocks
    if (rev < 0.45) {
      const barOp = Math.max(0, 1 - rev / 0.42);
      nodes.push(
        line([legX + 18, legY + 34], [legX + legW - 18, legY + 34], {
          stroke: ROLE.gold,
          width: 3.2,
        })
          .glow(8, ROLE.gold)
          .opacity(alpha * barOp),
      );
    }

    // Lower canvas: Multimodal pipeline skeleton (visible at quiet opacity >= 0.48 from t=0)
    const pipeY = 305;
    nodes.push(
      txt(
        dec > 0.4
          ? 'SLOPE + LABEL -> PREFIX SEQUENCE OR VISUAL MEMORY'
          : mat > 0.4
            ? 'GREEN = CHECKOUT (5.2 -> 9.0 ms)'
            : 'WHICH SERVICE SLOWED DOWN?',
        0,
        210,
        30,
        mat > 0.4 ? ROLE.ok : ROLE.gold,
        'mono',
        'center',
      )
        .glow(mat > 0.4 ? 8 : 0, ROLE.ok)
        .opacity(alpha),

      chipPill('Image Encoder', -610, pipeY, {
        w: 360,
        h: 74,
        color: enc > 0.3 ? ROLE.vision : '#36507d',
        fill: enc > 0.3 ? '#0f283c' : '#0f172b',
        size: 28,
        glow: enc > 0.3 ? 12 : 4,
        opacity: alpha * (0.52 + 0.48 * enc),
      }),
      arrow([-415, pipeY], [-255, pipeY], {
        stroke: con > 0.3 ? ROLE.bridge : '#405680',
        width: 3.4,
        head: 12,
      }).opacity(alpha * (0.5 + 0.5 * con)),
      chipPill('Connector Bridge', 0, pipeY, {
        w: 470,
        h: 74,
        color: con > 0.3 ? ROLE.bridge : '#36507d',
        fill: con > 0.3 ? '#211842' : '#0f172b',
        size: 28,
        glow: con > 0.3 ? 14 : 4,
        opacity: alpha * (0.52 + 0.48 * con),
      }),
      arrow([250, pipeY], [410, pipeY], {
        stroke: dec > 0.3 ? ROLE.ok : '#405680',
        width: 3.4,
        head: 12,
      }).opacity(alpha * (0.5 + 0.5 * dec)),
      chipPill('Language Decoder', 625, pipeY, {
        w: 400,
        h: 74,
        color: dec > 0.3 ? ROLE.ok : '#36507d',
        fill: dec > 0.3 ? '#0f2d24' : '#0f172b',
        size: 28,
        glow: dec > 0.3 ? 12 : 4,
        opacity: alpha * (0.52 + 0.48 * dec),
      }),
    );

    return group(...nodes);
  });

  s.add(bgAura, title, layer);
  playCue(s, c, 'opening-follow-traces', (d) => s.play(traceHour.to(6.0, { duration: d })), {
    dur: 1.4,
  });
  // Strict prediction withholding: reveal legend and Checkout match only after Beat 1 cues.
  playCue(s, c, 'opening-restore-key', (d) => s.play(revealLegend.to(1, { duration: d })), {
    after: true,
    dur: 0.7,
  });
  playCue(s, c, 'opening-match-key', (d) => s.play(matchCheckout.to(1, { duration: d })), {
    after: true,
    dur: 0.55,
  });
  playCue(s, c, 'opening-beat-2-focus-1', (d) => s.play(litEncoder.to(1, { duration: d })), {
    dur: 0.55,
  });
  playCue(s, c, 'opening-beat-2-focus-2', (d) => s.play(litConnector.to(1, { duration: d })), {
    dur: 0.55,
  });
  playCue(s, c, 'opening-read-evidence', (d) => s.play(litDecoder.to(1, { duration: d })), {
    dur: 0.55,
  });
}
