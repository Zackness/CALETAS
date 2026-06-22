"use client";

import React, { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

interface InputProps {
  id: string;
  onChange: React.ChangeEventHandler<HTMLInputElement>;
  value: string;
  label: string;
  type?: string;
  disable?: boolean;
}

const Input: React.FC<InputProps> = ({
  id,
  onChange,
  value,
  label,
  type = "text",
  disable,
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === "password";
  const inputType = isPassword && showPassword ? "text" : type;

  return (
    <div className="relative">
      <input
        onChange={onChange}
        type={inputType}
        value={value}
        id={id}
        disabled={disable}
        className="peer block w-full appearance-none rounded-xl border border-white/20 bg-white/10 px-6 pb-2 pt-6 pr-12 text-md font-normal text-white backdrop-blur-sm transition-all duration-200 placeholder-white/50 focus:border-white/40 focus:outline-none focus:ring-2 focus:ring-white/30"
        placeholder=" "
      />
      <label
        className="absolute left-6 top-4 z-10 origin-[0] -translate-y-3 scale-75 transform text-md font-normal text-white/80 duration-150 peer-placeholder-shown:translate-y-0 peer-placeholder-shown:scale-100 peer-focus:-translate-y-3 peer-focus:scale-75 peer-focus:text-white"
        htmlFor={id}
      >
        {label}
      </label>

      {isPassword ? (
        <button
          type="button"
          tabIndex={-1}
          aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
          onClick={() => setShowPassword((prev) => !prev)}
          className="absolute right-3 bottom-2.5 flex h-9 w-9 items-center justify-center rounded-lg text-white/55 transition-colors hover:bg-white/10 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
        >
          {showPassword ? <EyeOff className="h-[1.15rem] w-[1.15rem]" strokeWidth={2} /> : <Eye className="h-[1.15rem] w-[1.15rem]" strokeWidth={2} />}
        </button>
      ) : null}
    </div>
  );
};

export default Input;
