import { bench } from './workshop.mjs';
import { trays, uncertainty, estimands, weights, support, checkTickets } from './tickets.mjs';
import {
  unit,
  assignment,
  junctions,
  instrument,
  wald,
  weak,
  release,
  checkRouting,
} from './routing.mjs';
import { audit, pairings, checkPairingAudit } from './pairing-audit.mjs';
import { evaluation, checkEvaluation } from './policy.mjs';

const chapters = {
  c01: trays,
  c02: unit,
  c03: trays,
  c04: assignment,
  c05: junctions,
  c06: assignment,
  c07: assignment,
  c08: trays,
  c09: uncertainty,
  c10: pairings,
  c11: estimands,
  c12: pairings,
  c13: support,
  c14: weights,
  c15: weights,
  c16: support,
  c17: instrument,
  c18: wald,
  c19: weak,
  ...evaluation,
  c26: release,
  c27: audit,
  c28: audit,
};
function draw(ctx, clock) {
  ctx.save();
  ctx.scale(2, 2);
  bench(ctx);
  chapters[clock.beat.chapterId](ctx, clock);
  ctx.restore();
}
function check() {
  checkTickets();
  checkRouting();
  checkPairingAudit();
  checkEvaluation();
}
export default {
  title: 'Causal inference: follow the tickets from assignment to policy value',
  draw,
  check,
};
