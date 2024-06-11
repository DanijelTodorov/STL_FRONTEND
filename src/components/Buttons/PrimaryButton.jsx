import React, { useState } from "react";

const ImageButton = ({ disabled, label, className, onClick, width, height }) => {
    const [isHovered, setIsHovered] = useState(false);

    const handleMouseEnter = () => {
        setIsHovered(true);
    };

    const handleMouseLeave = () => {
        setIsHovered(false);
    };

    const imageUrl = isHovered ? disabled === true ? "/Btn_bg_Off.png" : "/Btn_bg_On.png" : "/Btn_bg_Off.png";

    return (
        <button className={`${className} ${disabled === true && "disabled"} bg-transparent border-none p-0 m-0 cursor-pointer`}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            onClick={onClick}>
            <div className={`${height > 0 ? `h-[${height}px]` : "h-[50px]"} ${width > 0 ? `w-[${width}px]` : "w-[156px]"} ${disabled === true ? "text-gray-500" : "text-white"} bg-cover bg-center  flex items-center justify-center text-[14px] font-semibold`}
                style={{ backgroundImage: `url(${imageUrl})` }}>
                {label}
            </div>
        </button>
    );
};

export default ImageButton;
