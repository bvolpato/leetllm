import { describe, expect, it } from "vitest"
import { planRectoPads } from "./reflow"

describe("planRectoPads", () => {
  it("corrects every chapter after a wrong page estimate", () => {
    // Part 0 as rendered: chapter 4 opened on page 36, and a pad fell before chapter 6 for nothing useful.
    const starts = [3, 13, 25, 36, 46, 58]
    const padded = [true, false, false, false, false, true]
    expect(planRectoPads(starts, padded, 70)).toEqual([true, false, false, true, false, true])
  })

  it("removes a pad that real page counts do not need", () => {
    // The divider is page 1, and the estimate wrongly added a pad before a chapter that was already odd.
    expect(planRectoPads([3, 8], [true, true], 12)).toEqual([true, false])
  })

  it("keeps a part that is already right", () => {
    expect(planRectoPads([3, 13], [true, false], 20)).toEqual([true, false])
  })
})
