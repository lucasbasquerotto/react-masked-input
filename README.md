# React Masked Input and Hooks

<div align="center">

[![npm downloads](https://img.shields.io/npm/dm/react-hook-mask.svg?style=for-the-badge)](https://www.npmjs.com/package/react-hook-mask)
[![npm](https://img.shields.io/npm/dt/react-hook-mask.svg?style=for-the-badge)](https://www.npmjs.com/package/react-hook-mask)
[![npm](https://img.shields.io/npm/l/react-hook-mask?style=for-the-badge)](https://github.com/lucasbasquerotto/react-masked-input/blob/master/LICENCE)

</div>

<p align="center">
  <a href="#quickstart">Quickstart</a> |
  <a href="https://github.com/lucasbasquerotto/react-masked-input/tree/master/examples/src/examples">Examples</a> |
  <a href="https://lucasbasquerotto.github.io/react-masked-input">Demo</a>
</p>

### Features

-   Support custom masks and mask rules to define which characters are allowed.
-   Can generate different masks based on the current value.
-   Preserve the cursor position when the value is changed, or when a new value (or part of it) is pasted, even when the mask changes.
-   Extensible, allowing the use of the [generic hook](src/hooks/use-mask.ts) by different components.
-   Default [hook for web (DOM) components](src/hooks/use-web-mask.ts), as well as an implementation of the [react-dom input component](src/components/masked-input.tsx) that uses the hook.
-   Function [createDefaultMaskGenerator](src/utils/mask-util.ts) to easily create a mask generator that generates a single mask (independent of the value).

### Install

    npm install react-hook-mask

### Quickstart

```tsx
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
```

You can define a boolean property `keepMask` with the value `true` to preserve the mask in the value provided (defined with `setValue`).

### Define custom rules

Define a map with custom rules for characters in the mask that must satisfy a regex provided. Characters in the mask not present in the rules are seen as static mask characters (as opposed to user provided characters), and will be included automatically in the display value.

```tsx
import React from 'react';
import { MaskedInput } from 'react-hook-mask';

const MY_RULES = new Map([
    ['C', /[A-Za-z]/],
    ['N', /\d/],
]);

const createMaskGenerator = (mask) => ({
    rules: MY_RULES,
    generateMask: () => mask,
});

const maskGenerator = createMaskGenerator('CCC-NNNN');

const CustomRules = () => {
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

export default CustomRules;
```

### Define a dynamic mask

A different mask can be defined based on the current mask value. The map `DEFAULT_MASK_RULES` can be used as the default rules, but [custom rules](#define-custom-rules) can be defined too. A `transform` optional function can be used to transform the string if needed (in the example below, instead of blocking lowercase letters, they are converted to uppercase).

```tsx
import React from 'react';
import { MaskedInput, DEFAULT_MASK_RULES } from 'react-hook-mask';

const maskGenerator = {
    rules: DEFAULT_MASK_RULES,
    generateMask: (value) =>
        (value?.replaceAll('-', '').length ?? 0) <= 10
            ? 'AAA-AAA-AAAA'
            : 'AAA-AAA-AAA-AAAA',
    transform: (v) => v?.toUpperCase(),
};

const DynamicMask = () => {
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

export default DynamicMask;
```

### Custom DOM component

Use any mask in a custom DOM component (as long it behaves as an HTML input).

```tsx
import React from 'react';
import { useWebMask } from 'react-hook-mask';
import MyInput from './my-input';

const CustomDOMComponent = React.forwardRef(
    (
        {
            maskGenerator,
            value: outerValue,
            onChange: onChangeOuter,
            keepMask,
            ...otherProps
        },
        outerRef,
    ) => {
        const { value, onChange, ref } = useWebMask({
            maskGenerator,
            value: outerValue,
            onChange: onChangeOuter,
            keepMask,
            ref: outerRef,
        });

        // The properties myValue, myOnChange and myRef are just examples
        return (
            <MyInput
                {...otherProps}
                myValue={value ?? ''}
                myOnChange={onChange}
                myRef={ref}
            />
        );
    },
);

export default CustomDOMComponent;
```

You can see the default [MaskedInput component](src/components/masked-input.tsx) provided by this package as a reference.

### Custom mask hook

Extend the hook to be used by a custom component (or several components, as long as the way to get and to change the cursor position is the same for those components).

The only requirement for the creation of a custom hook is that the input component must have a way to retrieve and to modify the cursor position (in the example below, the read-write property `myPosition` was used as an example).

```tsx
import React from 'react';
import { useRefMask } from 'react-hook-mask';

export const useMyMask = ({
    maskGenerator,
    value,
    onChange,
    keepMask,
    ref: outerRef,
}) => {
    const getCursorPosition = React.useCallback((el) => {
        const cursorPosition = el?.myPosition ?? 0;
        return cursorPosition;
    }, []);

    const setCursorPosition = React.useCallback((cursorPosition, el) => {
        if (el) {
            el.myPosition = cursorPosition;
        }
    }, []);

    const { displayValue, setDisplayValue, ref } = useRefMask({
        value,
        maskGenerator,
        getCursorPosition,
        setCursorPosition,
        onChange,
        keepMask,
        ref: outerRef,
    });

    return { value: displayValue, onChange: setDisplayValue, ref };
};
```

The hook [useRefMask](src/hooks/use-ref-mask.ts) wraps the generic [useMask](src/hooks/use-mask.ts) hook and was created to allow the use of the component `ref` even if an external `ref` is received without having to add boilerplate to handle this case.

You can see the [useWebMask](src/hooks/use-web-mask.ts) and [useNativeMask](src/hooks/use-native-mask.ts) hooks provided by this package as a reference.

### Currency mask

The utilitarian function `getCurrencyMaskGenerator` can create a mask generator that allows the value be displayed as a currency.

```tsx
import React from 'react';
import { MaskedInput, getCurrencyMaskGenerator } from 'react-hook-mask';

const maskGenerator = getCurrencyMaskGenerator({
    prefix: '$ ',
    thousandSeparator: '.',
    centsSeparator: ',',
});

export const CurrencyMaskedInput = () => {
    const [value, setValue] = React.useState('');

    return (
        <div>
            <MaskedInput
                maskGenerator={maskGenerator}
                value={value}
                onChange={setValue}
            />
            <div>
                Mask: {value ? maskGenerator.generateMask(value) : undefined}
            </div>
            <div>Value (no mask):</div>
            {value ? <div>{value}</div> : undefined}
        </div>
    );
};
```

You can define different currencies (like `US$ `, `R$ `, `€ `), using the prefix, or leave it empty/undefined, if you want only the numeric value.

You can use different separators for thousands, like ` `, `.`, or leave it empty/undefined, if you don't want separators.

You can use different symbols for the cents (decimal) separators, like `.`, `,`, or leave it empty/undefined, if the currency has no cents (like yen and won).

In the example above, for an input of `123456789`, you would see `$ 1.234.567,89` as the output (the displayed value).

### Show the mask as a string

Sometimes you just want to show a masked value as a string. In this case, instead of using an input component, you can just call the `mask` function available in this package:

```tsx
import { mask } from 'react-hook-mask';

const value = '12345678901';

const Component = () => (
    <div>
        <div>Value: {value}</div>
        <div>Masked: {mask(value, maskGenerator)}</div>
    </div>
);
```

If performance is a concern, the masked value can be memoized:

```tsx
import { mask } from 'react-hook-mask';

const value = '12345678901';

const Component = () => {
    const maskedValue = React.useMemo(
        () => mask(value, maskGenerator),
        [value],
    );

    return (
        <div>
            <div>Value: {value}</div>
            <div>Masked: {maskedValue}</div>
        </div>
    );
};
```

### React Native

You can use the hook `useNativeMask` instead of having to create a custom react-native hook using the lower level `useRefMask` hook.

This hook is similar to the `useWebMask` hook, except that it's to be used in a react-native `TextInput` (or compatible) component.

```tsx
import React from 'react';
import { useNativeMask } from 'react-hook-mask';
import { TextInput } from 'react-native';

const MaskedInput = React.forwardRef(
    (
        { maskGenerator, value: outerValue, onChange, keepMask, ...otherProps },
        outerRef,
    ) => {
        const { ref, value, onChangeText, onSelectionChange } = useNativeMask({
            maskGenerator,
            value: outerValue,
            onChange,
            keepMask,
            ref: outerRef,
        });

        return (
            <TextInput
                {...otherProps}
                ref={ref}
                value={value}
                onChangeText={onChangeText}
                onSelectionChange={onSelectionChange}
            />
        );
    },
);

export default MaskedInput;
```

The native component can be used in the same way as any other mask component, [as shown previously](#quickstart).
