import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './app';

import '@testing-library/jest-dom';

const testSection = (
	sectionName: string,
	test: (input: HTMLInputElement) => void | Promise<void>,
	examples?: (input: HTMLInputElement) => void | Promise<void>,
) => {
	it(sectionName, async () => {
		render(<App />);
		const section = await screen.findByTestId(sectionName);
		const input = section.querySelector('input');
		expect(input).toBeInTheDocument();

		if (input == null) {
			throw new Error('Input not found');
		}

		input.focus();
		await test(input);
		examples && (await examples(input));
	});
};

const clearInput = async (input: HTMLInputElement) => {
	input.value = '';
	await userEvent.keyboard(' ');
	await userEvent.keyboard('{backspace}');
	expect(input).toHaveValue('');
	expectPosition(input, 0);
};

const expectPosition = (input: HTMLInputElement, position: number) => {
	expect(input.selectionStart).toStrictEqual(position);
	expect(input.selectionEnd).toStrictEqual(position);
};

// Examples (cursor is |):

const staticExamples = async (input: HTMLInputElement) => {
	// Example 01:
	// Before the change (oldDisplayValue): (12) 3456|-7891
	// Number 1 added (valueBeforeMask): (12) 34561|-7891
	// Mask applied (displayValue): (12) 3456-|1789
	// Offset applied: (12) 3456-1|789
	await clearInput(input);
	await userEvent.keyboard('1234567891');
	expect(input).toHaveValue('(12) 3456-7891');
	expectPosition(input, 14);
	input.selectionStart = 9;
	input.selectionEnd = 9;
	expectPosition(input, 9);
	await userEvent.keyboard('1');
	expect(input).toHaveValue('(12) 3456-1789');
	expectPosition(input, 11);

	// Example 02:
	// Before the change (oldDisplayValue): (|12) 3456-7
	// Delete char after (valueBeforeMask): (|2) 3456-7
	// Mask applied (displayValue): (|23) 4567
	// Offset applied: (|23) 4567
	await clearInput(input);
	await userEvent.keyboard('1234567');
	expect(input).toHaveValue('(12) 3456-7');
	expectPosition(input, 11);
	input.selectionStart = 1;
	input.selectionEnd = 1;
	expectPosition(input, 1);
	await userEvent.keyboard('{delete}');
	expect(input).toHaveValue('(23) 4567');
	expectPosition(input, 1);

	// Example 03:
	// Before the change (oldDisplayValue): (1|2) 3456-7
	// Delete char before (valueBeforeMask): (|2) 3456-7
	// Mask applied (displayValue): (|23) 4567
	// Offset applied: (|23) 4567
	await clearInput(input);
	await userEvent.keyboard('1234567');
	expect(input).toHaveValue('(12) 3456-7');
	expectPosition(input, 11);
	input.selectionStart = 2;
	input.selectionEnd = 2;
	expectPosition(input, 2);
	await userEvent.keyboard('{backspace}');
	expect(input).toHaveValue('(23) 4567');
	expectPosition(input, 1);

	// -> Details for 02 and 03:
	// Important: from the point of view of the algorithm, both are the same, because it
	// doesn't actually know where the cursor was initially, only when displayValue
	// is already defined, and then tries to calculate lastCursorPosition based on it.

	// Example 04 (may not work the 1st time, but at most at the 2nd try it will work):
	// Before the change (oldDisplayValue): (12)| 3456-7891
	// Delete after (valueBeforeMask): (12)|3456-7891
	// Mask applied (displayValue): (12)| 3456-7891
	// Offset applied: (12) |3456-7891
	await clearInput(input);
	await userEvent.keyboard('1234567891');
	expect(input).toHaveValue('(12) 3456-7891');
	expectPosition(input, 14);
	input.selectionStart = 4;
	input.selectionEnd = 4;
	expectPosition(input, 4);
	await userEvent.keyboard('{delete}');
	expect(input).toHaveValue('(12) 3456-7891');
	expectPosition(input, 3);
	await userEvent.keyboard('{delete}');
	expect(input).toHaveValue('(12) 3456-7891');
	expectPosition(input, 5);

	// Example 05 (may not work the 1st time, but at most at the 2nd try it will work):
	// Before the change (oldDisplayValue): (12) |3456-7891
	// Delete before (valueBeforeMask): (12)|3456-7891
	// Mask applied (displayValue): (12)| 3456-7891
	// Offset applied: (12|) 3456-7891
	await clearInput(input);
	await userEvent.keyboard('1234567891');
	expect(input).toHaveValue('(12) 3456-7891');
	expectPosition(input, 14);
	input.selectionStart = 5;
	input.selectionEnd = 5;
	expectPosition(input, 5);
	await userEvent.keyboard('{backspace}');
	expect(input).toHaveValue('(12) 3456-7891');
	expectPosition(input, 3);

	// -> Details for 04 and 05:
	// Important: Observe that the values of valueBeforeMask and displayValue of
	// both examples are the same, as well as the value of cursorPosition
	// (which is 4, that we get AFTER the value changed).
	// Also note that examples 04 and 05 are seen as the same from the algorithm
	// point-of-view, in such a way that the flag 'lastWentBack' is used to know
	// if the last cursor change (without changing user provided chars) went forward
	// and backward, alternating the flag value so that deleting chars after and
	// before the cursor will work at most in the second try (without "blocking"
	// the user from deleting chars). It can be seen that the position in the
	// example 4 is wrong the 1st time, but correct the 2nd. The example 5 is
	// correct the 1st time (it's equal to the 1st time of example 4, at position 3,
	// but depending of previous actions, it could be wrong, equal to the 2nd time
	// of example 4, at position 5, but the next try would be correct, at position 3).

	// Example 06:
	// Before the change (oldDisplayValue): (12) 345|6-7891
	// '912' pasted (valueBeforeMask): (12) 345912|6-7891
	// Mask applied (displayValue): (12) 3459-1|267
	// Offset applied: (12) 3459-12|67
	await clearInput(input);
	await userEvent.keyboard('1234567891');
	expect(input).toHaveValue('(12) 3456-7891');
	expectPosition(input, 14);
	input.selectionStart = 8;
	input.selectionEnd = 8;
	expectPosition(input, 8);
	await userEvent.keyboard('912');
	expect(input).toHaveValue('(12) 3459-1267');
	expectPosition(input, 12);

	// Example 07:
	// Before the change (oldDisplayValue): (12) 3456-|7891
	// '1+2-3' pasted (valueBeforeMask): (12) 3456-1+2-3|7891
	// Mask applied (displayValue): (12) 3456-1237|
	// Offset applied: (12) 3456-123|7
	await clearInput(input);
	await userEvent.keyboard('1234567891');
	expect(input).toHaveValue('(12) 3456-7891');
	expectPosition(input, 14);
	input.selectionStart = 10;
	input.selectionEnd = 10;
	expectPosition(input, 10);
	await userEvent.paste('1+2-3');
	expect(input).toHaveValue('(12) 3456-1237');
	expectPosition(input, 13);

	// Example 08:
	// Before the change (oldDisplayValue): (1|2) 345
	// Select and delete from 2 to 4 (valueBeforeMask): (1|5
	// Mask applied (displayValue): (1|5
	// Offset applied: (1|5
	await clearInput(input);
	await userEvent.keyboard('12345');
	expect(input).toHaveValue('(12) 345');
	expectPosition(input, 8);
	input.selectionStart = 2;
	input.selectionEnd = 7;
	await userEvent.keyboard('{backspace}');
	expect(input).toHaveValue('(15');
	expectPosition(input, 2);

	// Example 09:
	// Before the change (oldDisplayValue): (12) 345
	// Select everything and type 9 (valueBeforeMask): 9|
	// Mask applied (displayValue): (|9
	// Offset applied: (9|
	await clearInput(input);
	await userEvent.keyboard('12345');
	expect(input).toHaveValue('(12) 345');
	expectPosition(input, 8);
	input.selectionStart = 0;
	input.selectionEnd = 8;
	await userEvent.keyboard('9');
	expect(input).toHaveValue('(9');
	expectPosition(input, 2);

	// Example 10:
	// Before the change (oldDisplayValue): (|23) 4567
	// Number 1 added (valueBeforeMask): (1|23) 4567
	// Mask applied (displayValue): (1|2) 3456-7
	// Offset applied: (1|2) 3456-7
	await clearInput(input);
	await userEvent.keyboard('234567');
	expect(input).toHaveValue('(23) 4567');
	expectPosition(input, 9);
	input.selectionStart = 1;
	input.selectionEnd = 1;
	await userEvent.keyboard('1');
	expect(input).toHaveValue('(12) 3456-7');
	expectPosition(input, 2);
};

