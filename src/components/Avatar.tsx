// noinspection GrazieInspection

import React from "react";
import { User } from "lucide-react";

interface AvatarProps {
  photoURL?: string | null;
  displayName?: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
  onClick?: () => void;
  clickable?: boolean;
}

const Avatar: React.FC<AvatarProps> = ({
  photoURL,
  displayName,
  size = "md",
  className = "",
  onClick,
  clickable = false,
}) => {
  const sizeClasses = {
    xs: "w-6 h-6",
    sm: "w-8 h-8",
    md: "w-10 h-10",
    lg: "w-12 h-12",
    xl: "w-16 h-16",
  };

  const iconSizes = {
    xs: 12,
    sm: 16,
    md: 20,
    lg: 24,
    xl: 32,
  };

  const getInitials = (name?: string) => {
    if (!name) return "?";
    const words = name.trim().split(" ");
    if (words.length === 1) {
      return words[0].charAt(0).toUpperCase();
    }
    return (
      words[0].charAt(0) + words[words.length - 1].charAt(0)
    ).toUpperCase();
  };

  const handleClick = (e: React.MouseEvent) => {
    if (clickable && onClick) {
      e.stopPropagation();
      onClick();
    }
  };

  const Component = clickable ? "button" : "div";

  return (
    <Component
      onClick={handleClick}
      className={`${sizeClasses[size]} rounded-full overflow-hidden bg-gray-200 flex items-center justify-center flex-shrink-0 ${className} ${
        clickable ? "hover:ring-2 hover:ring-blue-500 hover:ring-offset-2 transition-all cursor-pointer" : ""
      }`}
    >
      {photoURL ? (
        <img
          src={photoURL}
          alt={displayName || "Avatar"}
          className="w-full h-full object-cover"
          onError={(e) => {
            // If can't load image show initials
            e.currentTarget.style.display = "none";
          }}
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          {displayName ? (
            <span
              className={`font-semibold text-gray-600 ${
                size === "xs"
                  ? "text-xs"
                  : size === "sm"
                    ? "text-sm"
                    : size === "md"
                      ? "text-base"
                      : size === "lg"
                        ? "text-lg"
                        : "text-xl"
              }`}
            >
              {getInitials(displayName)}
            </span>
          ) : (
            <User size={iconSizes[size]} className="text-gray-400" />
          )}
        </div>
      )}
    </Component>
  );
};

export default Avatar;
