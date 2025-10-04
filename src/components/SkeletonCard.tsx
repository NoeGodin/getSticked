import React from "react";

interface SkeletonCardProps {
  count?: number;
}

const SkeletonCard: React.FC<SkeletonCardProps> = ({ count = 6 }) => {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="bg-white rounded-lg shadow-lg p-4 sm:p-6 animate-pulse"
        >
          <div className="h-5 sm:h-6 bg-gray-200 rounded mb-3 sm:mb-4"></div>
          <div className="h-3 sm:h-4 bg-gray-200 rounded mb-2 sm:mb-3"></div>
          <div className="h-3 sm:h-4 bg-gray-200 rounded w-2/3 mb-3 sm:mb-4"></div>
          <div className="flex justify-between items-center">
            <div className="h-3 sm:h-4 bg-gray-200 rounded w-1/3"></div>
            <div className="h-3 sm:h-4 bg-gray-200 rounded w-1/4"></div>
          </div>
        </div>
      ))}
    </>
  );
};

export default SkeletonCard;