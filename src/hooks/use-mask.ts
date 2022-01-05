import React from 'react';
import { MaskGenerator } from '../utils/mask-util';

const createString = (size: number): string => {
	let s = '';

	while (s.length < size) {
		s = ` ${s}`;
	}

	return s;
};

const maskMain = (
	value: string,
	maskGenerator: MaskGenerator,
): { maskedValue: string | null; mask: string } => {
	value = value.toString();

	const rules = maskGenerator.rules;
	const mask: string = maskGenerator.generateMask(value);
	const transform = maskGenerator.transform;
	let len = value.length;
	const maskLen = mask.length;
	let pos = 0;
	let newValue = '';

	for (let i = 0; i < Math.min(len, maskLen); i++) {
		const maskChar = mask.charAt(i);
		const newChar = value.charAt(pos);
		const regex = rules.get(maskChar);

		if (regex) {
			pos++;

			if (regex.test(newChar)) {
				newValue += newChar;
			} else {
				i--;
				len--;
			}
		} else {
			if (maskChar === newChar) {
				pos++;
			} else {
				len++;
			}

			newValue += maskChar;
		}
	}

	if (transform) {
		newValue = transform(newValue);
	}

	return { maskedValue: newValue, mask };
};
const mask = (
	value: string,
	maskGenerator: MaskGenerator,
): { maskedValue: string | null; mask: string } => {
	const { maskedValue, mask } = maskMain(value, maskGenerator);
	const { maskedValue: shouldBeTheSame, mask: newMask } = maskMain(
		maskedValue ?? '',
		maskGenerator,
	);

	if (maskedValue !== shouldBeTheSame) {
		if (typeof console !== undefined) {
			console?.error(
				'mask applied to value should not change when applied again',
				'-> before: ' + value,
				'-> after: ' + maskedValue + ' (mask: ' + mask + ')',
				'-> again: ' + shouldBeTheSame + ' (mask: ' + newMask + ')',
			);
		}

		return { maskedValue: value, mask };
	}

	return { maskedValue, mask };
};

const unmask = (
	displayValue: string,
	maskGenerator: MaskGenerator | undefined,
): string | null => {
	if (!maskGenerator) {
		return displayValue;
	}

	const rules = maskGenerator.rules;
	const mask: string = maskGenerator.generateMask(displayValue);
	const maskLen = mask?.length ?? 0;
	return displayValue
		.split('')
		.filter((_, idx) => idx < maskLen && rules.has(mask[idx]))
		.join('');
};

const processValue = (displayValue: string, maskGenerator: MaskGenerator) => {
	const keepMask = maskGenerator.keepMask;
	const value = keepMask ? displayValue : unmask(displayValue, maskGenerator);
	return value;
};

