import React, { useState } from "react";

interface InputProps {
    id: string;
    onChange: any;
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
    type,
    disable
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
        className="
            block
            rounded-xl
            px-6
            pt-6
            pb-1
            w-full
            text-md
            bg-white/10
            backdrop-blur-sm
            border
            border-white/20
            appearance-none
            focus:outline-none
            focus:ring-2
            focus:ring-white/30
            focus:border-white/40
            peer
            text-white
            placeholder-white/50
            transition-all
            duration-200
            pr-12
            font-normal
            "
            placeholder=" "
        />
        <label 
        className="
        absolute
        text-md
        text-white/80
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
        peer-focus:text-white
        font-normal
        "
        htmlFor={id}>
            {label}
        </label>
        
        {isPassword && (
            <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white/60 hover:text-white/80 transition-colors"
            >
                {showPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                    </svg>
                ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                )}
            </button>
        )}
        </div>
    )
}

export default Input;