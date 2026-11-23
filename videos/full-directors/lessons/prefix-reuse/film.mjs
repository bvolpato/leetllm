import { check } from './examples.mjs';
import { opening, inheritance, boundaries, layout } from './tokens.mjs';
import { publication, endpoints, isolation, capacity } from './storage.mjs';
import { ledger, receipts, pricing, routing, diagnosis, budget } from './decisions.mjs';

const painters = {
  c01: opening,
  c02: inheritance,
  c03: boundaries,
  c04: layout,
  c05: publication,
  'c05-window': endpoints,
  c06: isolation,
  c07: capacity,
  c08: ledger,
  usage: receipts,
  bill: pricing,
  route: routing,
  replay: diagnosis,
  budget,
};
export default {
  title: 'Reusing the Beginning of a Conversation',
  draw(context, clock) {
    painters[clock.beat.chapterId](context, clock);
  },
  check,
};
