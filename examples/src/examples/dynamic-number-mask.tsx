import React from 'react';
import { MaskedInput, createDynamicNumberMaskGenerator } from 'react-hook-mask';

const mask1 = '999-999-9999';
const mask2 = '999-999-999-9999';

const maskGenerator = createDynamicNumberMaskGenerator(mask1, mask2);

const DynamicNumberMask = () => {
	const [value, setValue] = React.useState('');

	return (
		<div>
			<MaskedInput
				maskGenerator={maskGenerator}
				value={value}
				onChange={setValue}
			/>
			<div>Mask1: {mask1}</div>
			<div>Mask2: {mask2}</div>
			<div>Value (no mask):</div>
			<div>{value}</div>
		</div>
	);
};

export default DynamicNumberMask;
