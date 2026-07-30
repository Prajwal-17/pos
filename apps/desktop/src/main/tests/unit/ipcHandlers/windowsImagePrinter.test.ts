import { describe, expect, it } from "vitest";
import { pngDataUrlToBuffer } from "../../../ipcHandlers/printHandlers/windowsImagePrinter";

describe("Windows receipt image printer", () => {
  it("accepts a PNG data URL", () => {
    const pngHeader = "iVBORw0KGgo=";

    expect(pngDataUrlToBuffer(`data:image/png;base64,${pngHeader}`)).toEqual(
      Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
    );
  });

  it("rejects non-PNG image data", () => {
    expect(() => pngDataUrlToBuffer("data:image/jpeg;base64,AAAA")).toThrow(
      "Only PNG receipt images are supported."
    );
  });
});
