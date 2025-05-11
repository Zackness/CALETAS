import React, { ChangeEventHandler, forwardRef } from "react";

interface InputProps {
  id: string;
  onChange?: ChangeEventHandler<HTMLInputElement>;
  value?: string;
  label: string;
  type?: string;
  disable?: boolean;
  name?: string;
  onBlur?: () => void;
  ref?: React.Ref<HTMLInputElement>;
}

const Input = forwardRef<HTMLInputElement, InputProps>(({
  id,
  onChange,
  value,
  label,
  type = "text",
  disable = false,
  name,
  onBlur
}, ref) => {
  return (
    <div className="relative">
      <input
        onChange={onChange}
        type={type}
        value={value}
        id={id}
        name={name}
        ref={ref}
        onBlur={onBlur}
        disabled={disable}
        className="
          block
          rounded-xl
          px-6
          pt-6
          pb-1
          w-full
          text-md
          bg-gray-800
          border-gray-700
          text-white
          placeholder-gray-500
          appearance-none
          focus:outline-none
          focus:ring-0
          peer
        "
        placeholder=" "
      />
      <label
        className="
          absolute
          text-md
          text-gray-300
          duration-150
          transform
          -translate-y-3
          scale-75
          top-4
          z-10
          origin-[0]
          left-6
          peer-placeholder-shown:scale-100
          peer-placeholder-shown:translate-y-0
          peer-focus:scale-75
          peer-focus:-translate-y-3
        "
        htmlFor={id}
      >
        {label}
      </label>
    </div>
  );
});

Input.displayName = "Input";

export default Input;