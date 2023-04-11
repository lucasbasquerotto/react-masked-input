import React from 'react';
import { MaskedInput, getCurrencyMaskGenerator } from 'react-hook-mask';

const maskGenerator = getCurrencyMaskGenerator({
	prefix: '$ ',
	thousandSeparator: '.',
	centsSeparator: ',',
});

const CurrencyMaskedInput = () => {
	const [value, setValue] = React.useState('');

	return (
		<div>
			<MaskedInput
				maskGenerator={maskGenerator}
				value={value}
				onChange={setValue}
			/>
			<div className="info">
				Mask: {value ? maskGenerator.generateMask(value) : undefined}
			</div>
			<div className="info">Value (no mask):</div>
			{value ? <div className="info">{value}</div> : undefined}
		</div>
	);
};

export default CurrencyMaskedInput;
