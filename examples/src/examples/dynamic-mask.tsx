import React from 'react';
import { MaskedInput, DEFAULT_MASK_RULES } from 'react-hook-mask';

const maskGenerator = {
	rules: DEFAULT_MASK_RULES,
	generateMask: (value: string) =>
		(value?.length ?? 0) < 10 ? 'AAA-AAA-AAAA' : 'AAA-AAA-AAA-AAAA',
	transform: (v: string) => v?.toUpperCase(),
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
			<div>Value (no mask):</div>
			<div>{value}</div>
		</div>
	);
};

export default DynamicMask;
