import React from 'react';
import type { MaskGenerator } from 'react-hook-mask';
import { MaskedInput } from 'react-hook-mask';

const mask = '+63(9NN) NNN-NN-NN';
const maskGenerator: MaskGenerator = {
	generateMask: () => mask,
	rules: new Map([['N', /\d/]]),
};

const Issue3 = () => {
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

export default Issue3;
