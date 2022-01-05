// Interface and constant

export interface MaskGenerator {
	rules: Map<string, RegExp>;
	generateMask: (value: string) => string;
	transform?: (value: string) => string;
	keepMask?: boolean;
}

export const DEFAULT_MASK_RULES = new Map([
	['A', /[A-Za-z]/],
	['9', /\d/],
	['?', /\w/],
]);

// Helper functions

export const createDefaultMaskGenerator = (mask: string): MaskGenerator => ({
	rules: DEFAULT_MASK_RULES,
	generateMask: () => mask,
});

const onlyDigits = (value: string) => {
	const onlyDigits = value != null ? value.replace(/\D/g, '') : null;
	return onlyDigits;
};

const hasMoreDigits = (v01: string, v02: string): boolean => {
	const d01 = onlyDigits(v01);
	const d02 = onlyDigits(v02);
	const len01 = d01?.length ?? 0;
	const len02 = d02?.length ?? 0;
	const moreDigits = len01 > len02;
	return moreDigits;
};

const dynamicNumberMask = (value: string, ...masks: string[]) => {
	let currentMask = null;

	for (const mask of masks) {
		if (!hasMoreDigits(value, mask)) {
			return mask;
		}

		currentMask = mask;
	}

	return currentMask ?? '';
};

export const createDynamicNumberMaskGenerator = (
	...masks: string[]
): MaskGenerator => ({
	rules: DEFAULT_MASK_RULES,
	generateMask: (v) => dynamicNumberMask(v, ...masks),
});
