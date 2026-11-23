import { group, line, place, polygon, polyline, rect, row } from 'vizmatic/stage';
import { photograph } from './inspection.mjs';
import { area, label, mono, note } from '../kit-narrated.mjs';
import {
  photos,
  cases,
  visionRows,
} from '../../films/capstone-damaged-package-vision-classifier/fixtures.mjs';
import {
  parcelGeometry,
  confusion,
} from '../../films/capstone-damaged-package-vision-classifier/arithmetic.mjs';
import { validateModel } from '../../films/capstone-damaged-package-vision-classifier/model.mjs';
validateModel();

export const COLOR = Object.freeze({
  photo: 'cyan',
  defect: 'pink',
  model: 'blue',
  outcome: 'green',
  current: 'yellow',
  failure: 'red',
});
export const [castArea, work] = area.columns([1, 2.25], 'loose');
export const ACTION = Object.freeze({
  priority_damage_review: 'Priority',
  normal_review: 'Normal',
  request_new_photo: 'New photo',
});
export { photos, cases, visionRows };

// Each row is the ending state of the right-hand mechanism. The cast remains unchanged.
export const STATE = Object.freeze({
  intro: 'quality precedes ranking',
  'evidence-contract': 'routes stop before order authority',
  labels: 'visible seam, hidden contents',
  groups: 'both views in train',
  'manifest-identity': '11 photos, 9 physical cases',
  'typed-inputs': 'validated outputs separate from labels',
  quality: 'dark view vetoed',
  'focus-stencil': 'variance 2/3',
  'contrast-intervention': 'variance 1/6 without blur',
  'exposure-detail': '4 pixels become 0.875',
  'ordered-router': '3 priority, 2 normal, 2 new-photo routes',
  threshold: 'cutoff frozen at 0.7',
  'development-threshold': '0.7 meets the worksheet constraints',
  preprocess: 'corner omitted',
  'transform-bundle': 'transform retained with weights',
  'representation-choice': 'shared holdout, separate candidates',
  'head-forward': 'logit -1',
  'head-update': 'lower toy loss',
  'masked-categories': 'unknown masked',
  'calibration-quality': 'temperature 2',
  'bundle-replay': 'rewritten threshold and route fail replay against the saved attempt',
  outcomes: 'one case in each cell',
  'outcome-clock': 'day-13 label outside day-12 readout',
  'case-reducer': 'priority wins once',
  'missing-evidence': 'empty metrics unknown',
  'source-slices': 'warehouse precision undefined',
  'receipt-boundary': 'hold synthetic fixture',
  'monitoring-response': 'candidate awaits evidence',
  synthesis: 'original route retains evidence',
  'fresh-parcel': 'late false negative joins at day 22',
});

// The parcel uses the existing model geometry. Coordinates are derived from its allotted region.
export function parcel(region, { dark = false, empty = false, torn = true } = {}) {
  const frame = place(
    rect(region.width, region.height, { fill: 'surface', stroke: 'grid', width: 2 }),
    region,
  );
  const width = Math.min(region.width, region.height / 0.65);
  const center = region.point('center');
  const geometry = empty
    ? []
    : parcelGeometry(center[0] - width / 2, center[1] - (width * 0.65) / 2, width, dark, torn);
  const marks = geometry.map((part) =>
    (part.closed ? polygon : polyline)(
      part.points.map((p) => [p.x, p.y]),
      { fill: part.closed ? part.fill : null, stroke: part.color, width: part.width },
    ),
  );
  return group(frame, ...marks);
}

export function cast(s, c) {
  const bands = castArea.rows(3, 'normal');
  const pictures = [],
    captions = [];
  for (const [i, photo] of photos.entries()) {
    const [image, caption] = bands[i].rows([3, 1], 'tight');
    pictures.push(photograph(image, ['dark', 'mailer', 'empty'][i]));
    captions.push(
      place(
        row(
          [
            mono(photo.id, { size: 34, color: 'cyan' }),
            mono('score ' + photo.damage.toFixed(2), { size: 30 }),
          ],
          { gap: 'wide' },
        ),
        caption,
      ),
    );
  }
  const nodes = [...pictures, ...captions.flatMap((x) => x.nodes)];
  s.add(nodes);
  return { nodes, pictures, captions };
}

