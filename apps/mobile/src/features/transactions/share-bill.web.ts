export async function shareBill(html: string): Promise<void> {
  const frame = document.createElement("iframe");
  frame.title = "Bill print preview";
  frame.style.cssText = "position:fixed;left:-10000px;top:0;width:794px;height:1123px;border:0";
  frame.srcdoc = html;
  const loaded = new Promise<void>((resolve) => {
    frame.onload = () => resolve();
  });
  document.body.appendChild(frame);
  try {
    await loaded;
    const target = frame.contentWindow;
    if (!target) throw new Error("Bill preview could not open.");
    await frame.contentDocument?.fonts.ready;
    await new Promise<void>((resolve) => {
      target.addEventListener("afterprint", () => resolve(), { once: true });
      target.focus();
      target.print();
      // Browser print cancellation also returns through afterprint.
    });
  } finally {
    frame.remove();
  }
}
