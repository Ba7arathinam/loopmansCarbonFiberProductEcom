/**
 * Price Matrix Utilities
 * Pure functions extracted from the old ProductService.
 * Used by ProductSeederService (to build initial data) and
 * ProductDetailComponent (to look up the active price).
 */

// ── Build a sorted matrix key from a combo of selected options ─────────────
export function matrixKey(combo: Record<string, string>): string {
  return Object.keys(combo)
    .sort()
    .map(k => `${k}:${combo[k]}`)
    .join('|');
}

// ── Look up price from a price matrix, with fallback ─────────────────────
export function lookupPrice(
  priceMatrix: Record<string, number> | undefined,
  selectedOptions: Record<string, string>,
  basePrice: number
): number {
  if (!priceMatrix || Object.keys(selectedOptions).length === 0) return basePrice;

  const sortedPairs = Object.keys(selectedOptions)
    .sort()
    .map(k => `${k}:${selectedOptions[k]}`);

  // Try progressively shorter key prefixes (longest match wins)
  for (let len = sortedPairs.length; len >= 1; len--) {
    const key = sortedPairs.slice(0, len).join('|');
    if (priceMatrix[key] !== undefined) return priceMatrix[key];
  }

  return basePrice;
}

// ── Round Tube Matrix ──────────────────────────────────────────────────────
export function buildRoundTubeMatrix(): Record<string, number> {
  const OD_PRICES: Record<string, number> = {
    '6MM': 280, '8MM': 320, '10MM': 390, '12MM': 450, '16MM': 580,
    '18MM': 650, '20MM': 720, '24MM': 860, '25MM': 890, '28MM': 980,
    '30MM': 1050, '38MM': 1380, '40MM': 1450, '45MM': 1620, '50MM': 1800,
  };
  const THICKNESS_MULT: Record<string, number> = {
    '1.0 MM': 1.00, '1.5 MM': 1.28, '2.0 MM': 1.58, '4.5 MM': 2.40,
  };
  const LENGTH_MULT: Record<string, number> = {
    '500MM': 0.60, '1000MM': 1.00,
  };
  const FINISH_MULT: Record<string, number> = {
    'MATTE': 1.00, 'GLOSS': 1.07,
  };

  const matrix: Record<string, number> = {};
  for (const od of Object.keys(OD_PRICES)) {
    for (const th of Object.keys(THICKNESS_MULT)) {
      for (const len of Object.keys(LENGTH_MULT)) {
        for (const fin of Object.keys(FINISH_MULT)) {
          const combo = { 'OD': od, 'Thickness (mm)': th, 'Length': len, 'Surface Finish': fin };
          const key = matrixKey(combo);
          const price = Math.round(OD_PRICES[od] * THICKNESS_MULT[th] * LENGTH_MULT[len] * FINISH_MULT[fin]);
          matrix[key] = price;
        }
      }
    }
  }
  return matrix;
}

// ── Square Tube Matrix ─────────────────────────────────────────────────────
export function buildSquareTubeMatrix(): Record<string, number> {
  const SIZE_PRICES: Record<string, number> = {
    '10MM X 8MM': 1850, '15MM X 12MM': 2100, '15MM X 13MM': 2150, '18MM X 14MM': 2450,
    '18MM X 16MM': 2550, '20MM X 16MM': 2750, '20MM X 17MM': 2800, '20MM X 18MM': 2900,
    '25MM X 22MM': 3400, '25MM X 23MM': 3480, '30MM X 25MM': 4100, '30MM X 26MM': 4180,
    '30MM X 27MM': 4250, '30MM X 28MM': 4320, '35MM X 31MM': 5050, '40MM X 35MM': 6100,
    '40MM X 36MM': 6180, '40MM X 38MM': 6420, '50MM X 45MM': 8200,
  };
  const FINISH_MULT: Record<string, number> = { 'MATTE': 1.00, 'GLOSS': 1.07 };

  const matrix: Record<string, number> = {};
  for (const size of Object.keys(SIZE_PRICES)) {
    for (const fin of Object.keys(FINISH_MULT)) {
      const combo = { 'Size': size, 'Surface Finish': fin, 'Length': '1000MM' };
      const key = matrixKey(combo);
      matrix[key] = Math.round(SIZE_PRICES[size] * FINISH_MULT[fin]);
    }
  }
  return matrix;
}

