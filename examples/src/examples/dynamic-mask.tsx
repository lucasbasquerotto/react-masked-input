import React from 'react';
import { MaskedInput } from 'react-hook-mask';

const mask = '+63(9XX) XXX-XX-XX';
const maskGenerator = {
	rules: new Map([['X', /\d/]]),
	generateMask: () => mask,
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
			<div className="info">Mask: {mask}</div>
			<div className="info">Value (no mask):</div>
			{value ? <div className="info">{value}</div> : undefined}
		</div>
	);
};

export default DynamicMask;
