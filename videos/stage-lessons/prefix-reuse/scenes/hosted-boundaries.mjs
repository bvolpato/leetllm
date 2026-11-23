import { assertEqual, beside, boxOf, dot, draw, line, to } from 'vizmatic/stage';
import { mono, note } from '../../kit-narrated.mjs';
import { board, body, caption, fmt, gauge, guide, ledger, readings } from '../parts.mjs';

export default function hostedBoundaries(s, c) {
  board(s, c, 'What does the marker qualify for?', 'OpenAI example · October 2026 contract');
  const minimum = 1024, selected = minimum - 1;
  const [warm, read, detail] = body.rows(3, 'wide');
  const max = guide + ledger.rows[0].tail;
  const envelopes = [warm, read].map((region, i) => gauge(region, i ? 'Request' : 'Warmup', [
    ['guide', guide, 'blue'], ['tail', ledger.rows[i].tail, 'pink'],
  ], max));
  const position = (i, tokens) => {
    const bar = boxOf(envelopes[i].bar.frame);
    return [bar.left + bar.width * tokens / max, bar.top - 34];
  };
  const markers = envelopes.map((_, i) => dot(13, 'yellow').moveTo(position(i, guide)));
  const shortMarkers = envelopes.map((_, i) => dot(13, 'yellow').moveTo(position(i, selected)));
  const guideEnd = markers.map((mark) =>
    beside(note(fmt(guide) + ' selected', { size: 31, color: 'yellow' }), mark, 'left', 'tight'));
  const shortEnd = shortMarkers.map((mark) =>
    beside(note(fmt(selected) + ' selected', { size: 31, color: 'yellow' }), mark, 'right', 'normal'));
  const [zoomName, field] = detail.columns([1, 4.5], 'wide');
  const [lo, hi] = field.columns(2, 'wide').map((r) => r.point('center'));
  const zoom = [
    caption('Endpoint zoom', zoomName, { align: 'left', size: 36 }),
    line(lo, hi, { stroke: 'dim', width: 4 }), dot(10, 'yellow').moveTo(lo),
    mono(fmt(selected) + ' selected', { size: 34, color: 'yellow' }).moveTo([lo[0], lo[1] + 44]),
  ];
  const threshold = [
    dot(10, 'blue').moveTo(hi),
    mono(fmt(minimum) + ' minimum', { size: 34, color: 'blue' }).moveTo([hi[0], hi[1] + 44]),
  ];
  s.add(envelopes.map((r) => r.nodes));
  c.show('host-marker', [markers[0], guideEnd[0]]);
  c.show('host-endpoint', [markers[1], guideEnd[1]]);
  c.hide('host-none', [markers, guideEnd]);
  c.show('host-min', [shortMarkers, shortEnd, zoom], { after: true });
  c.show('host-minimum', threshold, { after: true });
  c.hide('host-prewarm', [zoom, threshold, shortEnd]);
  c.on('host-prewarm', () => s.play(...shortMarkers.map((m, i) =>
    to(m, (n) => n.moveTo(position(i, guide)))), { duration: 0.65 }));
  c.show('host-write', guideEnd, { after: true });

  const writtenHours = 12, readAt = 9, readExpiry = readAt + 0.5;
  const finalExpiry = Math.max(writtenHours, readExpiry);
  assertEqual(finalExpiry, 12, 'The shorter read preserves the existing midnight expiry.');
  const [names, track] = body.columns([1, 4.35], 'wide');
  const [writeBand, readBand] = body.rows(2, 'wide');
  const clockX = (hours) => track.left + 108 + (track.width - 248) * hours / writtenHours;
  const clockBand = (band, start, stop, name, color) => {
    const y = band.cy;
    const rail = line([clockX(0), y], [clockX(writtenHours), y], { stroke: 'dim', width: 3 });
    const span = line([clockX(start), y], [clockX(stop), y], { stroke: color, width: 13 });
    const title = note(name, { size: 39, color }).moveTo([names.cx, y]);
    return { rail, span, title };
  };
  const write = clockBand(writeBand, 0, writtenHours, 'Write', 'blue');
  const refresh = clockBand(readBand, readAt, readExpiry, 'Read', 'yellow');
  const at = (text, hr, y, color) => note(text, { size: 36, color }).moveTo([clockX(hr), y]);
  const writeTicks = [
    at('Noon', 0, writeBand.cy - 51, 'ink'),
    at('Midnight', writtenHours, writeBand.cy - 51, 'ink'),
  ];
  const readTime = at('9 p.m. + 30 min', readAt, readBand.cy - 52, 'yellow');
  const readEnd = at('9:30 p.m.', readExpiry, readBand.cy + 49, 'yellow');
  const limit = line([clockX(finalExpiry), writeBand.cy + 13], [clockX(finalExpiry), readBand.cy + 13], {
    stroke: 'green', width: 4,
  });
  c.swap('host-lifetime', [envelopes.map((r) => r.nodes), shortMarkers, guideEnd],
    [write.rail, write.title, writeTicks, refresh.rail, refresh.title]);
  c.on('host-lifetime', () => s.play(draw(write.span), { duration: 0.95 }), 0.35);
  c.show('host-refresh', readTime);
  c.on('host-refresh', () => s.play(draw(refresh.span), { duration: 0.55 }));
  c.show('host-expiry', limit, { after: true, lead: 0 });
  c.show('host-half', readEnd, { after: true, lead: 0 });
  readings(s, c, 'The provider checks the selected endpoint.', [
    ['host-unmarked', 'Explicit-only mode   ·   no endpoint selected', 'dim'],
    ['host-ask', 'Can a longer question qualify the marked prefix?', 'yellow'],
    ['host-short', fmt(selected) + ' selected   <   ' + fmt(minimum) + ' required', 'red'],
    ['host-write', 'Prewarm   ·   guide entry written   ·   no answer generated', 'blue', 'host-lifetime'],
    ['host-lifetime', 'Existing write coverage', 'blue'],
    ['host-clock-question', 'When does coverage end after this read?', 'yellow'],
    ['host-expiry', 'Coverage still ends at midnight.', 'green'],
  ]);
}
