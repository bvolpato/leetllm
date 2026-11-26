// Scene 17: evidence-time: Fixed UTC ruler; wide intervals [105,135] vs [90,270] allow 100s or 180s; narrow [170,190] gives 35s gap.
import {
  COSMOS,
  ROLE,
  aura,
  chipPill,
  glowDot,
  group,
  guardedDynamic,
  heroTitle,
  line,
  playCue,
  rect,
  txt,
} from '../parts.mjs';

export default function evidenceTime(s, c) {
  const showWide = s.value(0);
  const placeBefore = s.value(0);
  const placeAfter = s.value(0);
  const showNarrow = s.value(0);
  const showUtterance = s.value(0);

  const bgAura = aura(0, 0, 760, '#14335c28', '#14383024');
  const title = heroTitle(['Which Event', 'Came First?'], {
    x: -855,
    y: -435,
    size: 50,
    lineHeight: 58,
    accent: ROLE.ok,
  });

  const stageVis = s.value(1);
  const layer = guardedDynamic(stageVis, (alpha) => {
    const wd = showWide.value;
    const p1 = placeBefore.value;
    const p2 = placeAfter.value;
    const nr = showNarrow.value;
    const ut = showUtterance.value;

    // Fixed UTC ruler: 80s to 280s mapped onto [-780, +780]
    const rx = (sec) => -780 + ((sec - 80) / 200) * 1560;
    const rulerY = 125;

    const chartLeft = 90 + 80 * nr; // 90 -> 170
    const chartRight = 270 - 80 * nr; // 270 -> 190
    const riseDotSec = p2 > 0.3 ? 180 : 100;

    const nodes = [
      // UTC ruler line + ticks
      line([rx(80), rulerY], [rx(280), rulerY], { stroke: '#4a628f', width: 3.2 }).opacity(alpha),
      ...[80, 105, 135, 170, 190, 230, 270].flatMap((sec) => [
        line([rx(sec), rulerY - 12], [rx(sec), rulerY + 12], {
          stroke: '#6c85b5',
          width: 2.2,
        }).opacity(alpha),
        txt(`${sec}s`, rx(sec), rulerY + 38, 26, COSMOS.muted, 'mono', 'center').opacity(alpha),
      ]),
      txt('UTC SECONDS AFTER 14:00:00', 0, rulerY + 86, 26, ROLE.vision, 'mono', 'center').opacity(
        alpha,
      ),

      // Deploy interval [105s, 135s] (14:02 +/- 15s)
      txt('Deploy: 14:02 +/- 15s  [105s, 135s]', -780, -256, 28, ROLE.text, 'mono', 'left').opacity(
        alpha,
      ),
      rect(rx(135) - rx(105), 46, {
        fill: '#183766',
        stroke: ROLE.text,
        width: 3,
        radius: 8,
      })
        .at((rx(105) + rx(135)) * 0.5, -148)
        .glow(8, ROLE.text)
        .opacity(alpha),

      // Chart rise interval: wide [90, 270] -> verified [170, 190]
      txt(
        nr > 0.4 ? 'Verified Chart Rise: [170s, 190s]' : 'Chart Rise: 14:03 +/- 90s  [90s, 270s]',
        780,
        -45,
        28,
        ROLE.ok,
        'mono',
        'right',
      ).opacity(alpha),
      rect(rx(chartRight) - rx(chartLeft), 46, {
        fill: '#0f362b',
        stroke: ROLE.ok,
        width: 3,
        radius: 8,
      })
        .at((rx(chartLeft) + rx(chartRight)) * 0.5, 22)
        .glow(8, ROLE.ok)
        .opacity(alpha * (0.65 + 0.35 * wd)),
    ];

    // Strict prediction withholding: show candidate placements only after Beat 1 cues!
    if (p1 > 0.35 && nr < 0.4) {
      nodes.push(
        glowDot(rx(120), -148, { radius: 9, color: ROLE.gold, glow: 14, opacity: alpha }),
        txt('deploy=120s', rx(120), -204, 26, ROLE.gold, 'mono', 'center').opacity(alpha),
        glowDot(rx(riseDotSec), 22, { radius: 9, color: ROLE.warn, glow: 14, opacity: alpha }),
        txt(
          p2 > 0.3 ? 'rise=180s (AFTER)' : 'rise=100s (BEFORE)',
          rx(riseDotSec),
          72,
          26,
          p2 > 0.3 ? ROLE.ok : ROLE.warn,
          'mono',
          'center',
        ).opacity(alpha),
      );
    }

    // Verified 35s gap highlight (135s -> 170s)
    if (nr > 0.45) {
      nodes.push(
        rect(rx(170) - rx(135), 92, {
          fill: '#10352855',
          stroke: ROLE.ok,
          width: 2.6,
          radius: 8,
        })
          .at((rx(135) + rx(170)) * 0.5, -62)
          .opacity(alpha * nr),
        txt('35s GAP', (rx(135) + rx(170)) * 0.5, -62, 30, ROLE.ok, 'mono', 'center')
          .glow(10, ROLE.ok)
          .opacity(alpha * nr),
      );
    }

    // Status verdict + Utterance separation
    const verdict =
      ut > 0.4
        ? '14:22 quote = utterance time; sequence alone does not prove causation'
        : nr > 0.45
          ? '170s > 135s (35s apart) -> STRICT ORDER: AFTER DEPLOY (touching = tie!)'
          : p2 > 0.35
            ? 'Both 100s (before) and 180s (after) fit -> ORDER IS OPEN'
            : p1 > 0.35
              ? 'Yes! Rise at 100s precedes deploy at 120s'
              : 'Look at both intervals: could the rise have happened before the deploy?';

    nodes.push(
      chipPill(verdict, 0, 315, {
        w: 1580,
        h: 72,
        color: ut > 0.4 ? ROLE.audio : nr > 0.45 ? ROLE.ok : p1 > 0.35 ? ROLE.warn : ROLE.gold,
        fill: nr > 0.45 ? '#0f2d24' : '#10182d',
        size: 26,
        glow: nr > 0.45 ? 12 : 6,
        opacity: alpha,
      }),
    );

    return group(...nodes);
  });

  s.add(bgAura, title, layer);
  playCue(s, c, 'clock-wide', (d) => s.play(showWide.to(1, { duration: d })));
  // Strict prediction withholding: reveal 100s & 180s placements only after Beat 1 cues!
  playCue(s, c, 'clock-first-placement', (d) => s.play(placeBefore.to(1, { duration: d })), {
    after: true,
  });
  playCue(s, c, 'clock-other-placement', (d) => s.play(placeAfter.to(1, { duration: d })), {
    after: true,
  });
  playCue(s, c, 'clock-verified', (d) => s.play(showNarrow.to(1, { duration: d })), { dur: 0.9 });
  playCue(s, c, 'clock-utterance', (d) => s.play(showUtterance.to(1, { duration: d })));
}
