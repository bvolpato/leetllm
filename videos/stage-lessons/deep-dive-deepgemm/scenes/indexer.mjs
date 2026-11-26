// Scene 15: A score column needs its source position.
// MQA weighted ReLU: k=[2,-1]*0.5=[1,-0.5], q_0=[1,0], q_1=[0,1] -> dots [1,-0.5] -> ReLU [1,0] -> 0.4;
// Compressed row [0.2, 0.9, 99] for span [40, 42): sentinel 99 trap -> restrict -> 40 + 1 = token 41.
import {
  COSMOS,
  INDEXER_REF,
  ROLE,
  aura,
  buildIndexerTower3d,
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

export default function indexer(s, c) {
  const phase = s.value(0);
  const maskVal = s.value(0); // 0 = sentinel 99 towering, 1 = masked off
  const step = s.value(0); // 1=dequant+dots, 2=ReLU+0.4, 3=compressed span, 4=sentinel trap, 5=restrict+offset, 6=token 41

  const bgAura = aura(445, 20, 520, '#6ee7b720', '#ff6b8b1a');
  const { view: idx3d } = buildIndexerTower3d(maskVal, phase, { x: 455, y: 15, unit: 94 });

  const title = heroTitle(['A Score Column Needs', 'Its Source Position'], {
    x: -860,
    y: -420,
    size: 56,
    lineHeight: 66,
    accent: ROLE.good,
    eyebrow: 'LIGHTNING INDEXER · MQA LOGITS',
    subtitle: 'Weighted-ReLU scoring + valid span masking + offset mapping',
  });

  const live = guardedDynamic(1, () => {
    const st = step.value;
    const masked = st >= 4.5;
    const nodes = [
      txt('3D INDEXER SCORE & SPAN GATE', 455, -415, 26, COSMOS.cyan, 'mono').glow(5, COSMOS.cyan),
      txt(
        'Gold gate = valid span [0, 2) · Red = unwritten slot 2',
        455,
        435,
        26,
        COSMOS.muted,
        'sans',
      ),
    ];

    // Top panel: Tiny weighted-ReLU reference (0.4)
    nodes.push(
      txt('TINY WEIGHTED-RELU REFERENCE', -860, -172, 26, ROLE.c, 'mono', 'left'),
      glassCell(-725, -92, 262, 96, st >= 0.6 ? ROLE.a : COSMOS.dim, {
        fill: '#101d36',
        glow: st >= 0.6 ? 7 : 0,
      }),
      txt('k = [1, -0.5]', -725, -112, 26, ROLE.a, 'mono'),
      txt('dots [1, -0.5]', -725, -72, 26, COSMOS.ink, 'mono'),

      glassCell(-455, -92, 248, 96, st >= 1.6 ? ROLE.scale : COSMOS.dim, {
        fill: '#1e1536',
        glow: st >= 1.6 ? 8 : 0,
      }),
      txt('ReLU [1, 0]', -455, -112, 26, ROLE.scale, 'mono'),
      txt('w = [0.4, 0.6]', -455, -72, 26, COSMOS.muted, 'mono'),

      glassCell(-190, -92, 244, 96, st >= 1.6 ? ROLE.good : COSMOS.dim, {
        fill: '#0e2620',
        glow: st >= 1.6 ? 9 : 0,
      }),
      txt('INDEXER SCORE', -190, -112, 26, COSMOS.muted, 'mono'),
      txt(st >= 1.6 ? `${INDEXER_REF.score.toFixed(1)}` : '...', -190, -72, 34, ROLE.good, 'mono'),
    );

    // Compressed score row [0.2, 0.9, 99] for valid span [40, 42)
    if (st >= 2.6) {
      nodes.push(
        txt('COMPRESSED ROW · VALID SPAN [40, 42)', -860, 14, 26, ROLE.gold, 'mono', 'left'),
      );
      const cols = [
        { c: 0, val: '0.2', valid: true, x: -725 },
        { c: 1, val: '0.9', valid: true, x: -460 },
        { c: 2, val: '99', valid: false, x: -195 },
      ];
      cols.forEach((item) => {
        const isWrongPick = !masked && st >= 3.6 && item.c === 2;
        const isWinner = masked && item.c === 1;
        const border = isWinner
          ? ROLE.good
          : isWrongPick
            ? ROLE.bad
            : item.valid
              ? ROLE.c
              : COSMOS.dim;
        nodes.push(
          glassCell(item.x, 106, 238, 108, border, {
            fill: isWinner ? '#0f2b22' : isWrongPick ? '#2e111f' : '#0e172a',
            glow: isWinner || isWrongPick ? 10 : 4,
            dash: !item.valid && masked ? [7, 5] : undefined,
            opacity: !item.valid && masked ? 0.45 : 0.94,
          }),
          txt(`col ${item.c}`, item.x, 72, 26, COSMOS.muted, 'mono'),
          txt(
            item.val,
            item.x,
            110,
            34,
            isWinner ? ROLE.good : isWrongPick ? ROLE.bad : COSMOS.ink,
            'mono',
          ),
          txt(
            item.valid ? `cache ${40 + item.c}` : masked ? 'EXCLUDED' : 'OUT OF SPAN',
            item.x,
            144,
            26,
            item.valid ? ROLE.c : ROLE.bad,
            'mono',
          ),
        );
      });
    }

    // Mapping result bar
    if (st >= 3.6) {
      const msg =
        st >= 5.6
          ? 'Valid col 1 + offset 40 -> cache token 41'
          : masked
            ? 'Restrict [0, 2) -> col 1 (0.9) + start 40'
            : 'Unrestricted max picks col 2 (99): invalid!';
      const col = st >= 5.6 ? ROLE.good : masked ? ROLE.gold : ROLE.bad;
      nodes.push(
        glassCell(-460, 265, 800, 84, col, { fill: '#0e1d2a', glow: 9 }),
        txt(msg, -460, 265, 26, col, 'mono').glow(5, col),
      );
    }

    nodes.push(
      txt(
        'Preserve API version, valid span & column offset mapping together',
        -860,
        382,
        26,
        COSMOS.muted,
        'sans',
        'left',
      ),
    );

    return group(...nodes);
  });

  s.add(bgAura, idx3d, title, live);
  runPhase(s, c, phase, 14);
  orbitScene(s, c, idx3d, { theta: -0.2, phi: 0.94 });

  c.on('ix-dequant', () => s.play(step.to(1, { duration: remainDuration(c, 'ix-dequant', 0.45) })));
  c.after('ix-relu', () =>
    s.play(step.to(2, { duration: remainAfterDuration(c, 'ix-relu', 0.35) })),
  );
  c.on('ix-span', () => s.play(step.to(3, { duration: remainDuration(c, 'ix-span', 0.45) })));
  c.on('ix-sentinel', () =>
    s.play(step.to(4, { duration: remainDuration(c, 'ix-sentinel', 0.45) })),
  );
  c.after('ix-restrict', () => {
    const dur = remainAfterDuration(c, 'ix-restrict', 0.4);
    s.play(step.to(5, { duration: dur }));
    s.play(maskVal.to(1, { duration: dur }));
  });
  c.after('ix-token41', () =>
    s.play(step.to(6, { duration: remainAfterDuration(c, 'ix-token41', 0.35) })),
  );
}
