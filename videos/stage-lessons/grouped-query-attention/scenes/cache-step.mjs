// Scene 17: cache-step - Incremental GQA append: RoPE rotates Q & K (not V), cursor advances, stale write rejected.
import {
  COSMOS,
  ROLE,
  cinemaAtmosphere,
  glowRing,
  glowVector,
  group,
  guardedDynamic,
  heroTitle,
  playCue,
  renderGqaRack2d,
  rule,
  runPhase,
  txt,
} from '../parts.mjs';

export default function cacheStep(s, c) {
  const phase = s.value(0);
  const rackTokens = s.value(1); // Rain at pos 0 -> append fell at pos 1
  const lit = s.value(-1);
  const cursorCol = s.value(-1);
  const rotAngle = s.value(0); // 0 -> pi/4 on 'rotate'

  const reqLen = s.value(1); // 1 -> 2 on c.after('advance')
  const showProject = s.value(0);
  const statusStage = s.value(0); // 0=init, 1=read, 2=stale, 3=reject, 4=own, 5=reorder, 6=parity, 7=chunks

  const title = heroTitle(['Where does this', 'request write?'], {
    x: -855,
    y: -445,
    size: 50,
    lineHeight: 58,
    accent: ROLE.query,
    eyebrow: 'INCREMENTAL DECODE · ROPE & CURSOR SAFETY',
  });

  const live = guardedDynamic(1, () => {
    const a = rotAngle.value;
    const len = Math.round(reqLen.value);
    const proj = showProject.value;
    const st = Math.round(statusStage.value);

    const nodes = [
      ...renderGqaRack2d({
        left: -855,
        top: -215,
        width: 710,
        height: 550,
        mode: 1,
        tokens: rackTokens.value,
        slots: 4,
        lit: lit.value,
        cursor: cursorCol.value,
        phase: phase.value,
        colNames: ['Rain', 'fell', 'p2', 'p3'],
      }),
      rule(-85, -310, -85, 405, COSMOS.rule, 1.6).opacity(0.6),
      txt(
        'TOKEN "fell" AT POSITION 1 · ROPE ROTATION',
        405,
        -265,
        26,
        COSMOS.muted,
        'mono',
        'center',
      ),
    ];

    // Three luminous rotary dials: Query (8H, rotates), Key (2H, rotates), Value (2H, stays 0°)
    const dials = [
      { name: 'Query (8H)', x: 110, col: ROLE.query, rotates: true },
      { name: 'Key (2H)', x: 405, col: ROLE.key, rotates: true },
      { name: 'Value (2H)', x: 700, col: ROLE.value, rotates: false },
    ];
    const dialY = -100;
    const dialR = 88;

    for (const d of dials) {
      const ang = d.rotates ? a : 0;
      const tip = [d.x + Math.cos(ang) * (dialR - 14), dialY - Math.sin(ang) * (dialR - 14)];
      nodes.push(
        glowRing(d.x, dialY, dialR, d.col, { width: 2.6, glow: 7, fillOpacity: 0.1 }),
        glowVector([d.x, dialY], tip, { color: d.col, width: 6, tipSize: 15, glow: 10 }),
        txt(d.name, d.x, dialY + dialR + 38, 28, d.col, 'mono', 'center'),
        txt(
          d.rotates ? (a > 0.1 ? 'RoPE θ₁' : 'pos 1') : 'no RoPE',
          d.x,
          dialY - dialR - 26,
          26,
          d.rotates && a > 0.1 ? ROLE.gold : COSMOS.dim,
          'mono',
          'center',
        ),
      );
    }

    // Request length & cursor telemetry below the dials
    nodes.push(
      rule(20, 75, 795, 75, COSMOS.rule, 1.5).opacity(0.6),
      txt(
        `Valid length: ${len}  ·  Next slot: pos ${len}`,
        405,
        132,
        32,
        len === 2 ? ROLE.gold : COSMOS.ink,
        'mono',
        'center',
      ).glow(len === 2 ? 7 : 0, ROLE.gold),
    );

    // Live append / rejection verdict
    const verdictMap = [
      ['Project fell → 8 queries, 2 compact keys & 2 compact values', COSMOS.muted],
      ['Read positions 0 & 1 (Rain + fell) across all 8 queries', ROLE.query],
      ['Stale retry arrives with cursor = 1 (pointing at fell!)', ROLE.amber],
      ['REJECTED · length is already 2 (expected cursor = 2)', ROLE.alert],
      ['Each request owns its cursor, valid length & physical blocks', ROLE.value],
      ['Scheduler reordering carries request metadata together', ROLE.query],
      ['Verify cached step outputs vs full-prefix logits at each step', ROLE.gold],
      ['Test ragged batches and multi-token chunks for cursor bugs', ROLE.gold],
    ];
    const [vText, vCol] = verdictMap[Math.max(0, Math.min(verdictMap.length - 1, st))];
    nodes.push(
      txt(vText, 405, 224, 28, vCol, st === 3 ? 'mono' : 'sans', 'center').glow(
        st === 3 ? 9 : 0,
        vCol,
      ),
    );

    if (proj > 0.02 && st < 2) {
      nodes.push(
        txt(
          'Old rotated keys stay untouched in cache',
          405,
          305,
          26,
          COSMOS.muted,
          'sans',
          'center',
        ).opacity(proj),
      );
    } else if (st >= 3) {
      nodes.push(
        txt(
          st >= 6
            ? 'Small logit drift near a tie can flip the sampled token'
            : 'In paged / sliding caches, logical position ≠ physical offset',
          405,
          305,
          26,
          COSMOS.muted,
          'sans',
          'center',
        ),
      );
    }

    return group(...nodes);
  });

  s.add(cinemaAtmosphere(ROLE.query, ROLE.alert), title, live);
  runPhase(s, c, phase, 14);

  playCue(s, c, 'project', (d) => s.play(showProject.to(1, { duration: d })), { dur: 0.45 });
  playCue(s, c, 'rotate', (d) => s.play(rotAngle.to(Math.PI / 4, { duration: d })), { dur: 0.75 });
  playCue(s, c, 'write', (d) => s.play(rackTokens.to(2, { duration: d })), {
    after: true,
    dur: 0.6,
  });
  playCue(
    s,
    c,
    'read',
    (d) => s.play(lit.to(2, { duration: d }), statusStage.to(1, { duration: 0.2 })),
    { dur: 0.45 },
  );
  playCue(s, c, 'advance', (d) => s.play(reqLen.to(2, { duration: Math.min(0.25, d) })), {
    after: true,
    dur: 0.3,
  });
  playCue(
    s,
    c,
    'stale',
    (d) =>
      s.play(
        cursorCol.to(1, { duration: 0.2 }),
        statusStage.to(2, { duration: Math.min(0.25, d) }),
      ),
    { dur: 0.35 },
  );
  playCue(s, c, 'reject', (d) => s.play(statusStage.to(3, { duration: Math.min(0.25, d) })), {
    after: true,
    dur: 0.3,
  });
  playCue(
    s,
    c,
    'own',
    (d) => s.play(lit.to(0, { duration: d }), statusStage.to(4, { duration: 0.2 })),
    { dur: 0.4 },
  );
  playCue(s, c, 'reorder', (d) => s.play(statusStage.to(5, { duration: Math.min(0.25, d) })), {
    dur: 0.3,
  });
  playCue(s, c, 'parity', (d) => s.play(statusStage.to(6, { duration: Math.min(0.25, d) })), {
    dur: 0.3,
  });
  playCue(s, c, 'chunks', (d) => s.play(statusStage.to(7, { duration: Math.min(0.25, d) })), {
    dur: 0.3,
  });
}
