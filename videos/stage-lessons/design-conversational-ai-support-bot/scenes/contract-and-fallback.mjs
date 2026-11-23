import { assertEqual, fitted, place, rect, table, to } from 'vizmatic/stage';
import { label, note } from '../../kit-narrated.mjs';
import { MAIN, FOOT, open, original } from '../parts.mjs';

export default function contract(s, c) {
  open(s, c, 'state');
  const ceilingCents = 0.5,
    ceilingDollars = ceilingCents / 100;
  assertEqual(ceilingDollars, 0.005, 'Half a cent in dollars.');
  const [lanesArea, cacheArea, statusArea] = MAIN.rows([5, 1.9, 0.5], 'normal');
  const lanes = lanesArea.rows(2, 'normal');
  const slots = lanes.map((region) => region.columns([1, 4], 'wide'));
  const rails = lanes.map((region) =>
    place(
      rect(region.width, region.height, { fill: 'surface', stroke: 'grid', radius: 12 }),
      region,
    ),
  );
  const processors = ['PRIMARY', 'FALLBACK'].map((words, i) =>
    place(label(words, { size: 30, color: 'cyan' }), slots[i][0]),
  );
  const record = place(
    fitted(slots[0][1], (width) =>
      table(
        [{ key: 'contract' }, { key: 'retained value' }],
        [
          {
            id: 'identity',
            contract: 'request',
            'retained value': original.customer + ' · ' + original.ticket + ' · private billing',
          },
          {
            id: 'permissions',
            contract: 'permissions',
            'retained value': 'invoice read + guarded write · review required',
          },
          {
            id: 'version',
            contract: 'version + output',
            'retained value': original.policy + ' · reviewed content · cited + schema',
          },
          {
            id: 'ceiling',
            contract: 'ceiling',
            'retained value': '$' + ceilingDollars.toFixed(3) + ' / generation · declared only',
          },
        ],
        { width, size: 29, leading: 1.5 },
      ),
    ),
    slots[0][1],
  );
  const [cacheTableArea, privateArea] = cacheArea.rows([2, 1], 'normal');
  const cache = place(
    fitted(cacheTableArea, (width) =>
      table(
        [
          { key: 'entry', label: 'Public cache entry' },
          { key: 'lookup', label: 'Lookup key', sample: 'US | v4 | public', marks: true },
        ],
        [{ id: 'key', entry: 'US | v3 | public', lookup: { value: '', state: 'pending' } }],
        { width, size: 30, leading: 1.5 },
      ),
    ),
    cacheTableArea,
  );
  const privatePath = place(
    label('Private billing write → guarded executor', { size: 34, color: 'blue' }),
    privateArea,
  );
  const ceiling = place(
    label('$' + ceilingDollars.toFixed(3) + ' declared per generation', {
      color: 'yellow',
      size: 36,
    }),
    statusArea,
  );
  const invalid = place(
    label('Version changes: old public entry no longer matches', { color: 'red', size: 34 }),
    statusArea,
  );
  const permission = place(
    label('Before a write: check permission for this invoice', { color: 'yellow', size: 36 }),
    statusArea,
  );
  const foot = place(
    note('The same request record carries its permissions and ceiling into fallback.'),
    FOOT,
  );
  s.add(rails, processors, record, cache, foot);
  c.on('compile-contract', () => s.play(record.light('identity')));
  c.on('version-content', () => s.play(record.light('version')));
  c.show('stub-ceiling', ceiling, { after: true });
  c.on('stub-ceiling', () => s.play(record.light('ceiling')));
  c.on('fallback-contract', () =>
    s.play(to(record, () => place(record, slots[1][1]), { duration: 1.4 })),
  );
  c.show('private-cache', privatePath);
  c.on('private-cache', () => s.play(record.light(null)));
  c.after('private-cache', () =>
    s.play(cache.setCell('key', 'lookup', { value: 'US | v3 | public', state: 'pass' })),
  );
  c.on('cache-version', () =>
    s.play(
      cache.setCell('key', 'lookup', { value: 'US | v4 | public', state: 'fail' }),
      cache.light('key', 'lookup'),
    ),
  );
  c.swap('cache-version', ceiling, invalid, { after: true });
  c.swap('screen-authority', invalid, permission);
}
