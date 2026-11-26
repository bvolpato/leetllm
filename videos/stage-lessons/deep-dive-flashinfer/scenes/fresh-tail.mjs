// Scene 28: One last slot (Transfer Finale): 8-slot pages [9, 2], length 15->16, reader busy @12 -> done @14 -> handoff + DeepGEMM bridge!
import {
  COSMOS,
  ROLE,
  aura,
  buildPagedKvRig3d,
  glassCell,
  group,
  guardedDynamic,
  heroTitle,
  line,
  orbitScene,
  remainAfter,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function freshTail(s, c) {
  const phase = s.value(0);
  const entryVal = s.value(1);
  const slotVal = s.value(2);

  const appended = s.value(0); // slot 7 of page 2 filled (15 -> 16)
  const askBoth = s.value(0); // prediction hold!
  const revLen16 = s.value(0); // strictly withheld until fi-fresh-tail-length!
  const revPlanShort = s.value(0); // strictly withheld until fi-fresh-tail-plan!
  const revKeepP9 = s.value(0); // strictly withheld until fi-fresh-tail-lease!
  const planRefreshed = s.value(0); // fi-fresh-tail-refresh
  const cancelled = s.value(0); // fresh-cancel
  const readerTick = s.value(12); // 12 -> 14 on fi-fresh-tail-complete
  const handedOff = s.value(0); // fresh-owner
  const newKeyWritten = s.value(0); // fresh-handoff

  const bgAura = aura(445, 20, 540, '#6ee7b722', '#ffd1661a');
  const { view: kv3d } = buildPagedKvRig3d(entryVal, slotVal, phase, {
    x: 455,
    y: 20,
    unit: 100,
    occupiedCounts: [4, 4, 4],
  });

  const title = heroTitle(['One Last Slot:', 'Plan & Lease Transfer'], {
    x: -855,
    y: -415,
    size: 54,
    lineHeight: 64,
    accent: ROLE.good,
    eyebrow: 'FINALE TRANSFER · 8-SLOT PAGES [9, 2]',
    subtitle: 'Page 9 holds 8 keys; Page 2 holds 7 -> append 1 key',
  });

  const live = guardedDynamic(1, () => {
    const p = phase.value;
    const app = appended.value > 0.5;
    const ask = askBoth.value > 0.5;
    const rl = revLen16.value > 0.5;
    const rp = revPlanShort.value > 0.5;
    const rk = revKeepP9.value > 0.5;
    const pr = planRefreshed.value > 0.5;
    const cn = cancelled.value > 0.5;
    const tk = readerTick.value;
    const ho = handedOff.value > 0.5;
    const nk = newKeyWritten.value > 0.5;
    const pulse = 0.72 + 0.28 * Math.sin(p * 3.8);

    const done14 = tk >= 13.9;

    const nodes = [
      txt('3D PAGED CACHE HANDOFF RIG', 455, -405, 26, COSMOS.cyan, 'mono').glow(5, COSMOS.cyan),
      txt(
        nk
          ? 'Next: DeepGEMM -> expert groups & padding'
          : ho
            ? 'Page 9 cleanly handed to new request'
            : 'Plan boundary & reader event move independently',
        455,
        420,
        26,
        nk ? COSMOS.gold : ho ? ROLE.good : COSMOS.muted,
        'sans',
      ),
    ];

    // Left-top: Page 9 (8 keys) and Page 2 (7 -> 8 slots)
    const p9Col = nk ? COSMOS.gold : ho ? ROLE.good : cn ? ROLE.warn : ROLE.r0;
    nodes.push(
      glassCell(-660, -112, 400, 124, p9Col, {
        fill: nk ? '#2a2110' : ho ? '#0e2824' : '#10213d',
        glow: ho || nk ? 10 * pulse : 6,
      }),
      txt('PAGE 9 (8 SLOTS)', -660, -142, 26, p9Col, 'mono'),
      txt(
        nk
          ? 'NEW REQ: k0 in s0!'
          : ho
            ? 'OWNED BY NEW REQ'
            : cn
              ? 'CANCELLED · BUSY'
              : '8 full keys (k0..k7)',
        -660,
        -86,
        26,
        COSMOS.ink,
        'mono',
      ),

      glassCell(-228, -112, 426, 124, app ? (pr ? ROLE.good : COSMOS.gold) : ROLE.r2, {
        fill: app ? (pr ? '#0e2824' : '#261e10') : '#0f2336',
        glow: app ? 10 * pulse : 5,
      }),
      txt('PAGE 2 (8 SLOTS)', -228, -142, 26, ROLE.r2, 'mono'),
      txt(
        app ? 'k8..k14 + k15 (8/8)' : 'k8..k14 + open (7/8)',
        -228,
        -86,
        26,
        app ? COSMOS.gold : COSMOS.ink,
        'mono',
      ),
    );

    // Middle-left: Plan Coverage bar vs Live Length
    const planLabel = pr
      ? 'PLAN EXTENDED: covers 16 keys'
      : rp
        ? 'OLD PLAN = 15 keys (STOPS 1 SHORT!)'
        : rl
          ? 'NEW LENGTH = 16 · old plan = 15'
          : 'OLD PLAN: covers 15 keys';
    const planCol = pr ? ROLE.good : rp ? ROLE.bad : COSMOS.cyan;

    nodes.push(
      glassCell(-440, 34, 855, 110, planCol, {
        fill: pr ? '#0e2824' : rp ? '#2c101b' : '#101d35',
        glow: pr || rp ? 9 : 5,
      }),
      txt('PLAN COVERAGE BOUNDARY', -440, 8, 26, COSMOS.muted, 'mono'),
      txt(planLabel, -440, 56, 28, planCol, 'mono').glow(5, planCol),
    );

    // Lower-left: Separate GPU Reader Lease Clock (tick 12 -> 14)
    const mapTk = (v) => -790 + ((v - 10) / 5) * 680; // ticks 10..15
    const curX = mapTk(Math.min(15, Math.max(10, tk)));
    const evX = mapTk(14);
    const leaseCol = done14 ? ROLE.good : rk ? ROLE.warn : COSMOS.cyan;

    nodes.push(
      glassCell(-440, 196, 855, 146, leaseCol, { fill: '#0e172a', glow: 7 }),
      txt(
        done14
          ? 'GPU READER: DONE @ 14 -> PAGE 9 FREE!'
          : rk
            ? 'GPU READER: BUSY @ 12 -> KEEP UNTIL 14'
            : 'GPU READER (PAGE 9): tick 12 · active',
        -440,
        152,
        26,
        leaseCol,
        'mono',
      ),
      line([-790, 208], [-110, 208], { stroke: COSMOS.rule, width: 3.5 }),
      line([evX, 190], [evX, 224], { stroke: ROLE.good, width: 3.5 }).glow(7, ROLE.good),
      line([curX, 192], [curX, 224], { stroke: COSMOS.gold, width: 4.5 }).glow(9, COSMOS.gold),
      ...(done14
        ? [txt('t = 14 (done)', evX, 250, 26, ROLE.good, 'mono')]
        : [
            txt('event 14', evX, 250, 26, ROLE.good, 'mono'),
            txt(`t=${tk.toFixed(0)}`, Math.min(curX, evX - 140), 250, 26, COSMOS.gold, 'mono'),
          ]),
    );

    // Bottom prediction / resolution strip (2 concise lines strictly inside 855px box!)
    let fCol = COSMOS.gold;
    let fLine1 = 'Predict: how many keys must next plan cover?';
    let fLine2 = 'Can allocator reuse Page 9 at tick 12?';
    if (!ask) {
      if (app) {
        fCol = COSMOS.gold;
        fLine1 = 'Appended 1 key into Page 2 last slot · tick 12 read active';
        fLine2 = 'Old plan still covers 15 keys';
      } else {
        fCol = ROLE.r2;
        fLine1 = 'Pages [9, 2] · 8 slots/page (8 + 7 = 15)';
        fLine2 = 'Current plan covers those 15 keys';
      }
    } else if (rl && !pr) {
      fCol = ROLE.warn;
      fLine1 = rk ? 'Length = 16 (old plan stops 1 short)' : 'New length = 16 (address unchanged)';
      fLine2 = rk
        ? 'Keep Page 9: earlier reader finishes at 14'
        : 'Last slot on Page 2 is now occupied';
    } else if (pr && !done14) {
      fCol = COSMOS.cyan;
      fLine1 = cn ? 'Launch cancelled -> host claim released' : 'Wrapper updates plan to 16 keys';
      fLine2 = cn ? 'Earlier GPU read still holds Page 9' : 'Update happens outside next launch';
    } else if (done14 && !nk) {
      fCol = ROLE.good;
      fLine1 = ho
        ? 'Zero claims left -> allocator hands Page 9'
        : 'Tick 14: last GPU reader finishes';
      fLine2 = ho ? 'New request receives Page 9 safely' : 'No remaining owner or reader claim';
    } else if (nk) {
      fCol = ROLE.good;
      fLine1 = 'New request writes safely into Page 9 slot 0';
      fLine2 = 'Next: DeepGEMM (expert groups & padding)';
    }

    nodes.push(
      glassCell(-440, 362, 855, 122, fCol, { fill: '#0e172a', glow: 9 }),
      txt(fLine1, -440, 336, 26, fCol, 'sans'),
      txt(fLine2, -440, 384, 26, COSMOS.ink, 'sans'),
    );

    return group(...nodes);
  });

  s.add(bgAura, kv3d, title, live);
  runPhase(s, c, phase, 14);
  orbitScene(s, c, kv3d, { theta: -0.2, phi: 0.92 });

  c.on('fresh-append', () => {
    s.play(appended.to(1, { duration: remainDuration(c, 'fresh-append', 0.45) }));
    s.play(slotVal.to(3, { duration: remainDuration(c, 'fresh-append', 0.45) }));
  });
  c.on('fresh-question', () =>
    s.play(askBoth.to(1, { duration: remainDuration(c, 'fresh-question', 0.35) })),
  );
  c.after('fi-fresh-tail-length', () =>
    s.play(revLen16.to(1, { duration: remainAfter(c, 'fi-fresh-tail-length', 0.35) })),
  );
  c.after('fi-fresh-tail-plan', () =>
    s.play(revPlanShort.to(1, { duration: remainAfter(c, 'fi-fresh-tail-plan', 0.35) })),
  );
  c.after('fi-fresh-tail-lease', () =>
    s.play(revKeepP9.to(1, { duration: remainAfter(c, 'fi-fresh-tail-lease', 0.35) })),
  );
  c.on('fi-fresh-tail-refresh', () =>
    s.play(planRefreshed.to(1, { duration: remainDuration(c, 'fi-fresh-tail-refresh', 0.4) })),
  );
  c.on('fresh-cancel', () =>
    s.play(cancelled.to(1, { duration: remainDuration(c, 'fresh-cancel', 0.4) })),
  );
  c.after('fi-fresh-tail-complete', () =>
    s.play(readerTick.to(14, { duration: remainAfter(c, 'fi-fresh-tail-complete', 0.45) })),
  );
  c.on('fresh-owner', () => {
    s.play(handedOff.to(1, { duration: remainDuration(c, 'fresh-owner', 0.4) }));
    s.play(entryVal.to(0, { duration: remainDuration(c, 'fresh-owner', 0.45) }));
    s.play(slotVal.to(0, { duration: remainDuration(c, 'fresh-owner', 0.45) }));
  });
  c.on('fresh-handoff', () =>
    s.play(newKeyWritten.to(1, { duration: remainDuration(c, 'fresh-handoff', 0.4) })),
  );
}