const dynamicExamples = async (input: HTMLInputElement) => {
	// Example 11:
	// Before the change (oldDisplayValue): (12) 3456-|7812
	// Number 9 added (valueBeforeMask): (12) 3456-9|7812
	// Mask applied (displayValue): (12) 34569-|7812
	// Offset applied: (12) 34569-|7812
	await clearInput(input);
	await userEvent.keyboard('1234567812');
	expect(input).toHaveValue('(12) 3456-7812');
	expectPosition(input, 14);
	input.selectionStart = 10;
	input.selectionEnd = 10;
	await userEvent.keyboard('9');
	expect(input).toHaveValue('(12) 34569-7812');
	expectPosition(input, 11);

	// -> Details for 11:
	// It's important to note that position=10 is not strictly wrong ((12) 34569|-7812).

	// Example 12:
	// Before the change (oldDisplayValue): (12) 34567|-8912
	// Delete before (valueBeforeMask): (12) 3456|-8912
	// Mask applied (displayValue): (12) 3456|-8912
	// Offset applied: (12) 3456|-8912
	await clearInput(input);
	await userEvent.keyboard('12345678912');
	expect(input).toHaveValue('(12) 34567-8912');
	expectPosition(input, 15);
	input.selectionStart = 10;
	input.selectionEnd = 10;
	await userEvent.keyboard('{backspace}');
	expect(input).toHaveValue('(12) 3456-8912');
	expectPosition(input, 9);

	// Example 13:
	// Before the change (oldDisplayValue): (12) 3456|7-8912
	// Delete after (valueBeforeMask): (12) 3456|-8912
	// Mask applied (displayValue): (12) 3456|-8912
	// Offset applied: (12) 3456|-8912
	await clearInput(input);
	await userEvent.keyboard('12345678912');
	expect(input).toHaveValue('(12) 34567-8912');
	expectPosition(input, 15);
	input.selectionStart = 9;
	input.selectionEnd = 9;
	await userEvent.keyboard('{delete}');
	expect(input).toHaveValue('(12) 3456-8912');
	expectPosition(input, 9);

	// -> Details for 12 and 13:
	// Important: Both examples are the same from the point of
	// view of the algorithm (just like examples 02 and 03).
	// It's also important to note that position=10 is not strictly
	// wrong (that is, (12) 3456-|8912).
};

