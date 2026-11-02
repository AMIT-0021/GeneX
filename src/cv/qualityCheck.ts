import { FrameQualityCheck } from '../types/diagnostic';
import { defaultCartridgeConfig } from '../config/cartridgeConfig';

/**
 * Evaluates image frame quality for brightness, contrast, and focus/sharpness
 */
export function evaluateFrameQuality(imageData: ImageData): FrameQualityCheck {
  const { width, height, data } = imageData;
  const cfg = defaultCartridgeConfig.qualityThresholds;
  const totalPixels = width * height;

  if (totalPixels === 0) {
    return {
      passed: false,
      brightnessScore: 0,
      contrastScore: 0,
      sharpnessScore: 0,
      warnings: ["Empty image captured"],
    };
  }

  // 1. Calculate Mean Luminance and Variance (Contrast)
  let sumLuminance = 0;
  let sumLuminanceSq = 0;
  let overexposedPixels = 0;
  let underexposedPixels = 0;

  // Step sampling for performance on high-res images
  const sampleStep = Math.max(1, Math.floor(Math.sqrt(totalPixels) / 200));
  let samplesCount = 0;

  // Luminance array for discrete Laplacian sharpness check
  // We'll downsample to a small grid (e.g. 160x120) to compute Laplacian variance quickly
  const gridW = 160;
  const gridH = Math.round((height / width) * 160);
  const grayGrid = new Float32Array(gridW * gridH);

  const stepX = width / gridW;
  const stepY = height / gridH;

  for (let gy = 0; gy < gridH; gy++) {
    const srcY = Math.min(height - 1, Math.floor(gy * stepY));
    for (let gx = 0; gx < gridW; gx++) {
      const srcX = Math.min(width - 1, Math.floor(gx * stepX));
      const idx = (srcY * width + srcX) * 4;
      const lum = 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
      grayGrid[gy * gridW + gx] = lum;
    }
  }

  // Compute full image brightness/contrast sample
  for (let i = 0; i < totalPixels; i += sampleStep) {
    const idx = i * 4;
    const lum = 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
    sumLuminance += lum;
    sumLuminanceSq += lum * lum;
    if (lum > 240) overexposedPixels++;
    if (lum < 30) underexposedPixels++;
    samplesCount++;
  }

  const meanLuminance = sumLuminance / samplesCount;
  const varianceLuminance = Math.max(0, sumLuminanceSq / samplesCount - meanLuminance * meanLuminance);
  const stdDevLuminance = Math.sqrt(varianceLuminance);

  // 2. Laplacian Filter on downsampled gray grid:
  // Kernel:
  // [ 0  1  0 ]
  // [ 1 -4  1 ]
  // [ 0  1  0 ]
  let laplacianSum = 0;
  let laplacianSumSq = 0;
  let laplacianCount = 0;

  for (let gy = 1; gy < gridH - 1; gy++) {
    for (let gx = 1; gx < gridW - 1; gx++) {
      const center = grayGrid[gy * gridW + gx];
      const up = grayGrid[(gy - 1) * gridW + gx];
      const down = grayGrid[(gy + 1) * gridW + gx];
      const left = grayGrid[gy * gridW + (gx - 1)];
      const right = grayGrid[gy * gridW + (gx + 1)];

      const lap = up + down + left + right - 4 * center;
      laplacianSum += lap;
      laplacianSumSq += lap * lap;
      laplacianCount++;
    }
  }

  const meanLap = laplacianCount > 0 ? laplacianSum / laplacianCount : 0;
  const lapVariance = laplacianCount > 0 ? Math.max(0, laplacianSumSq / laplacianCount - meanLap * meanLap) : 0;

  // Normalized scores (0 - 100)
  const brightnessScore = Math.min(100, Math.max(0, Math.round((meanLuminance / 255) * 100)));
  const contrastScore = Math.min(100, Math.max(0, Math.round((stdDevLuminance / 64) * 100)));
  const sharpnessScore = Math.min(100, Math.max(0, Math.round((lapVariance / 80) * 100)));

  const warnings: string[] = [];

  if (meanLuminance < cfg.minBrightness) {
    warnings.push("Lighting is too dark. Turn on phone flash or move to a brighter environment.");
  } else if (meanLuminance > cfg.maxBrightness || (overexposedPixels / samplesCount) > 0.35) {
    warnings.push("Excessive glare or overexposure detected. Angle phone slightly to avoid direct reflections.");
  }

  if (stdDevLuminance < cfg.minContrastRatio) {
    warnings.push("Low contrast detected across cartridge wells. Check focus distance.");
  }

  if (lapVariance < cfg.minSharpnessVariance) {
    warnings.push("Motion blur or soft focus detected. Hold device steady and retake shot.");
  }

  const passed = warnings.length === 0;

  return {
    passed,
    brightnessScore,
    contrastScore,
    sharpnessScore,
    warnings,
  };
}
