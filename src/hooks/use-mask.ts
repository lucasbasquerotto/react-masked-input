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
	const lastOuterValueRef = React.useRef(outerValue);
	const lastValueRef = React.useRef(outerValue);
	const lastDisplayValueRef = React.useRef(outerValue);
	const lastCursorPositionRef = React.useRef(outerValue?.length ?? 0);
	const cursorBeforeMaskValueRef = React.useRef(outerValue);
	const lastWentBackRef = React.useRef(false);
	const lastMaskRef = React.useRef(maskGenerator);
	const lastCursorMaskRef = React.useRef(maskGenerator);

	const [value, setValue] = React.useState(outerValue);
	const [displayValue, setDisplayValue] = React.useState(value);
	const [lastCursorValue, setLastCursorValue] = React.useState(displayValue);
	const [lastMaskValue, setLastMaskValue] = React.useState<
		string | undefined
	>();
	const [needUpdateCursor, setNeedUpdateCursor] = React.useState(false);

	const updateDisplayValue = React.useCallback(
		(value: string, updateCursorFlag?: boolean) => {
			if (updateCursorFlag && getCursorPosition) {
				const cursorPosition = getCursorPosition();
				lastCursorPositionRef.current = cursorPosition;
				cursorBeforeMaskValueRef.current = value;
				setNeedUpdateCursor(true);
			}

			if ((value ?? '').trim() === '') {
				setDisplayValue('');
				setValue('');
				lastMaskRef.current = undefined;
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
				lastMaskRef.current = maskGenerator;

				if (transformOffset && updateCursorFlag && getCursorPosition) {
					const cursorPosition = getCursorPosition();
					const newCursorPosition = cursorPosition + transformOffset;
					lastCursorPositionRef.current = newCursorPosition;
					cursorBeforeMaskValueRef.current = value;
					setNeedUpdateCursor(true);
				}

				return { displayValue: maskedValue, mask: currentMask };
			} else {
				setDisplayValue(value);
				setValue(value);
				lastMaskRef.current = undefined;
				return { displayValue: value };
			}
		},
		[maskGenerator, getCursorPosition],
	);

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
						valueBeforeMask: cursorBeforeMaskValueRef.current ?? '',
						newMask,
						oldMask,
						cursorPosition: lastCursorPositionRef.current,
						lastWentBack: lastWentBackRef.current,
					});

				if (force || lastCursorPositionRef.current !== newExpectedCursorPos) {
					lastCursorPositionRef.current = newExpectedCursorPos;
					setCursorPosition(newExpectedCursorPos);
				}

				lastWentBackRef.current = wentBack;
			}
		},
		[setCursorPosition, getCursorPosition],
	);

	React.useEffect(() => {
		const maskValue =
			(maskGenerator?.generateMask &&
				maskGenerator?.generateMask(value ?? '')) ||
			undefined;

		if (
			maskValue !== lastMaskValue ||
			outerValue !== lastOuterValueRef.current
		) {
			setLastMaskValue(maskValue);
			lastOuterValueRef.current = outerValue;

			if (maskValue !== lastMaskValue || outerValue !== value) {
				updateDisplayValue(outerValue ?? '');
			}
		}
	}, [
		lastMaskValue,
		setLastMaskValue,
		maskGenerator,
		outerValue,
		value,
		updateDisplayValue,
	]);

	React.useEffect(() => {
		if (value !== lastValueRef.current) {
			lastValueRef.current = value;
			updateDisplayValue(value ?? '');

			if (!keepMask && onChange) {
				onChange(value ?? '');
			}
		}
	}, [value, maskGenerator, updateDisplayValue, keepMask, onChange]);

	React.useEffect(() => {
		if (displayValue !== lastDisplayValueRef.current) {
			const { displayValue: newDisplayValue } = updateDisplayValue(
				displayValue ?? '',
			);

			if ((newDisplayValue ?? '') === (displayValue ?? '')) {
				lastDisplayValueRef.current = newDisplayValue ?? undefined;

				if (keepMask && onChange) {
					onChange(newDisplayValue ?? '');
				}
			}
		}
	}, [displayValue, updateDisplayValue, keepMask, onChange]);

	React.useEffect(() => {
		const newPos = getCursorPosition
			? getCursorPosition()
			: lastCursorPositionRef.current;
		const force = newPos !== lastCursorPositionRef.current;

		if (
			displayValue === lastDisplayValueRef.current &&
			(lastCursorValue !== lastDisplayValueRef.current ||
				force ||
				needUpdateCursor)
		) {
			setNeedUpdateCursor(false);
			setLastCursorValue(lastDisplayValueRef.current);
			lastCursorMaskRef.current = lastMaskRef.current;

			updateCursor({
				displayValue: lastDisplayValueRef.current ?? '',
				oldDisplayValue: lastCursorValue ?? '',
				newMask: lastMaskRef.current,
				oldMask: lastCursorMaskRef.current,
				force,
			});
		}
	}, [
		lastCursorValue,
		displayValue,
		needUpdateCursor,
		getCursorPosition,
		updateCursor,
	]);

	const result = React.useMemo(
		() => ({
			displayValue,
			setDisplayValue: (value: string) => {
				updateDisplayValue(value, true);
			},
		}),
		[displayValue, updateDisplayValue],
	);

	return result;
};
