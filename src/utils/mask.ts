import type { MaskGenerator } from '../types/mask-generator';

const maskMain = (
	value: string,
	maskGenerator: MaskGenerator,
): { maskedValue: string | null; mask: string; transformOffset: number } => {
	value = value.toString();

	const rules = maskGenerator.rules;
	const mask: string = maskGenerator.generateMask(value);
	const transform = maskGenerator.transform;
	let len = value.length;
	const maskLen = mask.length;
	let pos = 0;
	let newValue = '';

	for (let i = 0; i < Math.min(len, maskLen); i++) {
		const maskChar = mask.charAt(i);
		const newChar = value.charAt(pos);
		const regex = rules.get(maskChar);

		if (regex) {
			pos++;

			if (regex.test(newChar)) {
				newValue += newChar;
			} else {
				i--;
				len--;
			}
		} else {
			if (maskChar === newChar) {
				pos++;
			} else {
				len++;
			}

			newValue += maskChar;
		}
	}

	let transformOffset = 0;

	if (transform) {
		const beforeTransform = newValue;
		newValue = transform(beforeTransform);
		transformOffset = (newValue?.length ?? 0) - (beforeTransform?.length ?? 0);
	}

	return { maskedValue: newValue, mask, transformOffset };
};

const mask = (
	value: string,
	maskGenerator: MaskGenerator,
): { maskedValue: string | null; mask: string; transformOffset: number } => {
	const { maskedValue, mask, transformOffset } = maskMain(value, maskGenerator);
	const { maskedValue: shouldBeTheSame, mask: newMask } = maskMain(
		maskedValue ?? '',
		maskGenerator,
	);

	if (maskedValue !== shouldBeTheSame) {
		if (typeof console !== 'undefined') {
			console?.error(
				'mask applied to value should not change when applied again',
				'-> before: ' + value,
				'-> after: ' + maskedValue + ' (mask: ' + mask + ')',
				'-> again: ' + shouldBeTheSame + ' (mask: ' + newMask + ')',
			);
		}

		return { maskedValue: value, mask, transformOffset: 0 };
	}

	return { maskedValue, mask, transformOffset };
};

const unmask = (
	displayValue: string,
	maskGenerator: MaskGenerator | undefined,
): string | null => {
	if (!maskGenerator) {
		return displayValue;
	}

	const rules = maskGenerator.rules;
	const mask: string = maskGenerator.generateMask(displayValue);
	const maskLen = mask?.length ?? 0;
	return displayValue
		.split('')
		.filter((_, idx) => idx < maskLen && rules.has(mask[idx]))
		.join('');
};

const processValue = (displayValue: string, maskGenerator: MaskGenerator) => {
	const keepMask = maskGenerator.keepMask;
	const value = keepMask ? displayValue : unmask(displayValue, maskGenerator);
	return value;
};

