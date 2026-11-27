// Scene 16: The stored Linear weight fixes the sharded dimension (ColwiseParallel splits [out, in] dim 0 -> [8,4] -> [4,4] per TP rank vs FSDP2 gather).
import { group } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  TP_FIXTURE,
  aura,
  glassCell,
  guardedDynamic,
  heroTitle,
  line,
  remainDuration,
  txt,
} from '../parts.mjs';

export default function tensorSplit(s, c) {
  const stage = s.value(0); // 0=MLP Colwise->Rowwise composition, 1=[8,4] stored weight -> [4,4] slice, 2=TP vs FSDP2 dim-0 contrast

  const bgAura = aura(0, 20, 620, '#60a5fa1c', '#a78bfa18');
  const title = heroTitle(['Stored Linear Weight', 'Fixes the Split Axis'], {
    x: -855,
    y: -415,
    size: 52,
    lineHeight: 62,
    accent: ROLE.orig,
    eyebrow: 'COLWISEPARALLEL · ROWWISEPARALLEL · FSDP2',
  });

  const live = guardedDynamic(1, () => {
    const st = stage.value;

    const nodes = [
      // Left: nn.Linear stored [out, in] = [8, 4] split on dim 0
      glassCell(-470, -70, 740, 260, ROLE.orig, { fill: '#0f1b33', glow: 8 }),
      txt('nn.Linear STORED WEIGHT: [out=8, in=4]', -470, -162, 28, ROLE.orig, 'mono'),
      glassCell(-470, -82, 620, 66, ROLE.copy, { fill: '#0d222e', glow: st >= 1 ? 9 : 3 }),
      txt('TP Rank 0: rows 0..3  ->  [4, 4] slice', -470, -82, 26, ROLE.copy, 'mono'),
      glassCell(-470, 2, 620, 66, ROLE.grad, { fill: '#1d1433', glow: st >= 1 ? 9 : 3 }),
      txt('TP Rank 1: rows 4..7  ->  [4, 4] slice', -470, 2, 26, ROLE.grad, 'mono'),

      // Right: MLP 2-layer composition & partial sum fixture
      glassCell(410, -70, 820, 260, ROLE.good, { fill: '#0e2522', glow: 8 }),
      txt('MLP 2-LAYER TP COMPOSITION', 410, -162, 28, ROLE.good, 'mono'),
      txt('1. ColwiseParallel: split out (Shard 0)', 410, -102, 26, COSMOS.ink, 'mono'),
      txt('2. RowwiseParallel: split in -> all_reduce', 410, -48, 26, COSMOS.ink, 'mono'),
      txt(
        `Partials [${TP_FIXTURE.partials[0].join(',')}] + [${TP_FIXTURE.partials[1].join(',')}] = [${TP_FIXTURE.result.join(',')}]`,
        410,
        12,
        28,
        COSMOS.gold,
        'mono',
      ),

      // Bottom: TP vs FSDP2 dim-0 contrast
      glassCell(-470, 195, 740, 152, st >= 2.5 ? ROLE.trans : COSMOS.dim, {
        fill: st >= 2.5 ? '#241b0f' : '#0a0f1c',
        glow: st >= 2.5 ? 9 : 2,
      }),
      txt('TENSOR PARALLEL (TP)', -470, 154, 28, st >= 2.5 ? ROLE.trans : COSMOS.dim, 'mono'),
      txt(
        'Computes DIRECTLY on [4, 4] shard',
        -470,
        212,
        26,
        st >= 2.5 ? COSMOS.ink : COSMOS.dim,
        'mono',
      ),

      glassCell(410, 195, 820, 152, st >= 2.5 ? ROLE.copy : COSMOS.dim, {
        fill: st >= 2.5 ? '#0d222e' : '#0a0f1c',
        glow: st >= 2.5 ? 9 : 2,
      }),
      txt('FSDP2 (DATA PARALLEL)', 410, 154, 28, st >= 2.5 ? ROLE.copy : COSMOS.dim, 'mono'),
      txt(
        'ALL-GATHERS back to full [8, 4] to compute',
        410,
        212,
        26,
        st >= 2.5 ? COSMOS.ink : COSMOS.dim,
        'mono',
      ),
    ];

    nodes.push(
      txt(
        'Same dim-0 storage sharding does NOT make TP and FSDP2 equivalent; align mesh axes & order',
        0,
        380,
        28,
        COSMOS.muted,
        'sans',
      ),
    );

    return group(...nodes);
  });

  s.add(bgAura, title, live);

  c.on('pt-tensor-split-0', () => s.play(stage.to(0, { duration: 0.25 })));
  c.on('pt-tensor-split-1', () =>
    s.play(stage.to(1, { duration: remainDuration(c, 'pt-tensor-split-1', 0.4) })),
  );
  c.on('pt-stored-slice', () =>
    s.play(stage.to(2, { duration: remainDuration(c, 'pt-stored-slice', 0.4) })),
  );
  c.on('pt-tensor-split-2', () =>
    s.play(stage.to(3, { duration: remainDuration(c, 'pt-tensor-split-2', 0.45) })),
  );
}
