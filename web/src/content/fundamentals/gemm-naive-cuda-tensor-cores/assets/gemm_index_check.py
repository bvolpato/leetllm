#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.11"
# dependencies = []
# ///
"""CPU index model of the lab, not a CUDA emulator or performance benchmark."""


def product(a, b):
    return [[sum(x * b[k][j] for k, x in enumerate(row))
             for j in range(len(b[0]))] for row in a]


def tiled(a, b, width):
    m, k_size, n = len(a), len(b), len(b[0])
    out = [[None] * n for _ in range(m)]
    writes = [[0] * n for _ in range(m)]
    for by in range((m + 15) // 16):
        for bx in range((n + width - 1) // width):
            acc = [[0] * width for _ in range(16)]
            for k0 in range(0, k_size, 16):
                shared_a = [[None] * 16 for _ in range(16)]
                shared_b = [[None] * width for _ in range(16)]
                # Model every cooperative load before any consumer, equivalent
                # to assuming that the first block barrier worked correctly.
                for ty in range(16):
                    for tx in range(16):
                        row, ak = by * 16 + ty, k0 + tx
                        shared_a[ty][tx] = a[row][ak] if row < m and ak < k_size else 0
                        tid = ty * 16 + tx
                        for linear in range(tid, 16 * width, 256):
                            sk, sn = divmod(linear, width)
                            bk, col = k0 + sk, bx * width + sn
                            shared_b[sk][sn] = b[bk][col] if bk < k_size and col < n else 0
                assert all(v is not None for row in shared_a + shared_b for v in row)
                for ty in range(16):
                    for tx in range(16):
                        for j in range(width // 16):
                            col = tx + j * 16
                            acc[ty][col] += sum(shared_a[ty][k] * shared_b[k][col]
                                                for k in range(16))
                # The second barrier is assumed, not simulated or tested.
            for ty in range(16):
                for tx in range(16):
                    for j in range(width // 16):
                        row, col = by * 16 + ty, bx * width + tx + j * 16
                        if row < m and col < n:
                            writes[row][col] += 1
                            out[row][col] = acc[ty][tx + j * 16]
    assert all(count == 1 for row in writes for count in row)
    return out


def check_padding(a, b):
    m, k, n = len(a), len(b), len(b[0])
    mp, np, kp = ((v + 15) // 16 * 16 for v in (m, n, k))
    ap = [[a[r][s] if r < m and s < k else 0 for s in range(kp)] for r in range(mp)]
    bp = [[b[s][c] if s < k and c < n else 0 for c in range(np)] for s in range(kp)]
    cp = product(ap, bp)
    assert [row[:n] for row in cp[:m]] == product(a, b)
    assert all(cp[r][c] == 0 for r in range(mp) for c in range(np) if r >= m or c >= n)


def scalar_owners(m, n, strided):
    block_x, block_y = (16, 16) if strided else (32, 8)
    gx = ((m if strided else n) + block_x - 1) // block_x
    gy = ((n if strided else m) + block_y - 1) // block_y
    writes = [[0] * n for _ in range(m)]
    for bx in range(gx):
        for by in range(gy):
            for ty in range(block_y):
                for tx in range(block_x):
                    x, y = bx * block_x + tx, by * block_y + ty
                    r, c = (x, y) if strided else (y, x)
                    if r < m and c < n:
                        writes[r][c] += 1
    assert all(count == 1 for row in writes for count in row)


def first_warp_sectors(strided):
    # Aligned FP32 base, M=32, N=K=64, first block, k=0. Count
    # distinct 32-byte address sectors per instruction, not cache misses.
    coordinates = [(lane % 16, lane // 16) if strided else (0, lane)
                   for lane in range(32)]
    a = {4 * (r * 64) // 32 for r, _ in coordinates}
    b = {4 * c // 32 for _, c in coordinates}
    c = {4 * (r * 64 + col) // 32 for r, col in coordinates}
    return len(a), len(b), len(c)


def main():
    shapes = [(1, 1, 1), (2, 2, 3), (16, 16, 16), (17, 65, 19), (31, 29, 37), (73, 61, 67)]
    for m, n, k in shapes:
        a = [[((r * 3 + s * 5) % 7) - 3 for s in range(k)] for r in range(m)]
        b = [[((s * 2 + c * 3) % 9) - 4 for c in range(n)] for s in range(k)]
        reference = product(a, b)
        for strided in (True, False):
            scalar_owners(m, n, strided)
        for width in (16, 64):
            assert tiled(a, b, width) == reference
        check_padding(a, b)
    assert first_warp_sectors(True) == (16, 1, 16)
    assert first_warp_sectors(False) == (1, 4, 4)
    print(f"PASS {len(shapes)} shapes: scalar ownership, shared/register indices, padding/crop")
    print("first-warp sectors (A, B, C): strided=(16, 1, 16), coalesced=(1, 4, 4)")
    print("CPU integer shapes only; no CUDA, floating-point, barrier, or speed validation.")


if __name__ == "__main__":
    main()
