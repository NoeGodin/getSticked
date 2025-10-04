import React from "react";

interface LoadingProps {
  size?: "sm" | "md" | "lg" | "xl";
  variant?: "spinner" | "page" | "inline";
  message?: string;
  color?: "blue" | "white" | "gray";
}

const Loading: React.FC<LoadingProps> = ({
  size = "md",
  variant = "spinner",
  message,
  color = "blue",
}) => {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-6 h-6",
    lg: "w-8 h-8",
    xl: "w-16 h-16",
  };

  const colorClasses = {
    blue: "border-blue-500 border-t-transparent",
    white: "border-white border-t-transparent",
    gray: "border-gray-400 border-t-transparent",
  };

  const borderWidthClasses = {
    sm: "border-2",
    md: "border-2",
    lg: "border-3",
    xl: "border-4",
  };

  const spinner = (
    <div
      className={`${sizeClasses[size]} ${borderWidthClasses[size]} ${colorClasses[color]} rounded-full animate-spin`}
    />
  );

  if (variant === "page") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            {spinner}
          </div>
          {message && (
            <p className="text-gray-600 text-sm sm:text-base">{message}</p>
          )}
        </div>
      </div>
    );
  }

  if (variant === "inline") {
    return (
      <div className="flex items-center justify-center gap-2">
        {spinner}
        {message && (
          <span className="text-gray-600 text-sm">{message}</span>
        )}
      </div>
    );
  }

  // Default spinner variant
  return (
    <div className="flex justify-center">
      {spinner}
    </div>
  );
};

export default Loading;