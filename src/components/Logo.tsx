import React from "react";

interface LogoProps {
  className?: string;
  size?: number;
}

export const Logo: React.FC<LogoProps> = ({ className = "", size = 32 }) => {
  return (
    <div className={`flex items-center ${className}`}>
      <img
        src="/logo.png"
        alt="Feemat Logo"
        width={size}
        height={size}
        className="object-contain"
      />
      <span className="ml-2 text-xl font-bold">Feemat</span>
    </div>
  );
};
