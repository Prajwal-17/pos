import type { ReceiptImageData } from "@shared/types";

const THERMAL_PRINT_WIDTH_PX = 576;
const MAX_CANVAS_HEIGHT_PX = 30_000;

function copyComputedStyles(source: Element, target: Element): void {
  const computedStyle = window.getComputedStyle(source);
  const targetStyle = (target as HTMLElement | SVGElement).style;

  for (const property of computedStyle) {
    targetStyle.setProperty(
      property,
      computedStyle.getPropertyValue(property),
      computedStyle.getPropertyPriority(property)
    );
  }

  const sourceChildren = Array.from(source.children);
  const targetChildren = Array.from(target.children);
  sourceChildren.forEach((child, index) => {
    const targetChild = targetChildren[index];
    if (targetChild) copyComputedStyles(child, targetChild);
  });
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("The receipt image could not be rendered."));
    image.src = url;
  });
}

function applyThermalThreshold(
  context: CanvasRenderingContext2D,
  width: number,
  height: number
): void {
  const imageData = context.getImageData(0, 0, width, height);
  const pixels = imageData.data;

  for (let index = 0; index < pixels.length; index += 4) {
    const luminance =
      pixels[index]! * 0.299 + pixels[index + 1]! * 0.587 + pixels[index + 2]! * 0.114;
    const value = luminance < 210 ? 0 : 255;
    pixels[index] = value;
    pixels[index + 1] = value;
    pixels[index + 2] = value;
    pixels[index + 3] = 255;
  }

  context.putImageData(imageData, 0, 0);
}

export async function receiptElementToPng(element: HTMLElement): Promise<ReceiptImageData> {
  await document.fonts.ready;
  await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

  const bounds = element.getBoundingClientRect();
  if (bounds.width <= 0 || bounds.height <= 0) {
    throw new Error("The receipt preview is not visible.");
  }

  const scale = THERMAL_PRINT_WIDTH_PX / bounds.width;
  const outputHeight = Math.ceil(bounds.height * scale);
  if (outputHeight > MAX_CANVAS_HEIGHT_PX) {
    throw new Error("This receipt is too long for the image-print prototype.");
  }

  const clone = element.cloneNode(true) as HTMLElement;
  copyComputedStyles(element, clone);
  clone.setAttribute("xmlns", "http://www.w3.org/1999/xhtml");
  clone.style.margin = "0";
  clone.style.width = `${bounds.width}px`;
  clone.style.maxWidth = "none";
  clone.style.transform = "none";

  const serializedReceipt = new XMLSerializer().serializeToString(clone);
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg"
      width="${THERMAL_PRINT_WIDTH_PX}"
      height="${outputHeight}"
      viewBox="0 0 ${bounds.width} ${bounds.height}">
      <foreignObject x="0" y="0" width="${bounds.width}" height="${bounds.height}">
        ${serializedReceipt}
      </foreignObject>
    </svg>
  `;

  const svgUrl = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml;charset=utf-8" }));

  try {
    const image = await loadImage(svgUrl);
    const canvas = document.createElement("canvas");
    canvas.width = THERMAL_PRINT_WIDTH_PX;
    canvas.height = outputHeight;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Canvas rendering is unavailable.");

    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    applyThermalThreshold(context, canvas.width, canvas.height);

    return {
      dataUrl: canvas.toDataURL("image/png"),
      width: canvas.width,
      height: canvas.height
    };
  } finally {
    URL.revokeObjectURL(svgUrl);
  }
}
