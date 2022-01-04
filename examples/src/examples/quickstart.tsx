import React from 'react';
import { MaskedInput, createDefaultMaskGenerator } from 'react-hook-mask';

const mask = '999 999 9999';
const maskGenerator = createDefaultMaskGenerator(mask);

const Quickstart = () => {
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

export default Quickstart;
