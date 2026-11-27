// Scene 09: Which cache locations can this request use? (PREDICTION SCENE: 5 aligned tokens, page size 4 -> 12..15 for ns A; switch to ns B -> 0!)
import {
  COSMOS,
  NS_DIFF,
  NS_SAME,
  NS_TOKENS,
  ROLE,
  aura,
  glassCell,
  group,
  guardedDynamic,
  heroTitle,
  line,
  txt,
  wireStepCues,
} from '../parts.mjs';

export default function cacheNamespaces(s, c) {
  // step: 0=compare A..E (ns A), 1=returns KV 12..15 (E starts next page),
  // 2=switch adapter A -> B, 3=PREDICT HOLD (how many of 4?), 4=0 returned!, 5=RadixKey.match raises ValueError
  const step = s.value(0);

  const bgAura = aura(0, 20, 640, '#5ce1e61c', '#ffd16618');
  const title = heroTitle(['Which Cache Locations', 'Can Request B Use?'], {
    x: -855,
    y: -415,
    size: 54,
    lineHeight: 64,
    accent: ROLE.radix,
    eyebrow: 'RADIX KEY NAMESPACE · PAGE SIZE 4',
  });

  const live = guardedDynamic(1, () => {
    const st = Math.round(step.value);
    const switched = st >= 2;
    const revealed = st >= 4;
    const nodes = [];

    const startX = -320;
    const pitch = 230;

    // Row 1: Stored path (Namespace A)
    nodes.push(
      txt('STORED PATH', -760, -182, 28, COSMOS.ink, 'mono', 'left'),
      txt('Namespace A', -760, -142, 26, ROLE.prefill, 'mono', 'left'),
    );
    NS_TOKENS.forEach((tok, i) => {
      const cx = startX + i * pitch;
      nodes.push(
        glassCell(cx, -162, 196, 86, ROLE.prefill, { fill: '#10203a', glow: 7 }),
        txt(tok, cx, -162, 36, COSMOS.ink, 'mono'),
      );
    });

    // Row 2: Request path (Namespace A -> B)
    nodes.push(
      txt('REQUEST', -760, -20, 28, COSMOS.ink, 'mono', 'left'),
      txt(
        switched ? 'Namespace B' : 'Namespace A',
        -760,
        20,
        26,
        switched ? COSMOS.gold : ROLE.prefill,
        'mono',
        'left',
      ),
    );
    NS_TOKENS.forEach((tok, i) => {
      const cx = startX + i * pitch;
      nodes.push(
        txt('=', cx, -82, 28, COSMOS.muted, 'mono'),
        glassCell(cx, 0, 196, 86, switched ? COSMOS.gold : ROLE.radix, {
          fill: switched ? '#211b10' : '#0f2336',
          glow: 7,
        }),
        txt(tok, cx, 0, 36, COSMOS.ink, 'mono'),
      );
    });

    // Page bracket for first 4 tokens
    const brLeft = startX - 98;
    const brRight = startX + 3 * pitch + 98;
    nodes.push(
      line([brLeft, 66], [brRight, 66], { color: ROLE.radix, width: 3 }),
      txt(
        'Full page: 4 tokens (reusable unit)',
        (brLeft + brRight) / 2,
        98,
        26,
        ROLE.radix,
        'mono',
      ),
      txt('Next page', startX + 4 * pitch, 98, 26, COSMOS.muted, 'mono'),
    );

    // Row 3: Stored KV page locations [12, 13, 14, 15]
    nodes.push(txt('A STORED KV', -760, 196, 28, COSMOS.ink, 'mono', 'left'));
    for (let i = 0; i < 4; i++) {
      const cx = startX + i * pitch;
      const linked = st >= 1 && !switched;
      const col = linked ? ROLE.decode : switched && revealed ? ROLE.fail : COSMOS.dim;
      nodes.push(
        glassCell(cx, 196, 196, 86, col, {
          fill: linked ? '#0d2922' : switched && revealed ? '#2a1120' : '#0b101d',
          glow: linked ? 10 : switched && revealed ? 8 : 2,
        }),
        txt(
          st >= 1 ? `KV ${12 + i}` : '---',
          cx,
          196,
          30,
          st >= 1 ? COSMOS.ink : COSMOS.dim,
          'mono',
        ),
      );
    }

    // Result badge at col 5
    const badgeCol = !switched
      ? st >= 1
        ? ROLE.decode
        : COSMOS.dim
      : revealed
        ? ROLE.fail
        : COSMOS.gold;
    const badgeText = !switched
      ? st >= 1
        ? `${NS_SAME.reusable} hits`
        : 'check'
      : revealed
        ? `${NS_DIFF.reusable} hits!`
        : '? hits';
    nodes.push(
      glassCell(startX + 4 * pitch, 196, 210, 86, badgeCol, {
        fill: revealed ? '#2c1120' : '#141a2e',
        glow: 10,
      }),
      txt(badgeText, startX + 4 * pitch, 196, 34, badgeCol, 'mono'),
    );

    nodes.push(
      txt(
        st >= 5
          ? 'Lookup helper returns 0; direct RadixKey.match on mismatched keys raises ValueError.'
          : revealed
            ? 'B gets 0: those keys and values came from adapter A.'
            : switched
              ? 'Predict: same tokens, adapter switched A -> B. How many of the 4 locations can B use?'
              : st >= 1
                ? 'Page size 4 returns KV locations 12..15; token E starts the next page.'
                : 'Comparing five aligned token IDs under Namespace A.',
        0,
        350,
        28,
        switched && !revealed ? COSMOS.gold : revealed ? ROLE.fail : COSMOS.ink,
        'sans',
      ),
    );
    return group(...nodes);
  });

  s.add(bgAura, title, live);
  wireStepCues(s, c, step, [
    ['key-compare', 0],
    ['key-page', 1, true],
    ['key-switch', 2],
    ['key-question', 3],
    ['key-zero', 4, true],
    ['key-class', 5, true],
  ]);
}
