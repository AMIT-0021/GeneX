import { RGBColor, CIELabColor } from '../types/diagnostic';

/**
 * Calculates standard perceived luminance (ITU-R BT.601)
 */
export function getLuminance(rgb: RGBColor): number {
  return 0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b;
}

/**
 * Converts sRGB (0-255) to CIE XYZ
 */
export function rgbToXyz(rgb: RGBColor): { x: number; y: number; z: number } {
  let r = rgb.r / 255;
  let g = rgb.g / 255;
  let b = rgb.b / 255;

  r = r > 0.04045 ? Math.pow((r + 0.055) / 1.055, 2.4) : r / 12.92;
  g = g > 0.04045 ? Math.pow((g + 0.055) / 1.055, 2.4) : g / 12.92;
  b = b > 0.04045 ? Math.pow((b + 0.055) / 1.055, 2.4) : b / 12.92;

  r *= 100;
  g *= 100;
  b *= 100;

  // D65 Standard Illuminant
  const x = r * 0.4124564 + g * 0.3575761 + b * 0.1804375;
  const y = r * 0.2126729 + g * 0.7151522 + b * 0.0721750;
  const z = r * 0.0193339 + g * 0.1191920 + b * 0.9503041;

  return { x, y, z };
}

/**
 * Converts CIE XYZ to CIE L*a*b* (D65)
 */
export function xyzToLab(xyz: { x: number; y: number; z: number }): CIELabColor {
  // Reference white D65
  const refX = 95.047;
  const refY = 100.000;
  const refZ = 108.883;

  let x = xyz.x / refX;
  let y = xyz.y / refY;
  let z = xyz.z / refZ;

  const epsilon = 0.008856;
  const kappa = 903.3;

  const fx = x > epsilon ? Math.cbrt(x) : (kappa * x + 16) / 116;
  const fy = y > epsilon ? Math.cbrt(y) : (kappa * y + 16) / 116;
  const fz = z > epsilon ? Math.cbrt(z) : (kappa * z + 16) / 116;

  const L = Math.max(0, 116 * fy - 16);
  const a = 500 * (fx - fy);
  const b = 200 * (fy - fz);

  return { L, a, b };
}

/**
 * Direct RGB to CIE L*a*b*
 */
export function rgbToLab(rgb: RGBColor): CIELabColor {
  return xyzToLab(rgbToXyz(rgb));
}

/**
 * Calculates CIE76 Delta E color distance
 */
export function calculateDeltaE(rgb1: RGBColor, rgb2: RGBColor): number {
  const lab1 = rgbToLab(rgb1);
  const lab2 = rgbToLab(rgb2);

  const dL = lab1.L - lab2.L;
  const da = lab1.a - lab2.a;
  const db = lab1.b - lab2.b;

  return Math.sqrt(dL * dL + da * da + db * db);
}

/**
 * Calculates Optical Density (OD) equivalent from sample vs blank.
 * OD = -log10(I_sample / I_blank)
 * For enzymatic color change (e.g. darkening or chromophore accumulation),
 * transmitted/reflected intensity decreases, resulting in a positive OD signal.
 */
export function calculateOpticalDensity(sampleRgb: RGBColor, blankRgb: RGBColor): number {
  const iSample = Math.max(1, getLuminance(sampleRgb));
  const iBlank = Math.max(1, getLuminance(blankRgb));

  // If sample is brighter than blank due to slight lighting reflection, clamp to 0
  if (iSample >= iBlank) {
    // Check if there is significant chromatic shift even if overall luminance is flat
    const deltaE = calculateDeltaE(sampleRgb, blankRgb);
    return Math.max(0, parseFloat((deltaE * 0.015).toFixed(3)));
  }

  const rawOd = -Math.log10(iSample / iBlank);
  return parseFloat(Math.max(0, rawOd).toFixed(3));
}

/**
 * Extracts average RGB from an ImageData array over a defined circular/box ROI
 */
export function sampleRoiAverage(
  imageData: ImageData,
  centerX: number,
  centerY: number,
  radius: number
): RGBColor {
  const { width, height, data } = imageData;
  let totalR = 0;
  let totalG = 0;
  let totalB = 0;
  let count = 0;

  const minX = Math.max(0, Math.floor(centerX - radius));
  const maxX = Math.min(width - 1, Math.ceil(centerX + radius));
  const minY = Math.max(0, Math.floor(centerY - radius));
  const maxY = Math.min(height - 1, Math.ceil(centerY + radius));
  const r2 = radius * radius;

  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      const dx = x - centerX;
      const dy = y - centerY;
      if (dx * dx + dy * dy <= r2) {
        const index = (y * width + x) * 4;
        totalR += data[index];
        totalG += data[index + 1];
        totalB += data[index + 2];
        count++;
      }
    }
  }

  if (count === 0) {
    return { r: 255, g: 255, b: 255 };
  }

  return {
    r: Math.round(totalR / count),
    g: Math.round(totalG / count),
    b: Math.round(totalB / count),
  };
}
