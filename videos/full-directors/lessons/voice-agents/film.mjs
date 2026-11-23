import {checkPlaybackReceipt,prepareReceiptPicture} from './playback-receipt.mjs';
import {opening,listen,frames,checkListening} from './listening.mjs';
import {clocks,delayReplay,firstClause,cutoff,paging,checkReply} from './reply.mjs';
import {transport,samples,architecture,checkMedia} from './media.mjs';
import {cache,loadCalls,transfer,checkOperations} from './operations.mjs';

const scenes = {
  c01: opening,
  c02: listen,
  'c02-frames': frames,
  c03: clocks,
  'c03-delay': delayReplay,
  c04: firstClause,
  c05: cutoff,
  'c05-page': paging,
  c06: transport,
  'c06-pcm': samples,
  c07: architecture,
  'c07-cache': cache,
  'c08-load': loadCalls,
  c08: transfer,
};

export default {
  title: 'Building a Conversation Across Time',
  preparePicture(schedule) {
    return {playbackReceipt: prepareReceiptPicture(schedule)};
  },
  draw(ctx,clock) {
    if (clock.beat.id === 'c02-frames-batch') clocks(ctx,clock);
    else scenes[clock.beat.chapterId](ctx,clock);
  },
  check() {
    checkPlaybackReceipt();
    checkListening();
    checkReply();
    checkMedia();
    checkOperations();
    return true;
  },
};
