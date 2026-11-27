// Scene 22: Keep diagnostic work outside a timing claim: cold compile vs warm load, CI/privacy receipts, level-10 graph dumps.
import {
  COSMOS,
  ROLE,
  aura,
  delay,
  glassCell,
  group,
  guardedDynamic,
  heroTitle,
  line,
  par,
  rect,
  remainAfter,
  remainDuration,
  txt,
} from '../parts.mjs';

export default function startupLogging(s, c) {
  const showStart = s.value(1);
  const staleWarn = s.value(0);
  const showPrivacy = s.value(0);
  const privNote = s.value(0);
  const showDump = s.value(0);
  const dumpClean = s.value(0);

  const bgAura = aura(0, 20, 650, '#fb923c1a', '#5ce1e61a');

  const title = heroTitle(['Keep Diagnostics', 'Outside Timing'], {
    x: -855,
    y: -415,
    size: 56,
    lineHeight: 66,
    accent: ROLE.warn,
    eyebrow: 'JIT STARTUP & LEVEL-10 LOGGING',
  });

  // View 0: Cold compile vs Warm load timelines
  const startView = guardedDynamic(showStart, (a) => {
    const sw = staleWarn.value;
    const nodes = [
      txt(
        'SEPARATE COLD JIT COMPILATION FROM WARM STEADY-STATE EXECUTION',
        0,
        -162,
        26,
        COSMOS.cyan,
        'mono',
      ).opacity(a),

      // Cold bar
      txt('COLD START', -760, -68, 26, ROLE.warn, 'mono', 'left').opacity(a),
      rect(640, 74, { fill: '#331d10', stroke: ROLE.warn, width: 2.6, radius: 8 })
        .at(-230, -68)
        .glow(8, ROLE.warn)
        .opacity(a),
      txt('JIT Compile + Cache', -230, -68, 28, ROLE.warn, 'mono').opacity(a),
      rect(220, 74, { fill: '#122845', stroke: ROLE.r0, width: 2.4, radius: 8 })
        .at(210, -68)
        .opacity(a),
      txt('Load', 210, -68, 26, ROLE.r0, 'mono').opacity(a),
      rect(380, 74, { fill: '#0e3028', stroke: ROLE.good, width: 2.4, radius: 8 })
        .at(520, -68)
        .opacity(a),
      txt('Warm Run', 520, -68, 28, ROLE.good, 'mono').opacity(a),

      // Warm bar
      txt('WARM START', -760, 72, 26, ROLE.good, 'mono', 'left').opacity(a),
      rect(220, 74, { fill: '#122845', stroke: ROLE.r0, width: 2.4, radius: 8 })
        .at(-440, 72)
        .opacity(a),
      txt('Load', -440, 72, 26, ROLE.r0, 'mono').opacity(a),
      rect(380, 74, { fill: '#0e3028', stroke: ROLE.good, width: 2.6, radius: 8 })
        .at(-130, 72)
        .glow(8, ROLE.good)
        .opacity(a),
      txt('Warm Run', -130, 72, 28, ROLE.good, 'mono').opacity(a),

      glassCell(0, 275, 1620, 140, sw > 0.5 ? ROLE.warn : ROLE.r2, {
        fill: '#0e172a',
        glow: sw > 0.5 ? 9 : 5,
        opacity: a,
      }),
      txt(
        'PIN: library · CUDA toolkit · driver · compiler · cache path',
        0,
        245,
        28,
        COSMOS.gold,
        'mono',
      ).opacity(a),
      txt(
        sw > 0.5
          ? 'Stale cache or missing arch wheel alters startup without changing weights'
          : 'Pre-warm every production shape before serving traffic',
        0,
        302,
        28,
        sw > 0.5 ? ROLE.warn : COSMOS.ink,
        'sans',
      ).opacity(a),
    ];

    return group(...nodes);
  });

  // View 1: Ordinary CI vs Preview toolkit + API logs & tensor dump privacy
  const privView = guardedDynamic(showPrivacy, (a) => {
    const pn = privNote.value;
    const nodes = [
      txt(
        'RELEASE RECEIPTS, RUNTIME CI & DIAGNOSTIC DATA POLICY',
        0,
        -155,
        28,
        COSMOS.cyan,
        'mono',
      ).opacity(a),

      glassCell(-440, 35, 740, 235, ROLE.r0, { fill: '#10213d', glow: 8, opacity: a }),
      txt('RUNTIME CI VS PREVIEW TOOLKIT', -440, -32, 26, ROLE.r0, 'mono').opacity(a),
      txt('Separate ordinary CI from preview CUDA', -440, 26, 26, COSMOS.ink, 'sans').opacity(a),
      txt('Record exact combo in release receipt', -440, 84, 26, COSMOS.gold, 'mono').opacity(a),

      glassCell(440, 35, 740, 235, pn > 0.5 ? ROLE.bad : ROLE.warn, {
        fill: pn > 0.5 ? '#2c101b' : '#261b10',
        glow: 9,
        opacity: a,
      }),
      txt('API LOGS & TENSOR DUMPS', 440, -32, 26, ROLE.bad, 'mono').opacity(a),
      txt('Module logs explain dispatch choice', 440, 26, 26, COSMOS.ink, 'sans').opacity(a),
      txt('Dumps can write prompt/output to disk!', 440, 84, 26, ROLE.bad, 'mono').opacity(a),

      glassCell(0, 295, 1620, 118, ROLE.warn, { fill: '#241a10', glow: 8, opacity: a }),
      txt(
        'Treat dump destination and access policy as part of your diagnostic configuration',
        0,
        295,
        28,
        COSMOS.gold,
        'sans',
      ).opacity(a),
    ];

    return group(...nodes);
  });

  // View 2: Level-10 graph dumping adds stream sync + disk write -> disable before timing!
  const dumpView = guardedDynamic(showDump, (a) => {
    const dc = dumpClean.value;
    const nodes = [
      txt('LEVEL-10 GRAPH DUMPING CONFOUNDS REPLAY LATENCY', 0, -162, 28, ROLE.bad, 'mono').opacity(
        a,
      ),

      txt('LEVEL-10 ON', -790, -55, 26, ROLE.bad, 'mono', 'left').opacity(a),
      rect(280, 74, { fill: '#10253a', stroke: ROLE.r2, width: 2.2, radius: 8 })
        .at(-430, -55)
        .opacity(a),
      txt('Replay', -430, -55, 26, COSMOS.ink, 'mono').opacity(a),
      rect(420, 74, { fill: '#33101d', stroke: ROLE.bad, width: 2.8, radius: 8 })
        .at(-65, -55)
        .glow(9, ROLE.bad)
        .opacity(a),
      txt('Stream Sync', -65, -55, 28, ROLE.bad, 'mono').opacity(a),
      rect(480, 74, { fill: '#331c10', stroke: ROLE.warn, width: 2.8, radius: 8 })
        .at(400, -55)
        .glow(9, ROLE.warn)
        .opacity(a),
      txt('Disk Tensor Snapshot', 400, -55, 28, ROLE.warn, 'mono').opacity(a),

      txt('DUMPING OFF', -790, 95, 26, ROLE.good, 'mono', 'left').opacity(a),
      rect(280, 74, { fill: '#0e2d26', stroke: ROLE.good, width: 3.0, radius: 8 })
        .at(-430, 95)
        .glow(dc > 0.5 ? 11 : 5, ROLE.good)
        .opacity(a),
      txt('Replay', -430, 95, 28, ROLE.good, 'mono').opacity(a),
      line([-270, 95], [640, 95], { stroke: COSMOS.dim, width: 2.5, dash: [8, 6] }).opacity(a),
      txt('True warmed serving latency', 185, 148, 28, ROLE.good, 'sans').opacity(a),

      glassCell(0, 290, 1620, 126, dc > 0.5 ? ROLE.good : COSMOS.gold, {
        fill: dc > 0.5 ? '#0e2824' : '#141d34',
        glow: 9,
        opacity: a,
      }),
      txt(
        dc > 0.5
          ? 'Debug with snapshots -> turn dumping OFF -> re-time the same warmed requests'
          : 'A slow level-10 replay includes stream waits and disk snapshot I/O',
        0,
        290,
        28,
        dc > 0.5 ? ROLE.good : COSMOS.gold,
        'mono',
      ).opacity(a),
    ];

    return group(...nodes);
  });

  s.add(bgAura, title, startView, privView, dumpView);

  c.on('fi-startup-logging-0', () =>
    s.play(staleWarn.to(0.1, { duration: remainDuration(c, 'fi-startup-logging-0', 0.25) })),
  );
  c.on('fi-startup-logging-0-result', () =>
    s.play(staleWarn.to(1, { duration: remainDuration(c, 'fi-startup-logging-0-result', 0.4) })),
  );
  c.on('fi-startup-logging-1', () => {
    s.play(
      par(showStart.to(0, { duration: 0.18 }), delay(showPrivacy.to(1, { duration: 0.22 }), 0.2)),
    );
  });
  c.after('fi-startup-logging-1-result', () =>
    s.play(privNote.to(1, { duration: remainAfter(c, 'fi-startup-logging-1-result', 0.35) })),
  );
  c.on('fi-startup-logging-2', () => {
    s.play(
      par(showPrivacy.to(0, { duration: 0.18 }), delay(showDump.to(1, { duration: 0.22 }), 0.2)),
    );
  });
  c.on('fi-startup-logging-2-result', () =>
    s.play(dumpClean.to(1, { duration: remainDuration(c, 'fi-startup-logging-2-result', 0.4) })),
  );
}
