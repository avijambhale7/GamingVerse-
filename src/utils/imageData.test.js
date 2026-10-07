import { describe, expect, it } from "vitest";
import { IMAGE_PRESETS, compressionSteps } from "./imageData.js";

describe("IMAGE_PRESETS", () => {
  it("caps new uploads by kind", () => {
    expect(IMAGE_PRESETS.feed).toEqual({ maxSide: 1080, maxChars: 200 * 1024 });
    expect(IMAGE_PRESETS.product).toEqual({ maxSide: 1080, maxChars: 200 * 1024 });
    expect(IMAGE_PRESETS.cafe.maxSide).toBe(1280);
    expect(IMAGE_PRESETS.avatar.maxSide).toBe(256);
  });

  it("keeps every preset under the database limits", () => {
    for (const preset of Object.values(IMAGE_PRESETS)) {
      expect(preset.maxChars).toBeLessThanOrEqual(450000); // products/image rule
    }
  });
});

describe("compressionSteps", () => {
  it("tries lower JPEG quality at full size before shrinking", () => {
    const steps = compressionSteps(1080);
    const fullSize = steps.filter(([side]) => side === 1080);
    expect(steps[0]).toEqual([1080, 0.85]);
    expect(fullSize.map(([, q]) => q)).toEqual([0.85, 0.78, 0.7, 0.62, 0.55, 0.48, 0.42]);
    // only after every quality at 1080 does the size drop
    expect(steps[fullSize.length][0]).toBeLessThan(1080);
  });

  it("never goes above the preset's longest side", () => {
    for (const { maxSide } of Object.values(IMAGE_PRESETS)) {
      expect(Math.max(...compressionSteps(maxSide).map(([side]) => side))).toBe(maxSide);
    }
  });

  it("quality steps down one at a time within each size", () => {
    const steps = compressionSteps(256);
    for (let i = 1; i < steps.length; i += 1) {
      const [prevSide, prevQ] = steps[i - 1];
      const [side, q] = steps[i];
      if (side === prevSide) expect(q).toBeLessThan(prevQ);
      else expect(side).toBeLessThan(prevSide);
    }
  });
});
