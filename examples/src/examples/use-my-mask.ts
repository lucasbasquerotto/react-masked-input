import React from 'react';
import { MaskGenerator, useRefMask } from 'react-hook-mask';

export interface UseMyMaskProps {
	maskGenerator?: MaskGenerator;
	keepMask?: boolean;
	value?: string;
	onChange?: (value: string) => void;
	ref?: React.ForwardedRef<HTMLInputElement>;
}

const useMyMask = ({
	maskGenerator,
	value,
	onChange,
	keepMask,
	ref: outerRef,
}: UseMyMaskProps) => {
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

	return { value: displayValue, onChange: setDisplayValue, ref };
};

export default useMyMask;
