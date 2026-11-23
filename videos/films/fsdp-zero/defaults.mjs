import { BASE, SHARDS } from './fixtures.mjs';
import { perRank, stageSnapshot } from './model.mjs';
export function drawExpandedText(ctx, api, v, x, y, z = 32, col = api.C.ink, a = 'left') {
  return api.text(ctx, v, x, y, z, col, a);
}
export function drawExpandedTile(ctx, api, label, x, y, w = 180, h = 70, color = api.C.blue) {
  api.rect(ctx, x, y, w, h, api.C.panel, color, 5);
  drawExpandedText(ctx, api, label, x + w / 2, y + h / 2 + 10, 28, color, 'center');
}
export function drawExpandedBar(ctx, api, value, x, y, width, height, max, color) {
  api.rect(ctx, x, y, width, height, api.C.panel, api.C.muted, 2);
  if (value > 0) api.rect(ctx, x, y, (width * value) / max, height, color, undefined, 0);
}
export function drawExpandedLine(ctx, api, x1, y1, x2, y2, col = api.C.muted, w = 3) {
  return api.line(ctx, x1, y1, x2, y2, col, w);
}
export function drawExpandedTitle(ctx, api, v) {
  return drawExpandedText(ctx, api, v, 960, 260, 29, api.C.muted, 'center');
}
export function text(ctx, api, v, x, y, z = 32, col = api.C.ink, a = 'left') {
  return api.text(ctx, v, x, y, z, col, a);
}
export function drawLedgerEquation(ctx, api, v, x, y, z = 46, col = api.C.ink, a = 'center') {
  return api.math(ctx, v, x, y, z, col, a);
}
export function card(ctx, api, label, x, y, width = 360, color = api.C.cyan) {
  return api.components.card({
    label,
    x,
    y,
    width,
    height: 88,
    fontSize: 29,
    fill: api.C.panel,
    stroke: color,
    textColor: color,
  });
}
export function drawStateLedger(
  ctx,
  api,
  beat,
  progress,
  stateColors,
  stage,
  animated = false,
  compact = false,
  unitLabel = 'units',
) {
  const snapshot = animated
      ? stageSnapshot(stage, beat, progress)
      : {
          current: perRank(stage),
          q: 1,
        },
    entries = Object.entries(snapshot.current).map(([name, value]) => ({
      name,
      value: animated && stage === 0 && beat === 0
        ? BASE[name] * api.focus.progress('ledger-' + name, value / BASE[name])
        : value,
    })),
    unit = 43;
  if (!compact && unitLabel !== 'state units')
    entries.forEach(({ name, value }, index) =>
      api.focus.target('state-' + name, () =>
        text(
          ctx,
          api,
          `${name}: ${Number(value.toFixed(2))}`,
          560 + index * 400,
          345,
          29,
          stateColors[name],
          'center',
        ),
      ),
    );
  for (let rank = 0; rank < 4; rank++) {
    const x = compact ? 130 + rank * 225 : 220 + rank * 400,
      width = compact ? 190 : 320,
      baseY = 820;
    let used = 0;
    for (const { name, value } of entries) {
      const height = value * unit,
        y = baseY - (used + value) * unit;
      if (height > 0.5) {
        const shardedBefore =
            (name === 'optimizer' && stage > 1) || (name === 'gradients' && stage > 2),
          shardingNow =
            (name === 'optimizer' && stage === 1) ||
            (name === 'gradients' && stage === 2) ||
            (name === 'weights' && stage === 3),
          q = shardedBefore ? 1 : shardingNow ? snapshot.q : 0;
        const masses = SHARDS.map((_, owner) => (owner === rank ? 1 : 1 - q)),
          mass = masses.reduce((a, v) => a + v, 0);
        let offset = 0;
        SHARDS.forEach((id, owner) => {
          const tile = (width * masses[owner]) / mass;
          if (tile > 0.5) {
            api.focus.target('state-' + name, () =>
              api.rect(ctx, x + offset, y, tile, height, stateColors[name], api.C.bg, 3),
            );
            if (tile >= 30 && height >= 19)
              text(
                ctx,
                api,
                id,
                x + offset + tile / 2,
                y + height / 2 + 7,
                compact ? 17 : 20,
                api.C.bg,
                'center',
              );
          }
          offset += tile;
        });
      }
      used += value;
    }
    text(ctx, api, `Rank ${rank}`, x + width / 2, 850, compact ? 24 : 28, api.C.muted, 'center');
    text(
      ctx,
      api,
      `${Number(used.toFixed(2))} ${unitLabel}`,
      x + width / 2,
      895,
      compact ? 24 : 26,
      api.C.ink,
      'center',
    );
    text(
      ctx,
      api,
      stage === 0
        ? 'Replica A · B · C · D'
        : (stage === 1 ? 'O owner ' : stage === 2 ? 'G/O owner ' : 'W/G/O owner ') + SHARDS[rank],
      x + width / 2,
      940,
      compact ? 22 : 25,
      api.C.yellow,
      'center',
    );
  }
  if (compact)
    text(
      ctx,
      api,
      snapshot.q === 1 ? 'W full · G and O owned shards' : 'W full · G transitions to owned shards',
      560,
      365,
      27,
      api.C.muted,
      'center',
    );
}
