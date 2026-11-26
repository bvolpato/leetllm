// Scene 08: granularity: Single outlier stretches shared tensor scale (collapsing small weights) -> per-channel rows -> per-group scales.
import {
  COSMOS,
  ROLE,
  aura,
  chipPill,
  group,
  guardedDynamic,
  heroTitle,
  playCue,
  rect,
  txt,
} from '../parts.mjs';

export default function granularity(s, c) {
  const mode = s.value(0); // 0=per-tensor collapse, 1=per-channel, 2=per-group

  const bgAura = aura(0, 0, 740, '#14335c28', '#20184422');
  const title = heroTitle(['Scale Granularity:', 'Per-Tensor vs Per-Channel vs Per-Group'], {
    x: -855,
    y: -430,
    size: 46,
    lineHeight: 54,
    accent: ROLE.gold,
  });

  const rowsData = [
    ['0.12', '0.18', '0.24', '9.80!', '0.15', '0.21'],
    ['0.14', '0.28', '0.41', '0.19', '0.33', '0.25'],
    ['0.09', '0.22', '0.37', '0.31', '0.16', '0.29'],
  ];

  const stageVis = s.value(1);
  const layer = guardedDynamic(stageVis, (alpha) => {
    const m = mode.value;
    const isChan = m >= 0.7 && m < 1.5;
    const isGrp = m >= 1.5;

    const nodes = [
      txt(
        isGrp
          ? 'PER-GROUP SCALES (E.G. 128 WEIGHTS): OUTLIER CONTAINED TO ONE SMALL GROUP'
          : isChan
            ? 'PER-CHANNEL SCALES (ONE SCALE PER ROW): ROWS 2 & 3 RECOVER FULL DETAIL'
            : 'PER-TENSOR SCALE (ONE SHARED RULER): OUTLIER 9.80 COLLAPSES SMALL WEIGHTS TO 0',
        -855,
        -225,
        26,
        isGrp ? ROLE.ok : isChan ? ROLE.grid : ROLE.err,
        'mono',
        'left',
      ).opacity(alpha),
    ];

    rowsData.forEach((row, r) => {
      const y = -115 + r * 112;
      nodes.push(txt(`Row ${r + 1}`, -855, y, 26, COSMOS.muted, 'mono', 'left').opacity(alpha));
      row.forEach((val, cIdx) => {
        const cx = -610 + cIdx * 210;
        const isOut = r === 0 && cIdx === 3;
        const sameGroupAsOut = r === 0 && cIdx >= 3;
        const damaged =
          isOut || (!isChan && !isGrp) || (isChan && r === 0) || (isGrp && sameGroupAsOut);
        const col = isOut ? ROLE.err : damaged ? ROLE.gold : ROLE.ok;
        const shown =
          !isOut && !isChan && !isGrp
            ? '-> 0.0'
            : isChan && r === 0 && !isOut
              ? '-> 0.0'
              : isGrp && sameGroupAsOut && !isOut
                ? '-> 0.0'
                : val;
        nodes.push(
          rect(182, 74, {
            fill: isOut ? '#3c1426' : damaged ? '#261e10' : '#0f2d24',
            stroke: col,
            width: isOut ? 3 : 2,
            radius: 10,
          })
            .at(cx, y)
            .opacity(alpha),
          txt(shown, cx, y, 26, isOut ? ROLE.err : COSMOS.ink, 'mono', 'center').opacity(alpha),
        );
      });
      const scaleLbl = isGrp
        ? r === 0
          ? '2 scales'
          : '2 fine'
        : isChan
          ? r === 0
            ? 's=1.40'
            : 's=0.06'
          : r === 1
            ? '1 shared'
            : '';
      if (scaleLbl) {
        nodes.push(
          txt(
            scaleLbl,
            665,
            y,
            26,
            isGrp ? ROLE.ok : isChan ? ROLE.grid : ROLE.err,
            'mono',
            'left',
          ).opacity(alpha),
        );
      }
    });

    nodes.push(
      chipPill(
        isGrp
          ? 'Finer groups quarantine outliers tightly, trading extra scale metadata for local precision'
          : isChan
            ? 'Giving each channel its own ruler shields clean rows from one channel outlier'
            : 'One giant weight stretches the shared step size so small weights collapse onto zero',
        0,
        265,
        {
          w: 1580,
          h: 76,
          color: isGrp ? ROLE.ok : isChan ? ROLE.grid : ROLE.err,
          size: 26,
          opacity: alpha,
        },
      ),
    );

    return group(...nodes);
  });

  s.add(bgAura, title, layer);
  playCue(s, c, 'outlier-range', (d) => s.play(mode.to(0, { duration: d })));
  playCue(s, c, 'collapse-small', (d) => s.play(mode.to(0.2, { duration: d })));
  playCue(s, c, 'row-scales', (d) => s.play(mode.to(1, { duration: d })));
  playCue(s, c, 'local-grid', (d) => s.play(mode.to(1.2, { duration: d })));
  playCue(s, c, 'group-scales', (d) => s.play(mode.to(2, { duration: d })));
  playCue(s, c, 'scale-overhead', (d) => s.play(mode.to(2, { duration: d })));
}