testSection(
	'quickstart',
	async (input) => {
		expect(input).toHaveValue('');
		expectPosition(input, 0);

		// (12) 3456-7891

		await userEvent.keyboard('1');
		expect(input).toHaveValue('(1');
		expectPosition(input, 2);

		await userEvent.keyboard('2');
		expect(input).toHaveValue('(12');
		expectPosition(input, 3);

		await userEvent.keyboard('3');
		expect(input).toHaveValue('(12) 3');
		expectPosition(input, 6);

		await userEvent.keyboard('4');
		expect(input).toHaveValue('(12) 34');
		expectPosition(input, 7);

		await userEvent.keyboard('5');
		expect(input).toHaveValue('(12) 345');
		expectPosition(input, 8);

		await userEvent.keyboard('6');
		expect(input).toHaveValue('(12) 3456');
		expectPosition(input, 9);

		await userEvent.keyboard('7');
		expect(input).toHaveValue('(12) 3456-7');
		expectPosition(input, 11);

		await userEvent.keyboard('8');
		expect(input).toHaveValue('(12) 3456-78');
		expectPosition(input, 12);

		await userEvent.keyboard('9');
		expect(input).toHaveValue('(12) 3456-789');
		expectPosition(input, 13);

		await userEvent.keyboard('1');
		expect(input).toHaveValue('(12) 3456-7891');
		expectPosition(input, 14);

		await clearInput(input);
		await userEvent.paste('1-2-34-5-6-78-9-1');
		expect(input).toHaveValue('(12) 3456-7891');
		expectPosition(input, 14);
		input.selectionStart = 8;
		input.selectionEnd = 8;
		await userEvent.paste('1.2.3.4');
		expect(input).toHaveValue('(12) 3451-2346');
		expectPosition(input, 13);

		await clearInput(input);
		await userEvent.paste('1-2-34-5-6-78-9-1');
		expect(input).toHaveValue('(12) 3456-7891');
		expectPosition(input, 14);
		input.selectionStart = 2;
		input.selectionEnd = 2;
		await userEvent.paste('1.2.3.4');
		expect(input).toHaveValue('(11) 2342-3456');
		expectPosition(input, 8);

		await clearInput(input);
		await userEvent.paste('1111111111');
		expect(input).toHaveValue('(11) 1111-1111');
		expectPosition(input, 14);
		input.selectionStart = 2;
		input.selectionEnd = 2;
		await userEvent.paste('+');
		expect(input).toHaveValue('(11) 1111-1111');
		expectPosition(input, 2);
		await userEvent.paste('1');
		expect(input).toHaveValue('(11) 1111-1111');
		expectPosition(input, 3);
		await userEvent.paste('+');
		expect(input).toHaveValue('(11) 1111-1111');
		expectPosition(input, 4);
		await userEvent.paste('1');
		expect(input).toHaveValue('(11) 1111-1111');
		expectPosition(input, 5);
		input.selectionStart = 12;
		input.selectionEnd = 12;
		await userEvent.paste('1');
		expect(input).toHaveValue('(11) 1111-1111');
		expectPosition(input, 13);
		await userEvent.paste('+');
		expect(input).toHaveValue('(11) 1111-1111');
		expectPosition(input, 13);
		await userEvent.paste('1');
		expect(input).toHaveValue('(11) 1111-1111');
		expectPosition(input, 14);
		await userEvent.paste('1');
		expect(input).toHaveValue('(11) 1111-1111');
		expectPosition(input, 14);
	},
	staticExamples,
);

