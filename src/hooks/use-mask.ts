import React from 'react';
import MaskFunctions from '../utils/mask';
import type { MaskGenerator } from '../types/mask-generator';

const { getExpectedCursorPos, mask, processValue } = MaskFunctions;

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