// ── Sheet Matrix ───────────────────────────────────────────────────────────
export function buildSheetMatrix(): Record<string, number> {
  return {
    // 2mm Thickness
    'Size:300MM X 300MM|Thickness:2.0MM|Surface Finish:MATTE': 5094,   'Size:300MM X 300MM|Thickness:2.0MM|Surface Finish:GLOSS': 5349,
    'Size:400MM X 300MM|Thickness:2.0MM|Surface Finish:MATTE': 5251,   'Size:400MM X 300MM|Thickness:2.0MM|Surface Finish:GLOSS': 5514,
    'Size:500MM X 300MM|Thickness:2.0MM|Surface Finish:MATTE': 5414,   'Size:500MM X 300MM|Thickness:2.0MM|Surface Finish:GLOSS': 5685,
    'Size:600MM X 300MM|Thickness:2.0MM|Surface Finish:MATTE': 5581,   'Size:600MM X 300MM|Thickness:2.0MM|Surface Finish:GLOSS': 5860,
    'Size:700MM X 300MM|Thickness:2.0MM|Surface Finish:MATTE': 5754,   'Size:700MM X 300MM|Thickness:2.0MM|Surface Finish:GLOSS': 6042,
    'Size:800MM X 300MM|Thickness:2.0MM|Surface Finish:MATTE': 5932,   'Size:800MM X 300MM|Thickness:2.0MM|Surface Finish:GLOSS': 6229,
    'Size:900MM X 300MM|Thickness:2.0MM|Surface Finish:MATTE': 6115,   'Size:900MM X 300MM|Thickness:2.0MM|Surface Finish:GLOSS': 6421,
    'Size:1000MM X 300MM|Thickness:2.0MM|Surface Finish:MATTE': 6304,  'Size:1000MM X 300MM|Thickness:2.0MM|Surface Finish:GLOSS': 6619,
    'Size:300MM X 400MM|Thickness:2.0MM|Surface Finish:MATTE': 6367,   'Size:300MM X 400MM|Thickness:2.0MM|Surface Finish:GLOSS': 6685,
    'Size:400MM X 400MM|Thickness:2.0MM|Surface Finish:MATTE': 6564,   'Size:400MM X 400MM|Thickness:2.0MM|Surface Finish:GLOSS': 6892,
    'Size:500MM X 400MM|Thickness:2.0MM|Surface Finish:MATTE': 6767,   'Size:500MM X 400MM|Thickness:2.0MM|Surface Finish:GLOSS': 7105,
    'Size:600MM X 400MM|Thickness:2.0MM|Surface Finish:MATTE': 6977,   'Size:600MM X 400MM|Thickness:2.0MM|Surface Finish:GLOSS': 7326,
    'Size:700MM X 400MM|Thickness:2.0MM|Surface Finish:MATTE': 7192,   'Size:700MM X 400MM|Thickness:2.0MM|Surface Finish:GLOSS': 7552,
    'Size:800MM X 400MM|Thickness:2.0MM|Surface Finish:MATTE': 7415,   'Size:800MM X 400MM|Thickness:2.0MM|Surface Finish:GLOSS': 7786,
    'Size:900MM X 400MM|Thickness:2.0MM|Surface Finish:MATTE': 7644,   'Size:900MM X 400MM|Thickness:2.0MM|Surface Finish:GLOSS': 8026,
    'Size:1000MM X 400MM|Thickness:2.0MM|Surface Finish:MATTE': 7881,  'Size:1000MM X 400MM|Thickness:2.0MM|Surface Finish:GLOSS': 8275,
    // 3mm Thickness
    'Size:300MM X 300MM|Thickness:3.0MM|Surface Finish:MATTE': 6499,   'Size:300MM X 300MM|Thickness:3.0MM|Surface Finish:GLOSS': 6824,
    'Size:400MM X 300MM|Thickness:3.0MM|Surface Finish:MATTE': 6700,   'Size:400MM X 300MM|Thickness:3.0MM|Surface Finish:GLOSS': 7035,
    'Size:500MM X 300MM|Thickness:3.0MM|Surface Finish:MATTE': 6908,   'Size:500MM X 300MM|Thickness:3.0MM|Surface Finish:GLOSS': 7253,
    'Size:600MM X 300MM|Thickness:3.0MM|Surface Finish:MATTE': 7121,   'Size:600MM X 300MM|Thickness:3.0MM|Surface Finish:GLOSS': 7477,
    'Size:700MM X 300MM|Thickness:3.0MM|Surface Finish:MATTE': 7342,   'Size:700MM X 300MM|Thickness:3.0MM|Surface Finish:GLOSS': 7709,
    'Size:800MM X 300MM|Thickness:3.0MM|Surface Finish:MATTE': 7569,   'Size:800MM X 300MM|Thickness:3.0MM|Surface Finish:GLOSS': 7947,
    'Size:900MM X 300MM|Thickness:3.0MM|Surface Finish:MATTE': 7803,   'Size:900MM X 300MM|Thickness:3.0MM|Surface Finish:GLOSS': 8193,
    'Size:1000MM X 300MM|Thickness:3.0MM|Surface Finish:MATTE': 8044,  'Size:1000MM X 300MM|Thickness:3.0MM|Surface Finish:GLOSS': 8446,
    'Size:300MM X 400MM|Thickness:3.0MM|Surface Finish:MATTE': 8124,   'Size:300MM X 400MM|Thickness:3.0MM|Surface Finish:GLOSS': 8530,
    'Size:400MM X 400MM|Thickness:3.0MM|Surface Finish:MATTE': 8376,   'Size:400MM X 400MM|Thickness:3.0MM|Surface Finish:GLOSS': 8795,
    'Size:500MM X 400MM|Thickness:3.0MM|Surface Finish:MATTE': 8635,   'Size:500MM X 400MM|Thickness:3.0MM|Surface Finish:GLOSS': 9067,
    'Size:600MM X 400MM|Thickness:3.0MM|Surface Finish:MATTE': 8902,   'Size:600MM X 400MM|Thickness:3.0MM|Surface Finish:GLOSS': 9347,
    'Size:700MM X 400MM|Thickness:3.0MM|Surface Finish:MATTE': 9177,   'Size:700MM X 400MM|Thickness:3.0MM|Surface Finish:GLOSS': 9636,
    'Size:800MM X 400MM|Thickness:3.0MM|Surface Finish:MATTE': 9461,   'Size:800MM X 400MM|Thickness:3.0MM|Surface Finish:GLOSS': 9934,
    'Size:900MM X 400MM|Thickness:3.0MM|Surface Finish:MATTE': 9753,   'Size:900MM X 400MM|Thickness:3.0MM|Surface Finish:GLOSS': 10241,
    'Size:1000MM X 400MM|Thickness:3.0MM|Surface Finish:MATTE': 10055, 'Size:1000MM X 400MM|Thickness:3.0MM|Surface Finish:GLOSS': 10558,
    // 4mm Thickness
    'Size:300MM X 300MM|Thickness:4.0MM|Surface Finish:MATTE': 8293,   'Size:300MM X 300MM|Thickness:4.0MM|Surface Finish:GLOSS': 8708,
    'Size:400MM X 300MM|Thickness:4.0MM|Surface Finish:MATTE': 8549,   'Size:400MM X 300MM|Thickness:4.0MM|Surface Finish:GLOSS': 8976,
    'Size:500MM X 300MM|Thickness:4.0MM|Surface Finish:MATTE': 8814,   'Size:500MM X 300MM|Thickness:4.0MM|Surface Finish:GLOSS': 9255,
    'Size:600MM X 300MM|Thickness:4.0MM|Surface Finish:MATTE': 9086,   'Size:600MM X 300MM|Thickness:4.0MM|Surface Finish:GLOSS': 9540,
    'Size:700MM X 300MM|Thickness:4.0MM|Surface Finish:MATTE': 9367,   'Size:700MM X 300MM|Thickness:4.0MM|Surface Finish:GLOSS': 9835,
    'Size:800MM X 300MM|Thickness:4.0MM|Surface Finish:MATTE': 9657,   'Size:800MM X 300MM|Thickness:4.0MM|Surface Finish:GLOSS': 10140,
    'Size:900MM X 300MM|Thickness:4.0MM|Surface Finish:MATTE': 9956,   'Size:900MM X 300MM|Thickness:4.0MM|Surface Finish:GLOSS': 10454,
    'Size:1000MM X 300MM|Thickness:4.0MM|Surface Finish:MATTE': 10264, 'Size:1000MM X 300MM|Thickness:4.0MM|Surface Finish:GLOSS': 10777,
    'Size:300MM X 400MM|Thickness:4.0MM|Surface Finish:MATTE': 10366,  'Size:300MM X 400MM|Thickness:4.0MM|Surface Finish:GLOSS': 10884,
    'Size:400MM X 400MM|Thickness:4.0MM|Surface Finish:MATTE': 10687,  'Size:400MM X 400MM|Thickness:4.0MM|Surface Finish:GLOSS': 11221,
    'Size:500MM X 400MM|Thickness:4.0MM|Surface Finish:MATTE': 11017,  'Size:500MM X 400MM|Thickness:4.0MM|Surface Finish:GLOSS': 11568,
    'Size:600MM X 400MM|Thickness:4.0MM|Surface Finish:MATTE': 11358,  'Size:600MM X 400MM|Thickness:4.0MM|Surface Finish:GLOSS': 11926,
    'Size:700MM X 400MM|Thickness:4.0MM|Surface Finish:MATTE': 11709,  'Size:700MM X 400MM|Thickness:4.0MM|Surface Finish:GLOSS': 12294,
    'Size:800MM X 400MM|Thickness:4.0MM|Surface Finish:MATTE': 12071,  'Size:800MM X 400MM|Thickness:4.0MM|Surface Finish:GLOSS': 12675,
    'Size:900MM X 400MM|Thickness:4.0MM|Surface Finish:MATTE': 12445,  'Size:900MM X 400MM|Thickness:4.0MM|Surface Finish:GLOSS': 13067,
    'Size:1000MM X 400MM|Thickness:4.0MM|Surface Finish:MATTE': 12830, 'Size:1000MM X 400MM|Thickness:4.0MM|Surface Finish:GLOSS': 13472,
    // 5mm Thickness
    'Size:300MM X 300MM|Thickness:5.0MM|Surface Finish:MATTE': 10581,  'Size:300MM X 300MM|Thickness:5.0MM|Surface Finish:GLOSS': 11110,
    'Size:400MM X 300MM|Thickness:5.0MM|Surface Finish:MATTE': 10908,  'Size:400MM X 300MM|Thickness:5.0MM|Surface Finish:GLOSS': 11453,
    'Size:500MM X 300MM|Thickness:5.0MM|Surface Finish:MATTE': 11246,  'Size:500MM X 300MM|Thickness:5.0MM|Surface Finish:GLOSS': 11808,
    'Size:600MM X 300MM|Thickness:5.0MM|Surface Finish:MATTE': 11594,  'Size:600MM X 300MM|Thickness:5.0MM|Surface Finish:GLOSS': 12174,
    'Size:700MM X 300MM|Thickness:5.0MM|Surface Finish:MATTE': 11952,  'Size:700MM X 300MM|Thickness:5.0MM|Surface Finish:GLOSS': 12550,
    'Size:800MM X 300MM|Thickness:5.0MM|Surface Finish:MATTE': 12322,  'Size:800MM X 300MM|Thickness:5.0MM|Surface Finish:GLOSS': 12938,
    'Size:900MM X 300MM|Thickness:5.0MM|Surface Finish:MATTE': 12703,  'Size:900MM X 300MM|Thickness:5.0MM|Surface Finish:GLOSS': 13338,
    'Size:1000MM X 300MM|Thickness:5.0MM|Surface Finish:MATTE': 13096, 'Size:1000MM X 300MM|Thickness:5.0MM|Surface Finish:GLOSS': 13751,
    'Size:300MM X 400MM|Thickness:5.0MM|Surface Finish:MATTE': 13226,  'Size:300MM X 400MM|Thickness:5.0MM|Surface Finish:GLOSS': 13887,
    'Size:400MM X 400MM|Thickness:5.0MM|Surface Finish:MATTE': 13635,  'Size:400MM X 400MM|Thickness:5.0MM|Surface Finish:GLOSS': 14317,
    'Size:500MM X 400MM|Thickness:5.0MM|Surface Finish:MATTE': 14057,  'Size:500MM X 400MM|Thickness:5.0MM|Surface Finish:GLOSS': 14760,
    'Size:600MM X 400MM|Thickness:5.0MM|Surface Finish:MATTE': 14492,  'Size:600MM X 400MM|Thickness:5.0MM|Surface Finish:GLOSS': 15217,
    'Size:700MM X 400MM|Thickness:5.0MM|Surface Finish:MATTE': 14940,  'Size:700MM X 400MM|Thickness:5.0MM|Surface Finish:GLOSS': 15687,
    'Size:800MM X 400MM|Thickness:5.0MM|Surface Finish:MATTE': 15402,  'Size:800MM X 400MM|Thickness:5.0MM|Surface Finish:GLOSS': 16172,
    'Size:900MM X 400MM|Thickness:5.0MM|Surface Finish:MATTE': 15879,  'Size:900MM X 400MM|Thickness:5.0MM|Surface Finish:GLOSS': 16673,
    'Size:1000MM X 400MM|Thickness:5.0MM|Surface Finish:MATTE': 16370, 'Size:1000MM X 400MM|Thickness:5.0MM|Surface Finish:GLOSS': 17189,
  };
}
