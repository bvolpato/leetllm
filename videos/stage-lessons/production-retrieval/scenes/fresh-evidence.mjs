// Scene 22 (fresh-evidence): "What can Luna receive now?"
// Grand finale combining our pure-cinema 2D two-clock eligibility map (13d/47h -> rewind -> 13d/49h
// crossing the 48-hour ceiling) with a live serving-state rack: Bundle C -> Tombstone deletion
// surviving rollback to Bundle B -> discard cached draft & abstain -> rewind -> cited denial [E1]!
import { dynamic, group } from 'vizmatic/stage';
import { renderEligibilityMap } from '../eligibility-map.mjs';
import {
  COSMOS,
  ROLE,
  RULE,
  RUN,
  answerFromEvidence,
  assertEqual,
  callerTag,
  cinemaAtmosphere,
  heroTitle,
  lumBar,
  playCue,
  runPhase,
  statusPill,
  tweenCue,
  txt,
} from '../parts.mjs';

export default function freshEvidence(s, c) {
  const days = RULE.days - 1; // 13
  const hours = RULE.hours - 1; // 47
  const olderSignal = RULE.hours + 1; // 49
  const keySource = RUN.packed.find((item) => item.documentId === 'eu-access');

  const checkCase = (sigH, deletedId) =>
    answerFromEvidence(
      { intent: 'rotation_eligibility', staleDays: days, signalHours: sigH },
      RUN.packed.filter((item) => item.documentId !== deletedId),
    );
  const orig = checkCase(hours, null);
  const del = checkCase(hours, keySource.documentId);
  const over = checkCase(olderSignal, null);
  assertEqual(orig.decision, 'eligible', '13d/47h eligible');
  assertEqual(del.decision, 'abstain', 'deleted abstains');
  assertEqual(over.decision, 'ineligible', '13d/49h ineligible');

  const phase = s.value(0);
  const showPoint = s.value(0);
  const signalHours = s.value(hours);
  const limitsVis = s.value(1);
  // Serving state: 0=Bundle C active, 1=Bundle C tombstoned, 2=Rollback to B (tombstone stays!),
  // 3=Rewound to C before deletion
  const bundleState = s.value(0);
  // Draft state: 0=hidden, 1=cached eligible [E1], 2=discarded, 3=recheck both ages, 4=cited denial [E1]
  const draftState = s.value(0);
  const tombstonePulse = s.value(0);
  // Footer mode: 0=setup, 1=ask cache?, 2=discard & abstain, 3=ask signal?, 4=ineligible [E1]
  const footMode = s.value(0);

  const title = heroTitle(['What Can Luna', 'Receive Now?'], {
    x: -855,
    y: -440,
    size: 54,
    lineHeight: 64,
    accent: ROLE.policy,
    eyebrow: 'TOMBSTONE ACROSS ROLLBACK · FINAL TRANSFER CHECK',
  });

  const live = dynamic(() => {
    const p = phase.value;
    const pulse = 0.8 + 0.2 * Math.sin(p * 3.0);
    const sp = showPoint.value;
    const sh = signalHours.value;
    const lv = limitsVis.value;
    const bs = Math.round(bundleState.value);
    const ds = Math.round(draftState.value);
    const tp = tombstonePulse.value;
    const fm = Math.round(footMode.value);

    const isDeleted = bs === 1 || bs === 2;

    const nodes = [callerTag(1)];

    // Left: Magnified two-clock eligibility map
    const map = renderEligibilityMap({
      x0: -795,
      y0: -195,
      w: 800,
      h: 470,
      staleDays: days,
      signalHours: sh,
      showPoint: sp,
      showDayLimit: lv,
      showHourLimit: lv,
      showRegion: lv,
      pulse,
    });
    nodes.push(...map.nodes);

    // Right: Serving-State Telemetry Rack (4 clean rows)
    const rx = 475;
    const rowW = 760;

    // Row 1: Serving Pointer
    const ptrText = bs === 2 ? 'SERVING BUNDLE:  B  (ROLLED BACK)' : 'SERVING BUNDLE:  C  (ACTIVE)';
    const ptrCol = bs === 2 ? ROLE.warn : ROLE.policy;
    nodes.push(
      lumBar(rx, -172, rowW, 96, {
        color: ptrCol,
        fillAlpha: 0.1,
        strokeWidth: 2.2,
        glow: 7,
        radius: 14,
      }),
      txt('INDEX POINTER', rx - 350, -196, 26, COSMOS.muted, 'mono', 'left'),
      txt(ptrText, rx - 350, -152, 28, ptrCol, 'mono', 'left'),
    );

    // Row 2: External Policy / Tombstone Authority State
    const polCol = isDeleted ? ROLE.danger : ROLE.admitted;
    nodes.push(
      lumBar(rx, -52, rowW, 102, {
        color: polCol,
        fillAlpha: isDeleted ? 0.18 : 0.09,
        strokeWidth: isDeleted ? 2.8 : 2.2,
        glow: (isDeleted ? 12 + tp * 5 : 7) * pulse,
        radius: 14,
      }),
      txt('AUTHORITATIVE STATE (OUTSIDE INDEX)', rx - 350, -78, 26, COSMOS.muted, 'mono', 'left'),
      txt(
        isDeleted ? 'TOMBSTONE: eu-access DELETED' : '[E1] eu-access  ·  PERMITTED & CURRENT',
        rx - 350,
        -32,
        28,
        polCol,
        'mono',
        'left',
      ).glow(isDeleted ? 9 : 5, polCol),
    );

    // Row 3: Live Request Ages
    const displayH = Math.round(sh);
    const overH = displayH > RULE.hours;
    nodes.push(
      lumBar(rx, 70, rowW, 96, {
        color: overH ? ROLE.danger : ROLE.focus,
        fillAlpha: 0.09,
        strokeWidth: 2.2,
        glow: 7,
        radius: 14,
      }),
      txt('REQUEST READINGS', rx - 350, 46, 26, COSMOS.muted, 'mono', 'left'),
      txt(
        `${days} days stale   /   ${displayH} hours signal`,
        rx - 350,
        90,
        30,
        overH ? ROLE.danger : ROLE.focus,
        'mono',
        'left',
      ),
    );

    // Row 4: Cache / Delivery Decision
    const draftInfo = [
      { label: 'CACHE / RESPONSE', text: 'Awaiting cached draft...', col: COSMOS.dim },
      {
        label: 'CACHED DRAFT (FROM C)',
        text: 'eligible   [E1]   (not yet delivered)',
        col: ROLE.request,
      },
      { label: 'CACHE INVALIDATED', text: 'DISCARDED  ->  ABSTAIN', col: ROLE.danger },
      {
        label: 'RECHECKED ON BUNDLE C',
        text: 'Evaluating 13d / 49h against [E1]...',
        col: ROLE.focus,
      },
      {
        label: 'FINAL VERIFIED RESPONSE',
        text: 'INELIGIBLE   [E1]   (49h > 48h)',
        col: ROLE.danger,
      },
    ][Math.max(0, Math.min(4, ds))];

    nodes.push(
      lumBar(rx, 198, rowW, 114, {
        color: draftInfo.col,
        fillAlpha: ds === 2 || ds === 4 ? 0.16 : 0.09,
        strokeWidth: 2.4,
        glow: ds >= 2 ? 10 * pulse : 6,
        radius: 14,
      }),
      txt(draftInfo.label, rx - 350, 170, 26, COSMOS.muted, 'mono', 'left'),
      txt(draftInfo.text, rx - 350, 218, 30, draftInfo.col, 'mono', 'left').glow(
        ds >= 2 ? 8 : 0,
        draftInfo.col,
      ),
    );

    if (bs === 2) {
      const revealed = ds >= 2;
      nodes.push(
        statusPill(
          revealed ? 'ROLLBACK CANNOT RESURRECT DELETED DOC' : 'BUNDLE B STILL HOLDS OLD BYTES',
          rx,
          315,
          {
            color: revealed ? ROLE.danger : ROLE.warn,
            width: revealed ? 680 : 560,
            height: 46,
          },
        ),
      );
    }

    // Discrete bottom verdict (strict prediction withholding on `ask-cache` and `ask-signal`!)
    const footMap = [
      {
        text: '13 days stale, 47-hour signal  ·  Bundle C holds current key policy',
        col: COSMOS.muted,
        font: 'sans',
      },
      {
        text: 'Tombstone deleted policy, rollback restored Bundle B bytes. Send cached draft?',
        col: ROLE.focus,
        font: 'serif',
      },
      {
        text: 'DISCARD & ABSTAIN  ·  external tombstone invalidates cache across rollback',
        col: ROLE.danger,
        font: 'mono',
      },
      {
        text: 'Rewound to Bundle C (13 days, 49-hour signal). What decision & source apply?',
        col: ROLE.focus,
        font: 'serif',
      },
      {
        text: 'INELIGIBLE  [E1]  ·  cited denial (49h > 48h ceiling)  ·  keep this check on hybrid search',
        col: ROLE.danger,
        font: 'mono',
      },
    ];
    const ft = footMap[Math.max(0, Math.min(footMap.length - 1, fm))];
    nodes.push(txt(ft.text, -855, 422, 30, ft.col, ft.font, 'left').glow(fm > 0 ? 7 : 0, ft.col));

    return group(...nodes);
  });

  s.add(cinemaAtmosphere(ROLE.policy, ROLE.danger), title, live);
  runPhase(s, c, phase, 14);

  tweenCue(s, c, 'fresh-ages', showPoint, 1, { dur: 0.5 });
  playCue(s, c, 'cached-draft', () => s.play(draftState.to(1, { duration: 0.001 })), { dur: 0.1 });
  playCue(
    s,
    c,
    'tombstone',
    (d) => s.play(bundleState.to(1, { duration: 0.001 }), limitsVis.to(0, { duration: d })),
    { dur: 0.5 },
  );
  playCue(s, c, 'roll-back', () => s.play(bundleState.to(2, { duration: 0.001 })), { dur: 0.1 });
  playCue(s, c, 'ask-cache', () => s.play(footMode.to(1, { duration: 0.001 })), { dur: 0.1 });
  playCue(
    s,
    c,
    'discard-draft',
    () => s.play(draftState.to(2, { duration: 0.001 }), footMode.to(2, { duration: 0.001 })),
    {
      after: true,
      dur: 0.1,
    },
  );
  tweenCue(s, c, 'no-longer-applies', tombstonePulse, 1, { dur: 0.5 });
  playCue(s, c, 'no-answer', () => s.play(tombstonePulse.to(1, { duration: 0.25 })), {
    after: true,
    dur: 0.25,
  });
  playCue(
    s,
    c,
    'rewind',
    (d) =>
      s.play(
        bundleState.to(3, { duration: 0.001 }),
        draftState.to(1, { duration: 0.001 }),
        limitsVis.to(1, { duration: d }),
        footMode.to(0, { duration: 0.001 }),
      ),
    { dur: 0.5 },
  );
  playCue(
    s,
    c,
    'older-signal',
    (d) =>
      s.play(signalHours.to(olderSignal, { duration: d }), draftState.to(3, { duration: 0.001 })),
    { dur: 0.75 },
  );
  playCue(s, c, 'ask-signal', () => s.play(footMode.to(3, { duration: 0.001 })), { dur: 0.1 });
  playCue(
    s,
    c,
    'fresh-denial',
    () => s.play(draftState.to(4, { duration: 0.001 }), footMode.to(4, { duration: 0.001 })),
    { after: true, dur: 0.1 },
  );
}
