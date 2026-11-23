import { Path2D } from '@napi-rs/canvas';

// Seminar room and figures from the approved course short.
const lerp = (a, b, t) => a + (b - a) * t;
const silhouettes = new Map();
function fill(ctx, shape, color) {
  if (!silhouettes.has(shape)) silhouettes.set(shape, new Path2D(shape));
  ctx.fillStyle = color;
  ctx.fill(silhouettes.get(shape));
}

function rect(ctx, x, y, w, h, color) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);
}

function stroke(ctx, x, y, x2, y2, color, width) {
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x2, y2);
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.stroke();
}

// The low afternoon sun cuts across the acoustic planks. The projection stays in shade.
function seminarRoom(ctx) {
  const wall = ctx.createLinearGradient(0, 0, 1700, 920);
  wall.addColorStop(0, '#dfb392');
  wall.addColorStop(0.43, '#bb8880');
  wall.addColorStop(1, '#72596c');
  rect(ctx, -340, -220, 2700, 1500, wall);
  for (let x = -125; x < 2150; x += 52) {
    rect(ctx, x, -120, 3, 1090, '#6f536254');
    rect(ctx, x + 4, -120, 2.1, 1090, '#ffe8b839');
    for (let k = 0; k < 3; k++) {
      const start = 120 + 165 * k + 89 * Math.sin(x * 0.27 + k);
      stroke(ctx, x + 17 + 4 * k, start, x + 18 + 4 * k, start + 94, '#563f531c', 1.4);
    }
  }
  fill(
    ctx,
    'M-160 490 L278 -70 L344 -70 L-140 557 Z M-120 679 L426 -30 L515 -30 L-130 799 Z',
    '#ffe0a875',
  );
  rect(ctx, -200, 871, 2420, 14, '#735665');
  rect(ctx, -200, 884, 2420, 320, '#a57e78');
  rect(ctx, -200, 888, 2420, 6, '#f4c6a580');
  // A pull-down screen with a rolled lip, wall shadow, bottom bar and pull cord.
  rect(ctx, 254, 88, 1424, 759, '#543d4d55');
  rect(ctx, 235, 67, 1424, 759, '#342f3d');
  const light = ctx.createRadialGradient(759, 315, 50, 924, 390, 956);
  light.addColorStop(0, '#fffbee');
  light.addColorStop(0.74, '#f6f2e7');
  light.addColorStop(1, '#e2ded1');
  rect(ctx, 245, 76, 1404, 738, light);
  rect(ctx, 216, 57, 1462, 25, '#423c47');
  rect(ctx, 219, 57, 1454, 5, '#b5a7aa');
  rect(ctx, 228, 813, 1438, 13, '#46404c');
  stroke(ctx, 945, 826, 945, 864, '#624d58', 3);
  ctx.beginPath();
  ctx.ellipse(945, 870, 7, 11, 0, 0, 2 * Math.PI);
  ctx.strokeStyle = '#594b56';
  ctx.lineWidth = 2.5;
  ctx.stroke();
}

function presenter(ctx) {
  // The remote and the presenter's gaze lead back into the screen.
  fill(
    ctx,
    'M1717 969 L1859 969 L1869 1120 L1789 1120 L1782 1041 L1760 1120 L1689 1120 Z',
    '#39384e',
  );
  fill(
    ctx,
    'M1767 575 Q1753 562 1757 537 L1746 525 Q1742 521 1749 513 L1758 498 Q1753 462 1781 451 Q1813 438 1832 463 Q1846 486 1832 514 L1814 538 L1818 565 L1841 583 L1810 626 Z',
    '#b97666',
  );
  fill(
    ctx,
    'M1755 489 Q1749 470 1761 451 Q1770 436 1787 439 Q1799 423 1820 433 Q1849 431 1850 464 Q1868 488 1845 524 L1820 541 L1817 518 Q1827 498 1817 494 Q1808 492 1803 507 L1796 500 L1797 478 Q1776 486 1755 489 Z',
    '#353043',
  );
  fill(ctx, 'M1765 549 Q1785 561 1798 549 Q1787 569 1768 567 Z', '#8a5557');
  fill(
    ctx,
    'M1756 566 L1785 589 L1817 561 Q1859 572 1871 603 L1894 793 L1877 1014 L1698 1014 L1719 691 L1740 595 Z',
    '#494968',
  );
  fill(
    ctx,
    'M1745 581 L1757 564 L1785 588 L1773 626 Z M1785 588 L1817 559 L1827 572 L1804 611 Z',
    '#e3b69c',
  );
  fill(
    ctx,
    'M1785 602 L1747 684 L1716 714 L1685 698 L1645 674 L1633 692 L1689 743 Q1717 763 1743 740 L1799 679 Z',
    '#3d3e5b',
  );
  fill(
    ctx,
    'M1646 674 L1628 654 Q1619 649 1611 652 L1594 646 Q1587 645 1587 650 L1603 660 L1593 662 L1578 654 Q1571 650 1570 656 L1593 678 Q1602 685 1623 681 L1634 691 Z',
    '#c5816c',
  );
  fill(ctx, 'M1593 649 L1598 644 L1628 654 L1624 662 Z', '#383d4c');
  stroke(ctx, 1754, 500, 1763, 500, '#774f52', 2.5);
  stroke(ctx, 1749, 527, 1759, 527, '#855459', 2);
  stroke(ctx, 1721, 777, 1711, 953, '#8e7c8c', 2);
}

