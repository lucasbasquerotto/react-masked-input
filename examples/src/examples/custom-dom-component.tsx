import React from 'react';
import { useWebMask, MaskGenerator } from 'react-hook-mask';

export interface MyInputProps {
	className?: string;
	myValue?: string;
	myOnChange?: React.ChangeEventHandler<HTMLInputElement>;
	myRef?: React.ForwardedRef<HTMLInputElement>;
}

const MyInput = ({ className, myValue, myOnChange, myRef }: MyInputProps) => (
	<input
		className={className}
		value={myValue}
		onChange={myOnChange}
		ref={myRef}
	/>
);

export interface CustomDOMComponentProps {
	maskGenerator?: MaskGenerator;
	keepMask?: boolean;
	value?: string;
	onChange?: (value: string) => void;
}

const CustomDOMComponent = React.forwardRef(
	(
		{
			maskGenerator,
			value: outerValue,
			onChange: onChangeOuter,
			keepMask,
			...otherProps
		}: CustomDOMComponentProps,
		outerRef: React.ForwardedRef<HTMLInputElement> | undefined,
	) => {
		const { value, onChange, ref } = useWebMask({
			maskGenerator,
			value: outerValue,
			onChange: onChangeOuter,
			keepMask,
			ref: outerRef,
		});

		// The properties myValue, myOnChange and myRef are just examples
		return (
			<MyInput
				{...otherProps}
				myValue={value ?? ''}
				myOnChange={onChange}
				myRef={ref}
			/>
		);
	},
);

export default CustomDOMComponent;
