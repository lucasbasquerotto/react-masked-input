import React from 'react';
import type { MaskGenerator } from '../types/mask-generator';
import { useRefMask } from './use-ref-mask';

interface NativeSelection {
	start: number;
	end: number;
}

interface NativeSelectionWrapper {
	selection: NativeSelection;
}

interface TextInputProps {
	setNativeProps: (props: NativeSelectionWrapper) => void;
}

export const useNativeMask = <T extends TextInputProps>({
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
	ref?: React.ForwardedRef<T>;
}) => {
	const selectionRef = React.useRef({ start: 0, end: 0 });

	const onSelectionChange = React.useCallback(
		(event: { nativeEvent: NativeSelectionWrapper }) => {
			selectionRef.current = event.nativeEvent.selection;
		},
		[],
	);

	const getCursorPosition = React.useCallback(() => {
		const cursorPosition = selectionRef.current?.start ?? 0;
		return cursorPosition;
	}, []);

	const setCursorPosition = React.useCallback(
		(
			cursorPosition: number,
			el:
				| { setNativeProps: (props: NativeSelectionWrapper) => void }
				| undefined,
		) => {
			if (el?.setNativeProps) {
				const selection = { start: cursorPosition, end: cursorPosition };
				selectionRef.current = selection;
				el.setNativeProps({
					selection,
				});
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

	const onChangeText = React.useCallback(
		(text: string) => {
			const position =
				(selectionRef.current?.start ?? 0) +
				(text?.length ?? 0) -
				(displayValue?.length ?? 0);
			const selection = { start: position, end: position };
			selectionRef.current = selection;
			ref.current?.setNativeProps({ selection });
			return setDisplayValue(text);
		},
		[setDisplayValue, displayValue, ref],
	);

	return {
		value: displayValue,
		onChangeText,
		onSelectionChange,
		ref,
	};
};
