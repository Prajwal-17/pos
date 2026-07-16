import { describe, expect, it } from "vitest";
import { ReceiptBuilder } from "../src/receipt/builder";

describe("ReceiptBuilder", () => {
  it("init() emits ESC @", () => {
    const bytes = new ReceiptBuilder().init().build();
    expect(bytes).toEqual(new Uint8Array([0x1b, 0x40]));
  });

  it("newline() emits LF", () => {
    expect(new ReceiptBuilder().newline().build()).toEqual(new Uint8Array([0x0a]));
  });

  it("feed(3) emits ESC d 3", () => {
    expect(new ReceiptBuilder().feed(3).build()).toEqual(new Uint8Array([0x1b, 0x64, 0x03]));
  });

  it("paperCut() emits GS V 0", () => {
    expect(new ReceiptBuilder().paperCut().build()).toEqual(new Uint8Array([0x1d, 0x56, 0x00]));
  });

  it("bold(true) emits ESC E 1", () => {
    expect(new ReceiptBuilder().bold(true).build()).toEqual(new Uint8Array([0x1b, 0x45, 0x01]));
  });

  it("underline(1) emits ESC - 1", () => {
    expect(new ReceiptBuilder().underline(1).build()).toEqual(new Uint8Array([0x1b, 0x2d, 0x01]));
  });

  it("size(2, 2) emits GS ! 0x11", () => {
    expect(new ReceiptBuilder().size(2, 2).build()).toEqual(new Uint8Array([0x1d, 0x21, 0x11]));
  });

  it("left/center/right emit correct ESC a bytes", () => {
    expect(new ReceiptBuilder().left().build()).toEqual(new Uint8Array([0x1b, 0x61, 0x00]));
    expect(new ReceiptBuilder().center().build()).toEqual(new Uint8Array([0x1b, 0x61, 0x01]));
    expect(new ReceiptBuilder().right().build()).toEqual(new Uint8Array([0x1b, 0x61, 0x02]));
  });

  it("text() encodes CP437 without LF", () => {
    expect(new ReceiptBuilder().text("Hi").build()).toEqual(new Uint8Array([0x48, 0x69]));
  });

  it("line() encodes text + LF", () => {
    expect(new ReceiptBuilder().line("Hi").build()).toEqual(new Uint8Array([0x48, 0x69, 0x0a]));
  });

  it("hr() fills column width with dashes + LF", () => {
    const bytes = new ReceiptBuilder({ columns: 4 }).hr().build();
    expect(bytes).toEqual(new Uint8Array([0x2d, 0x2d, 0x2d, 0x2d, 0x0a]));
  });

  it("hr('=') uses custom char", () => {
    const bytes = new ReceiptBuilder({ columns: 3 }).hr("=").build();
    expect(bytes).toEqual(new Uint8Array([0x3d, 0x3d, 0x3d, 0x0a]));
  });

  it("row() creates left-right padded line", () => {
    const bytes = new ReceiptBuilder({ columns: 20 }).row("Total", "Rs.400").build();
    const decoded = new TextDecoder().decode(bytes);
    expect(decoded).toBe("Total         Rs.400\n");
  });

  it("columns3() creates three-column line", () => {
    const bytes = new ReceiptBuilder({ columns: 30 }).columns3("Item", "x2", "Rs.200").build();
    const decoded = new TextDecoder().decode(bytes);
    expect(decoded).toContain("Item");
    expect(decoded).toContain("x2");
    expect(decoded).toContain("Rs.200");
    expect(bytes.length).toBe(31); // 30 + LF
  });

  it("chains operations and produces contiguous Uint8Array", () => {
    const bytes = new ReceiptBuilder({ columns: 20 })
      .init().center().bold(true).line("Test").bold(false).feed(2).paperCut()
      .build();
    expect(bytes).toBeInstanceOf(Uint8Array);
    expect(bytes[0]).toBe(0x1b); // ESC
    expect(bytes[1]).toBe(0x40); // @
    expect(bytes[bytes.length - 1]).toBe(0x00); // cut full
  });

  it("raw() appends arbitrary bytes", () => {
    expect(new ReceiptBuilder().raw(new Uint8Array([0xff])).build())
      .toEqual(new Uint8Array([0xff]));
  });

  it("getColumns() returns configured width", () => {
    expect(new ReceiptBuilder({ columns: 32 }).getColumns()).toBe(32);
    expect(new ReceiptBuilder().getColumns()).toBe(48);
  });
});