testSection('custom-rules', async (input) => {
	expect(input).toHaveValue('');
	expectPosition(input, 0);

	// ABC-1234

	await userEvent.keyboard('abcdef');
	expect(input).toHaveValue('abc-');
	expectPosition(input, 4);

	await userEvent.keyboard('1234567890');
	expect(input).toHaveValue('abc-1234');
	expectPosition(input, 8);

	await userEvent.keyboard('{backspace}');
	expect(input).toHaveValue('abc-123');
	expectPosition(input, 7);

	await userEvent.keyboard('{backspace}');
	expect(input).toHaveValue('abc-12');
	expectPosition(input, 6);

	await userEvent.keyboard('{backspace}');
	expect(input).toHaveValue('abc-1');
	expectPosition(input, 5);

	await userEvent.keyboard('{backspace}');
	expect(input).toHaveValue('abc-');
	expectPosition(input, 4);

	await userEvent.keyboard('{backspace}');
	expect(input).toHaveValue('abc');
	expectPosition(input, 3);

	await userEvent.keyboard('{backspace}');
	expect(input).toHaveValue('ab');
	expectPosition(input, 2);

	await userEvent.keyboard('{backspace}');
	expect(input).toHaveValue('a');
	expectPosition(input, 1);

	await userEvent.keyboard('{backspace}');
	expect(input).toHaveValue('');
	expectPosition(input, 0);
});

testSection(
	'dynamic-number-mask',
	async (input) => {
		expect(input).toHaveValue('');
		expectPosition(input, 0);

		await clearInput(input);
		await userEvent.paste('1-2-34-5-6-78-9-12');
		expect(input).toHaveValue('(12) 34567-8912');
		expectPosition(input, 15);
		input.selectionStart = 2;
		input.selectionEnd = 2;
		await userEvent.paste('1.2.3.4');
		expect(input).toHaveValue('(11) 23423-4567');
		expectPosition(input, 8);
	},
	dynamicExamples,
);

