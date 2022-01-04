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

const maskGenerator = createMaskGenerator('CCC-NNNN');

const CustomRules = () => {
	const [value, setValue] = React.useState('');

	return (
		<div>
			<MaskedInput
				maskGenerator={maskGenerator}
				value={value}
				onChange={setValue}
			/>
			<div>Value (no mask):</div>
			<div>{value}</div>
		</div>
	);
};

export default CustomRules;
