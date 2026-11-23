import { Bench } from './bench.mjs';
import { check } from './evidence.mjs';
import { comparator, adapters, pdf, ocr, table, webPage, markdown } from './extraction.mjs';
import { provenance, chunking, versioning, pageSearch } from './publication.mjs';
import { gate, isolation, practice } from './release.mjs';

const painters = [comparator, adapters, pdf, ocr, table, webPage, markdown,
  provenance, chunking, versioning, pageSearch, gate, isolation, practice];
export default {
  title: 'Turning a Page into Grounded Evidence',
  draw(ctx, clock) { painters[clock.beat.chapterIndex](new Bench(ctx), clock); },
  check,
};
