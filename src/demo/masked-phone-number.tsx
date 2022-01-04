import { createDefaultMaskGenerator } from "../hooks/use-mask";
import MaskedInput from "../components/masked-input";
import React from "react";

const phoneNumberMaskGenerator = createDefaultMaskGenerator("999 999 9999");

const MaskedPhoneNumber = () => {
  const [value, setValue] = React.useState("");

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
