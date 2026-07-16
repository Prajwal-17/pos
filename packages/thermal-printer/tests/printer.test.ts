import { describe, expect, it } from "vitest";
import { CaptureTransport } from "../src/transport/capture";
import { ReceiptBuilder } from "../src/receipt/builder";
import { Printer } from "../src/printer";

describe("CaptureTransport", () => {
  it("collects written bytes", async () => {
    const t = new CaptureTransport();
    await t.open();
    await t.write(new Uint8Array([0x01, 0x02]));
    await t.write(new Uint8Array([0x03]));
    await t.close();

    const buf = t.getBuffer();
    expect(buf).toEqual(new Uint8Array([0x01, 0x02, 0x03]));
  });

  it("throws on write before open", async () => {
    const t = new CaptureTransport();
    await expect(t.write(new Uint8Array([0x01]))).rejects.toThrow("not open");
  });

  it("clear() resets buffer", async () => {
    const t = new CaptureTransport();
    await t.open();
    await t.write(new Uint8Array([0x01]));
    t.clear();
    expect(t.getBuffer().length).toBe(0);
  });

  it("isOpen() reflects state", async () => {
    const t = new CaptureTransport();
    expect(t.isOpen()).toBe(false);
    await t.open();
    expect(t.isOpen()).toBe(true);
    await t.close();
    expect(t.isOpen()).toBe(false);
  });

  it("getChunks() returns individual writes", async () => {
    const t = new CaptureTransport();
    await t.open();
    await t.write(new Uint8Array([0x01]));
    await t.write(new Uint8Array([0x02, 0x03]));
    expect(t.getChunks().length).toBe(2);
  });
});

describe("Printer", () => {
  it("print() opens, writes, and closes transport", async () => {
    const t = new CaptureTransport();
    const printer = new Printer(t);
    const data = new Uint8Array([0x1b, 0x40]);
    await printer.print(data);

    expect(t.isOpen()).toBe(false); // closed after print
    expect(t.getBuffer()).toEqual(data);
  });

  it("createReceipt() returns a ReceiptBuilder", () => {
    const printer = new Printer(new CaptureTransport(), { columns: 32 });
    const builder = printer.createReceipt();
    expect(builder).toBeInstanceOf(ReceiptBuilder);
    expect(builder.getColumns()).toBe(32);
  });

  it("end-to-end: build + print receipt", async () => {
    const t = new CaptureTransport();
    const printer = new Printer(t, { columns: 32 });

    const receipt = printer.createReceipt()
      .init()
      .center().bold(true).line("Test Store")
      .bold(false).hr()
      .left().row("Item", "Rs.100")
      .feed(2).paperCut()
      .build();

    await printer.print(receipt);

    const buf = t.getBuffer();
    expect(buf.length).toBeGreaterThan(0);
    // Starts with ESC @ (init)
    expect(buf[0]).toBe(0x1b);
    expect(buf[1]).toBe(0x40);
    // Ends with GS V 0 (full cut)
    expect(buf[buf.length - 3]).toBe(0x1d);
    expect(buf[buf.length - 2]).toBe(0x56);
    expect(buf[buf.length - 1]).toBe(0x00);
  });
});
