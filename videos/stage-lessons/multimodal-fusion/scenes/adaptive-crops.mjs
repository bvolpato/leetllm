// Scene 15: adaptive-crops: Global thumbnail + top-k local crops (3 slots -> 1,728 features, 2 slots drops badge) + video 128 states.
import {
  COSMOS,
  CROP_CANDIDATES,
  ROLE,
  VISUAL_TOKENS_336,
  aura,
  chipPill,
  group,
  guardedDynamic,
  heroTitle,
  lumBar,
  playCue,
  rect,
  txt,
} from '../parts.mjs';

export default function adaptiveCrops(s, c) {
  const showQuestion = s.value(0);
  const showRanked = s.value(0);
  const showTwoSlots = s.value(0);
  const showVideo = s.value(0);

  const bgAura = aura(0, 0, 760, '#14335c28', '#2a163824');
  const title = heroTitle(['Which Details', 'Get a View?'], {
    x: -855,
    y: -435,
    size: 50,
    lineHeight: 58,
    accent: ROLE.gold,
  });

  const stageVis = s.value(1);
  const layer = guardedDynamic(stageVis, (alpha) => {
    const q = showQuestion.value;
    const rnk = showRanked.value;
    const two = showTwoSlots.value;
    const vid = showVideo.value;

    const toneMap = {
      blue: ROLE.text,
      yellow: ROLE.gold,
      pink: ROLE.warn,
      muted: COSMOS.muted,
    };

    const nodes = [
      // Left: Candidate saliency scores
      txt('CANDIDATE REGIONS & SCORES', -855, -240, 26, ROLE.vision, 'mono', 'left').opacity(alpha),
      ...CROP_CANDIDATES.flatMap((cand, idx) => {
        const y = -155 + idx * 96;
        const col = toneMap[cand.tone] ?? ROLE.vision;
        const isGlobal = cand.name === 'global';
        return [
          txt(cand.label, -855, y, 28, col, 'mono', 'left').opacity(alpha),
          lumBar(-520, y, Math.max(12, cand.score * 320), 28, col, {
            opacity: alpha,
            maxTrackW: 320,
          }),
          txt(
            isGlobal ? 'RESERVED' : cand.score.toFixed(2),
            -175,
            y,
            26,
            isGlobal ? ROLE.text : col,
            'mono',
            'left',
          ).opacity(alpha),
        ];
      }),

      // Right: Fixed Slot Column (strictly withholding answers until crop-ranked / crop-two-slots!)
      txt(
        two > 0.4 ? 'BUDGET CAP = 2 VIEWS' : 'BUDGET CAP = 3 VIEWS',
        455,
        -240,
        28,
        two > 0.4 ? ROLE.warn : ROLE.gold,
        'mono',
        'center',
      ).opacity(alpha),
      chipPill('Slot 1: Global Thumbnail (reserved)', 455, -155, {
        w: 690,
        h: 72,
        color: ROLE.text,
        fill: '#122446',
        size: 26,
        glow: 8,
        opacity: alpha,
      }),
      chipPill(rnk > 0.4 ? 'Slot 2: Time Axis  (0.96)' : 'Slot 2:  [ ? predict ]', 455, -60, {
        w: 690,
        h: 72,
        color: rnk > 0.4 ? ROLE.gold : '#384c76',
        fill: rnk > 0.4 ? '#2c2210' : '#10182d',
        size: 26,
        glow: rnk > 0.4 ? 12 : 4,
        opacity: alpha,
      }),
      chipPill(
        two > 0.4
          ? 'Slot 3: REMOVED -> Badge Lost!'
          : rnk > 0.4
            ? 'Slot 3: Paging Badge  (0.85)'
            : 'Slot 3:  [ ? predict ]',
        455,
        35,
        {
          w: 690,
          h: 72,
          color: two > 0.4 ? ROLE.warn : rnk > 0.4 ? ROLE.ok : '#384c76',
          fill: two > 0.4 ? '#2c1422' : rnk > 0.4 ? '#0f2d24' : '#10182d',
          size: 26,
          glow: two > 0.4 || rnk > 0.4 ? 12 : 4,
          opacity: alpha,
        },
      ),
      txt(
        two > 0.4
          ? 'Escalate to slow OCR route or abstain!'
          : rnk > 0.4
            ? `3 views = ${3 * VISUAL_TOKENS_336} raw features (keep crop coords!)`
            : q > 0.2
              ? 'Which two local crops win slots 2 and 3?'
              : 'Reserve slot 1 for global layout',
        455,
        125,
        26,
        two > 0.4 ? ROLE.warn : rnk > 0.4 ? ROLE.ok : ROLE.gold,
        'sans',
        'center',
      ).opacity(alpha),

      // Bottom: Qwen2.5-VL 2x2 merge + video clip frame growth (32 -> 128 states)
      txt(
        'QWEN2.5-VL 2x2 MERGE (4x CUT)  |  VIDEO BRIDGE: 32 STATES / FRAME',
        -855,
        220,
        26,
        vid > 0.3 ? ROLE.vision : COSMOS.muted,
        'mono',
        'left',
      ).opacity(alpha * (0.55 + 0.45 * vid)),
      ...Array.from({ length: 4 }, (_, i) => {
        const active = i === 0 || vid > 0.25 + i * 0.16;
        return rect(240, 62, {
          fill: active ? '#10283d' : '#0f1629',
          stroke: active ? ROLE.vision : '#2e3f69',
          width: active ? 2.6 : 1.6,
          radius: 10,
        })
          .at(-735 + i * 270, 295)
          .opacity(alpha * (active ? 1 : 0.45));
      }),
      ...Array.from({ length: 4 }, (_, i) =>
        txt(`Frame ${i + 1}: 32`, -735 + i * 270, 295, 26, COSMOS.ink, 'mono', 'center').opacity(
          alpha * (i === 0 || vid > 0.25 + i * 0.16 ? 1 : 0.45),
        ),
      ),
      txt(
        vid > 0.4 ? '= 128 states (bound clip window!)' : '= 32 states (1 frame)',
        245,
        295,
        28,
        vid > 0.4 ? ROLE.gold : COSMOS.muted,
        'mono',
        'left',
      ).opacity(alpha),
    ];

    return group(...nodes);
  });

  s.add(bgAura, title, layer);
  playCue(s, c, 'crop-rank-question', (d) => s.play(showQuestion.to(1, { duration: d })));
  // Strict prediction withholding: reveal Axis + Badge only after crop-ranked!
  playCue(s, c, 'crop-ranked', (d) => s.play(showRanked.to(1, { duration: d })), { after: true });
  // Strict prediction withholding: reveal dropped badge only after crop-two-slots!
  playCue(s, c, 'crop-two-slots', (d) => s.play(showTwoSlots.to(1, { duration: d })), {
    after: true,
  });
  playCue(s, c, 'crop-more-frames', (d) => s.play(showVideo.to(1, { duration: d })), { dur: 0.9 });
}
