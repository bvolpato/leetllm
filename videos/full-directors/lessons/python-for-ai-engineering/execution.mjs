import { rows, decisions, score, quoted, bool } from './examples.mjs';

function folder(s, x, y, w, h, name, contents) {
  const { ctx, c, label, txt } = s;
  ctx.beginPath();
  ctx.moveTo(x, y + 14);
  ctx.lineTo(x, y);
  ctx.lineTo(x + w * 0.4, y);
  ctx.lineTo(x + w * 0.4 + 14, y + 14);
  ctx.lineTo(x + w, y + 14);
  ctx.lineTo(x + w, y + h);
  ctx.lineTo(x, y + h);
  ctx.closePath();
  ctx.fillStyle = c.wash;
  ctx.fill();
  ctx.strokeStyle = c.line;
  ctx.lineWidth = 1;
  ctx.stroke();
  label(name, x + 15, y + 43, { color: c.accent });
  contents.forEach((text, i) => txt(text, x + 15, y + 77 + i * 31, 20, { width: w - 30 }));
}

export function checkout(s) {
  const { b, c, cue, txt, label, line, paper, footer } = s;
  if (b === 0) {
    const work = cue(0, 'Our copy uses capitals');
    [
      ['Docker fixture', rows[1].prediction.trim().toLowerCase()],
      ['Working copy', rows[1].prediction],
    ].forEach(([name, v], i) => {
      const x = 49 + i * 444;
      paper(x, 163, 415, 180);
      label(name, x + 18, 207);
      txt('102', x + 18, 250, 33, { face: 'serif' });
      txt(i === 0 || work > 0 ? quoted(v) : '…', x + 19, 307, 32);
    });
    footer('Both spellings normalize to "escalated".');
  } else if (b === 1) {
    folder(s, 50, 160, 364, 212, 'Project checkout', [
      'pyproject.toml',
      '.python-version',
      'eval/',
    ]);
    const sync = cue(1, 'Run uv sync');
    s.wire(432, 261, 528, 261);
    folder(s, 548, 160, 348, 212, 'After uv sync', sync > 0 ? ['.venv/', 'uv.lock'] : []);
    footer('$ uv sync');
  } else {
    label('Project terminal', 49, 136);
    s.rect(49, 158, 862, 72, c.deep);
    txt('$ uv run scripts/score_access_requests.py', 68, 194, 24, { color: '#f5eddb', width: 818 });
    const open = cue(2, 'Open the file as UTF eight');
    label('Path("eval/access_requests.jsonl")', 52, 269);
    if (open > 0)
      rows.forEach((r, i) => {
        txt(String(i + 1).padStart(2, '0'), 54, 312 + i * 38, 18, { color: c.dim });
        txt('{"prompt": "' + r.prompt + '", …}', 114, 312 + i * 38, 21);
      });
    footer('with path.open("r", encoding="utf-8") as handle:');
  }
}

