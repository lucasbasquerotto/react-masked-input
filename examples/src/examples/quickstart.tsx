import React from 'react';
import { MaskedInput, createDefaultMaskGenerator } from 'react-hook-mask';

const maskGenerator = createDefaultMaskGenerator('999 999 9999');

const Quickstart = () => {
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

export default Quickstart;
