import type { MonochromeRasterData } from "../../../shared/types";

const ESC = 0x1b;
const GS = 0x1d;
const MAX_WIDTH_DOTS = 576;
const MAX_HEIGHT_DOTS = 30_000;
const RASTER_CHUNK_HEIGHT = 256;

type ValidatedRaster = {
  data: Buffer;
  width: number;
  height: number;
  stride: number;
};

function bytes(...values: number[]): Buffer {
  return Buffer.from(values);
}

export function validateMonochromeRaster(image: MonochromeRasterData): ValidatedRaster {
  if (!Number.isInteger(image.width) || image.width <= 0 || image.width > MAX_WIDTH_DOTS) {
    throw new Error(`Raster width must be between 1 and ${MAX_WIDTH_DOTS} dots.`);
  }
  if (!Number.isInteger(image.height) || image.height <= 0 || image.height > MAX_HEIGHT_DOTS) {
    throw new Error(`Raster height must be between 1 and ${MAX_HEIGHT_DOTS} dots.`);
  }

  const expectedStride = Math.ceil(image.width / 8);
  if (image.stride !== expectedStride) {
    throw new Error(`Raster stride must be ${expectedStride} bytes for this width.`);
  }

  const data = Buffer.from(image.dataBase64, "base64");
  const expectedLength = expectedStride * image.height;
  if (data.length !== expectedLength) {
    throw new Error(`Raster data must contain exactly ${expectedLength} bytes.`);
  }

  return { data, width: image.width, height: image.height, stride: expectedStride };
}

function rasterSlice(raster: ValidatedRaster, row: number, height: number): Buffer {
  const start = row * raster.stride;
  return raster.data.subarray(start, start + height * raster.stride);
}

export function buildGsV0Raster(image: MonochromeRasterData): Buffer {
  const raster = validateMonochromeRaster(image);
  const chunks: Buffer[] = [];

  for (let row = 0; row < raster.height; row += RASTER_CHUNK_HEIGHT) {
    const height = Math.min(RASTER_CHUNK_HEIGHT, raster.height - row);
    chunks.push(
      bytes(
        GS,
        0x76,
        0x30,
        0x00,
        raster.stride & 0xff,
        (raster.stride >> 8) & 0xff,
        height & 0xff,
        (height >> 8) & 0xff
      ),
      rasterSlice(raster, row, height)
    );
  }

  return Buffer.concat(chunks);
}

function isBlack(raster: ValidatedRaster, x: number, y: number): boolean {
  if (y >= raster.height) return false;
  const value = raster.data[y * raster.stride + (x >> 3)]!;
  return (value & (0x80 >> (x & 7))) !== 0;
}

export function buildEscStarRaster(image: MonochromeRasterData): Buffer {
  const raster = validateMonochromeRaster(image);
  const chunks: Buffer[] = [bytes(ESC, 0x33, 24)];

  for (let row = 0; row < raster.height; row += 24) {
    const band = Buffer.alloc(raster.width * 3);

    for (let x = 0; x < raster.width; x += 1) {
      for (let plane = 0; plane < 3; plane += 1) {
        let value = 0;
        for (let bit = 0; bit < 8; bit += 1) {
          if (isBlack(raster, x, row + plane * 8 + bit)) value |= 0x80 >> bit;
        }
        band[x * 3 + plane] = value;
      }
    }

    chunks.push(
      bytes(ESC, 0x2a, 33, raster.width & 0xff, (raster.width >> 8) & 0xff),
      band,
      bytes(0x0a)
    );
  }

  chunks.push(bytes(ESC, 0x32));
  return Buffer.concat(chunks);
}

export function buildGsLRaster(image: MonochromeRasterData): Buffer {
  const raster = validateMonochromeRaster(image);
  const chunks: Buffer[] = [];

  for (let row = 0; row < raster.height; row += RASTER_CHUNK_HEIGHT) {
    const height = Math.min(RASTER_CHUNK_HEIGHT, raster.height - row);
    const data = rasterSlice(raster, row, height);
    const parameterLength = data.length + 10;

    chunks.push(
      bytes(
        GS,
        0x28,
        0x4c,
        parameterLength & 0xff,
        (parameterLength >> 8) & 0xff,
        0x30,
        0x70,
        0x30,
        0x01,
        0x01,
        0x31,
        raster.width & 0xff,
        (raster.width >> 8) & 0xff,
        height & 0xff,
        (height >> 8) & 0xff
      ),
      data,
      bytes(GS, 0x28, 0x4c, 0x02, 0x00, 0x30, 0x32)
    );
  }

  return Buffer.concat(chunks);
}

export function buildRasterCommand(
  command: "gs-v-0" | "esc-star" | "gs-l",
  image: MonochromeRasterData
): Buffer {
  if (command === "gs-v-0") return buildGsV0Raster(image);
  if (command === "esc-star") return buildEscStarRaster(image);
  return buildGsLRaster(image);
}
