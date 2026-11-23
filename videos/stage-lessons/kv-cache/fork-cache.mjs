// Each number stands for a distinct K/V pair in the article's four-slot fixture.
export const entries = Object.fromEntries([
  ['The', 10], ['fox', 20], ['ran', 30], ['straight', 40],
  ['home', 90], ['away', 80], ['Rain', 50],
].map(([token, tag]) => [token, { token, tag }]));

export const blockSize = 4;
const emptyBlock = () => Array(blockSize).fill(null);

export class ForkCache {
  constructor(prefix) {
    this.blocks = [emptyBlock()];
    this.tables = { A: [0] };
    this.lengths = { A: 0 };
    for (const word of prefix) this.append('A', word);
  }

  fork() {
    this.tables.B = [...this.tables.A];
    this.lengths.B = this.lengths.A;
  }

  owners(id) {
    return Object.keys(this.tables).filter(branch => this.tables[branch].includes(id));
  }

  read(branch, position) {
    if (position >= this.lengths[branch]) throw new RangeError('Position is outside the valid prefix');
    const id = this.tables[branch][Math.floor(position / blockSize)];
    return this.blocks[id][position % blockSize];
  }

  copyTail(branch) {
    const old = this.tables[branch].at(-1);
    const valid = this.lengths[branch] % blockSize;
    if (!valid || this.owners(old).length < 2) throw new Error('Expected a shared partial tail');
    const copy = emptyBlock();
    copy.splice(0, valid, ...this.blocks[old].slice(0, valid));
    return this.blocks.push(copy) - 1;
  }

  moveTail(branch, id) {
    this.tables[branch].splice(-1, 1, id);
  }

  append(branch, word, { unsafe = false } = {}) {
    const position = this.lengths[branch];
    const logical = Math.floor(position / blockSize);
    const table = this.tables[branch];
    if (logical === table.length) table.push(this.blocks.push(emptyBlock()) - 1);
    const id = table[logical];
    if (!unsafe && this.owners(id).length !== 1) throw new Error('A writer needs a private slot');
    this.blocks[id][position % blockSize] = entries[word];
    this.lengths[branch]++;
  }

  retire(branch) {
    delete this.tables[branch];
    delete this.lengths[branch];
  }

  admit(branch, id, firstWord) {
    if (this.owners(id).length) throw new Error('Cannot reuse an owned block');
    this.blocks[id] = emptyBlock();
    this.tables[branch] = [id];
    this.lengths[branch] = 0;
    this.append(branch, firstWord);
  }
}
