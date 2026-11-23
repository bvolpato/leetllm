export class TokenBudget {
  constructor(cap) {
    if (!Number.isSafeInteger(cap) || cap < 0) throw Error('Invalid cap');
    this.cap = cap;
    this.spent = 0;
    this.pending = new Map();
    this.finished = new Map();
  }

  get free() {
    return this.cap - this.spent - [...this.pending.values()].reduce((a, b) => a + b, 0);
  }

  reserve(id, maximum) {
    if (!id || !Number.isSafeInteger(maximum) || maximum <= 0) throw Error('Invalid reservation');
    if (this.pending.has(id) || this.finished.has(id)) throw Error('Call ID already used');
    if (maximum > this.free) return false;
    this.pending.set(id, maximum);
    return true;
  }

  settle(id, used) {
    if (!Number.isSafeInteger(used) || used < 0) throw Error('Invalid usage');
    if (this.finished.has(id)) {
      if (this.finished.get(id) !== used) throw Error('Conflicting duplicate receipt');
      return;
    }
    if (!this.pending.has(id)) throw Error('Unknown call ID');
    if (used > this.pending.get(id)) throw Error('Backend exceeded reserved maximum');
    this.pending.delete(id);
    this.finished.set(id, used);
    this.spent += used;
  }

  snapshot(event) {
    return {
      event,
      spent: this.spent,
      free: this.free,
      reservations: [...this.pending].map(([id, value]) => ({ id, value })),
    };
  }
}

export function deadlineLedger() {
  const ledger = new TokenBudget(6000);
  ledger.reserve('C', 900);
  ledger.settle('C', 900);
  ledger.reserve('A', 2000);
  ledger.reserve('B', 2000);
  const initial = ledger.snapshot('D requested');
  ledger.settle('A', 1400);
  const receipt = ledger.snapshot('A settled');
  ledger.reserve('D', 1500);
  return { initial, receipt, admitted: ledger.snapshot('D admitted') };
}