// Algorithm to get the cursor position after the mask is applied
export const getExpectedCursorPos = (args: {
	displayValue: string;
	oldDisplayValue: string;
	valueBeforeMask: string;
	newMask?: MaskGenerator;
	oldMask?: MaskGenerator;
	cursorPosition: number;
	lastWentBack: boolean | undefined;
}): { position: number; wentBack?: boolean } => {
	const {
		displayValue,
		oldDisplayValue,
		valueBeforeMask,
		newMask,
		oldMask,
		cursorPosition,
		lastWentBack,
	} = args;

	const oldMaskStr = oldMask?.generateMask(oldDisplayValue) ?? '';
	const newMaskStr = newMask?.generateMask(displayValue) ?? '';

	const oldDynamicAmount = oldMaskStr
		.split('')
		.filter(
			(char, idx) =>
				oldDisplayValue?.[idx] && (oldMask ? oldMask.rules.has(char) : true),
		).length;

	const newDynamicAmount = newMaskStr
		.split('')
		.filter(
			(char, idx) =>
				displayValue?.[idx] && (newMask ? newMask.rules.has(char) : true),
		).length;

	if (
		oldDynamicAmount === newDynamicAmount &&
		displayValue === oldDisplayValue
	) {
		const afterMaskLen = displayValue?.length ?? 0;
		const beforeMaskLen = valueBeforeMask?.length ?? 0;

		if (afterMaskLen > beforeMaskLen) {
			// When the new value before the mask was applied had less chars,
			// consider to be a case in which a char was deleted.
			// Because it's not known if it was deleted before or after the cursor
			// (the cursor position before the change is unknown), the flag lastWentBack
			// is used to consider if the cursor was before or after the deleted char.
			const position = cursorPosition + afterMaskLen - beforeMaskLen;
			let goOn = true;
			const wentBack = !lastWentBack;
			let offset = 0;

			// advance the adjacent static chars until there's no more remaining
			// if wentBack is true, it will go back until it finds a dynamic char
			// if wentBack is false, it will go forward until it finds a dynamic char
			while (goOn) {
				const idx = position + offset + (wentBack ? -1 : 0);
				const maskChar =
					idx >= 0 && idx < (newMaskStr?.length ?? 0)
						? newMaskStr?.charAt(idx)
						: undefined;

				if (!maskChar) {
					goOn = false;
				} else {
					const regex = newMask?.rules?.get(maskChar);

					if (regex) {
						goOn = false;
					} else {
						offset = wentBack ? offset - 1 : offset + 1;
					}
				}
			}

			const newPosition = Math.max(
				Math.min(position + offset, displayValue?.length ?? 0),
				0,
			);

			return {
				position: newPosition,
				wentBack,
			};
		} else if (afterMaskLen < beforeMaskLen) {
			// If 1 or more chars were added, but the end value ended up
			// being the same after the mask was applied, the cursor should
			// return a number of positions equal to the number of ignored
			// chars (those that should have been placed in dynamic positions,
			// but the rule wasn't satisfied).
			const initial = { ignored: 0, idx: 0 };
			const { ignored } =
				valueBeforeMask
					?.substring(
						0,
						Math.min(
							valueBeforeMask?.length ?? 0,
							newMaskStr?.length ?? 0,
							cursorPosition,
						),
					)
					?.split('')
					?.reduce((acc, char) => {
						const { ignored } = acc;
						let idx = acc.idx;
						const len = newMaskStr?.length ?? 0;

						while (idx < len) {
							if (idx >= cursorPosition) {
								return acc;
							}

							const maskChar = newMaskStr?.charAt(idx);
							const regex = newMask?.rules?.get(maskChar);

							if (regex) {
								if (regex.test(char)) {
									return { ignored, idx: idx + 1 };
								} else {
									return { ignored: ignored + 1, idx };
								}
							} else {
								if (maskChar === char) {
									return { ignored, idx: idx + 1 };
								}

								idx++;
							}
						}

						return {
							ignored,
							idx: idx + 1,
						};
					}, initial) ?? initial;

			const newPosition = Math.max(
				Math.min(cursorPosition - ignored, displayValue?.length ?? 0),
				0,
			);

			return {
				position: newPosition,
				wentBack: lastWentBack,
			};
		} else {
			return {
				position: cursorPosition,
				wentBack: lastWentBack,
			};
		}
	} else if (oldDynamicAmount <= newDynamicAmount) {
		const dynamicOffset = newDynamicAmount - oldDynamicAmount;
		// Guess the last position of the cursor
		const cursorBeforeDynamic = Math.max(
			Math.min(cursorPosition - dynamicOffset, oldDisplayValue?.length ?? 0),
			0,
		);

		const oldStaticAmountBefore = oldMaskStr
			?.substring(0, Math.max(cursorBeforeDynamic, 0))
			.split('')
			.filter(
				(char, idx) =>
					oldDisplayValue?.[idx] &&
					(oldMask ? !oldMask.rules.has(char) : false),
			).length;

		const newStaticAmountBefore = newMaskStr
			?.substring(0, Math.max(cursorBeforeDynamic, 0))
			.split('')
			.filter(
				(char, idx) =>
					displayValue?.[idx] && (newMask ? !newMask.rules.has(char) : false),
			).length;

		// the difference of static chars between the new and old mask, before the cursor
		// and not considering the cursor changes due to dynamic chars
		const initialStaticOffset = newStaticAmountBefore - oldStaticAmountBefore;

		const exceededOffset = Math.max(
			(valueBeforeMask?.length ?? 0) - (displayValue?.length ?? 0),
			0,
		);

		// Calculates the number of ignored chars (those that have not satisfied the mask)
		// and the number of exceeded chars (those that have not been added to the mask,
		// because the end of the mask was reached)
		const initial = { ignored: 0, exceeded: 0, staticAdded: 0, idx: 0 };
		const {
			ignored: charsIgnored = 0,
			exceeded: charsExceeded = 0,
			staticAdded = 0,
		} = valueBeforeMask
			?.split('')
			?.reduce(({ ignored, exceeded, staticAdded, idx }, char) => {
				const len = newMaskStr?.length ?? 0;

				while (idx < len) {
					const maskChar = newMaskStr?.charAt(idx);
					const regex = newMask?.rules?.get(maskChar);

					if (regex) {
						if (regex.test(char)) {
							return { ignored, exceeded, staticAdded, idx: idx + 1 };
						} else {
							const newIgnored =
								idx >
									cursorBeforeDynamic + initialStaticOffset - exceededOffset &&
								idx < cursorPosition
									? ignored + 1
									: ignored;
							return {
								ignored: newIgnored,
								exceeded,
								staticAdded:
									!newIgnored && idx < cursorPosition
										? staticAdded - 1
										: staticAdded,
								idx,
							};
						}
					} else {
						if (maskChar === char) {
							const newIgnored =
								idx >
									cursorBeforeDynamic + initialStaticOffset - exceededOffset &&
								idx < cursorPosition
									? ignored + 1
									: ignored;

							return {
								ignored: newIgnored,
								exceeded,
								staticAdded,
								idx: idx + 1,
							};
						} else {
							if (idx < cursorPosition) {
								staticAdded = staticAdded + 1;
							}
						}

						idx++;
					}
				}

				// after the entire masked was surpassed, increase the exceeded chars amount
				return { ignored, exceeded: exceeded + 1, staticAdded, idx: idx + 1 };
			}, initial) ?? initial;

		let currentPos = cursorBeforeDynamic;
		let staticOffset = initialStaticOffset;

		// calculates the number of static chars that were added to the value,
		// starting from the expected last position of the cursor
		while (
			currentPos - staticOffset - charsExceeded <
			cursorBeforeDynamic + dynamicOffset
		) {
			const idx = currentPos - charsExceeded;

			if (idx < 0) {
				currentPos++;
				continue;
			}

			const char = newMaskStr?.[idx];

			if (!char) {
				break;
			}

			const dynamic = newMask ? newMask.rules.has(char) : true;

			if (!dynamic) {
				staticOffset++;
			}

			currentPos++;
		}

		staticOffset = Math.max(staticAdded, staticOffset, 0);

		return {
			position: Math.min(
				cursorPosition + staticOffset - charsIgnored,
				newMaskStr?.length ?? 0,
			),
			wentBack: lastWentBack,
		};
	} else {
		// If a new static char is added to the display value, not present before the mask was applied,
		// the cursor position should be moved to the right.
		// If a char is removed from the display value, because it was supposed to be dynamic,
		// but have not satisfied the condition, the cursor position should be moved to the left.
		const offset =
			valueBeforeMask
				?.substring(0, Math.min(cursorPosition, valueBeforeMask?.length ?? 0))
				?.split('')
				?.reduce((acc, char, idx) => {
					const maskChar = newMaskStr?.[idx];
					const regex = newMask?.rules?.get(maskChar);

					if (regex) {
						if (regex.test(char)) {
							return acc;
						} else {
							return acc - 1;
						}
					} else {
						if (maskChar === char) {
							return acc;
						} else {
							return acc + 1;
						}
					}
				}, 0) ?? 0;

		// Consider the dynamic chars added when the mask was applied
		// (due to a call to transform). In this case, the cursor position should
		// be moved to the right according to the number of dynamic chars added.
		const initial = { dynamic: 0, idx: 0 };
		const { dynamic } =
			valueBeforeMask?.split('')?.reduce((acc, char) => {
				const { dynamic } = acc;
				let idx = acc.idx;
				const len = newMaskStr?.length ?? 0;

				while (idx < len) {
					const maskChar = newMaskStr?.[idx];
					const regex = newMask?.rules?.get(maskChar);

					if (regex) {
						if (regex.test(char)) {
							return { dynamic: dynamic + 1, idx: idx + 1 };
						} else {
							return acc;
						}
					} else {
						if (maskChar === char) {
							return { dynamic, idx: idx + 1 };
						}

						idx++;
					}
				}

				return acc;
			}, initial) ?? initial;
		const dynamicOffset = Math.max(newDynamicAmount - dynamic, 0);

		const position = Math.max(
			Math.min(
				cursorPosition + offset + dynamicOffset,
				displayValue?.length ?? 0,
			),
			0,
		);

		return { position, wentBack: lastWentBack };
	}
};

const MaskFunctions = {
	getExpectedCursorPos,
	mask,
	processValue,
	unmask,
};

export default MaskFunctions;