testSection('dynamic-mask', async (input) => {
	expect(input).toHaveValue('');
	expectPosition(input, 0);

	// ABC-DEF-GHIJ

	await userEvent.keyboard('abcde');
	expect(input).toHaveValue('ABC-DE');
	expectPosition(input, 6);

	await userEvent.keyboard('fghij');
	expect(input).toHaveValue('ABC-DEF-GHIJ');
	expectPosition(input, 12);

	// ABC-DEFG-HIJ-KLMN

	await userEvent.keyboard('klmnop');
	expect(input).toHaveValue('ABC-DEFG-HIJ-KLMN');
	expectPosition(input, 17);

	await userEvent.keyboard('{backspace}');
	expect(input).toHaveValue('ABC-DEFG-HIJ-KLM');
	expectPosition(input, 16);

	await userEvent.keyboard('{backspace}');
	expect(input).toHaveValue('ABC-DEFG-HIJ-KL');
	expectPosition(input, 15);

	await userEvent.keyboard('{backspace}');
	expect(input).toHaveValue('ABC-DEFG-HIJ-K');
	expectPosition(input, 14);

	await userEvent.keyboard('{backspace}');
	expect(input).toHaveValue('ABC-DEF-GHIJ');
	expectPosition(input, 12);

	await userEvent.keyboard('{backspace}');
	expect(input).toHaveValue('ABC-DEF-GHI');
	expectPosition(input, 11);

	await userEvent.keyboard('{backspace}');
	expect(input).toHaveValue('ABC-DEF-GH');
	expectPosition(input, 10);

	await userEvent.keyboard('{backspace}');
	expect(input).toHaveValue('ABC-DEF-G');
	expectPosition(input, 9);

	await userEvent.keyboard('{backspace}');
	expect(input).toHaveValue('ABC-DEF-');
	expectPosition(input, 8);

	await userEvent.keyboard('{backspace}');
	expect(input).toHaveValue('ABC-DEF');
	expectPosition(input, 7);

	await userEvent.keyboard('{backspace}');
	expect(input).toHaveValue('ABC-DE');
	expectPosition(input, 6);

	await userEvent.keyboard('{backspace}');
	expect(input).toHaveValue('ABC-D');
	expectPosition(input, 5);

	await userEvent.keyboard('{backspace}');
	expect(input).toHaveValue('ABC-');
	expectPosition(input, 4);

	await userEvent.keyboard('{backspace}');
	expect(input).toHaveValue('ABC');
	expectPosition(input, 3);

	await userEvent.keyboard('{backspace}');
	expect(input).toHaveValue('AB');
	expectPosition(input, 2);

	await userEvent.keyboard('{backspace}');
	expect(input).toHaveValue('A');
	expectPosition(input, 1);

	await userEvent.keyboard('{backspace}');
	expect(input).toHaveValue('');
	expectPosition(input, 0);
});

testSection('custom-dom-component', async (input) => {
	expect(input).toHaveValue('');
	expectPosition(input, 0);

	// a1b-2C3d

	await userEvent.keyboard('a');
	expect(input).toHaveValue('a');
	expectPosition(input, 1);

	await userEvent.keyboard('1');
	expect(input).toHaveValue('a1');
	expectPosition(input, 2);

	await userEvent.keyboard('b');
	expect(input).toHaveValue('a1b');
	expectPosition(input, 3);

	await userEvent.keyboard('2');
	expect(input).toHaveValue('a1b-2');
	expectPosition(input, 5);

	await userEvent.keyboard('C');
	expect(input).toHaveValue('a1b-2C');
	expectPosition(input, 6);

	await userEvent.keyboard('3');
	expect(input).toHaveValue('a1b-2C3');
	expectPosition(input, 7);

	await userEvent.keyboard('d');
	expect(input).toHaveValue('a1b-2C3d');
	expectPosition(input, 8);

	await userEvent.keyboard('{backspace}');
	expect(input).toHaveValue('a1b-2C3');
	expectPosition(input, 7);

	await userEvent.keyboard('{backspace}');
	expect(input).toHaveValue('a1b-2C');
	expectPosition(input, 6);

	await userEvent.keyboard('{backspace}');
	expect(input).toHaveValue('a1b-2');
	expectPosition(input, 5);

	await userEvent.keyboard('{backspace}');
	expect(input).toHaveValue('a1b-');
	expectPosition(input, 4);

	await userEvent.keyboard('{backspace}');
	expect(input).toHaveValue('a1b');
	expectPosition(input, 3);

	await userEvent.keyboard('{backspace}');
	expect(input).toHaveValue('a1');
	expectPosition(input, 2);

	await userEvent.keyboard('{backspace}');
	expect(input).toHaveValue('a');
	expectPosition(input, 1);

	await userEvent.keyboard('{backspace}');
	expect(input).toHaveValue('');
	expectPosition(input, 0);
});