// A three-quarter back view. The elbow is a fixed pivot on the audience member's shoulder.
function audience(ctx, raised) {
  fill(
    ctx,
    'M-100 1140 L-75 927 Q-41 867 50 855 L78 820 L77 759 Q72 718 99 702 Q126 684 164 696 Q200 708 199 742 L192 792 Q187 816 162 827 L158 853 Q247 871 272 946 L303 1140 Z',
    '#434157',
  );
  fill(
    ctx,
    'M68 764 Q40 730 58 697 Q55 665 83 666 Q98 638 121 650 Q148 635 165 651 Q195 646 204 672 Q231 691 209 719 Q215 740 191 752 L180 783 L168 759 Q157 744 148 760 L144 793 Q112 812 78 790 Z',
    '#303246',
  );
  fill(ctx, 'M-25 914 Q43 863 84 854 L122 881 L88 932 L-30 986 Z', '#62637d');
  fill(ctx, 'M122 881 L158 851 L191 862 L170 909 Z', '#7c7990');
  ctx.save();
  ctx.translate(219, 935);
  ctx.rotate(lerp(1.91, 0.08, raised));
  // Rust-colored knit sleeve, ribbed cuff, then an open hand.
  fill(
    ctx,
    'M-52 42 Q-70 0 -37 -66 L5 -137 L31 -238 L91 -226 L74 -102 L36 -8 Q20 49 -15 55 Z',
    '#a5594f',
  );
  fill(ctx, 'M-42 9 Q-10 -39 17 -80 L39 -184 L49 -185 L38 -73 L6 -2 Z', '#be7966');
  fill(ctx, 'M28 -243 L91 -230 L85 -200 L22 -213 Z', '#804853');
  for (let i = 0; i < 8; i++)
    stroke(ctx, 31 + i * 7, -238 + i * 1.5, 26 + i * 7, -217 + i * 1.5, '#bd7968', 2);
  fill(
    ctx,
    'M39 -241 L42 -262 Q34 -279 24 -291 L8 -310 Q5 -318 12 -320 Q16 -321 22 -315 L37 -301 L23 -345 Q21 -354 27 -356 Q33 -358 36 -347 L49 -319 L39 -363 Q37 -373 43 -375 Q50 -377 53 -365 L63 -325 L61 -368 Q60 -377 66 -377 Q72 -377 73 -368 L76 -323 L83 -352 Q86 -361 91 -359 Q96 -357 94 -347 L89 -305 L86 -279 L76 -257 L74 -234 Z',
    '#d4957b',
  );
  fill(ctx, 'M42 -262 Q55 -285 70 -296 Q64 -276 55 -250 L50 -239 L40 -242 Z', '#bc796b');
  ctx.restore();
  fill(
    ctx,
    'M1283 1110 Q1296 996 1391 977 L1420 956 L1417 893 Q1398 843 1431 815 Q1455 794 1498 812 Q1533 826 1531 861 L1520 923 L1498 947 L1501 969 Q1584 988 1603 1111 Z',
    '#34384d',
  );
  fill(
    ctx,
    'M1415 909 Q1386 870 1400 833 Q1411 797 1454 797 Q1502 789 1526 819 Q1544 847 1526 875 Q1521 847 1500 850 Q1465 877 1437 863 L1433 904 Z',
    '#292c40',
  );
  fill(ctx, 'M1498 965 L1546 987 L1570 1012 L1530 994 L1486 981 Z', '#626071');
}

export { seminarRoom, presenter, audience };
