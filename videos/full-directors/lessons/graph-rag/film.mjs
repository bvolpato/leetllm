import {
  opening,
  triples,
  identity,
  trace,
  claims,
  shelf,
  drift,
  access,
  finish,
  checkCatalogue,
} from './catalogue.mjs';
import { extract, incident, communities, checkInvestigation } from './investigation.mjs';
import { local, selection, indexing, workload, checkRouting } from './routing.mjs';

const painters = [
  opening,
  triples,
  identity,
  trace,
  claims,
  extract,
  incident,
  communities,
  shelf,
  local,
  selection,
  drift,
  indexing,
  workload,
  access,
  finish,
];

export default {
  title: 'Following Evidence Through a Graph',
  draw(ctx, clock) {
    ctx.save();
    ctx.scale(1.6, 1.6);
    painters[clock.beat.chapterIndex](ctx, clock);
    ctx.restore();
  },
  check() {
    checkCatalogue();
    checkInvestigation();
    checkRouting();
    return true;
  },
};
