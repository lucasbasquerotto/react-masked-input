import React from 'react';
import { MaskGenerator } from '../utils/mask-util';
import { useMask } from './use-mask';

const useCombinedRefs = <T>(
	innerRef: React.MutableRefObject<T | null>,
	fwdRef: React.ForwardedRef<T> | undefined,
) => {
	React.useEffect(() => {
		[innerRef, fwdRef].forEach((ref) => {
			if (ref) {
				if (typeof ref === 'function') {
					ref(innerRef.current || null);
				} else {
					ref.current = innerRef.current || null;
				}
			}
		});
	}, [innerRef, fwdRef]);

	return innerRef;
};

export interface UseRefMaskProps<T> {
	maskGenerator?: MaskGenerator;
	value?: string;
	onChange?: (value: string) => void;
	keepMask?: boolean;
	getCursorPosition: (el: T | undefined) => number;
	setCursorPosition: (cursorPosition: number, el: T | undefined) => void;
	ref?: React.ForwardedRef<T>;
}

export const useRefMask = <T>({
	maskGenerator,
	value: outerValue,
	onChange,
	keepMask,
	ref,
	getCursorPosition: getCursorPositionOuter,
	setCursorPosition: setCursorPositionOuter,
}: UseRefMaskProps<T>) => {
	const innerRef = React.useRef<T>(null);
	const combinedRefs = useCombinedRefs(innerRef, ref);

	const getCursorPosition = React.useCallback(() => {
		const el = combinedRefs?.current;
		return getCursorPositionOuter(el ?? undefined);
	}, [combinedRefs, getCursorPositionOuter]);

	const setCursorPosition = React.useCallback(
		(cursorPosition: number) => {
			const el = combinedRefs?.current;
			setCursorPositionOuter(cursorPosition, el ?? undefined);
		},
		[combinedRefs],
	);

	const { displayValue, setDisplayValue } = useMask({
		outerValue,
		maskGenerator,
		getCursorPosition,
		setCursorPosition,
		onChange,
		keepMask,
	});

	return { displayValue, setDisplayValue, ref: combinedRefs };
};