export function versions(s) {
  const { c, b, cue, txt, label, line, paint, footer } = s;
  if (b === 0) {
    const labels = ['3.12.2', '3.12.7', '3.13.0'];
    labels.forEach((v, i) => {
      const x = 220 + i * 244;
      txt(v, x, 194, 36, { align: 'center' });
      line(x, 226, x, 346, c.line, 1, true);
    });
    paint(97, 259, 733, 22, c.wash);
    line(97, 270, 830, 270, c.accent, 4);
    label('requires-python = ">=3.12"', 99, 239);
    const show = cue(0, 'Both fit that pin');
    if (show > 0) {
      line(97, 356, 548, 356, c.gold, 6);
      label('.python-version = 3.12', 99, 389, { color: c.gold });
    }
    footer('The checkout selects a minor release family.');
  } else if (b < 3) {
    const stages = [
      ['uv init --bare --python 3.12', 'pyproject.toml'],
      ['uv python pin 3.12', '.python-version'],
      ['uv sync', '.venv/  +  uv.lock'],
      ['uv run python --version', 'project Python'],
    ];
    const seen = [1, cue(1, 'Python pin writes'), cue(1, 'Sync creates'), cue(1, 'Uv run uses')];
    label('Command', 61, 143);
    label('What it creates or uses', 575, 143);
    stages.forEach(([a, z], i) => {
      const y = 201 + i * 59;
      txt(a, 61, y, 22, { width: 439 });
      line(514, y, 554, y);
      if (seen[i] > 0) txt(z, 575, y, 23, { color: c.accent, width: 329 });
    });
    footer(
      b === 2
        ? 'Alternative: python3.12 -m venv .venv     ·     Docker keeps requirements.txt'
        : 'Activation changes the executable that the shell finds.',
    );
  } else {
    folder(s, 48, 159, 352, 210, 'Inputs in Git', ['pyproject.toml', '.python-version', 'uv.lock']);
    s.wire(413, 262, 526, 262);
    const stale = cue(3, 'A locked sync or run stops');
    folder(
      s,
      546,
      159,
      360,
      210,
      b === 4 ? 'Plain uv run' : 'New checkout',
      b === 4
        ? ['May update uv.lock', 'Which input file?']
        : stale > 0
          ? ['metadata changed', 'lock out of date', 'scorer did not start']
          : ['uv sync --locked', '.venv/'],
    );
    footer(
      b === 4
        ? 'The lock records dependencies. The input file identifies requests.'
        : 'Rebuild the local environment from the portable inputs.',
    );
  }
}

export function program(s) {
  const { c, b, cue, label, txt, line, chip, code, footer } = s;
  if (b < 2) {
    const steps = [
      cue(0, 'On the first visit'),
      cue(0, 'On the middle visit'),
      cue(0, 'On the last visit'),
    ];
    label('score_examples(examples)', 53, 142);
    code(
      [
        'matches = 0',
        'for example in examples:',
        '    if exact_match(…):',
        '        matches += 1',
        'total = len(examples)',
      ],
      55,
      205,
      43,
      b === 1 ? 4 : 2,
      392,
      20,
    );
    let count = 0;
    const flags = decisions(rows);
    rows.forEach((r, i) => {
      const y = 200 + 66 * i;
      txt(r.id, 507, y, 23);
      if (steps[i] === 1) {
        count += Number(flags[i]);
        txt(bool(flags[i]), 597, y, 24, { color: flags[i] ? c.accent : c.red });
        txt('→ ' + count, 794, y, 26);
      }
    });
    if (b === 1) {
      const r = score(rows);
      line(497, 364, 907, 364);
      txt(
        '(' + r.matches + ', ' + r.total + ', ' + String(r.matches / r.total) + ')',
        505,
        398,
        24,
        {
          width: 401,
        },
      );
    }
    footer(
      b === 1
        ? 'matches, total, score = score_examples(examples)'
        : 'One visit per row. The conditional controls only the addition.',
    );
  } else if (b === 2 || b === 3) {
    if (b === 2) {
      label('if __name__ == "__main__":', 50, 145);
      const states = [
        ['Import in a test', 'scripts.score_access_requests', 'functions available'],
        ['Execute the file', '__main__', 'main(selected_path)'],
      ];
      states.forEach(([a, v, z], i) => {
        const y = 206 + 133 * i;
        label(a, 53, y);
        txt(v, 54, y + 43, 23, { width: 400 });
        s.wire(452, y + 42, 540, y + 42);
        chip(z, 548, y + 18, 350);
      });
      footer('sys.argv[0] holds the name of the script.');
    } else {
      label('sys.argv', 58, 138);
      const which =
        cue(3, 'Try two extra') > 0 ? 2 : cue(3, 'With just the script name') > 0 ? 0 : 1;
      const args = ['score_access_requests.py', 'trial.jsonl', 'other.jsonl'];
      args.slice(0, which + 1).forEach((v, i) => {
        const x = 55 + i * 289;
        label('[' + i + ']', x, 210);
        chip(v, x, 242, 271);
      });
      line(57, 335, 907, 335);
      txt(
        which === 2
          ? 'SystemExit("usage: …")'
          : which === 1
            ? 'main(Path(sys.argv[1]))'
            : 'main(DEFAULT_INPUT)',
        59,
        382,
        31,
        { color: which === 2 ? c.red : c.accent },
      );
      footer(
        which === 2
          ? 'No input file has been opened.'
          : which === 1
            ? 'Read trial.jsonl.'
            : 'Read eval/access_requests.jsonl.',
      );
    }
  } else {
    const fail = b === 5;
    const show = fail ? cue(5, 'stop before any metric') : cue(4, 'already printed the metric');
    const stages = ['load_examples', 'score_examples', 'print(metric)', 'check floor'];
    stages.forEach((v, i) => {
      const x = 55 + i * 220;
      const active = !fail || i === 0;
      s.disk(x + 87, 220, 12, active ? (fail ? c.red : c.accent) : c.line);
      if (i < 3) line(x + 99, 220, x + 294, 220, c.line, 2);
      txt(v, x + 87, 274, 19, { align: 'center', color: active ? c.ink : c.dim, width: 191 });
    });
    if (show > 0) {
      label(fail ? 'Input exception' : 'Below-floor run', 58, 351);
      txt(fail ? 'loader did not return' : 'stdout: metric     stderr: Gate failed', 58, 399, 25, {
        color: fail ? c.red : c.ink,
      });
    }
    footer(
      fail
        ? 'The command stops before score_examples.'
        : 'A valid below-floor score prints before exit status 1.',
    );
  }
}

