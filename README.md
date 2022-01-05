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

Define a map custom rules for characters in the mask that must satisfy a regex provided. Characters in the mask not present in the rules are seen as static mask characters (as opposed to user provided characters), and will be included automatically in the display value.

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

Extend the hook to be used by a custom component. For this to work, the input component must allow to know and to modify the cursor position (in the example below, the read-write property `myPosition` was used as an example).

```ts
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

The hook [useRefMask](src/hooks/use-ref-mask.ts) wraps the generic hook and was created to be allow to use the component `ref` even if an external ref is received without boilerplate.

You can see the [useWebMask hook](src/hooks/use-web-mask.ts) provided by this package as a reference.
