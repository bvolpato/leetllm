// Scene 13: acceptance-race - Between paint and Tab
// 3 replays of the same 15-char ghost: (1) unchanged Tab inserts 15 chars, (2) policy changes before Tab
// -> STRICT prediction pause -> inserts NOTHING, (3) typing "all" rebases remaining "ows(request)" at col 26!
import { group, line } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  aura,
  cinemaHeader,
  clampDur,
  driftValue,
  glowDot,
  guardedDynamic,
  txt,
} from '../parts.mjs';

export default function acceptanceRace(s, c) {
  const phase = s.value(0);
  const policyChg = s.value(0);
  const emptyReveal = s.value(0); // STRICT after tab-empty!
  const rebaseOn = s.value(0);

  const header = cinemaHeader('ATOMIC ACCEPTANCE CHECK', 'Between paint', 'and pressing Tab', {
    x: -860,
    y: -445,
    accent: ROLE.ok,
    size: 48,
  });

  const bgAura = aura(40, 20, 680, '#6ee7b71a', '#f59e0b16');

  const view = guardedDynamic(
    () => 1,
    () => {
      const p = phase.value;
      const pc = policyChg.value;
      const em = emptyReveal.value;
      const rb = rebaseOn.value;
      const nodes = [];

      const lx = -820;

      // Case 1: Matching Tab -> inserts 15 chars
      nodes.push(
        txt('REPLAY 1: UNCHANGED SNAPSHOT + TAB', lx, -185, 26, ROLE.ok, 'mono', 'left'),
        txt(
          '  inserts 15 chars -> is_allowed = graph.allows(request)|',
          lx,
          -132,
          26,
          COSMOS.ink,
          'mono',
          'left',
        ),
      );

      // Case 2: Policy changes between paint & Tab -> STRICT withholding until tab-empty!
      const c2Alpha = 0.45 + pc * 0.55;
      nodes.push(
        txt(
          'REPLAY 2: POLICY CHANGES BEFORE TAB (BUFFER & CARET UNCHANGED)',
          lx,
          -42,
          26,
          ROLE.warn,
          'mono',
          'left',
        ).opacity(c2Alpha),
        txt(
          em > 0.4
            ? '  INSERTS NOTHING (0 CHARS): policy change cleared ghost! Re-check atomically at Tab!'
            : pc > 0.4
              ? '  WHAT WILL TAB INSERT?  [ ? ]'
              : '  waiting for Tab...',
          lx,
          12,
          26,
          em > 0.4 ? ROLE.fail : ROLE.focus,
          'mono',
          'left',
        )
          .glow(em > 0.4 ? 7 : 0, ROLE.fail)
          .opacity(c2Alpha),
      );

      // Case 3: Matching typed prefix ("all") -> rebase remainder to col 26 + new version!
      const c3Alpha = 0.35 + rb * 0.65;
      nodes.push(
        txt(
          'REPLAY 3: USER TYPES MATCHING PREFIX "all"',
          lx,
          102,
          26,
          ROLE.ed,
          'mono',
          'left',
        ).opacity(c3Alpha),
        txt(
          '  verify prefix match -> move start to col 26 -> bind "ows(request)" to new doc version!',
          lx,
          156,
          26,
          ROLE.ok,
          'mono',
          'left',
        ).opacity(c3Alpha),
      );

      // Bottom prompt / atomic invariant
      const botY = 290;
      nodes.push(
        line([-840, 225], [840, 225], { stroke: '#25355a', width: 2 }).opacity(0.65),
        txt(
          pc > 0.35 && em < 0.35
            ? 'Policy changed after paint while buffer stayed put. What will Tab insert?'
            : 'Real editor applies edit against checked version & range in ONE atomic operation',
          0,
          botY,
          pc > 0.35 && em < 0.35 ? 32 : 26,
          pc > 0.35 && em < 0.35 ? ROLE.focus : COSMOS.muted,
          pc > 0.35 && em < 0.35 ? 'serif' : 'mono',
          'center',
        ),
        txt('CHECK TWICE', 480, -425, 26, ROLE.focus, 'mono', 'center'),
        txt('At paint AND atomically at Tab', 480, -378, 26, ROLE.ok, 'mono', 'center'),
        glowDot(-780 + ((p * 110) % 220), 435, {
          radius: 4.5,
          color: ROLE.ok,
          glow: 8,
          opacity: 0.7,
        }),
      );

      return group(...nodes);
    },
  );

  s.add(bgAura, header, view);
  driftValue(s, c, phase, 4.4);

  c.on('tab-policy', () => {
    s.play(policyChg.to(1, { duration: clampDur(c, c.cue('tab-policy').start, 0.35) }));
  });
  c.after('tab-empty', () => {
    s.play(emptyReveal.to(1, { duration: clampDur(c, c.cue('tab-empty').end, 0.35) }));
  });
  c.on('tab-rebase', () => {
    s.play(rebaseOn.to(1, { duration: clampDur(c, c.cue('tab-rebase').start, 0.4) }));
  });
}
