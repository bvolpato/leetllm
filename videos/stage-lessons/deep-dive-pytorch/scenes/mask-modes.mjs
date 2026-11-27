// Scene 09: Which keys do these flags let through? Padding mask polarity trap ([4, 8, 1000]), dropout_p=0.2 vs 0.0, FlexAttention.
import { group } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  aura,
  glassCell,
  guardedDynamic,
  heroTitle,
  remainDuration,
  txt,
} from '../parts.mjs';

export default function maskModes(s, c) {
  const passPad = s.value(0);
  const revWrong = s.value(0);
  const inverted = s.value(0);
  const showReal = s.value(0);
  const showBias = s.value(0);
  const oldDrop = s.value(0);
  const zeroDrop = s.value(0);
  const showRef = s.value(0);
  const showFlex = s.value(0);

  const bgAura = aura(0, 20, 620, '#fb71851c', '#6ee7b718');
  const title = heroTitle(['Which Keys Do These', 'Flags Let Through?'], {
    x: -855,
    y: -415,
    size: 54,
    lineHeight: 64,
    accent: ROLE.bad,
    eyebrow: 'SDPA BOOLEAN POLARITY · DROPOUT · FLEX',
  });

  const live = guardedDynamic(1, () => {
    const pp = passPad.value;
    const rw = revWrong.value;
    const inv = inverted.value;
    const sr = showReal.value;
    const sb = showBias.value;
    const od = oldDrop.value;
    const zd = zeroDrop.value;
    const ref = showRef.value;
    const flx = showFlex.value;

    const vals = [
      { label: 'KEY 0 (real)', v: 4, padFlag: false, x: -560 },
      { label: 'KEY 1 (real)', v: 8, padFlag: false, x: -160 },
      { label: 'KEY 2 (PAD!)', v: 1000, padFlag: true, x: 240 },
    ];

    const nodes = [
      txt(
        sb > 0.5
          ? 'ADDITIVE MASK:  0.0 = KEEP   ·   -inf = BLOCK'
          : inv > 0.5
            ? 'INVERTED SDPA MASK: [True, True, False]  (True = KEEP)'
            : 'PADDING MASK: [False, False, True]  ->  PASSED INTO SDPA',
        -160,
        -222,
        28,
        inv > 0.5 ? ROLE.good : ROLE.bad,
        'mono',
      ),
    ];

    vals.forEach((k) => {
      const flag = inv > 0.5 ? !k.padFlag : k.padFlag;
      const bias = flag ? '0.0' : '-inf';
      const active = rw > 0.5 ? flag : false;
      const col = active ? (k.padFlag ? ROLE.bad : ROLE.good) : COSMOS.dim;
      nodes.push(
        glassCell(k.x, -85, 340, 178, col, {
          fill: active ? (k.padFlag ? '#2e1222' : '#0e2824') : '#0c1220',
          glow: active ? 10 : 2,
        }),
        txt(k.label, k.x, -142, 26, k.padFlag ? ROLE.bad : ROLE.orig, 'mono'),
        txt(`V = ${k.v}`, k.x, -88, 38, COSMOS.ink, 'mono'),
        txt(
          sb > 0.5 ? `bias: ${bias}` : `flag: ${flag ? 'True' : 'False'}`,
          k.x,
          -30,
          28,
          flag ? (k.padFlag ? ROLE.bad : ROLE.good) : COSMOS.muted,
          'mono',
        ),
      );
    });

    // Right output box (withheld until revWrong!)
    const outText =
      zd > 0.5
        ? '6.0 (exact)'
        : od > 0.5
          ? 'dropout=0.2!'
          : sr > 0.5
            ? '(4 + 8)/2 = 6'
            : rw > 0.5
              ? '1000!'
              : '?';
    const outCol =
      zd > 0.5 || (sr > 0.5 && od < 0.5) ? ROLE.good : rw > 0.5 ? ROLE.bad : COSMOS.gold;

    nodes.push(
      glassCell(660, -85, 400, 178, outCol, {
        fill: outCol === ROLE.good ? '#0d2924' : outCol === ROLE.bad ? '#2d1222' : '#1b1710',
        glow: 10,
      }),
      txt('SDPA OUTPUT', 660, -142, 26, COSMOS.muted, 'mono'),
      txt(outText, 660, -70, 42, outCol, 'mono').glow(6, outCol),
      txt(
        od > 0.5 && zd < 0.5
          ? 'eval() keeps p=0.2'
          : zd > 0.5
            ? 'Pass dropout_p=0.0'
            : 'scores = [0, 0, 0]',
        660,
        -18,
        26,
        COSMOS.muted,
        'mono',
      ),
    );

    // Bottom contract strip (Dropout + Math reference + FlexAttention)
    nodes.push(
      glassCell(-430, 155, 760, 162, od > 0.5 ? (zd > 0.5 ? ROLE.good : ROLE.bad) : COSMOS.dim, {
        fill: zd > 0.5 ? '#0d2624' : od > 0.5 ? '#2b1220' : '#0a0f1c',
        glow: od > 0.5 ? 9 : 2,
      }),
      txt(
        'FUNCTIONAL DROPOUT TRAP',
        -430,
        108,
        28,
        zd > 0.5 ? ROLE.good : od > 0.5 ? ROLE.bad : COSMOS.dim,
        'mono',
      ),
      txt(
        zd > 0.5 ? 'dropout_p = 0.0 -> deterministic 6.0' : 'Functional SDPA ignores model.eval()',
        -430,
        166,
        26,
        od > 0.5 ? COSMOS.ink : COSMOS.dim,
        'mono',
      ),

      glassCell(430, 155, 780, 162, flx > 0.5 ? ROLE.copy : ref > 0.5 ? ROLE.orig : COSMOS.dim, {
        fill: ref > 0.5 ? '#101d35' : '#0a0f1c',
        glow: ref > 0.5 ? 9 : 2,
      }),
      txt(
        flx > 0.5 ? 'FLEXATTENTION API' : 'CPU MATH REFERENCE CHECK',
        430,
        108,
        28,
        flx > 0.5 ? ROLE.copy : ref > 0.5 ? ROLE.orig : COSMOS.dim,
        'mono',
      ),
      txt(
        flx > 0.5
          ? 'score_mod + BlockMask skips empty tiles'
          : 'Matches formula + Q/K/V grads (CUDA separate)',
        430,
        166,
        26,
        ref > 0.5 ? COSMOS.ink : COSMOS.dim,
        'mono',
      ),
    );

    nodes.push(
      txt(
        pp > 0.5 && rw < 0.5
          ? 'Predict: pass [False, False, True] into SDPA; which value comes out?'
          : 'SDPA boolean True means KEEP (invert key_padding_mask before passing)',
        0,
        365,
        28,
        rw < 0.5 ? COSMOS.gold : ROLE.good,
        'sans',
      ),
    );

    return group(...nodes);
  });

  s.add(bgAura, title, live);

  c.on('pass-padding', () =>
    s.play(passPad.to(1, { duration: remainDuration(c, 'pass-padding', 0.35) })),
  );
  c.after('wrong-padding', () =>
    s.play(revWrong.to(1, { duration: remainDuration(c, 'wrong-padding', 0.4) })),
  );
  c.on('invert-padding', () =>
    s.play(inverted.to(1, { duration: remainDuration(c, 'invert-padding', 0.4) })),
  );
  c.after('mix-real', () =>
    s.play(showReal.to(1, { duration: remainDuration(c, 'mix-real', 0.4) })),
  );
  c.on('bias-mask', () =>
    s.play(showBias.to(1, { duration: remainDuration(c, 'bias-mask', 0.35) })),
  );
  c.on('old-dropout', () =>
    s.play(oldDrop.to(1, { duration: remainDuration(c, 'old-dropout', 0.4) })),
  );
  c.on('zero-dropout', () =>
    s.play(zeroDrop.to(1, { duration: remainDuration(c, 'zero-dropout', 0.4) })),
  );
  c.on('mask-reference', () =>
    s.play(showRef.to(1, { duration: remainDuration(c, 'mask-reference', 0.4) })),
  );
  c.on('flex-contract', () =>
    s.play(showFlex.to(1, { duration: remainDuration(c, 'flex-contract', 0.4) })),
  );
}
