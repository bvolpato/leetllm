// Scene 01: intro: 4 tables x 8 seats = 32 + 12 wall chairs -> predict total? -> AFTER room-total reveal 44 chairs (test-time compute with fixed weights).
import {
  COSMOS,
  ROLE,
  answer,
  aura,
  chipPill,
  extras,
  group,
  guardedDynamic,
  heroTitle,
  playCue,
  rect,
  seats,
  tables,
  txt,
} from '../parts.mjs';

export default function intro(s, c) {
  const showWall = s.value(0);
  const revealTotal = s.value(0); // strictly withheld until AFTER room-total!
  const showFixed = s.value(0);

  const bgAura = aura(0, 0, 740, '#14335c28', '#14383222');
  const title = heroTitle(['Extra Thinking at Inference:', 'What Count Would You Send?'], {
    x: -855,
    y: -430,
    size: 48,
    lineHeight: 56,
    accent: ROLE.search,
  });

  const stageVis = s.value(1);
  const layer = guardedDynamic(stageVis, (alpha) => {
    const wl = showWall.value;
    const rev = revealTotal.value;
    const fx = showFixed.value;

    const nodes = [
      txt(
        'FIRST DRAFT SAID 32 CHAIRS  |  ROOM PLAN: 4 TABLES x 8 SEATS + WALL ROW',
        -855,
        -220,
        26,
        ROLE.search,
        'mono',
        'left',
      ).opacity(alpha),
    ];

    // 4 tables (8 seats each)
    for (let t = 0; t < tables; t++) {
      const cx = -630 + t * 420;
      nodes.push(
        rect(340, 124, { fill: '#10223e', stroke: ROLE.draft, width: 2.8, radius: 12 })
          .at(cx, -100)
          .opacity(alpha),
        txt(`Table ${t + 1}`, cx, -124, 26, ROLE.draft, 'mono', 'center').opacity(alpha),
        txt(`${seats} seats`, cx, -74, 28, COSMOS.ink, 'mono', 'center').opacity(alpha),
      );
    }

    // Wall row (12 extra chairs)
    nodes.push(
      rect(1600, 90, {
        fill: wl > 0.35 ? '#261e10' : '#10182d',
        stroke: wl > 0.35 ? ROLE.gold : ROLE.search,
        width: 2.8,
        radius: 12,
      })
        .at(0, 48)
        .opacity(alpha * (0.5 + 0.5 * wl)),
      txt(
        rev > 0.35
          ? `Wall row: +${extras} extra chairs`
          : 'Extra row of chairs along the wall (+12)',
        0,
        48,
        28,
        ROLE.gold,
        'mono',
        'center',
      ).opacity(alpha * (0.5 + 0.5 * wl)),

      // Answer pill (withheld until room-total!)
      chipPill(
        rev > 0.35
          ? `VERIFIED COUNT: 32 + 12 = ${answer} CHAIRS!`
          : '4 tables x 8 + wall row -> What count would you send?',
        0,
        190,
        {
          w: 1200,
          h: 80,
          color: rev > 0.35 ? ROLE.ok : ROLE.gold,
          fill: rev > 0.35 ? '#0f2d24' : '#261e10',
          size: 30,
          glow: 12,
          opacity: alpha,
        },
      ),
      txt(
        fx > 0.35
          ? 'Test-time compute: weights stay frozen while extra checks or 4 drafts improve the reply'
          : 'Checking the room catches the missing wall row before replying to the organizer',
        0,
        305,
        26,
        fx > 0.35 ? ROLE.search : COSMOS.muted,
        'sans',
        'center',
      ).opacity(alpha),
    );

    return group(...nodes);
  });

  s.add(bgAura, title, layer);
  playCue(s, c, 'first-draft', (d) => s.play(showWall.to(0, { duration: d })));
  playCue(s, c, 'chair-tables', (d) => s.play(showWall.to(0.2, { duration: d })));
  playCue(s, c, 'extra-chairs', (d) => s.play(showWall.to(1, { duration: d })));
  playCue(s, c, 'send-question', (d) => s.play(revealTotal.to(0, { duration: d })));
  playCue(s, c, 'table-subtotal', (d) => s.play(showWall.to(1, { duration: d })));
  playCue(s, c, 'include-wall', (d) => s.play(showWall.to(1, { duration: d })));
  // Strict prediction withholding: reveal 44 only after room-total!
  playCue(s, c, 'room-total', (d) => s.play(revealTotal.to(1, { duration: d })), { after: true });
  playCue(s, c, 'fixed-weight-work', (d) => s.play(showFixed.to(1, { duration: d })));
}