const getExpectedCursorPos = (args: {
	displayValue: string;
	oldDisplayValue: string;
	valueBeforeMask: string;
	newMask?: MaskGenerator;
	oldMask?: MaskGenerator;
	cursorPosition: number;
	lastWentBack: boolean | undefined;
}) => {
	const {
		displayValue,
		oldDisplayValue,
		valueBeforeMask,
		newMask,
		oldMask,
		cursorPosition,
		lastWentBack,
	} = args;

	const len01 = (oldDisplayValue ?? '').length;
	const len02 = (displayValue ?? '').length;
	const len03 = (valueBeforeMask ?? '')?.length;

	const oldMaskStr = oldMask?.generateMask(oldDisplayValue) ?? '';
	const newMaskStr = newMask?.generateMask(displayValue) ?? '';

	// The mask offset relative to the removed characters between the old and
	// new values is calculated when the new value before having the mask
	// applied had more chars than after the mask applied (after the mask was
	// applied, it should be the same than the new value).
	//
	// This is considered only when the exceeded characters are removed due to
	// the mask (the number of chars in the string was greater than the number
	// of chars in the mask).
	//
	// The offset is the number of chars removed when the mask was applied (which
	// corresponds to the number of chars added).
	let maskRemovedOffsetTmp = 0;

	const { maskedValue: valueBeforeMaskMasked } = newMask
		? mask(valueBeforeMask, newMask)
		: { maskedValue: displayValue };

	if (newMask && valueBeforeMaskMasked === displayValue) {
		if (len03 > newMaskStr.length) {
			maskRemovedOffsetTmp = len03 - len02;
		}
	}

	// If the old and the new display values are the same, and there where
	// no chars changed after the mask was applied to the new value, it's
	// considered that there was no change (but the cursor may need to have
	// its position changed).
	const noChange =
		displayValue === oldDisplayValue && maskRemovedOffsetTmp === 0;

	// Calculate the number of non-static chars (user provided) in the previous value.
	const oldDynamicChars = noChange
		? 0
		: (oldDisplayValue ?? '')
				.substring(0, len01)
				.split('')
				.filter((_, idx) =>
					oldMask ? oldMask.rules.has(oldMaskStr?.[idx]) : true,
				).length;

	// Calculate the number of non-static chars (user provided) in the new value.
	const newDynamicChars = noChange
		? 0
		: (displayValue ?? '')
				.substring(0, len02)
				.split('')
				.filter((_, idx) =>
					newMask ? newMask.rules.has(newMaskStr?.[idx]) : true,
				).length;

	const diffDynamicChars = newDynamicChars - oldDynamicChars;

	// The current cursor position includes the characters entered by the user.
	// To calculate the previous cursor position (before the change), the difference
	// between the number of user-provided chars between the new and old values is
	// subtracted from the current cursor position.
	const lastCursorPositionTmp = Math.max(
		cursorPosition - diffDynamicChars - maskRemovedOffsetTmp,
		0,
	);

	// Calculate the static chars offset (when the mask changed, to compensate the
	// difference in the number of static chars before the cursor)
	const fnDiffStaticChars = (positionToUse: number) => {
		// Calculate the number of static chars (mask provided) in the previous value.
		const oldStaticChars = noChange
			? 0
			: (oldDisplayValue ?? '')
					.substring(0, positionToUse)
					.split('')
					.filter((_, idx) => {
						const char = oldMaskStr?.[idx];
						const staticChar =
							oldMask && char != null && !oldMask.rules.has(char);
						return staticChar;
					}).length;

		// Calculate the number of static chars (mask provided) in the new value.
		const newStaticChars = noChange
			? 0
			: (displayValue ?? '')
					.substring(0, positionToUse)
					.split('')
					.filter((_, idx) => {
						const char = newMaskStr?.[idx];
						const staticChar =
							newMask && char != null && !newMask.rules.has(char);
						return staticChar;
					}).length;

		const staticCharsOffset =
			noChange || positionToUse >= cursorPosition
				? 0
				: createString(cursorPosition)
						.substring(positionToUse, cursorPosition)
						.split('')
						.reduce((acc, _, idx) => {
							if (oldMask && newMask) {
								const maskIdx = positionToUse + idx;
								const oldChar = oldMaskStr?.[maskIdx];
								const oldCharStatic =
									oldChar != null && !oldMask.rules.has(oldChar);
								const newChar = newMaskStr?.[maskIdx];
								const newCharStatic =
									newChar != null && !newMask.rules.has(newChar);

								if (newCharStatic && !oldCharStatic) {
									return acc + 1;
								} else if (oldCharStatic && !newCharStatic) {
									return acc - 1;
								}
							}

							return acc;
						}, 0);

		const diffStaticChars =
			diffDynamicChars > 0
				? Math.max(
						newStaticChars - oldStaticChars + Math.max(staticCharsOffset, 0),
						-diffDynamicChars,
				  )
				: Math.max(oldStaticChars - newStaticChars, 0);

		return diffStaticChars;
	};

	// The mask static chars can decrease the cursor position only if the user provided
	// chars increases, but the former can't decrease more than the increase of the later
	const diffStaticCharsTmp = fnDiffStaticChars(lastCursorPositionTmp);
	const lastCursorPositionAux = Math.max(
		lastCursorPositionTmp + diffStaticCharsTmp,
		0,
	);

	// The mask static offset corresponds to the number of static chars present in the new
	// value not present in it before applying the mask before the starting position (the
	// cursor should go forward according to this offset after applying the mask)
	const maskStaticOffset =
		newMask &&
		valueBeforeMaskMasked === displayValue &&
		len03 < len02 &&
		len03 <= newMaskStr.length
			? Math.max(
					0,
					(valueBeforeMask ?? '')
						.substring(
							0,
							Math.min(Math.min(cursorPosition, lastCursorPositionAux), len03),
						)
						.split('')
						.reduce(
							({ offset, maskOffset }, char) => {
								const offsetToAdd =
									newMask && maskOffset < (newMaskStr ?? '').length
										? newMaskStr
												.substring(maskOffset)
												.split('')
												.findIndex((maskChar) => {
													const userProvided = !!newMask.rules.get(maskChar);
													return (
														userProvided || (!userProvided && maskChar === char)
													);
												})
										: 0;

								const maskIdx =
									maskOffset + (offsetToAdd >= 0 ? offsetToAdd : 0);

								const maskChar = newMaskStr?.[maskIdx];
								const rule =
									newMask && maskIdx < (newMaskStr ?? '').length
										? newMask.rules.get(maskChar)
										: null;

								const userProvided = rule?.test(char);
								const ignoreChar = !userProvided && char !== maskChar;
								const maskOffsetToAdd = ignoreChar ? 0 : 1;
								const valueOffsetToAdd = ignoreChar ? -1 : 0;

								return {
									offset:
										offset +
										(userProvided ? offsetToAdd : 0) +
										valueOffsetToAdd,
									maskOffset:
										maskOffset +
										(userProvided ? offsetToAdd : 0) +
										maskOffsetToAdd,
								};
							},
							{ offset: 0, maskOffset: 0 },
						).offset,
			  )
			: 0;

	// For the mask offset, if the string before the mask was applied
	// was bigger than mask, consider only user provided chars
	const maskRemovedOffset =
		maskRemovedOffsetTmp === 0
			? maskStaticOffset
			: (valueBeforeMask ?? '')
					.substring(
						Math.min(lastCursorPositionAux, len03),
						Math.min(lastCursorPositionAux + maskRemovedOffsetTmp, len03),
					)
					.split('')
					.reduce(
						({ offset, maskOffset }, char) => {
							const maskIdxTmp = lastCursorPositionAux + maskOffset;

							const maskOffsetToAddTmp =
								newMask && maskIdxTmp < (newMaskStr ?? '').length
									? newMaskStr
											.substring(maskIdxTmp)
											.split('')
											.findIndex((maskChar) => !!newMask.rules.get(maskChar))
									: 0;

							const maskOffsetToAdd =
								maskOffsetToAddTmp >= 0 ? maskOffsetToAddTmp : 0;

							const maskIdx = maskIdxTmp + maskOffsetToAddTmp;

							const rule =
								newMask && maskIdx < (newMaskStr ?? '').length
									? newMask.rules.get(newMaskStr?.[maskIdx])
									: null;

							const userProvided = rule?.test(char);

							return userProvided
								? {
										offset: offset + 1,
										maskOffset: maskOffset + maskOffsetToAdd + 1,
								  }
								: { offset, maskOffset: maskOffset + maskOffsetToAdd };
						},
						{ offset: 0, maskOffset: 0 },
					).offset;

	// Add to the last cursor position the number of static chars that had been removed from it
	// due to the change in the mask, but that were discarded
	const diffMaskRemoved =
		maskRemovedOffsetTmp > 0
			? Math.max(
					Math.min(
						maskRemovedOffsetTmp + maskRemovedOffset,
						(oldMaskStr?.length ?? 0) - (newMaskStr?.length ?? 0),
					),
					0,
			  )
			: 0;

	// Fix the difference of static chars when the mask changes, based on the calculated position
	const diffStaticChars = fnDiffStaticChars(lastCursorPositionAux);
	const diffStaticCharsToApply = diffStaticChars - diffStaticCharsTmp;

	const lastCursorPosition =
		lastCursorPositionAux + diffStaticCharsToApply + diffMaskRemoved;

	// The offset of dynamic chars is used to correct the cursor when the number of user
	// provided chars before the last cursor position changed (when the mask changes)
	const dynamicCharsOffset = noChange
		? 0
		: createString(Math.min(lastCursorPosition, cursorPosition))
				.split('')
				.reduce((acc, _, idx) => {
					if (oldMask && newMask) {
						const maskIdx = idx;
						const oldChar = oldMaskStr?.[maskIdx];
						const newChar = newMaskStr?.[maskIdx];

						if (oldChar != null && newChar != null) {
							const oldCharDynamic = oldMask.rules.has(oldChar);
							const newCharDynamic = newMask.rules.has(newChar);

							if (newCharDynamic && !oldCharDynamic) {
								return acc + 1;
							} else if (oldCharDynamic && !newCharDynamic) {
								return acc - 1;
							}
						}
					}

					return acc;
				}, 0);

	// To calculate the remaining, it's considered the number of dynamic chars added (minus the
	// added chars before the last cursor position due to a change in the mask) plus the new static
	// chars before the last position (but not considering the fix in the difference based on the
	// mask change after the previous initial position was defined, because static chars after
	// the initial position are already skipped when calculating the new position). The number of
	// chars removed because the mask already reached the limit of chars is also considered.
	const remaining = diffDynamicChars - dynamicCharsOffset + maskRemovedOffset;

	// Go with the cursor to the front of the text until before the first user-provided char
	// (or to the end of the new display value) when there are no changes in the value.
	//
	// If the cursor is already right before a first user-provided char, it remains the same.
	const goToTheFrontNoChange = () => {
		const offset = createString(Math.max(lastCursorPosition, len02))
			.substring(lastCursorPosition)
			.split('')
			.findIndex((_, idx) => {
				const maskIdx = lastCursorPosition + idx;

				return newMask && maskIdx < (newMaskStr ?? '').length
					? newMask.rules.has(newMaskStr?.[maskIdx])
					: true;
			});
		return offset === -1 ? len02 : offset;
	};

	// Go with the cursor to the back of the text until after the first user-provided char
	// (or to the beginning of the new display value) when there are no changes in the value.
	//
	// If the cursor is already right after a first user-provided char, it remains the same.
	const goToTheBackNoChange = () => {
		const offset = createString(lastCursorPosition)
			.split('')
			.findIndex((_, idx) => {
				const maskIdx = lastCursorPosition - 1 - idx;

				return newMask && maskIdx < (newMaskStr ?? '').length
					? newMask.rules.has(newMaskStr?.[maskIdx])
					: true;
			});
		return offset === -1 ? 0 : -offset;
	};

	// Go with the cursor to the front (or to the end) of the new display
	// value based on the remaining chars that were calculated.
	//
	// Static mask chars are ignored (are skipped without decreasing the
	// remaining chars), because they haven't changed the cursor from
	// lastCursorPosition to cursorPosition, and only the static mask chars
	// until lastCursorPosition were considered in the remaining value.
	const goToTheFront = () => {
		return createString(Math.max(lastCursorPosition, len02))
			.substring(lastCursorPosition)
			.split('')
			.reduce(
				({ offset, remaining }, _, idx) => {
					if (remaining > 0) {
						offset++;

						const maskIdx = lastCursorPosition + idx;

						if (
							newMask && maskIdx < (newMaskStr ?? '').length
								? newMask.rules.has(newMaskStr?.[maskIdx])
								: true
						) {
							remaining--;
						}
					}

					return { offset, remaining };
				},
				{ offset: 0, remaining },
			).offset;
	};

	// Go with the cursor to the back (or to the beginning) of the new
	// display value based on the remaining chars that were calculated.
	//
	// It goes until right before a first user-provided char (or to
	// the beginning of the string) when remaining reaches 0.
	const goToTheBack = () => {
		return createString(lastCursorPosition)
			.split('')
			.reduce(
				({ offset, compensation, remaining }, _, idx) => {
					if (remaining < 0) {
						offset--;

						const maskIdx = lastCursorPosition - 1 - idx;

						const newUserProvided =
							newMask && maskIdx < (newMaskStr ?? '').length
								? newMask.rules.has(newMaskStr?.[maskIdx])
								: true;

						const oldUserProvided =
							oldMask && maskIdx < (oldMaskStr ?? '').length
								? oldMask.rules.has(oldMaskStr?.[maskIdx])
								: true;

						if (newUserProvided) {
							if (oldUserProvided || compensation === 0) {
								remaining++;
							} else {
								compensation--;
							}
						} else if (oldUserProvided) {
							compensation++;
							remaining++;
						}
					}

					return { offset, compensation, remaining };
				},
				{ offset: 0, compensation: 0, remaining },
			).offset;
	};

	// Calculate the offset based on the conditions
	// (cases detailed above)
	const offset = noChange
		? lastWentBack
			? goToTheFrontNoChange()
			: goToTheBackNoChange()
		: remaining > 0
		? goToTheFront()
		: remaining < 0
		? goToTheBack()
		: 0;

	// The new position is the old position plus the offset (the
	// offset can be negative, in which case the cursor goes back).
	const position = Math.min(
		Math.max(lastCursorPosition + offset, 0),
		(displayValue ?? '')?.length,
	);

	// Examples (cursor is |):
	//
	// Mask: (99) 9999-9999
	//
	// Example 01:
	// Before the change (oldDisplayValue): (12) 3456|-7891
	// Number 1 added (valueBeforeMask): (12) 34561|-7891
	// Mask applied (displayValue): (12) 3456-|1789
	// Offset applied: (12) 3456-1|789
	//
	// -> Details for 01:
	// - lastCursorPosition=9 (oldDisplayValue)
	// - cursorPosition=10 (displayValue)
	// - remaining=1 (because '1' at the end was removed and maskRemovedOffset=1)
	// - offset=2 ('-' is a static char and is skipped, increasing the offset)
	// - position=11 (lastCursorPosition + offset)
	//
	// Example 02:
	// Before the change (oldDisplayValue): (|12) 3456-7
	// Delete char after (valueBeforeMask): (|2) 3456-7
	// Mask applied (displayValue): (|23) 4567
	// Offset applied: (|23) 4567
	//
	// Example 03:
	// Before the change (oldDisplayValue): (1|2) 3456-7
	// Delete char before (valueBeforeMask): (|2) 3456-7
	// Mask applied (displayValue): (|23) 4567
	// Offset applied: (|23) 4567
	//
	// -> Details for 02 and 03:
	// - lastCursorPosition=2 (oldDisplayValue)
	// - cursorPosition=1 (displayValue)
	// - remaining=-1 (because the number of user-provided chars reduced by 1)
	// - offset=-1 (remaining)
	// - position=1 (lastCursorPosition + offset)
	// Important: from the point of view of the algorithm, both are the same, because it
	// doesn't actually know where the cursor was initially, only when displayValue
	// is already defined - cursorPosition, and then calculates lastCursorPosition
	// based on it.
	//
	// Example 04 (may not work the 1st time, but at most at the 2nd try it will work):
	// Before the change (oldDisplayValue): (12)| 3456-7891
	// Delete after (valueBeforeMask): (12)|3456-7891
	// Mask applied (displayValue): (12)| 3456-7891
	// Offset applied: (12) |3456-7891
	//
	// Example 05 (may not work the 1st time, but at most at the 2nd try it will work):
	// Before the change (oldDisplayValue): (12) |3456-7891
	// Delete before (valueBeforeMask): (12)|3456-7891
	// Mask applied (displayValue): (12)| 3456-7891
	// Offset applied: (12|) 3456-7891
	//
	// -> Details for 04 and 05:
	// - lastCursorPosition=4 (oldDisplayValue)
	// - cursorPosition=4 (displayValue)
	// - offset=1 (goToTheFrontNoChange for 04 -> ' ' is a static word and adds 1)
	// - offset=-1 (goToTheBackNoChange for 05 -> ')' is a static word and subtracts 1)
	// - position=5 (for 04)
	// - position=3 (for 05)
	// Important: Observe that the values of valueBeforeMask and displayValue of
	// both examples are the same, as well as the value of cursorPosition
	// (which is 4, that we get AFTER the value changed).
	// Also note that lastCursorPosition in the example '05' should be 5, but we don't
	// actually know that (because no user-provided char was removed), which makes
	// examples 04 and 05 be seen as the same from the algorithm point-of-view, in such a
	// way that the flag 'lastWentBack' is used to know if the last cursor change (without
	// changing user provided chars) went forward and backward, alternating the flag
	// value so that deleting chars after and before the cursor will work at most in
	// the second try (without "blocking" the user from deleting chars).
	//
	// Example 06:
	// Before the change (oldDisplayValue): (12) 345|6-7891
	// '912' pasted (valueBeforeMask): (12) 345912|6-7891
	// Mask applied (displayValue): (12) 3459-1|267
	// Offset applied: (12) 3459-12|67
	//
	// -> Details for 06:
	// - lastCursorPosition=8 (oldDisplayValue)
	// - cursorPosition=11 (displayValue)
	// - remaining=3 (because maskRemovedOffset=3)
	// - offset=4 ('-' is a static char and is skipped, increasing the offset)
	// - position=12 (lastCursorPosition + offset)
	//
	// Example 07:
	// Before the change (oldDisplayValue): (12) 3456-|7891
	// '1+2-3' pasted (valueBeforeMask): (12) 3456-1+2-3|7891
	// Mask applied (displayValue): (12) 3456-1237|
	// Offset applied: (12) 3456-123|7
	//
	// -> Details for 07:
	// - lastCursorPosition=10 (oldDisplayValue)
	// - cursorPosition=15 (displayValue)
	// - remaining=3 (because maskRemovedOffset=3, with only the chars '123' considered)
	// - offset=3 (remaining)
	// - position=13 (lastCursorPosition + offset)
	//
	// Example 08:
	// Before the change (oldDisplayValue): (1|2) 345
	// Select and delete from 2 to 4 (valueBeforeMask): (1|5
	// Mask applied (displayValue): (1|5
	// Offset applied: (1|5
	//
	// -> Details for 08:
	// - lastCursorPosition=5 (oldDisplayValue)
	// - cursorPosition=2 (displayValue)
	// - remaining=-3 (because 3 user provided chars were removed)
	// - offset=-3 (remaining)
	// - position=2 (lastCursorPosition + offset)
	// Important: Keep in mind that, as demonstrated in other examples,
	// lastCursorPosition is guessed (it doesn't necessarily correspond
	// to the initial cursor position, especially in this case in which
	// several chars were selected).
	//
	// Example 09:
	// Before the change (oldDisplayValue): (12) 345
	// Select everything and type 9 (valueBeforeMask): 9|
	// Mask applied (displayValue): (|9
	// Offset applied: (9|
	//
	// -> Details for 09:
	// - lastCursorPosition=5 (oldDisplayValue)
	// - cursorPosition=1 (displayValue)
	// - diffDynamicChars=-4 (because 4 user provided chars were removed)
	// - maskStaticOffset=1 (because 1 static char, not present previously, was added)
	// - remaining=-3 (diffDynamicChars + maskStaticOffset)
	// - offset=-3 (remaining)
	// - position=2 (lastCursorPosition + offset)
	// Important: lastCursorPositionTmp was calculated as cursorPosition - diffDynamicChars,
	// and lastCursorPosition was calculated from it (ended with the same value)
	//
	// Example 10:
	// Before the change (oldDisplayValue): (|23) 4567
	// Number 1 added (valueBeforeMask): (1|23) 4567
	// Mask applied (displayValue): (1|2) 3456-7
	// Offset applied: (1|2) 3456-7
	//
	// -> Details for 10:
	// - lastCursorPosition=1 (oldDisplayValue)
	// - cursorPosition=2 (displayValue)
	// - remaining=1 (1 new user provided char added)
	// - offset=1 (remaining)
	// - position=2 (lastCursorPosition + offset)
	//
	// Mask: (99) 9999-9999 -> (99) 99999-9999
	// (The mask is dynamic, based on the number of user provided chars)
	//
	// Example 11:
	// Before the change (oldDisplayValue): (12) 3456-|7812
	// Number 9 added (valueBeforeMask): (12) 3456-9|7812
	// Mask applied (displayValue): (12) 34569-|7812
	// Offset applied: (12) 34569|-7812
	//
	// -> Details for 11:
	// - lastCursorPosition=10 (oldDisplayValue)
	// - cursorPosition=11 (displayValue)
	// - diffDynamicChars=1 (newDynamicChars=11 - oldDynamicChars=10)
	// - remaining=0 (diffDynamicChars=1 - dynamicCharsOffset=1) +
	// - offset=0 (remaining)
	// - position=10 (lastCursorPosition + offset)
	// Important: The remaining amount is 0 because the number of user
	// provided chars is 1, but the change in the mask made it so that
	// the initial position applied to the new mask contained the user
	// provided char (but not the old mask), so the change from the
	// cursor position from 10 to 11 was reverted back to 10
	// (diffDynamicChars - dynamicCharsOffset = 0). It's also important
	// to note that position=11 is not strictly wrong ((12) 34569-|7812).
	//
	// Example 12:
	// Before the change (oldDisplayValue): (12) 34567|-8912
	// Delete before (valueBeforeMask): (12) 3456|-8912
	// Mask applied (displayValue): (12) 3456|-8912
	// Offset applied: (12) 3456-|8912
	//
	// Example 13:
	// Before the change (oldDisplayValue): (12) 3456|7-8912
	// Delete after (valueBeforeMask): (12) 3456|-8912
	// Mask applied (displayValue): (12) 3456|-8912
	// Offset applied: (12) 3456-|8912
	//
	// -> Details for 12 and 13:
	// - lastCursorPosition=10 (oldDisplayValue)
	// - cursorPosition=9 (displayValue)
	// - diffDynamicChars=-1 (newDynamicChars=10 - oldDynamicChars=11)
	// - offset=-1 (offset = remaining = diffDynamicChars)
	// - position=9 (lastCursorPosition + offset)
	// Important: The examples 12 and 13 are the same from the point of
	// view of the algorithm (just like examples 02 and 03).
	// It's also important to note that position=10 is not strictly
	// wrong (that is, (12) 3456-|8912).

	const wentBack = noChange ? !lastWentBack : !!lastWentBack;

	return { position, wentBack };
};