testSection('custom-mask-hook', async (input) => {
	expect(input).toHaveValue('(123) 4567-8901');

	await clearInput(input);
	await userEvent.keyboard('1-2--3---4--5-6--7---8--9-0--1');
	expect(input).toHaveValue('(123) 4567-8901');
	expectPosition(input, 15);
});

testSection('currency-mask', async (input) => {
	expect(input).toHaveValue('');
	expectPosition(input, 0);

	// $ 1.234.567,89

	await userEvent.keyboard('1');
	expect(input).toHaveValue('$ 0,01');
	expectPosition(input, 6);

	await userEvent.keyboard('2');
	expect(input).toHaveValue('$ 0,12');
	expectPosition(input, 6);

	await userEvent.keyboard('3');
	expect(input).toHaveValue('$ 1,23');
	expectPosition(input, 6);

	await userEvent.keyboard('4');
	expect(input).toHaveValue('$ 12,34');
	expectPosition(input, 7);

	await userEvent.keyboard('5');
	expect(input).toHaveValue('$ 123,45');
	expectPosition(input, 8);

	await userEvent.keyboard('6');
	expect(input).toHaveValue('$ 1.234,56');
	expectPosition(input, 10);

	await userEvent.keyboard('7');
	expect(input).toHaveValue('$ 12.345,67');
	expectPosition(input, 11);

	await userEvent.keyboard('8');
	expect(input).toHaveValue('$ 123.456,78');
	expectPosition(input, 12);

	await userEvent.keyboard('9');
	expect(input).toHaveValue('$ 1.234.567,89');
	expectPosition(input, 14);

	await userEvent.keyboard('{backspace}');
	expect(input).toHaveValue('$ 123.456,78');
	expectPosition(input, 12);

	await userEvent.keyboard('{backspace}');
	expect(input).toHaveValue('$ 12.345,67');
	expectPosition(input, 11);

	await userEvent.keyboard('{backspace}');
	expect(input).toHaveValue('$ 1.234,56');
	expectPosition(input, 10);

	await userEvent.keyboard('{backspace}');
	expect(input).toHaveValue('$ 123,45');
	expectPosition(input, 8);

	await userEvent.keyboard('{backspace}');
	expect(input).toHaveValue('$ 12,34');
	expectPosition(input, 7);

	await userEvent.keyboard('{backspace}');
	expect(input).toHaveValue('$ 1,23');
	expectPosition(input, 6);

	await userEvent.keyboard('{backspace}');
	expect(input).toHaveValue('$ 0,12');
	expectPosition(input, 6);

	await userEvent.keyboard('{backspace}');
	expect(input).toHaveValue('$ 0,01');
	expectPosition(input, 6);

	await userEvent.keyboard('{backspace}');
	expect(input).toHaveValue('$ 0,00');
	expectPosition(input, 6);

	input.selectionStart = 0;
	input.selectionEnd = input.value.length;
	await userEvent.keyboard('{backspace}');
	await userEvent.keyboard('0');
	expect(input).toHaveValue('$ 0,00');
	expectPosition(input, 6);
	input.selectionStart = 3;
	input.selectionEnd = 3;

	await userEvent.keyboard('1');
	expect(input).toHaveValue('$ 1,00');
	expectPosition(input, 3);

	await userEvent.keyboard('2');
	expect(input).toHaveValue('$ 12,00');
	expectPosition(input, 4);

	await userEvent.keyboard('3');
	expect(input).toHaveValue('$ 123,00');
	expectPosition(input, 5);

	await userEvent.keyboard('4');
	expect(input).toHaveValue('$ 1.234,00');
	expectPosition(input, 7);

	await userEvent.keyboard('5');
	expect(input).toHaveValue('$ 12.345,00');
	expectPosition(input, 8);

	await userEvent.keyboard('6');
	expect(input).toHaveValue('$ 123.456,00');
	expectPosition(input, 9);

	await userEvent.keyboard('7');
	expect(input).toHaveValue('$ 1.234.567,00');
	expectPosition(input, 11);

	await clearInput(input);
	input.selectionStart = 0;
	input.selectionEnd = input.value.length;
	await userEvent.keyboard('{backspace}');
	await userEvent.keyboard('0');
	expect(input).toHaveValue('$ 0,00');
	expectPosition(input, 6);
	input.selectionStart = 3;
	input.selectionEnd = 3;

	await userEvent.keyboard('123');
	expect(input).toHaveValue('$ 123,00');
	expectPosition(input, 5);

	await userEvent.keyboard('4');
	expect(input).toHaveValue('$ 1.234,00');
	expectPosition(input, 7);

	input.selectionStart = 4;
	input.selectionEnd = 4;

	await userEvent.keyboard('{delete}');
	expect(input).toHaveValue('$ 134,00');
	expectPosition(input, 3);

	await userEvent.keyboard('{delete}');
	expect(input).toHaveValue('$ 14,00');
	expectPosition(input, 3);

	await userEvent.keyboard('{delete}');
	expect(input).toHaveValue('$ 1,00');
	expectPosition(input, 3);

	await userEvent.keyboard('{delete}');
	expect(input).toHaveValue('$ 1,00');
	expectPosition(input, 3);

	await userEvent.keyboard('{delete}');
	expect(input).toHaveValue('$ 1,00');
	expectPosition(input, 4);

	await userEvent.keyboard('{delete}');
	expect(input).toHaveValue('$ 0,10');
	expectPosition(input, 5);

	await userEvent.keyboard('{delete}');
	expect(input).toHaveValue('$ 0,01');
	expectPosition(input, 6);

	await userEvent.keyboard('{delete}');
	expect(input).toHaveValue('$ 0,01');
	expectPosition(input, 6);

	await userEvent.keyboard('{backspace}');
	expect(input).toHaveValue('$ 0,00');
	expectPosition(input, 6);

	await userEvent.keyboard('1234567');
	expect(input).toHaveValue('$ 12.345,67');
	expectPosition(input, 11);
	input.selectionStart = 8;
	input.selectionEnd = 8;
	await userEvent.keyboard('{backspace}');
	expect(input).toHaveValue('$ 1.234,67');
	expectPosition(input, 7);

	await clearInput(input);
	await userEvent.paste('$ 1.235,67');
	expect(input).toHaveValue('$ 1.235,67');
	expectPosition(input, 10);
	input.selectionStart = 6;
	input.selectionEnd = 6;
	await userEvent.keyboard('{backspace}');
	expect(input).toHaveValue('$ 125,67');
	expectPosition(input, 4);

	await clearInput(input);
	await userEvent.paste('$ 1.235,67');
	expect(input).toHaveValue('$ 1.235,67');
	expectPosition(input, 10);
	input.selectionStart = 0;
	input.selectionEnd = 10;
	await userEvent.keyboard('9');
	expect(input).toHaveValue('$ 0,09');
	expectPosition(input, 6);

	await clearInput(input);
	await userEvent.keyboard('9');
	expect(input).toHaveValue('$ 0,09');
	expectPosition(input, 6);
	input.selectionStart = 3;
	input.selectionEnd = 6;
	await userEvent.keyboard('{backspace}');
	expect(input).toHaveValue('$ 0,00');
	expectPosition(input, 6);

	await clearInput(input);
	await userEvent.keyboard('9');
	expect(input).toHaveValue('$ 0,09');
	expectPosition(input, 6);
	input.selectionStart = 2;
	input.selectionEnd = 6;
	await userEvent.keyboard('{backspace}');
	expect(input).toHaveValue('$ ');
	expectPosition(input, 2);
	input.selectionStart = 1;
	input.selectionEnd = 2;
	await userEvent.keyboard('{backspace}');
	expect(input).toHaveValue('$');
	expectPosition(input, 1);
	input.selectionStart = 0;
	input.selectionEnd = 1;
	await userEvent.keyboard('{backspace}');
	expect(input).toHaveValue('');
	expectPosition(input, 0);

	await clearInput(input);
	await userEvent.keyboard('9');
	expect(input).toHaveValue('$ 0,09');
	expectPosition(input, 6);
	input.selectionStart = 1;
	input.selectionEnd = 6;
	await userEvent.keyboard('{backspace}');
	expect(input).toHaveValue('$');
	expectPosition(input, 1);
	await userEvent.keyboard('{backspace}');
	expect(input).toHaveValue('');
	expectPosition(input, 0);
});
