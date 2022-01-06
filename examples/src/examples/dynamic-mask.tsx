import React from 'react';
import { MaskedInput, DEFAULT_MASK_RULES } from 'react-hook-mask';

const mask1 = 'AAA-AAA-AAAA';
const mask2 = 'AAA-AAAA-AAA-AAAA';

const maskGenerator = {
	rules: DEFAULT_MASK_RULES,
	generateMask: (value: string) =>
		(value?.replaceAll('-', '').length ?? 0) <= 10 ? mask1 : mask2,
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
			<div className="info">Mask1: {mask1}</div>
			<div className="info">Mask2: {mask2}</div>
			<div className="info">Value (no mask):</div>
			{value ? <div className="info">{value}</div> : undefined}
		</div>
	);
};

export default DynamicMask;
