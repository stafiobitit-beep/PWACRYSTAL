import React from 'react';

interface SkeletonProps {
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className }) => {
  return (
    <div className={`bg-gray-200 animate-pulse rounded-2xl ${className}`} />
  );
};

export const TaskCardSkeleton: React.FC = () => (
  <div className="bg-white rounded-3xl p-5 mb-4 shadow-sm border border-gray-50 flex items-center justify-between">
    <div className="flex-1">
      <div className="flex items-center gap-2 mb-2">
        <Skeleton className="h-5 w-16 rounded-full" />
        <Skeleton className="h-4 w-12" />
      </div>
      <Skeleton className="h-6 w-3/4 mb-1" />
      <Skeleton className="h-4 w-1/2" />
    </div>
    <Skeleton className="w-6 h-6 rounded-full" />
  </div>
);
