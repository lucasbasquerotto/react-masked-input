import React from 'react';
import { MaskedInput } from 'react-hook-mask';

const MY_RULES = new Map([
	['C', /[A-Za-z]/],
	['N', /\d/],
]);

const createMaskGenerator = (mask: string) => ({
	rules: MY_RULES,
	generateMask: () => mask,
});

const mask = 'CCC-NNNN';
const maskGenerator = createMaskGenerator(mask);

const CustomRules = () => {
	const [value, setValue] = React.useState('');

	return (
		<div>
			<MaskedInput
				maskGenerator={maskGenerator}
				value={value}
				onChange={setValue}
			/>
			<div>Mask: {mask}</div>
			<div>Value (no mask):</div>
			<div>{value}</div>
		</div>
	);
};

export default CustomRules;
