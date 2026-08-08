import { describe, expect, it } from "vitest";
import { getCheckStatusColor } from "./renderer.utils";

describe("getCheckStatusColor", () => {
  it("returns the white hoverable row for an unchecked item", () => {
    expect(getCheckStatusColor(0, 3)).toBe("border-border bg-card hover:bg-accent");
  });

  it("returns the solid success state and rail for a fully checked item", () => {
    expect(getCheckStatusColor(3, 3)).toBe(
      "border-success-border border-l-4 border-l-success bg-success-surface"
    );
  });

  it("returns the solid warning state and rail for a partially checked item", () => {
    expect(getCheckStatusColor(1, 3)).toBe(
      "border-warning-border border-l-4 border-l-warning bg-warning-surface"
    );
  });

  it("handles fractional quantities without losing checked-state precision", () => {
    expect(getCheckStatusColor(1.5, 1.5)).toBe(
      "border-success-border border-l-4 border-l-success bg-success-surface"
    );
    expect(getCheckStatusColor(0.5, 1.5)).toBe(
      "border-warning-border border-l-4 border-l-warning bg-warning-surface"
    );
  });
});
