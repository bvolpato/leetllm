import { area, ACCEPTANCE, actual, begin, metrics, number, peakDiagnostic, plate, residual, TOLERANCE, words } from '../parts.mjs';

export default function synthesis(s, c) {
  begin(s, c);
  const [gains, ledger, standard, verdict] = area.rows([2, 3, 2, 2], 'normal');
  const [err, cost] = gains.columns(2, 'wide');
  const m = metrics(actual.length), peak = peakDiagnostic();
  const n = m.n, minimum = Math.ceil(ACCEPTANCE * n);
  s.add(words(err, 'MAE   ' + m.baseline.toFixed(3) + ' → ' + m.mae.toFixed(3) + ' parcels', 'cyan', 38));
  c.show('peak', words(cost, 'Peak   ' + peak.baselineUnits + ' → ' + peak.candidateUnits.toFixed(3) + ' units', 'green', 38));
  const blocks = ledger.columns(n, 'tight');
  const marks = blocks.flatMap((r, i) => {
    const [day, error] = r.rows(2, 'tight');
    const pass = Math.abs(residual(i)) <= TOLERANCE;
    return [plate(r, pass ? 'green' : 'red'), words(day, String(i + 2), 'dim', 32), words(error, pass ? 'in' : 'out', pass ? 'green' : 'red', 36)];
  });
  c.show('count-days', marks);
  const gate = number(standard, m.inside + ' of ' + n + ' within ±6 parcels     ·     required ≥ 85%', 'yellow', 41);
  c.show('require', gate);
  const ask = words(verdict, 'Does this candidate pass the local comparison?', 'yellow', 44);
  c.show('ask', ask);
  c.swap('minimum', ask, words(verdict, 'Hold   ·   ' + minimum + ' days needed   ·   ' + m.inside + ' qualified', 'red', 49));
}
