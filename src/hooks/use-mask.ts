import React from 'react';
import type { MaskGenerator } from '../utils/mask-util';

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
	const {
		maskedValue: maskedValueAux,
		transformOffset: transformOffsetInitial,
	} = maskMain(value, maskGenerator);
	const {
		maskedValue,
		mask,
		transformOffset: transformOffsetAux,
	} = maskMain(maskedValueAux ?? '', maskGenerator);
	let transformOffset = transformOffsetInitial;

	if (maskedValue !== maskedValueAux) {
		transformOffset = transformOffsetAux;
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
				while (idx < newMaskStr?.length) {
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
		let staticOffset = newStaticAmountBefore - oldStaticAmountBefore;

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

		const position = Math.max(
			Math.min(cursorPosition + offset, displayValue?.length ?? 0),
			0,
		);

		return { position, wentBack: lastWentBack };
	}
};

export interface UseMaskProps {
	outerValue?: string;
	maskGenerator?: MaskGenerator;
	onChange?: (value: string) => void;
	getCursorPosition?: () => number;
	setCursorPosition?: (cursorPosition: number) => void;
	keepMask?: boolean;
}

export const useMask = ({
	outerValue,
	maskGenerator,
	onChange,
	getCursorPosition,
	setCursorPosition,
	keepMask,
}: UseMaskProps) => {
	const [lastOuterValue, setLastOuterValue] = React.useState(outerValue);
	const [value, setValue] = React.useState(outerValue);
	const [lastValue, setLastValue] = React.useState(value);
	const [displayValue, setDisplayValue] = React.useState(value);
	const [lastDisplayValue, setLastDisplayValue] = React.useState(displayValue);
	const [lastCursorValue, setLastCursorValue] = React.useState(displayValue);
	const [lastCursorPosition, setLastCursorPosition] = React.useState(
		displayValue?.length ?? 0,
	);
	const [cursorBeforeMaskValue, setCursorBeforeMaskValue] =
		React.useState(displayValue);
	const [needUpdateCursor, setNeedUpdateCursor] = React.useState(false);
	const [lastWentBack, setLastWentBack] = React.useState(false);

	const [lastMask, setLastMask] = React.useState(maskGenerator);
	const [lastCursorMask, setLastCursorMask] = React.useState(maskGenerator);
	const [lastMaskValue, setLastMaskValue] = React.useState<string | undefined>(
		undefined,
	);

	const updateDisplayValue = React.useCallback(
		(value: string, updateCursor?: boolean) => {
			if (updateCursor && getCursorPosition) {
				const cursorPosition = getCursorPosition();
				setLastCursorPosition(cursorPosition);
				setCursorBeforeMaskValue(value);
				setNeedUpdateCursor(true);
			}

			if ((value ?? '').trim() === '') {
				setDisplayValue('');
				setValue('');
				setLastMask(undefined);
				return { displayValue: '' };
			} else if (maskGenerator) {
				const {
					maskedValue,
					mask: currentMask,
					transformOffset,
				} = mask(value, maskGenerator);
				const processedValue = processValue(maskedValue ?? '', maskGenerator);

				setDisplayValue(maskedValue ?? undefined);
				setValue(processedValue ?? undefined);
				setLastMask(maskGenerator);

				if (transformOffset && updateCursor && getCursorPosition) {
					const cursorPosition = getCursorPosition();
					const newCursorPosition = cursorPosition + transformOffset;
					setLastCursorPosition(newCursorPosition);
					setCursorBeforeMaskValue(value);
					setNeedUpdateCursor(true);
				}

				return { displayValue: maskedValue, mask: currentMask };
			} else {
				setDisplayValue(value);
				setValue(value);
				setLastMask(undefined);
				return { displayValue: value };
			}
		},
		[maskGenerator, getCursorPosition],
	);

	const changeDisplayValue = React.useCallback(
		(value: string) => {
			updateDisplayValue(value, true);
		},
		[updateDisplayValue],
	);

	React.useEffect(() => {
		if (setCursorPosition && lastCursorPosition != null) {
			setCursorPosition(lastCursorPosition);
		}
	}, [setCursorPosition, lastCursorPosition]);

	const updateCursor = React.useCallback(
		({
			displayValue,
			oldDisplayValue,
			newMask,
			oldMask,
			force,
		}: {
			displayValue: string;
			oldDisplayValue: string;
			newMask?: MaskGenerator;
			oldMask?: MaskGenerator;
			force?: boolean;
		}) => {
			if (setCursorPosition && getCursorPosition) {
				let { position: newExpectedCursorPos, wentBack = false } =
					getExpectedCursorPos({
						displayValue,
						oldDisplayValue,
						valueBeforeMask: cursorBeforeMaskValue ?? '',
						newMask,
						oldMask,
						cursorPosition: lastCursorPosition,
						lastWentBack,
					});

				if (force || lastCursorPosition !== newExpectedCursorPos) {
					setLastCursorPosition(newExpectedCursorPos);
					setCursorPosition(newExpectedCursorPos);
				}

				setLastWentBack(wentBack);
			}
		},
		[
			lastCursorPosition,
			setCursorPosition,
			getCursorPosition,
			lastWentBack,
			cursorBeforeMaskValue,
		],
	);

	React.useEffect(() => {
		const maskValue =
			(maskGenerator?.generateMask &&
				maskGenerator?.generateMask(value ?? '')) ||
			undefined;

		if (maskValue !== lastMaskValue || outerValue !== lastOuterValue) {
			setLastMaskValue(maskValue);
			setLastOuterValue(outerValue);

			if (maskValue !== lastMaskValue || outerValue !== value) {
				updateDisplayValue(outerValue ?? '');
			}
		}
	}, [
		lastMaskValue,
		setLastMaskValue,
		maskGenerator,
		outerValue,
		lastOuterValue,
		value,
		updateDisplayValue,
	]);

	React.useEffect(() => {
		if (value !== lastValue) {
			setLastValue(value);
			updateDisplayValue(value ?? '');

			if (!keepMask && onChange) {
				onChange(value ?? '');
			}
		}
	}, [value, lastValue, maskGenerator, updateDisplayValue, keepMask, onChange]);

	React.useEffect(() => {
		if (displayValue !== lastDisplayValue) {
			const { displayValue: newDisplayValue } = updateDisplayValue(
				displayValue ?? '',
			);

			if ((newDisplayValue ?? '') === (displayValue ?? '')) {
				setLastDisplayValue(newDisplayValue ?? undefined);

				if (keepMask && onChange) {
					onChange(newDisplayValue ?? '');
				}
			}
		}
	}, [displayValue, lastDisplayValue, updateDisplayValue, keepMask, onChange]);

	React.useEffect(() => {
		const newPos = getCursorPosition ? getCursorPosition() : lastCursorPosition;
		const force = newPos !== lastCursorPosition;

		if (
			displayValue === lastDisplayValue &&
			(lastCursorValue !== lastDisplayValue || force || needUpdateCursor)
		) {
			setNeedUpdateCursor(false);
			setLastCursorValue(lastDisplayValue);
			setLastCursorMask(lastMask);

			updateCursor({
				displayValue: lastDisplayValue ?? '',
				oldDisplayValue: lastCursorValue ?? '',
				newMask: lastMask,
				oldMask: lastCursorMask,
				force,
			});
		}
	}, [
		lastCursorValue,
		displayValue,
		lastDisplayValue,
		lastCursorPosition,
		lastMask,
		lastCursorMask,
		needUpdateCursor,
		getCursorPosition,
		updateCursor,
	]);

	const result = React.useMemo(
		() => ({ displayValue, setDisplayValue: changeDisplayValue }),
		[displayValue, changeDisplayValue],
	);

	return result;
};
