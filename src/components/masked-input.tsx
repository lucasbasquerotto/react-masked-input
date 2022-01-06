import React from 'react';
import { useWebMask } from '../hooks/use-web-mask';
import type { MaskGenerator } from '../utils/mask-util';

export const MaskedInput = React.forwardRef(
	(
		{
			maskGenerator,
			value,
			onChange,
			keepMask,
			...inputProps
		}: Omit<
			React.DetailedHTMLProps<
				React.InputHTMLAttributes<HTMLInputElement>,
				HTMLInputElement
			>,
			'value' | 'onChange'
		> & {
			maskGenerator?: MaskGenerator;
			keepMask?: boolean;
			value: string;
			onChange?: (value: string) => void;
		},
		ref: React.ForwardedRef<HTMLInputElement> | undefined,
	) => {
		const maskProps = useWebMask({
			maskGenerator,
			value: value != null ? `${value}` : undefined,
			onChange,
			keepMask,
			ref,
		});

		return <input {...inputProps} {...maskProps} />;
	},
);
