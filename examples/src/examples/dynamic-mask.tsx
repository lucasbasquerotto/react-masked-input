import React from 'react';
import { MaskedInput, DEFAULT_MASK_RULES } from 'react-hook-mask';

const mask1 = 'AAA-AAA-AAAA';
const mask2 = 'AAA-AAAA-AAA-AAAA';

const maskGenerator = {
	rules: DEFAULT_MASK_RULES,
	generateMask: (value: string) =>
		(value?.replace('-', '')?.length ?? 0) <= 10 ? mask1 : mask2,
};

const DynamicMask = () => {
	const [value, setValue] = React.useState('');

	return (
		<div>
			<MaskedInput
				maskGenerator={maskGenerator}
				value={value}
				onChange={setValue}
			/>
			<div>Mask1: {mask1}</div>
			<div>Mask2: {mask2}</div>
			<div>Value (no mask):</div>
			<div>{value}</div>
		</div>
	);
};

export default DynamicMask;
