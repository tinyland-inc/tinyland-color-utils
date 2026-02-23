












export type {
	RGB,
	RGBA,
	HSL,
	OKLCH,
	OKLAB,
	ParsedColor,
	WCAGLevel,
	ContrastResult,
	ContrastValidation,
	ColorBlindnessType,
	ColorPalette
} from './types';


export {
	parseColor,
	parseHex,
	parseRgb,
	parseHsl,
	parseOklchString,
	parseOklabString,
	parseOklchToRgb,
	parseOklabToRgb
} from './parser';


export {
	hexToRgb,
	rgbToHex,
	rgbToHsl,
	hslToRgb,
	rgbToOklch,
	rgbToOklab,
	oklchToRgb,
	oklabToRgb,
	oklchToOklab,
	oklabToOklch,
	oklchStringToRgbValues,
	alphaBlend
} from './conversion';


export {
	getRelativeLuminance,
	getContrastRatio,
	meetsWCAG,
	analyzeContrast,
	isLargeText,
	getPerceivedBrightness,
	isLightColor,
	getContrastingColor,
	adjustColorForContrast,
	isReadableOnGlass,
	batchValidate,
	simulateColorBlindness
} from './contrast';


export {
	ColorCache,
	parseCache,
	conversionCache,
	luminanceCache,
	contrastCache,
	clearAllCaches,
	getAllCacheStats
} from './cache';







export { parseColor as getCSSVariableColor } from './parser';




export { getRelativeLuminance as getLuminance } from './contrast';





export { alphaBlend as applyTransparency } from './conversion';





export function checkWCAG(
	foreground: string,
	background: string,
	level: 'AA' | 'AAA' = 'AA',
	fontSize: 'normal' | 'large' = 'normal'
): boolean {
	const wcagLevel = fontSize === 'large' ? `${level}-large` : level;
	return meetsWCAG(foreground, background, wcagLevel as any);
}





export function generateAccessiblePalette(baseColor: string, count = 5, minContrast = 4.5): string[] {
	const palette: string[] = [baseColor];
	const rgb = parseColor(baseColor);
	if (!rgb) return palette;

	
	for (let i = 1; i < Math.ceil(count / 2); i++) {
		const factor = 1 + i * 0.2;
		const lighter = {
			r: Math.min(255, rgb.r * factor),
			g: Math.min(255, rgb.g * factor),
			b: Math.min(255, rgb.b * factor)
		};
		palette.push(rgbToHex(lighter));
	}

	
	for (let i = 1; i <= Math.floor(count / 2); i++) {
		const factor = 1 - i * 0.2;
		const darker = {
			r: Math.max(0, rgb.r * factor),
			g: Math.max(0, rgb.g * factor),
			b: Math.max(0, rgb.b * factor)
		};
		palette.push(rgbToHex(darker));
	}

	return palette;
}

import { parseColor } from './parser';
import { rgbToHex } from './conversion';
import { meetsWCAG } from './contrast';
