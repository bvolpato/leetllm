import { arrow, boxOf, column, dot, pictogram, place, rect, table, to } from 'vizmatic/stage';
import { chip, label, mono, note } from '../../kit-narrated.mjs';
import { repositoryContext } from '../parts.mjs';

export default function environment(s, c) {
  const { main } = repositoryContext(s, c);
  const [buildBand, transferTrack, contractBand, foot] = main.rows([3, 1, 3, 1], 'wide');
  const [sourceBand, gap, destination] = buildBand.columns([2, 1, 2], 'normal');
  const source = place(
    column(
      [
        pictogram('workflow', { size: 130, color: 'cyan' }),
        mono('tracked setup', { size: 36, color: 'cyan' }),
      ],
      { gap: 'normal' },
    ),
    sourceBand,
  );
  const [environmentTitle, interpreterArea] = destination.rows([1, 4], 'normal');
  const interpreter = place(
    column(
      [
        pictogram('process', { size: 130, color: 'blue' }),
        mono('.venv/bin/python', { size: 34, color: 'blue' }),
      ],
      { gap: 'normal' },
    ),
    interpreterArea,
  );
  const environment = place(
    rect(destination.width, destination.height, {
      fill: 'surface',
      stroke: 'dim',
      strokeWidth: 2,
      radius: 12,
    }),
    destination,
  ).zIndex(-1);
  const environmentName = place(note('new local environment'), environmentTitle);
  const route = arrow(
    transferTrack.columns([2, 1, 2], 'normal')[0].point('center'),
    transferTrack.columns([2, 1, 2], 'normal')[2].point('center'),
    { stroke: 'dim', pad: 18 },
  );
  const packet = dot(15, 'cyan').moveTo(
    transferTrack.columns([2, 1, 2], 'normal')[0].point('center'),
  );
  const contracts = place(
    table(
      [
        { key: 'id', label: 'tracked input', mono: true, sample: 'requirements.txt' },
        { key: 'meaning', label: 'destination uses it to', sample: 'verify interpreter version' },
      ],
      [
        { id: 'setup script', meaning: 'rebuild the environment' },
        { id: 'requirements.txt', meaning: 'install no extra packages' },
        { id: '.env.example', meaning: 'carry variable names' },
      ],
      { width: contractBand.width, size: 34, leading: 1.9 },
    ),
    contractBand,
  );
  const receipt = place(mono('python --version', { color: 'yellow' }), foot);
  const [templateArea, localArea] = foot.columns(2, 'wide');
  const names = place(mono('.env.example   ACCESS_API_KEY=', { size: 37, color: 'cyan' }), templateArea);
  const copy = place(mono('cp .env.example .env', { size: 37, color: 'blue' }), localArea);
  const localFile = place(mono('.env (ignored)   ACCESS_API_KEY=…', { size: 37, color: 'pink' }), localArea);
  const lfs = place(mono('Git pointer → separate weight bytes', { size: 36, color: 'cyan' }), foot);
  s.add(source, environment, environmentName, route);
  c.show('standard-library', contracts);
  c.show('rebuild-venv', packet, { fade: 0.1 });
  c.on(
    'rebuild-venv',
    () =>
      s.play(
        to(packet, (n) => n.moveTo(transferTrack.columns([2, 1, 2], 'normal')[2].point('center')), {
          duration: 1.0,
        }),
      ),
    0.15,
  );
  c.hide('rebuild-venv', packet, { lead: -1.3, fade: 0.1 });
  c.show('rebuild-venv', interpreter, { after: true });
  c.show('environment-receipt', receipt);
  c.swap('environment-names', receipt, names);
  c.on('environment-names', () => s.play(contracts.light('.env.example')));
  c.show('copy-template', copy);
  c.swap('local-key', copy, localFile);
  c.swap('lfs-boundary', [names, localFile], lfs);
  c.clear([route], 0.46, 0.2);
}
