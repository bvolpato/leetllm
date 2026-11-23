const themes = {
  paper: { page: '#f8efd9', edge: '#e6d7b8', ink: '#282b29', dim: '#645d50', rule: '#ab9e87', green: '#14645c', light: '#c9ded0', red: '#a83732', rose: '#f4c8b1', gold: '#97631d', pale: '#efd792', face: '#fff8e9' },
  slate: { page: '#162f39', edge: '#0d232e', ink: '#fff3d9', dim: '#c1d1c9', rule: '#57757b', green: '#89dcc4', light: '#244f50', red: '#ffae8e', rose: '#673e39', gold: '#f7d777', pale: '#5e5134', face: '#25414c' }
};

export const clamp = (n) => Math.min(1, Math.max(0, n));
export const mix = (a, b, p) => a + (b - a) * p;

export class Press {
  constructor(ctx, clock, theme = 'paper') {
    this.ctx = ctx;
    this.clock = clock;
    this.b = clock.beat.beatIndex + 1;
    Object.assign(this, themes[theme]);
    const ground = ctx.createLinearGradient(0, 0, 1650, 1080);
    ground.addColorStop(0, this.page);
    ground.addColorStop(.76, this.page);
    ground.addColorStop(1, this.edge);
    this.box(0, 0, 1920, 1080, ground);
  }

  cue(beat, phrase, seconds = .55) {
    if (this.b !== beat) return this.b > beat ? 1 : 0;
    const t = this.clock.reveal(phrase, seconds);
    return t * t * (3 - 2 * t);
  }

  label(value, x, y, size = 42, options = {}) {
    const {family = 'Sans', color = this.ink, align = 'left', weight = 400, max = 1740} = options;
    const c = this.ctx;
    c.font = weight + ' ' + size + 'px "Lesson ' + family + '", "Hiragino Sans", sans-serif';
    c.textBaseline = 'middle';
    c.textAlign = align;
    c.fillStyle = color;
    c.fillText(String(value), x, y, max);
  }

  mono(value, x, y, size = 46, color = this.ink, align = 'left', max = 1740) {
    this.label(value, x, y, size, {family: 'Mono', color, align, max});
  }

  title(value, context) {
    this.label(value, 100, 118, 79, {family: 'Serif', max: context ? 1250 : 1720});
    if (context) this.label(context, 1820, 129, 36, {color: this.dim, align: 'right', max: 475});
    this.line(100, 183, 1820, 183, this.rule, 2);
  }

  box(x, y, w, h, fill, radius = 0) {
    if (w <= 0 || h <= 0) return;
    const c = this.ctx;
    c.fillStyle = fill;
    if (radius) {
      c.beginPath();
      c.roundRect(x, y, w, h, radius);
      c.fill();
    } else c.fillRect(x, y, w, h);
  }

  line(x, y, endX, endY, color = this.rule, width = 4) {
    const c = this.ctx;
    c.beginPath();
    c.moveTo(x, y);
    c.lineTo(endX, endY);
    c.strokeStyle = color;
    c.lineWidth = width;
    c.stroke();
  }

  circle(x, y, r, fill) {
    const c = this.ctx;
    c.beginPath();
    c.arc(x, y, r, 0, Math.PI * 2);
    c.fillStyle = fill;
    c.fill();
  }

  sparkle(x, y, r, color = this.gold) {
    const c = this.ctx;
    const star = (cx, cy, size) => {
      c.beginPath();
      c.moveTo(cx, cy-size);
      c.quadraticCurveTo(cx+size*.11, cy-size*.1, cx+size*.77, cy);
      c.quadraticCurveTo(cx+size*.1, cy+size*.1, cx, cy+size);
      c.quadraticCurveTo(cx-size*.1, cy+size*.1, cx-size*.77, cy);
      c.quadraticCurveTo(cx-size*.1, cy-size*.1, cx, cy-size);
      c.fillStyle = color;
      c.fill();
    };
    star(x+r*.14, y, r*.85);
    star(x-r*.56, y-r*.46, r*.32);
    star(x-r*.5, y+r*.46, r*.25);
  }

  fixedText(word, x, y, cell, size, color = this.ink) {
    [...word].forEach((ch,i) => {
      const cx = x+(i+.5)*cell;
      if (ch === '✨') this.sparkle(cx,y,size*.52);
      else this.mono(ch,cx,y,size,color,'center');
    });
  }

  brace(x, end, y, depth = 23, color = this.dim) {
    this.line(x, y, x, y + depth, color);
    this.line(x, y + depth, end, y + depth, color);
    this.line(end, y + depth, end, y, color);
  }

  // The raised face prints a piece. Its width registers to the number of letters it covers.
  slug(x, y, width, height, word, {face = this.face, ink = this.ink, size = 64, family = 'Mono'} = {}) {
    this.box(x + 3, y + 10, width, height, this.rule, 5);
    this.box(x, y, width, height, face, 5);
    this.line(x + 4, y + 3, x + width - 4, y + 3, '#fff9e540', 3);
    this.line(x + 4, y + height - 3, x + width - 4, y + height - 3, ink, 3);
    this.label(word, x + width / 2, y + height * .53, size, {family, color: ink, align: 'center', max: width * .92});
  }

  sorts(pieces, x, y, unit, {height = 98, size = 60, faces = [], inks = [], gap = 8} = {}) {
    for (const [i, piece] of pieces.entries()) {
      const width = [...piece].length * unit;
      this.slug(x, y, width - gap, height, piece.replaceAll(' ', '·'), {face: faces[i], ink: inks[i], size});
      x += width;
    }
  }

  note(value, y = 895, color = this.ink) {
    this.label(value, 960, y, 51, {family: 'Serif', align: 'center', color, max: 1700});
  }

  fade(alpha, paint) {
    if (alpha <= 0) return;
    this.ctx.save();
    this.ctx.globalAlpha *= alpha;
    paint();
    this.ctx.restore();
  }
}

