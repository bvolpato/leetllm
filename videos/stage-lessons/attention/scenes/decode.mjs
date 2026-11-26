// Scene 14: decode: "One new token at a time"
// View 1: Single-row decode query reading the growing KV cache + absolute vs local position mask bug.
// View 2: KV cache capacity & bandwidth wall -> MHA (64 heads, 344 GB) vs GQA (8 heads, 43 GB) vs MQA (1 head, 5 GB).
import { arrow, line } from 'vizmatic/stage';
import { COSMOS, glowingTrail, guardedDynamic, heroTitle, txt } from '../../cinematic-kit.mjs';
import { ROLE, arcPts, cacheBytes, cinemaAtmosphere, lumBar, playCue, swapVis } from '../parts.mjs';

export default function decode(s, c) {
  const mhaGB = Math.round(cacheBytes(64) / 1e9); // 344
  const gqaGB = Math.round(cacheBytes(8) / 1e9); // 43
  const mqaGB = Math.round(cacheBytes(1) / 1e9); // 5

  const title = heroTitle(['Autoregressive decode:', 'one row & the KV cache'], {
    x: -850,
    y: -435,
    size: 48,
    lineHeight: 56,
    accent: ROLE.sing,
  });

  // Two spacious views: 1) Single-row decode + cached mask bug, 2) KV cache head sharing (MHA / GQA / MQA)
  const vRow = s.value(1);
  const vCache = s.value(0);

  // View 1 state
  const cacheLit = s.value(0.25);
  const readBeams = s.value(0);
  const maskMode = s.value(0); // 0 = normal, 1 = local bug (only key 0), 2 = fixed absolute (all 5 keys)
  const ruleLit = s.value(0);

  // View 2 state
  const bwNote = s.value(0);
  const mhaVis = s.value(0.35);
  const gqaVis = s.value(0.35);
  const mqaVis = s.value(0.35);
  const limitsStep = s.value(0); // 0..3 limits banner

  // VIEW 1: 1×5 Decode Row reading KV Cache + Position-4 Mask Bug vs Fix
  const rowLayer = guardedDynamic(vRow, (alpha) => {
    const mm = maskMode.value;
    const cl = cacheLit.value;
    const rb = readBeams.value;
    const nodes = [];

    const keys = ['k₀', 'k₁', 'k₂', 'k₃', 'k₄'];
    const vals = ['v₀', 'v₁', 'v₂', 'v₃', 'v₄'];
    const slotXs = [-440, -220, 0, 220, 440];
    const qX = 0;
    const qY = -165;
    const kY = 45;
    const vY = 170;

    // Single new query at position 4
    nodes.push(
      lumBar(qX, qY, 450, 82, {
        color: ROLE.query,
        fillOpacity: 0.28,
        strokeWidth: 2.8,
        glow: 10,
        opacity: alpha,
      }),
      txt('new query  q₄  (pos 4)', qX, qY, 30, ROLE.query, 'mono', 'center').opacity(alpha),
      txt('KV Cache (K)', -710, kY, 28, ROLE.birds, 'mono', 'center').opacity(
        (0.4 + 0.6 * cl) * alpha,
      ),
      txt('KV Cache (V)', -710, vY, 28, ROLE.value, 'mono', 'center').opacity(
        (0.4 + 0.6 * cl) * alpha,
      ),
    );

    slotXs.forEach((sx, i) => {
      const blockedByBug = mm >= 0.6 && mm < 1.5 && i > 0;
      const colK = blockedByBug ? ROLE.mask : i === 4 ? ROLE.sing : ROLE.birds;
      const colV = blockedByBug ? ROLE.mask : ROLE.value;

      // Glowing attention beam from q_4 down to key i
      if (rb > 0.05) {
        nodes.push(
          glowingTrail(arcPts([qX, qY + 46], [sx, kY - 46], 0, 16), {
            color: blockedByBug ? ROLE.mask : ROLE.query,
            width: blockedByBug ? 1.8 : 3.2,
            glow: blockedByBug ? 2 : 8,
            core: !blockedByBug,
            opacity: (blockedByBug ? 0.22 : 0.85) * rb * alpha,
          }),
        );
      }

      nodes.push(
        lumBar(sx, kY, 164, 78, {
          color: colK,
          fillOpacity: blockedByBug ? 0.14 : 0.26,
          strokeWidth: blockedByBug ? 1.6 : 2.4,
          glow: blockedByBug ? 3 : 8,
          opacity: (0.35 + 0.65 * cl) * alpha,
        }),
        txt(blockedByBug ? `${keys[i]} ×` : keys[i], sx, kY, 30, colK, 'mono', 'center').opacity(
          (0.35 + 0.65 * cl) * alpha,
        ),
        lumBar(sx, vY, 164, 74, {
          color: colV,
          fillOpacity: blockedByBug ? 0.1 : 0.22,
          strokeWidth: blockedByBug ? 1.4 : 2.2,
          glow: blockedByBug ? 2 : 6,
          opacity: (0.35 + 0.65 * cl) * alpha,
        }),
        txt(vals[i], sx, vY, 28, colV, 'mono', 'center').opacity((0.35 + 0.65 * cl) * alpha),
      );
    });

    // Bottom status explaining local-row bug vs absolute-position rule
    let msg = 'Single query row (1 × T) scores all cached keys & mixes all cached values';
    let msgCol = COSMOS.muted;
    if (mm >= 0.6 && mm < 1.5) {
      msg = 'Bug: local row 0 causal mask blocks k₁..k₄  →  history erased!';
      msgCol = ROLE.mask;
    } else if (mm >= 1.5) {
      msg = 'Fix: allow key j when pos(j) ≤ pos(q) and not PAD  →  all 5 keys legal';
      msgCol = ROLE.value;
    }
    nodes.push(
      txt(msg, 0, 315, 30, msgCol, 'mono', 'center')
        .glow(mm >= 0.6 ? 6 : 0, msgCol)
        .opacity(alpha),
    );
    if (ruleLit.value > 0.05) {
      nodes.push(
        txt(
          'Always build cached masks from absolute positions',
          0,
          385,
          28,
          ROLE.query,
          'sans',
          'center',
        ).opacity(ruleLit.value * alpha),
      );
    }

    return nodes;
  });

  // VIEW 2: KV Cache Sharing (MHA 344 GB -> GQA 43 GB -> MQA 5 GB)
  const cacheLayer = guardedDynamic(vCache, (alpha) => {
    const nodes = [];
    const bw = bwNote.value;
    const lim = limitsStep.value;

    nodes.push(
      txt(
        '80 layers · 64 Q heads (d=128) · 16 req × 8,192 tokens · FP16 (2 B)',
        0,
        -265,
        28,
        COSMOS.muted,
        'mono',
        'center',
      ).opacity(alpha),
    );

    const rows = [
      { y: -155, name: 'MHA', kv: '64 KV heads', gb: mhaGB, col: ROLE.mask, vis: mhaVis.value },
      { y: 15, name: 'GQA', kv: '8 KV heads (8:1)', gb: gqaGB, col: ROLE.sing, vis: gqaVis.value },
      {
        y: 185,
        name: 'MQA',
        kv: '1 KV head (64:1)',
        gb: mqaGB,
        col: ROLE.value,
        vis: mqaVis.value,
      },
    ];

    const barLeft = -380;
    const maxW = 920;

    rows.forEach((r) => {
      const w = Math.max(24, (r.gb / mhaGB) * maxW);
      const op = (0.3 + 0.7 * r.vis) * alpha;
      nodes.push(
        txt(r.name, -760, r.y - 16, 36, r.col, 'mono', 'left').opacity(op),
        txt(r.kv, -760, r.y + 26, 26, COSMOS.muted, 'mono', 'left').opacity(op),
        lumBar(barLeft + w / 2, r.y, w, 72, {
          color: r.col,
          fillOpacity: 0.36,
          strokeWidth: 2.6,
          glow: 9 * r.vis,
          opacity: op,
        }),
        txt(`~${r.gb} GB`, barLeft + w + 28, r.y, 36, r.col, 'mono', 'left')
          .glow(r.vis > 0.7 ? 7 : 0, r.col)
          .opacity(op),
      );
    });

    // Bottom takeaway line (stable per phase so never flashes briefly)
    let foot = 'Decode bottleneck: reading the persistent KV cache from HBM every token';
    let footCol = ROLE.amber;
    if (lim >= 0.5) {
      foot =
        'Shrinks persistent KV cache only · must train or uptrain for GQA/MQA & verify quality';
      footCol = ROLE.sing;
    } else if (bw > 0.5) {
      foot = '1 score row fits easily · KV cache capacity & HBM bandwidth are the limit';
    }
    nodes.push(txt(foot, 0, 365, 28, footCol, 'sans', 'center').glow(5, footCol).opacity(alpha));

    return nodes;
  });

  s.add(cinemaAtmosphere(ROLE.sing, ROLE.value), title, rowLayer, cacheLayer);

  // Beat 0: 1 new query + saved KV cache + reads & mixes all
  playCue(s, c, 'one-query', (d) => s.play(cacheLit.to(0.5, { duration: d })), { dur: 0.4 });
  playCue(s, c, 'saved', (d) => s.play(cacheLit.to(1, { duration: d })), { dur: 0.5 });
  playCue(s, c, 'reads-all', (d) => s.play(readBeams.to(0.7, { duration: d })), { dur: 0.45 });
  playCue(s, c, 'mixes-all', (d) => s.play(readBeams.to(1, { duration: d })), { dur: 0.45 });

  // Beat 1: Position 4 local-row mask bug -> absolute position fix
  playCue(s, c, 'position', (d) => s.play(maskMode.to(0.4, { duration: d })), { dur: 0.35 });
  playCue(s, c, 'local', (d) => s.play(maskMode.to(1.0, { duration: d })), { dur: 0.5 });
  playCue(s, c, 'all-five', (d) => s.play(maskMode.to(2.0, { duration: d })), { dur: 0.55 });
  playCue(s, c, 'rule', (d) => s.play(ruleLit.to(1, { duration: d })), { dur: 0.45 });

  // Beat 2: Switch to KV cache capacity & bandwidth view
  playCue(s, c, 'score-fine', (d) => s.play(swapVis(vRow, vCache, d)), { dur: 0.65 });
  playCue(s, c, 'one-score-row', (d) => s.play(bwNote.to(0.4, { duration: d })), { dur: 0.35 });
  playCue(s, c, 'fit', (d) => s.play(bwNote.to(0.7, { duration: d })), { dur: 0.35 });
  playCue(s, c, 'read-again', (d) => s.play(bwNote.to(0.9, { duration: d })), { dur: 0.35 });
  playCue(s, c, 'limit', (d) => s.play(bwNote.to(1, { duration: d })), { dur: 0.35 });

  // Beat 3: Fewer KV heads (MQA, GQA)
  playCue(s, c, 'fewer', (d) => s.play(mhaVis.to(0.6, { duration: d })), { dur: 0.35 });
  playCue(s, c, 'mqa', (d) => s.play(mqaVis.to(1, { duration: d })), { dur: 0.45 });
  playCue(s, c, 'gqa', (d) => s.play(gqaVis.to(1, { duration: d })), { dur: 0.45 });

  // Beat 4: Hypothetical 344 GB -> 43 GB -> 5 GB
  playCue(
    s,
    c,
    'hypothetical',
    (d) =>
      s.play(
        mhaVis.to(0.4, { duration: d }),
        gqaVis.to(0.4, { duration: d }),
        mqaVis.to(0.4, { duration: d }),
      ),
    { dur: 0.4 },
  );
  playCue(s, c, 'sixty-four', (d) => s.play(mhaVis.to(1, { duration: d })), { dur: 0.55 });
  playCue(s, c, 'with-eight', (d) => s.play(gqaVis.to(1, { duration: d })), { dur: 0.55 });
  playCue(s, c, 'with-one', (d) => s.play(mqaVis.to(1, { duration: d })), { dur: 0.55 });

  // Beat 5: Limits of head sharing (in exact chronological phrase order!)
  playCue(s, c, 'limits', (d) => s.play(limitsStep.to(1, { duration: d })), { dur: 0.35 });
  playCue(s, c, 'own-scores', (d) => s.play(limitsStep.to(1.4, { duration: d })), { dur: 0.4 });
  playCue(s, c, 'shrinks', (d) => s.play(limitsStep.to(1.8, { duration: d })), { dur: 0.4 });
  playCue(s, c, 'reshape', (d) => s.play(limitsStep.to(2.2, { duration: d })), { dur: 0.4 });
  playCue(s, c, 'train-new', (d) => s.play(limitsStep.to(2.6, { duration: d })), { dur: 0.4 });
  playCue(s, c, 'measure', (d) => s.play(limitsStep.to(3.0, { duration: d })), { dur: 0.4 });

  void arrow;
  void line;
}
