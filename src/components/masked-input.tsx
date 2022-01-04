import type { MaskGenerator } from "../hooks/use-mask";
import useWebMask from "../hooks/use-web-mask";
import React from "react";

const MaskedInput = React.forwardRef(
  (
    {
      maskGenerator,
      value,
      onChange,
      keepMask
    }: {
      maskGenerator?: MaskGenerator;
      keepMask?: boolean;
      value?: string;
      onChange?: (value: string) => void;
    },
    ref: React.ForwardedRef<HTMLInputElement> | undefined
  ) => {
    const maskProps = useWebMask({
      maskGenerator,
      value,
      onChange,
      keepMask,
      ref
    });

    return <input {...maskProps} />;
  }
);

export default MaskedInput;
