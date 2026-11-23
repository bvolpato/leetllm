import { describe, expect, it } from 'vitest'
import { detectBackgroundColor, detectContentBounds, detectOverflow } from 'vizmatic'

function makePixels(
    width: number,
    height: number,
    bg: [number, number, number, number] = [0, 0, 0, 0],
) {
    const pixels = new Uint8Array(width * height * 4)

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const idx = (y * width + x) * 4
            pixels[idx] = bg[0]
            pixels[idx + 1] = bg[1]
            pixels[idx + 2] = bg[2]
            pixels[idx + 3] = bg[3]
        }
    }

    return pixels
}

function paintRect(
    pixels: Uint8Array,
    width: number,
    x0: number,
    y0: number,
    rectWidth: number,
    rectHeight: number,
    rgba: [number, number, number, number] = [255, 255, 255, 255],
) {
    for (let y = y0; y < y0 + rectHeight; y++) {
        for (let x = x0; x < x0 + rectWidth; x++) {
            const idx = (y * width + x) * 4
            pixels[idx] = rgba[0]
            pixels[idx + 1] = rgba[1]
            pixels[idx + 2] = rgba[2]
            pixels[idx + 3] = rgba[3]
        }
    }
}

describe('detectContentBounds', () => {
    it('finds content and expands by padding', () => {
        const pixels = makePixels(20, 12)
        paintRect(pixels, 20, 5, 3, 4, 3)

        expect(detectContentBounds(pixels, 20, 12, '#000000', 2)).toEqual({
            x: 3,
            y: 1,
            width: 8,
            height: 7,
        })
    })

    it('ignores opaque root background when finding content bounds', () => {
        const pixels = makePixels(30, 18, [245, 247, 250, 255])
        paintRect(pixels, 30, 6, 4, 10, 6, [20, 24, 32, 255])

        expect(detectContentBounds(pixels, 30, 18, detectBackgroundColor(pixels), 2)).toEqual({
            x: 4,
            y: 2,
            width: 14,
            height: 10,
        })
    })
})

describe('detectBackgroundColor', () => {
    it('returns opaque corner color', () => {
        const pixels = makePixels(8, 8, [18, 52, 86, 255])
        expect(detectBackgroundColor(pixels)).toBe('#123456')
    })
})

describe('detectOverflow', () => {
    it('does not flag centered content with breathing room', () => {
        const pixels = makePixels(40, 20)
        paintRect(pixels, 40, 10, 5, 12, 6)

        expect(detectOverflow(pixels, 40, 20, '#000000').overflows).toBe(false)
    })

    it('flags content touching a canvas edge with enough density', () => {
        const pixels = makePixels(40, 20)
        paintRect(pixels, 40, 37, 4, 3, 10)

        expect(detectOverflow(pixels, 40, 20, '#000000')).toMatchObject({
            overflows: true,
            edges: {
                top: false,
                right: true,
                bottom: false,
                left: false,
            },
        })
    })
})
