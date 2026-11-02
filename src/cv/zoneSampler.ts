import { RGBColor, ScanStage } from '../types/diagnostic';
import { sampleRoiAverage } from './colorimetry';

export interface RoiDefinition {
  id: string;
  name: string;
  relX: number; // 0 to 1 relative to cartridge bounding frame
  relY: number; // 0 to 1 relative to cartridge bounding frame
  relRadius: number; // radius relative to frame width
  label?: string;
  layer: 'blank' | 'layer1' | 'layer2' | 'layer3';
}

/**
 * Standardized bounding frame calculation for viewfinder, synthetic simulator, and image sampling
 */
export function getFrameRect(
  frameWidth: number,
  frameHeight: number,
  stage: ScanStage
): { x: number; y: number; width: number; height: number } {
  const relW = stage === 'layer3' || stage === 'full' ? 0.80 : 0.75;
  const relH = stage === 'layer3' || stage === 'full' ? 0.75 : 0.65;
  const width = Math.round(frameWidth * relW);
  const height = Math.round(frameHeight * relH);
  return {
    x: Math.round((frameWidth - width) / 2),
    y: Math.round((frameHeight - height) / 2),
    width,
    height,
  };
}

/**
 * Returns standardized ROI coordinates for each capture stage
 */
export function getRoisForStage(stage: ScanStage): RoiDefinition[] {
  switch (stage) {
    case 'calibration':
      return [
        { id: 'blank_center', name: 'Blank Substrate', relX: 0.50, relY: 0.50, relRadius: 0.14, label: 'BLANK', layer: 'blank' }
      ];

    case 'layer1':
      return [
        { id: 'layer1_pus', name: 'Pus-Cell Well', relX: 0.50, relY: 0.22, relRadius: 0.16, label: 'PYURIA', layer: 'layer1' },
        { id: 'layer1_ref', name: 'Internal Reference', relX: 0.50, relY: 0.08, relRadius: 0.08, label: 'REF', layer: 'blank' },
      ];

    case 'layer2':
      // 4-Plex Aptamer Quadrants: A1 (TL), A2 (TR), A3 (BL), A4 (BR)
      return [
        { id: 'ecoli', name: 'E. coli', relX: 0.36, relY: 0.38, relRadius: 0.09, label: 'A1: E. coli', layer: 'layer2' },
        { id: 'klebsiella', name: 'K. pneumoniae', relX: 0.64, relY: 0.38, relRadius: 0.09, label: 'A2: K. pneumo', layer: 'layer2' },
        { id: 'proteus', name: 'P. mirabilis', relX: 0.36, relY: 0.64, relRadius: 0.09, label: 'A3: P. mirab', layer: 'layer2' },
        { id: 'enterococcus', name: 'E. faecalis', relX: 0.64, relY: 0.64, relRadius: 0.09, label: 'A4: E. faec', layer: 'layer2' },
      ];

    case 'layer3': {
      // 5 Antibiotics x 4 Replicates Grid (5 rows x 4 cols)
      const drugs = [
        { id: 'nitrofurantoin', name: 'Nitrofurantoin' },
        { id: 'fosfomycin', name: 'Fosfomycin' },
        { id: 'tmp_smx', name: 'TMP-SMX' },
        { id: 'ciprofloxacin', name: 'Ciprofloxacin' },
        { id: 'amox_clav', name: 'Amox-Clav' },
      ];

      const rois: RoiDefinition[] = [];
      const startX = 0.28;
      const stepX = 0.15;
      const startY = 0.22;
      const stepY = 0.14;

      drugs.forEach((drug, row) => {
        for (let col = 0; col < 4; col++) {
          rois.push({
            id: `${drug.id}_rep_${col + 1}`,
            name: `${drug.name} R${col + 1}`,
            relX: startX + col * stepX,
            relY: startY + row * stepY,
            relRadius: 0.045,
            label: `${drug.name.substring(0, 3).toUpperCase()}-${col + 1}`,
            layer: 'layer3'
          });
        }
      });
      return rois;
    }

    case 'full': {
      // Single-shot full cartridge overlay (FR32)
      const fullRois: RoiDefinition[] = [
        { id: 'blank_ref', name: 'Control Reference', relX: 0.86, relY: 0.08, relRadius: 0.045, label: 'BLANK', layer: 'blank' },
        { id: 'layer1_pus', name: 'Pus-Cell Reaction', relX: 0.50, relY: 0.22, relRadius: 0.075, label: 'PYURIA', layer: 'layer1' },
        // Layer 2 spots
        { id: 'ecoli', name: 'E. coli', relX: 0.36, relY: 0.40, relRadius: 0.05, label: 'A1', layer: 'layer2' },
        { id: 'klebsiella', name: 'K. pneumoniae', relX: 0.64, relY: 0.40, relRadius: 0.05, label: 'A2', layer: 'layer2' },
        { id: 'proteus', name: 'P. mirabilis', relX: 0.36, relY: 0.50, relRadius: 0.05, label: 'A3', layer: 'layer2' },
        { id: 'enterococcus', name: 'E. faecalis', relX: 0.64, relY: 0.50, relRadius: 0.05, label: 'A4', layer: 'layer2' },
      ];

      const drugs = ['nitrofurantoin', 'fosfomycin', 'tmp_smx', 'ciprofloxacin', 'amox_clav'];
      drugs.forEach((drugId, row) => {
        for (let col = 0; col < 4; col++) {
          fullRois.push({
            id: `${drugId}_rep_${col + 1}`,
            name: `${drugId} R${col + 1}`,
            relX: 0.28 + col * 0.15,
            relY: 0.65 + row * 0.065,
            relRadius: 0.024,
            label: `W${row * 4 + col + 1}`,
            layer: 'layer3'
          });
        }
      });

      return fullRois;
    }

    default:
      return [];
  }
}

/**
 * Samples all ROIs from an image canvas given the aligned cartridge bounding rect
 */
export function sampleStageRois(
  canvas: HTMLCanvasElement,
  frameRectOrStage: { x: number; y: number; width: number; height: number } | ScanStage,
  optionalStage?: ScanStage
): Record<string, RGBColor> {
  const ctx = canvas.getContext('2d');
  if (!ctx) return {};

  const stage: ScanStage = typeof frameRectOrStage === 'string'
    ? frameRectOrStage
    : (optionalStage || 'full');

  const frameRect = typeof frameRectOrStage === 'object'
    ? frameRectOrStage
    : getFrameRect(canvas.width, canvas.height, stage);

  const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const rois = getRoisForStage(stage);
  const results: Record<string, RGBColor> = {};

  for (const roi of rois) {
    const pxX = frameRect.x + roi.relX * frameRect.width;
    const pxY = frameRect.y + roi.relY * frameRect.height;
    const pxRadius = roi.relRadius * frameRect.width;

    const rgb = sampleRoiAverage(imgData, pxX, pxY, pxRadius);
    results[roi.id] = rgb;
  }

  return results;
}
