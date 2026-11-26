// Scene 29: paired-evaluation: Parcel dock 7 JSON check (Source {"dock":7} OK vs File A {"dock":1} FAIL!) + 100-request trial (Source 90/85 vs File A 95/80) + warm/cold timing.
import {
  COSMOS,
  ROLE,
  aura,
  chipPill,
  group,
  guardedDynamic,
  heroTitle,
  lumBar,
  playCue,
  rect,
  requestedDock,
  routeReplies,
  routingTrial,
  txt,
} from '../parts.mjs';

export default function pairedEvaluation(s, c) {
  const showDock = s.value(0);
  const showTrial = s.value(0);
  const showTiming = s.value(0);

  const bgAura = aura(0, 0, 740, '#14335c28', '#2a162422');
  const title = heroTitle(['Paired Task Evaluation:', 'Valid JSON Can Still Fail the Task'], {
    x: -855,
    y: -430,
    size: 46,
    lineHeight: 54,
    accent: ROLE.err,
  });

  const stageVis = s.value(1);
  const layer = guardedDynamic(stageVis, (alpha) => {
    const dk = showDock.value;
    const tr = showTrial.value;
    const tm = showTiming.value;

    const barX = -460;
    const maxW = 860;

    const nodes = [
      txt(
        `REQUEST: "SEND PARCEL TO DOCK ${requestedDock}"  |  BOTH PARSE AS JSON`,
        -855,
        -220,
        26,
        ROLE.grid,
        'mono',
        'left',
      ).opacity(alpha),

      rect(760, 128, { fill: '#0f2d24', stroke: ROLE.ok, width: 2.8, radius: 12 })
        .at(-430, -110)
        .opacity(alpha),
      txt(
        `${routeReplies[0].name}: ${routeReplies[0].json}`,
        -430,
        -130,
        28,
        COSMOS.ink,
        'mono',
        'center',
      ).opacity(alpha),
      txt('JSON parses  ·  Dock 7 = PASS!', -430, -82, 26, ROLE.ok, 'mono', 'center').opacity(
        alpha * (0.48 + 0.52 * dk),
      ),

      rect(760, 128, { fill: '#321420', stroke: ROLE.err, width: 2.8, radius: 12 })
        .at(430, -110)
        .opacity(alpha),
      txt(
        `${routeReplies[1].name}: ${routeReplies[1].json}`,
        430,
        -130,
        28,
        COSMOS.ink,
        'mono',
        'center',
      ).opacity(alpha),
      txt('JSON parses  ·  Dock 1 = WRONG DOCK!', 430, -82, 26, ROLE.err, 'mono', 'center').opacity(
        alpha * (0.48 + 0.52 * dk),
      ),

      // 100-parcel held-out trial bars
      txt(
        '100 HELD-OUT PARCELS (MIN REQUIRED: 85 CORRECT)',
        -855,
        10,
        26,
        ROLE.gold,
        'mono',
        'left',
      ).opacity(alpha * (0.48 + 0.52 * tr)),

      txt('Source Model', -855, 85, 28, ROLE.ok, 'mono', 'left').opacity(
        alpha * (0.48 + 0.52 * tr),
      ),
      lumBar(barX, 85, (routingTrial.source.correct / 100) * maxW, 38, ROLE.ok, {
        opacity: alpha * (0.48 + 0.52 * tr),
        maxTrackW: maxW,
      }),
      txt(
        `${routingTrial.source.parsed} parse  /  ${routingTrial.source.correct} correct (PASS)`,
        barX + maxW + 24,
        85,
        26,
        ROLE.ok,
        'mono',
        'left',
      ).opacity(alpha * (0.48 + 0.52 * tr)),

      txt('4-Bit File A', -855, 165, 28, ROLE.err, 'mono', 'left').opacity(
        alpha * (0.48 + 0.52 * tr),
      ),
      lumBar(barX, 165, (routingTrial.fileA.correct / 100) * maxW, 38, ROLE.err, {
        opacity: alpha * (0.48 + 0.52 * tr),
        maxTrackW: maxW,
      }),
      txt(
        `${routingTrial.fileA.parsed} parse  /  ${routingTrial.fileA.correct} correct (FAIL!)`,
        barX + maxW + 24,
        165,
        26,
        ROLE.err,
        'mono',
        'left',
      ).opacity(alpha * (0.48 + 0.52 * tr)),

      chipPill(
        tm > 0.35
          ? 'Time warm runs apart from cold load/compile; track TTFT (with queue), ITL gaps & total throughput!'
          : '95% JSON parse hid 15 wrong docks: perplexity & JSON validity never prove task fit',
        0,
        280,
        {
          w: 1620,
          h: 74,
          color: tm > 0.35 ? ROLE.gold : ROLE.err,
          size: 26,
          opacity: alpha,
        },
      ),
    ];

    return group(...nodes);
  });

  s.add(bgAura, title, layer);
  playCue(s, c, 'check-dock', (d) => s.play(showDock.to(0.6, { duration: d })));
  playCue(s, c, 'paired-evaluation-build-0', (d) => s.play(showDock.to(1, { duration: d })));
  playCue(s, c, 'paired-evaluation-build-1', (d) => s.play(showTrial.to(0.3, { duration: d })));
  playCue(s, c, 'paired-source-parse', (d) => s.play(showTrial.to(0.5, { duration: d })));
  playCue(s, c, 'paired-source-task', (d) => s.play(showTrial.to(0.7, { duration: d })));
  playCue(s, c, 'paired-candidate-parse', (d) => s.play(showTrial.to(0.85, { duration: d })));
  playCue(s, c, 'paired-candidate-task', (d) => s.play(showTrial.to(0.95, { duration: d })));
  playCue(s, c, 'paired-conclusion', (d) => s.play(showTrial.to(1, { duration: d })));
  playCue(s, c, 'paired-evaluation-build-2', (d) => s.play(showTiming.to(1, { duration: d })));
}
