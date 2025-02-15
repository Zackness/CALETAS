import React from "react";

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
    return (
        <div className="relative ">
        <input 
        onChange={onChange}
        type={type}
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
            bg-fm-blue-2
            appearance-none
            focus:outline-none
            focus:ring-0
            peer
            text-white
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
        "
        htmlFor={id}>
            {label}
        </label>
        </div>
    )
}

export default Input;