export interface UseMaskProps {
	outerValue?: string;
	maskGenerator?: MaskGenerator;
	onChange?: (value: string) => void;
	getCursorPosition?: () => number;
	setCursorPosition?: (cursorPosition: number) => void;
	keepMask?: boolean;
}

export const useMask = ({
	outerValue,
	maskGenerator,
	onChange,
	getCursorPosition,
	setCursorPosition,
	keepMask,
}: UseMaskProps) => {
	const [value, setValue] = React.useState(outerValue);
	const [lastValue, setLastValue] = React.useState(value);
	const [displayValue, setDisplayValue] = React.useState(value);
	const [lastDisplayValue, setLastDisplayValue] = React.useState(displayValue);
	const [lastCursorValue, setLastCursorValue] = React.useState(displayValue);
	const [lastCursorPosition, setLastCursorPosition] = React.useState(
		displayValue?.length ?? 0,
	);
	const [cursorBeforeMaskValue, setCursorBeforeMaskValue] =
		React.useState(displayValue);
	const [needUpdateCursor, setNeedUpdateCursor] = React.useState(false);
	const [lastWentBack, setLastWentBack] = React.useState(false);

	const [lastMask, setLastMask] = React.useState(maskGenerator);
	const [lastCursorMask, setLastCursorMask] = React.useState(maskGenerator);

	const updateDisplayValue = React.useCallback(
		(value: string, updateCursor?: boolean) => {
			if (updateCursor && getCursorPosition) {
				const cursorPosition = getCursorPosition();
				setLastCursorPosition(cursorPosition);
				setCursorBeforeMaskValue(value);
				setNeedUpdateCursor(true);
			}

			if ((value ?? '').trim() === '') {
				setDisplayValue('');
				setValue('');
				setLastMask(undefined);
				return { displayValue: '' };
			} else if (maskGenerator) {
				const { maskedValue, mask: currentMask } = mask(value, maskGenerator);
				const processedValue = processValue(maskedValue ?? '', maskGenerator);

				setDisplayValue(maskedValue ?? undefined);
				setValue(processedValue ?? undefined);
				setLastMask(maskGenerator);

				return { displayValue: maskedValue, mask: currentMask };
			} else {
				setDisplayValue(value);
				setValue(value);
				setLastMask(undefined);
				return { displayValue: value };
			}
		},
		[maskGenerator, getCursorPosition],
	);

	const changeDisplayValue = React.useCallback(
		(value: string) => {
			updateDisplayValue(value, true);
		},
		[updateDisplayValue],
	);

	React.useEffect(() => {
		if (setCursorPosition && lastCursorPosition != null) {
			setCursorPosition(lastCursorPosition);
		}
	}, [setCursorPosition, lastCursorPosition]);

	const updateCursor = React.useCallback(
		({
			displayValue,
			oldDisplayValue,
			newMask,
			oldMask,
			force,
		}: {
			displayValue: string;
			oldDisplayValue: string;
			newMask?: MaskGenerator;
			oldMask?: MaskGenerator;
			force?: boolean;
		}) => {
			if (setCursorPosition && getCursorPosition) {
				let { position: newExpectedCursorPos, wentBack } = getExpectedCursorPos(
					{
						displayValue,
						oldDisplayValue,
						valueBeforeMask: cursorBeforeMaskValue ?? '',
						newMask,
						oldMask,
						cursorPosition: lastCursorPosition,
						lastWentBack,
					},
				);

				if (force || lastCursorPosition !== newExpectedCursorPos) {
					setLastCursorPosition(newExpectedCursorPos);
					setCursorPosition(newExpectedCursorPos);
				}

				setLastWentBack(wentBack);
			}
		},
		[
			lastCursorPosition,
			setCursorPosition,
			getCursorPosition,
			lastWentBack,
			cursorBeforeMaskValue,
		],
	);

	React.useEffect(() => {
		updateDisplayValue(outerValue ?? '');
	}, [outerValue, updateDisplayValue]);

	React.useEffect(() => {
		if (value !== lastValue) {
			setLastValue(value);
			updateDisplayValue(value ?? '');

			if (!keepMask && onChange) {
				onChange(value ?? '');
			}
		}
	}, [value, lastValue, maskGenerator, updateDisplayValue, keepMask, onChange]);

	React.useEffect(() => {
		if (displayValue !== lastDisplayValue) {
			const { displayValue: newDisplayValue } = updateDisplayValue(
				displayValue ?? '',
			);

			if ((newDisplayValue ?? '') === (displayValue ?? '')) {
				setLastDisplayValue(newDisplayValue ?? undefined);

				if (keepMask && onChange) {
					onChange(newDisplayValue ?? '');
				}
			}
		}
	}, [displayValue, lastDisplayValue, updateDisplayValue, keepMask, onChange]);

	React.useEffect(() => {
		const newPos = getCursorPosition ? getCursorPosition() : lastCursorPosition;
		const force = newPos !== lastCursorPosition;

		if (
			displayValue === lastDisplayValue &&
			(lastCursorValue !== lastDisplayValue || force || needUpdateCursor)
		) {
			setNeedUpdateCursor(false);
			setLastCursorValue(lastDisplayValue);
			setLastCursorMask(lastMask);

			updateCursor({
				displayValue: lastDisplayValue ?? '',
				oldDisplayValue: lastCursorValue ?? '',
				newMask: lastMask,
				oldMask: lastCursorMask,
				force,
			});
		}
	}, [
		lastCursorValue,
		displayValue,
		lastDisplayValue,
		lastCursorPosition,
		lastMask,
		lastCursorMask,
		needUpdateCursor,
		getCursorPosition,
		updateCursor,
	]);

	const result = React.useMemo(
		() => ({ displayValue, setDisplayValue: changeDisplayValue }),
		[displayValue, changeDisplayValue],
	);

	return result;
};
