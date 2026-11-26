// Scene 03: What should the access assistant do? (P-7 policy pair + withheld verdict + release candidate preview)
import {
  COSMOS,
  aura,
  buildDpoLandscape3d,
  glassCell,
  group,
  guardedDynamic,
  heroTitle,
  orbitScene,
  remainAfterDuration,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function policyContract(s, c) {
  const phase = s.value(0);
  const showClause = s.value(0);
  const revealWinner = s.value(0);
  const showReward = s.value(0);
  const showOutcomes = s.value(0);

  const bgAura = aura(420, 10, 560, '#14385c26', '#3c1b2a16');
  const dpo3d = buildDpoLandscape3d(phase, { x: 430, y: -30, beta: 0.5 });

  const title = heroTitle(['What Should the Access', 'Assistant Do?'], {
    x: -855,
    y: -415,
    size: 56,
    lineHeight: 66,
    accent: COSMOS.gold,
    eyebrow: 'POLICY CONTRACT P-7 · SUPERVISED vs PREFERENCE CONTRAST',
  });

  const live = guardedDynamic(s.value(1), () => {
    const p = phase.value;
    const pulse = 0.72 + 0.28 * Math.sin(p * 3.8);
    const cl = Math.max(0.72, showClause.value);
    const win = revealWinner.value;
    const rw = showReward.value;
    const oc = showOutcomes.value;

    const nodes = [
      // P-7 Clause
      glassCell(-465, -152, 770, 118, COSMOS.gold, {
        fill: '#221c0e',
        glow: 7 * pulse,
        opacity: cl,
      }),
      txt('POLICY P-7 (PRIVILEGED ADMIN MIGRATION)', -815, -182, 26, COSMOS.gold, 'mono', 'left'),
      txt(
        'Cite P-7 and route privileged changes to a reviewer.',
        -815,
        -128,
        28,
        COSMOS.ink,
        'sans',
        'left',
      ),

      // Reply A
      glassCell(-465, 2, 770, 126, win > 0.5 ? COSMOS.emerald : COSMOS.cyan, {
        fill: win > 0.5 ? '#0e2824' : '#101d34',
        glow: win > 0.5 ? 10 * pulse : 4,
      }),
      txt(
        win > 0.5 ? 'REPLY A  ·  CHOSEN (FOLLOWS P-7)' : 'REPLY A',
        -815,
        -28,
        26,
        win > 0.5 ? COSMOS.emerald : COSMOS.cyan,
        'mono',
        'left',
      ),
      txt('Offer to open a reviewer ticket citing P-7.', -815, 24, 28, COSMOS.ink, 'sans', 'left'),

      // Reply B
      glassCell(-465, 160, 770, 126, win > 0.5 ? COSMOS.rose : COSMOS.dim, {
        fill: win > 0.5 ? '#28101a' : '#111626',
        glow: win > 0.5 ? 6 : 3,
      }),
      txt(
        win > 0.5 ? 'REPLY B  ·  REJECTED' : 'REPLY B',
        -815,
        130,
        26,
        win > 0.5 ? COSMOS.rose : COSMOS.muted,
        'mono',
        'left',
      ),
      txt(
        'Go ahead tonight and clean up access tomorrow.',
        -815,
        182,
        28,
        COSMOS.ink,
        'sans',
        'left',
      ),

      // Bottom-left prompt or preference signal
      txt(
        win > 0.5
          ? 'Preference: reviewer chose Ticket A over Grant B'
          : 'Which reply follows policy P-7?  [ A or B ]',
        -855,
        282,
        28,
        win > 0.5 ? COSMOS.emerald : COSMOS.gold,
        'sans',
        'left',
      ),

      // Right 3D header
      txt('3D PREFERENCE MARGIN LANDSCAPE', 430, -375, 26, COSMOS.cyan, 'mono'),

      // Bottom-right candidate ledger (set aside for later release gate)
      glassCell(430, 322, 810, 168, oc > 0.3 ? COSMOS.rose : rw > 0.3 ? COSMOS.gold : COSMOS.dim, {
        fill: '#12182b',
        glow: oc > 0.3 ? 8 * pulse : 4,
        opacity: Math.max(0.75, rw),
      }),
      txt('LATER RELEASE CANDIDATE (HOLD OR SHIP?)', 55, 268, 26, COSMOS.muted, 'mono', 'left'),
      txt(
        rw > 0.2 ? 'REWARD MODEL: +0.31' : 'REWARD MODEL: pending',
        55,
        322,
        28,
        COSMOS.cyan,
        'mono',
        'left',
      ),
      txt(
        oc > 0.2
          ? 'BLIND WINS: 184 / 400 (46%)  ·  +48 TOKENS'
          : 'HUMAN BLIND WINS & LENGTH: pending',
        55,
        372,
        26,
        oc > 0.2 ? COSMOS.rose : COSMOS.dim,
        'mono',
        'left',
      ),
    ];

    return group(...nodes);
  });

  s.add(bgAura, dpo3d, title, live);
  runPhase(s, c, phase, 14);
  orbitScene(s, c, dpo3d, { theta: -0.22, phi: 0.92 });

  c.on('read-policy', () =>
    s.play(showClause.to(1, { duration: remainDuration(c, 'read-policy', 0.55) })),
  );
  c.after('ticket-wins', () =>
    s.play(revealWinner.to(1, { duration: remainAfterDuration(c, 'ticket-wins', 0.48) })),
  );
  c.on('candidate-reward', () =>
    s.play(showReward.to(1, { duration: remainDuration(c, 'candidate-reward', 0.55) })),
  );
  c.on('candidate-outcomes', () =>
    s.play(showOutcomes.to(1, { duration: remainDuration(c, 'candidate-outcomes', 0.55) })),
  );
}
