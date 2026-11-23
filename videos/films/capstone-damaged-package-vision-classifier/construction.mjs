import { visionRows } from './fixtures.mjs';
import { visionRoute } from './arithmetic.mjs';
export const visionTestRows = visionRows.filter((row) => row.photo.split === 'test');
export const visionServed = visionTestRows.map((row) => visionRoute(row.photo, row.output));
