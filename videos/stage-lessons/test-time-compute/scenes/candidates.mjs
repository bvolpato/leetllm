// Scene 02: candidates: [32, 32, 44, 48] -> plurality vote=32 vs verifier=44 -> swap 44->40 -> predict? -> AFTER empty-selection reveal NONE!
import {
  COSMOS,
  ROLE,
  answer,
  aura,
  candidates,
  chipPill,
  group,
  guardedDynamic,
  heroTitle,
  playCue,
  plurality,
  rect,
  txt,
} from '../parts.mjs';

export default function candidatesScene(s, c) {
  const showVerify = s.value(0);
  const swapPool = s.value(0);
  const revealEmpty = s.value(0); // strictly withheld until AFTER empty-selection!

  const bgAura = aura(0, 0, 740, '#14335c28', '#2a162422');
  const title = heroTitle(['Self-Consistency vs Verifier:', 'A Selector Needs a Good Candidate'], {
    x: -855,
    y: -430,
    size: 46,
    lineHeight: 54,
    accent: ROLE.search,
  });

  const stageVis = s.value(1);
  const layer = guardedDynamic(stageVis, (alpha) => {
    const vf = showVerify.value;
    const sw = swapPool.value;
    const em = revealEmpty.value;
    const isSwapped = sw > 0.35;
    const pool = isSwapped ? [32, 32, 40, 48] : candidates;

    const nodes = [
      txt(
        isSwapped
          ? 'MODIFIED POOL [32, 32, 40, 48]  |  TRUE ROOM COUNT = 44'
          : '4 CANDIDATE DRAFTS [32, 32, 44, 48]  |  TRUE ROOM COUNT = 44',
        -855,
        -220,
        26,
        ROLE.search,
        'mono',
        'left',
      ).opacity(alpha),
    ];

    pool.forEach((val, idx) => {
      const cx = -630 + idx * 420;
      const isTrue = val === answer;
      const isSwappedThird = isSwapped && idx === 2;
      const holdingSwap = isSwapped && em <= 0.35;
      const col =
        isTrue && vf > 0.35
          ? ROLE.ok
          : isSwappedThird
            ? holdingSwap
              ? ROLE.gold
              : ROLE.err
            : ROLE.draft;
      nodes.push(
        rect(340, 150, {
          fill:
            isTrue && vf > 0.35
              ? '#0f2d24'
              : isSwappedThird
                ? holdingSwap
                  ? '#261e10'
                  : '#321420'
                : '#101c36',
          stroke: col,
          width: isTrue || isSwappedThird ? 3 : 2.2,
          radius: 12,
        })
          .at(cx, -85)
          .opacity(alpha),
        txt(`Draft ${idx + 1}`, cx, -124, 26, COSMOS.muted, 'mono', 'center').opacity(alpha),
        txt(`${val}`, cx, -76, 44, COSMOS.ink, 'mono', 'center').opacity(alpha),
        txt(
          holdingSwap
            ? 're-checking?'
            : vf > 0.35
              ? isTrue
                ? 'MATCHES 44!'
                : 'fails check'
              : 'unchecked',
          cx,
          -34,
          26,
          holdingSwap ? ROLE.gold : isTrue && vf > 0.35 ? ROLE.ok : ROLE.err,
          'mono',
          'center',
        ).opacity(alpha * (0.48 + 0.52 * vf)),
      );
    });

    nodes.push(
      chipPill(`Plurality vote: ${plurality(pool)} (wrong!)`, -430, 85, {
        w: 760,
        h: 74,
        color: ROLE.gold,
        size: 28,
        opacity: alpha,
      }),
      chipPill(
        isSwapped
          ? em > 0.35
            ? 'Verifier: NONE (0/4 pass!)'
            : 'Verifier: which draft?'
          : vf > 0.35
            ? 'Verifier: Draft 3 (44!)'
            : 'Verifier: pending check',
        430,
        85,
        {
          w: 760,
          h: 74,
          color: isSwapped ? (em > 0.35 ? ROLE.err : ROLE.gold) : ROLE.ok,
          fill: isSwapped && em > 0.35 ? '#321420' : '#0f2d24',
          size: 28,
          glow: 10,
          opacity: alpha,
        },
      ),
      chipPill(
        em > 0.35
          ? 'A selector can only pick from candidates it received; report empty & resample if budget allows!'
          : isSwapped
            ? 'Draft 3 changed from 44 to 40 while room stayed 44: which draft can the checker return?'
            : 'Self-consistency votes on extracted answers; Best-of-N ranks drafts with a verifier or scorer',
        0,
        225,
        {
          w: 1620,
          h: 76,
          color: em > 0.35 ? ROLE.err : ROLE.gold,
          size: 26,
          opacity: alpha,
        },
      ),
    );

    return group(...nodes);
  });

  s.add(bgAura, title, layer);
  playCue(s, c, 'candidate-pool', (d) => s.play(showVerify.to(0, { duration: d })));
  playCue(s, c, 'plurality-vote', (d) => s.play(showVerify.to(0.2, { duration: d })));
  playCue(s, c, 'arithmetic-check', (d) => s.play(showVerify.to(1, { duration: d })));
  playCue(s, c, 'replace-candidate', (d) => s.play(swapPool.to(1, { duration: d })));
  playCue(s, c, 'check-again', (d) => s.play(revealEmpty.to(0, { duration: d })));
  // Strict prediction withholding: reveal NONE only after empty-selection!
  playCue(s, c, 'empty-selection', (d) => s.play(revealEmpty.to(1, { duration: d })), {
    after: true,
  });
  playCue(s, c, 'vote-name', (d) => s.play(revealEmpty.to(1, { duration: d })));
}
