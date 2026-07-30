import type { MonochromeRasterData, ReceiptImageData } from "@shared/types";

export const THERMAL_PRINT_WIDTH_PX = 576;
const MAX_CANVAS_HEIGHT_PX = 30_000;
const MAX_SOURCE_IMAGE_BYTES = 20 * 1024 * 1024;

type ThermalRenderOptions = {
  threshold?: number;
};

function normalizedThreshold(value = 210): number {
  if (!Number.isFinite(value)) return 210;
  return Math.max(0, Math.min(255, Math.round(value)));
}

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
  height: number,
  threshold: number
): void {
  const imageData = context.getImageData(0, 0, width, height);
  const pixels = imageData.data;

  for (let index = 0; index < pixels.length; index += 4) {
    const alpha = pixels[index + 3]! / 255;
    const red = pixels[index]! * alpha + 255 * (1 - alpha);
    const green = pixels[index + 1]! * alpha + 255 * (1 - alpha);
    const blue = pixels[index + 2]! * alpha + 255 * (1 - alpha);
    const luminance = red * 0.299 + green * 0.587 + blue * 0.114;
    const value = luminance < threshold ? 0 : 255;
    pixels[index] = value;
    pixels[index + 1] = value;
    pixels[index + 2] = value;
    pixels[index + 3] = 255;
  }

  context.putImageData(imageData, 0, 0);
}

function makeCanvas(height: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  if (height <= 0 || height > MAX_CANVAS_HEIGHT_PX) {
    throw new Error("This image is too long for the thermal-print prototype.");
  }

  const canvas = document.createElement("canvas");
  canvas.width = THERMAL_PRINT_WIDTH_PX;
  canvas.height = height;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) throw new Error("Canvas rendering is unavailable.");
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, canvas.width, canvas.height);
  return [canvas, context];
}

function canvasToReceiptImage(canvas: HTMLCanvasElement): ReceiptImageData {
  return {
    dataUrl: canvas.toDataURL("image/png"),
    width: canvas.width,
    height: canvas.height
  };
}

export async function receiptElementToPng(
  element: HTMLElement,
  options: ThermalRenderOptions = {}
): Promise<ReceiptImageData> {
  await document.fonts.ready;
  await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

  const bounds = element.getBoundingClientRect();
  if (bounds.width <= 0 || bounds.height <= 0) {
    throw new Error("The receipt preview is not visible.");
  }

  const scale = THERMAL_PRINT_WIDTH_PX / bounds.width;
  const outputHeight = Math.ceil(bounds.height * scale);
  const [canvas, context] = makeCanvas(outputHeight);

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
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    applyThermalThreshold(
      context,
      canvas.width,
      canvas.height,
      normalizedThreshold(options.threshold)
    );
    return canvasToReceiptImage(canvas);
  } finally {
    URL.revokeObjectURL(svgUrl);
  }
}

export async function imageFileToReceiptPng(
  file: File,
  options: ThermalRenderOptions = {}
): Promise<ReceiptImageData> {
  if (file.size === 0 || file.size > MAX_SOURCE_IMAGE_BYTES) {
    throw new Error("Choose an image smaller than 20 MB.");
  }

  const sourceUrl = URL.createObjectURL(file);
  try {
    const image = await loadImage(sourceUrl);
    if (image.naturalWidth <= 0 || image.naturalHeight <= 0) {
      throw new Error("The selected file has invalid image dimensions.");
    }

    const outputHeight = Math.ceil(
      image.naturalHeight * (THERMAL_PRINT_WIDTH_PX / image.naturalWidth)
    );
    const [canvas, context] = makeCanvas(outputHeight);
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = "high";
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    applyThermalThreshold(
      context,
      canvas.width,
      canvas.height,
      normalizedThreshold(options.threshold)
    );
    return canvasToReceiptImage(canvas);
  } finally {
    URL.revokeObjectURL(sourceUrl);
  }
}

export async function receiptImageToMonochromeRaster(
  image: ReceiptImageData
): Promise<MonochromeRasterData> {
  if (image.width <= 0 || image.width > THERMAL_PRINT_WIDTH_PX || image.height <= 0) {
    throw new Error("The prepared receipt image dimensions are invalid.");
  }

  const loadedImage = await loadImage(image.dataUrl);
  const canvas = document.createElement("canvas");
  canvas.width = image.width;
  canvas.height = image.height;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) throw new Error("Canvas rendering is unavailable.");
  context.drawImage(loadedImage, 0, 0, canvas.width, canvas.height);

  const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
  const stride = Math.ceil(canvas.width / 8);
  const packed = new Uint8Array(stride * canvas.height);

  for (let y = 0; y < canvas.height; y += 1) {
    for (let x = 0; x < canvas.width; x += 1) {
      const pixelIndex = (y * canvas.width + x) * 4;
      if (pixels[pixelIndex]! < 128) {
        packed[y * stride + (x >> 3)]! |= 0x80 >> (x & 7);
      }
    }
  }

  let binary = "";
  const chunkSize = 0x8000;
  for (let offset = 0; offset < packed.length; offset += chunkSize) {
    binary += String.fromCharCode(...packed.subarray(offset, offset + chunkSize));
  }

  return {
    dataBase64: window.btoa(binary),
    width: canvas.width,
    height: canvas.height,
    stride
  };
}
