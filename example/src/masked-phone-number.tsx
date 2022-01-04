import { createDefaultMaskGenerator } from 'typescript-react-test';
import { MaskedInput } from 'typescript-react-test';
import React from 'react';

const phoneNumberMaskGenerator = createDefaultMaskGenerator('999 999 9999');

const MaskedPhoneNumber = () => {
	const [value, setValue] = React.useState('');

	return (
		<div>
			<MaskedInput
				maskGenerator={phoneNumberMaskGenerator}
				value={value}
				onChange={setValue}
			/>
			<div>Value (no mask):</div>
			<div>{value}</div>
		</div>
	);
};

export default MaskedPhoneNumber;
