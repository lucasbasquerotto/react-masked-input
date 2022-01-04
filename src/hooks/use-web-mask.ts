import React from 'react';
import type { MaskGenerator } from './use-mask';
import { useMask } from './use-mask';

const useCombinedRefs = <T extends HTMLElement>(
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

export const useWebMask = ({
	maskGenerator,
	value: outerValue,
	onChange,
	keepMask,
	ref,
}: {
	maskGenerator?: MaskGenerator;
	value?: string;
	onChange?: (value: string) => void;
	keepMask?: boolean;
	ref?: React.ForwardedRef<HTMLInputElement>;
}) => {
	const innerRef = React.useRef<HTMLInputElement>(null);
	const combinedRefs = useCombinedRefs(innerRef, ref);

	const getCursorPosition = React.useCallback(() => {
		const el = combinedRefs?.current;
		const cursorPosition = el?.selectionStart ?? 0;
		return cursorPosition;
	}, [combinedRefs]);

	const setCursorPosition = React.useCallback(
		(cursorPosition: number) => {
			const el = combinedRefs?.current;

			if (el) {
				el.selectionStart = cursorPosition;
				el.selectionEnd = cursorPosition;
			}
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

	const handleOnChange: React.ChangeEventHandler<HTMLInputElement> =
		React.useCallback(
			(e) => setDisplayValue(e?.target?.value ?? ''),
			[setDisplayValue],
		);

	return { value: displayValue, onChange: handleOnChange, ref: combinedRefs };
};
