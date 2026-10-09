import { describe, expect, it } from "vitest";
import { screenMapping, rotationQuaternion } from "../src/screen-mapping";

describe("screen mapping", () => {
  it("fills landscape input without stretching and allows both crop edges", () => {
    const left = screenMapping(1600, 900, 462, 1000, "fill", 0, 0.5);
    const right = screenMapping(1600, 900, 462, 1000, "fill", 1, 0.5);
    expect(left.sx).toBe(0);
    expect(right.sx + right.sw).toBeCloseTo(1600);
    expect(left.sw / left.sh).toBeCloseTo(left.dw / left.dh);
  });
  it("fits the whole image with centered padding", () => {
    const r = screenMapping(1600, 900, 462, 1000, "fit");
    expect(r.sw).toBe(1600);
    expect(r.sh).toBe(900);
    expect(r.dw / r.dh).toBeCloseTo(1600/900);
    expect(r.dy * 2 + r.dh).toBeCloseTo(1000);
  });
  it("crops a tall image vertically and keeps matching ratios intact", () => {
    const tall = screenMapping(400, 2000, 462, 1000, "fill", 0.5, 1);
    expect(tall.sy + tall.sh).toBeCloseTo(2000);
    expect(tall.sw / tall.sh).toBeCloseTo(0.462);
    expect(screenMapping(462,1000,462,1000,"fill")).toEqual({sx:0,sy:0,sw:462,sh:1000,dx:0,dy:0,dw:462,dh:1000});
  });
  it("rejects invalid dimensions", () => {
    expect(() => screenMapping(0,900,462,1000,"fill")).toThrow();
  });
  it("produces normalized rotations", () => {
    expect(rotationQuaternion([0,0,0])).toEqual([0,0,0,1]);
    expect(Math.hypot(...rotationQuaternion([32,-42,12]))).toBeCloseTo(1);
  });
});
