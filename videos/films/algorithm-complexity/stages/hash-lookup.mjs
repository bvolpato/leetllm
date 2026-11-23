import { hashKey } from '../arithmetic.mjs';
import { COLLISION_QUERY, DOCS, HASH_GRID } from '../fixtures.mjs';
import { lerp, q } from '../construction.mjs';
import { hashBucketGeometry, issuerHashRouteGeometry } from '../model.mjs';
import { arrow, box, focus, math, text } from '../defaults.mjs';
export function drawHashLookup(ctx, scene, state, api) {
  const themeColors = api.C,
    beat = state.beat ?? 0;
  {
    const collide = q(state, 'hash-collide', 1),
      route = q(state, 'hash-route', 0),
      equal = q(state, 'hash-equality', 0),
      walk = q(state, 'hash-walk', 1);
    focus(ctx, api, themeColors, 'hash-work', () => {
      if (collide === 0) {
        const routeGeometry = issuerHashRouteGeometry();
        box(ctx, api, themeColors, 'issuer-check', 160, 265, 510, 85, themeColors.yellow, 36);
        text(
          ctx,
          api,
          themeColors,
          'sum of character codes mod 8 = ' + hashKey('issuer-check'),
          1020,
          400,
          34,
          themeColors.cyan,
        );
        for (let bucket = 0; bucket < 8; bucket++) {
          const { x, y, width, height } = hashBucketGeometry(bucket),
            keys = DOCS.filter((d) => hashKey(d.id) === bucket);
          const selected = route > 0 && bucket === routeGeometry.bucket;
          text(
            ctx,
            api,
            themeColors,
            bucket,
            x + width / 2,
            y - HASH_GRID.labelOffset,
            HASH_GRID.labelSize,
            themeColors.muted,
          );
          box(
            ctx,
            api,
            themeColors,
            keys.map((d) => d.id).join('\n') || 'empty',
            x,
            y,
            width,
            height,
            equal === 1 && keys.some((d) => d.id === 'issuer-check')
              ? themeColors.green
              : selected
                ? themeColors.yellow
                : themeColors.blue,
            31,
          );
        }
        if (route > 0) {
          const points = routeGeometry.points;
          const lengths = points
            .slice(1)
            .map((point, i) => Math.hypot(point.x - points[i].x, point.y - points[i].y));
          let remaining = route * lengths.reduce((n, v) => n + v, 0);
          for (let i = 0; i < lengths.length; i++) {
            const a = points[i],
              z = points[i + 1],
              f = Math.min(1, remaining / lengths[i]),
              end = {
                x: lerp(a.x, z.x, f),
                y: lerp(a.y, z.y, f),
              };
            if (f > 0) {
              if (i === lengths.length - 1 && Math.hypot(end.x - a.x, end.y - a.y) >= 22)
                arrow(ctx, api, a.x, a.y, end.x, end.y, themeColors.yellow, 7);
              else api.line(ctx, a.x, a.y, end.x, end.y, themeColors.yellow, 4);
            }
            remaining -= lengths[i];
            if (remaining <= 0) break;
          }
        }
        text(
          ctx,
          api,
          themeColors,
          equal === 1 ? 'Stored key equality checked' : 'Follow the computed bucket address',
          960,
          885,
          37,
          equal === 1 ? themeColors.green : themeColors.muted,
        );
      } else {
        box(
          ctx,
          api,
          themeColors,
          'Requested key: ' + COLLISION_QUERY + ' (absent)',
          450,
          260,
          1020,
          90,
          themeColors.yellow,
          36,
        );
        text(
          ctx,
          api,
          themeColors,
          'Controlled collision case · hash(key) = 0 for every key',
          960,
          420,
          33,
          themeColors.pink,
        );
        DOCS.forEach((d, i) => {
          const checked = i < Math.floor(walk * 4 + 1e-9);
          box(
            ctx,
            api,
            themeColors,
            d.id,
            185 + i * 415,
            550,
            365,
            100,
            checked ? themeColors.pink : themeColors.blue,
            29,
          );
          if (i < 3) arrow(ctx, api, 560 + i * 415, 600, 590 + i * 415, 600, themeColors.muted, 3);
        });
        text(
          ctx,
          api,
          themeColors,
          Math.floor(walk * 4 + 1e-9) + ' equality checks',
          960,
          790,
          42,
          themeColors.yellow,
        );
      }
    });
    focus(ctx, api, themeColors, 'hash-bound', () =>
      math(
        ctx,
        api,
        themeColors,
        collide > 0
          ? String.raw`\text{worst case: }O(n)`
          : String.raw`\text{expected: }O(1)\quad\text{with controlled load and useful hash spread}`,
        960,
        960,
        collide > 0 ? 45 : 31,
        collide > 0 ? themeColors.pink : themeColors.cyan,
      ),
    );
  }
}
export default {
  id: 'hash-lookup',
  draw: drawHashLookup,
  cues: ['hash-route', 'hash-equality', 'hash-collide', 'hash-walk', 'hash-bound'],
};
