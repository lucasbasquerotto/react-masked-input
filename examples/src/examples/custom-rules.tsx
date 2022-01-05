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
			<div className="info">Mask: {mask}</div>
			<div className="info">Value (no mask):</div>
			{value ? <div className="info">{value}</div> : undefined}
		</div>
	);
};

export default CustomRules;