export function environmentReplay(s) {
  const { c, b, cue, txt, label, chip, wire, footer } = s;
  const removed = cue(1, 'Try the same import again', 0);
  const extra =
    b === 0
      ? 1 - cue(0, 'removes packages')
      : b === 1
        ? cue(1, 'manually install') * (1 - removed)
        : 0;
  folder(s, 55, 166, 310, 222, '.venv/ inventory', ['pytest', 'selected dependencies']);
  if (extra > 0) {
    s.ctx.save();
    s.ctx.globalAlpha = extra;
    chip('six  1.17.0', 72, 310 + 22 * (1 - extra), 275, c.gold, c.paper);
    s.ctx.restore();
  }
  if (b === 0) {
    label('Project commands', 476, 163);
    txt('uv run --locked', 479, 222, 21);
    txt('unselected package can stay', 479, 266, 19, { color: c.accent });
    s.line(477, 306, 902, 306);
    txt('uv sync --locked', 479, 343, 23);
    txt('exact install by default', 479, 390, 22, { color: c.dim });
    footer('The lock check and the installed package inventory answer different questions.');
  } else if (b === 1) {
    label('Disposable environment   ·   command and outcome', 412, 132);
    const importSix = 'uv run --locked python -c "import six"';
    if (cue(1, 'The first locked run') > 0) txt(importSix, 412, 169, 21, { width: 495 });
    if (cue(1, 'Now run locked sync', 0))
      txt('exit 0   ·   import succeeded', 428, 199, 19, { color: c.accent });
    s.line(411, 226, 905, 226);
    if (cue(1, 'Now run locked sync') > 0) txt('uv sync --locked', 412, 257, 21);
    if (removed === 1) txt('exit 0   ·   removed six 1.17.0', 428, 287, 19, { color: c.accent });
    s.line(411, 315, 905, 315);
    if (cue(1, 'Try the same import again') > 0) txt(importSix, 412, 347, 21, { width: 495 });
    if (s.clock.elapsed >= s.clock.speechDuration) {
      txt("ModuleNotFoundError: No module named 'six'", 428, 381, 19, { width: 478, color: c.red });
      txt('exit 1', 428, 413, 18, { color: c.red });
    }
    footer('Track six in the inventory as each command runs.');
  } else {
    wire(375, 279, 508, 279);
    folder(
      s,
      523,
      166,
      382,
      222,
      b === 2 ? 'Clean checkout' : 'Replay inputs',
      b === 2
        ? ['declare the helper', 'review the lock', 'rebuild .venv/']
        : ['code + fixture + command', 'pin + lock', 'generator + seed (if used)'],
    );
    footer(
      b === 2
        ? 'Commit the dependency declaration and the reviewed lock.'
        : b === 3
          ? 'This scorer has no random draws.'
          : 'Hardware and library versions can also affect a numerical result.',
    );
  }
}
