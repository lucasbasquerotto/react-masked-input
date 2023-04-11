import React from 'react';
import { MaskedInput, createDynamicNumberMaskGenerator } from 'react-hook-mask';

const mask1 = '(99) 9999-9999';
const mask2 = '(99) 99999-9999';

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
			<div className="info">Mask1: {mask1}</div>
			<div className="info">Mask2: {mask2}</div>
			<div className="info">Value (no mask):</div>
			{value ? <div className="info">{value}</div> : undefined}
		</div>
	);
};

export default DynamicNumberMask;
