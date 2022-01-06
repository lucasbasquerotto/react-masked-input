import React from 'react';
import type { MaskGenerator } from '../utils/mask-util';
import { useRefMask } from './use-ref-mask';

export const useWebMask = ({
	maskGenerator,
	value,
	onChange,
	keepMask,
	ref: outerRef,
}: {
	maskGenerator?: MaskGenerator;
	value?: string;
	onChange?: (value: string) => void;
	keepMask?: boolean;
	ref?: React.ForwardedRef<HTMLInputElement>;
}) => {
	const getCursorPosition = React.useCallback(
		(el: HTMLInputElement | undefined) => {
			const cursorPosition = el?.selectionStart ?? 0;
			return cursorPosition;
		},
		[],
	);

	const setCursorPosition = React.useCallback(
		(cursorPosition: number, el: HTMLInputElement | undefined) => {
			if (el) {
				el.selectionStart = cursorPosition;
				el.selectionEnd = cursorPosition;
			}
		},
		[],
	);

	const { displayValue, setDisplayValue, ref } = useRefMask({
		value,
		maskGenerator,
		getCursorPosition,
		setCursorPosition,
		onChange,
		keepMask,
		ref: outerRef,
	});

	const handleOnChange: React.ChangeEventHandler<HTMLInputElement> =
		React.useCallback(
			(e) => setDisplayValue(e?.target?.value ?? ''),
			[setDisplayValue],
		);

	return { value: displayValue, onChange: handleOnChange, ref };
};
