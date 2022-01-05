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
			<div className="info">Mask: {mask}</div>
			<div className="info">Value (no mask):</div>
			{value ? <div className="info">{value}</div> : undefined}
		</div>
	);
};

export default Quickstart;