// A case board has room for its physical identities before any outcome is revealed.
export function caseBoard(region) {
  const [head, body] = region.rows([1, 5], 'normal');
  const names = head
    .columns(2, 'normal')
    .map((region, i) => place(label(['Priority', 'Nonpriority'][i]), region));
  const regions = body.rows(2, 'normal').flatMap((r) => r.columns(2, 'normal'));
  const keys = ['TP', 'FN', 'FP', 'TN'];
  const skeleton = regions.flatMap((r, i) => {
    const [cap] = r.rows([1, 2], 'tight');
    return [
      place(rect(r.width, r.height, { fill: 'surface', stroke: 'grid', width: 2 }), r),
      place(note(keys[i] + (i < 2 ? ' · damaged' : ' · clear')), cap),
    ];
  });
  const slots = Object.fromEntries(
    keys.map((key, i) => [key, regions[i].rows([1, 2], 'tight')[1]]),
  );
  const counts = confusion(cases);
  const tokens = cases.map((r) => {
    const key = r.score >= 0.7 ? (r.gold ? 'TP' : 'FP') : r.gold ? 'FN' : 'TN';
    return place(mono(r.id, { color: r.gold ? 'green' : 'cyan' }), slots[key]);
  });
  return { skeleton: [names, skeleton], slots, tokens, counts };
}

// A clipped view of the same geometry, with a crop expressed as source-image fractions.
export function cropParcel(region, left, span = 0.6, top = 0, height = 1) {
  const source = parcelGeometry(0, 0, 1, false, true);
  const bottom = 0.65;
  const edges = [
    [0, left, true],
    [0, left + span, false],
    [1, top * bottom, true],
    [1, (top + height) * bottom, false],
  ];
  const project = (p) => [
    region.left + ((p[0] - left) / span) * region.width,
    region.top + ((p[1] / bottom - top) / height) * region.height,
  ];
  const inside = (p, [axis, limit, low]) => (low ? p[axis] >= limit : p[axis] <= limit);
  const cross = (a, b, [axis, limit]) => {
    const t = (limit - a[axis]) / (b[axis] - a[axis]);
    return [a[0] + t * (b[0] - a[0]), a[1] + t * (b[1] - a[1])];
  };
  const nodes = [
    place(rect(region.width, region.height, { fill: 'surface', stroke: 'grid', width: 2 }), region),
  ];
  for (const part of source) {
    let points = part.points.map((p) => [p.x, p.y]);
    if (part.closed) {
      for (const edge of edges) {
        const old = points;
        points = [];
        for (let i = 0; i < old.length; i++) {
          const a = old[i],
            b = old[(i + 1) % old.length],
            ia = inside(a, edge),
            ib = inside(b, edge);
          if (ia) points.push(a);
          if (ia !== ib) points.push(cross(a, b, edge));
        }
      }
      if (points.length > 2)
        nodes.push(
          polygon(points.map(project), { fill: part.fill, stroke: part.color, width: part.width }),
        );
    } else {
      for (let i = 0; i < points.length - 1; i++) {
        let a = points[i],
          b = points[i + 1],
          ok = true;
        for (const edge of edges) {
          const ia = inside(a, edge),
            ib = inside(b, edge);
          if (!ia && !ib) {
            ok = false;
            break;
          }
          if (ia !== ib) {
            const p = cross(a, b, edge);
            if (!ia) a = p;
            else b = p;
          }
        }
        if (ok) nodes.push(line(project(a), project(b), { stroke: part.color, width: part.width }));
      }
    }
  }
  return group(...nodes);
}
