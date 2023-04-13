import type { MaskGenerator } from '../types/mask-generator';
import MaskFunctions from './mask';

export const DEFAULT_MASK_RULES = new Map([
	['A', /[A-Za-z]/],
	['9', /\d/],
	['?', /\w/],
]);

// Helper functions

export const mask = (value: string, maskGenerator: MaskGenerator): string =>
	MaskFunctions.mask(value, maskGenerator)?.maskedValue ?? '';

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

export const getCurrencyMaskGenerator = ({
	prefix = '',
	thousandSeparator = '',
	centsSeparator = '',
}: {
	prefix?: string;
	thousandSeparator?: string;
	centsSeparator?: string;
}): MaskGenerator => {
	const getRawValue = (value: string): string => {
		const valNoPrefix = prefix
			? value?.startsWith(prefix)
				? value?.substring(prefix.length)
				: prefix?.startsWith(value)
				? ''
				: value
			: value;

		const valNoCents = centsSeparator
			? valNoPrefix?.replaceAll(centsSeparator, '')
			: valNoPrefix;

		const valDigits = thousandSeparator
			? valNoCents?.replaceAll(thousandSeparator, '')
			: valNoCents;

		return valDigits ?? '';
	};

	return {
		rules: DEFAULT_MASK_RULES,
		generateMask: (value) => {
			const rawVal = getRawValue(value);
			const len = rawVal.length;
			const lenCents = centsSeparator ? Math.min(2, Math.max(len - 1, 0)) : 0;
			const lenNoCents = Math.max(len - lenCents, 0);

			const mask =
				prefix +
				'9'.repeat(lenNoCents % 3) +
				(lenNoCents % 3 > 0 && lenNoCents >= 3 ? thousandSeparator : '') +
				(lenNoCents >= 3
					? Array(Math.trunc(lenNoCents / 3))
							.fill('999')
							.join(thousandSeparator)
					: '') +
				(lenCents ? centsSeparator : '') +
				'9'.repeat(lenCents);

			return mask;
		},
		transform: (value) => {
			const valDigits = getRawValue(value);
			const rawVal = valDigits?.replace(/^0+/, '');
			const len = rawVal.length;
			const prefixToUse = value?.startsWith(prefix) ? prefix : '';

			if ((valDigits?.length ?? 0) === 0) {
				return value;
			} else if (centsSeparator && len < 3) {
				return (
					prefixToUse + '0' + centsSeparator + '0'.repeat(2 - len) + rawVal
				);
			} else if (valDigits?.length !== rawVal?.length) {
				const initial: {
					current: string;
					parts: string[];
				} = { current: '', parts: [] };

				const { parts: thousandsParts } = rawVal
					.substring(0, len - 2)
					.split('')
					.reverse()
					.reduce(({ current, parts }, char, idx, arr) => {
						const newCurrent = char + current;

						if (idx === arr?.length - 1 || (idx + 1) % 3 === 0) {
							return {
								current: '',
								parts: [newCurrent, ...parts],
							};
						}

						return {
							current: newCurrent,
							parts,
						};
					}, initial);

				const valNoCents = thousandsParts.join(thousandSeparator);

				const newValue =
					prefixToUse + valNoCents + centsSeparator + rawVal.substring(len - 2);

				return newValue;
			}

			return value;
		},
	};
};
