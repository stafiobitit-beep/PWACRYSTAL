import React from 'react';
import { Ghost } from 'lucide-react';

interface EmptyStateProps {
  title: string;
  message: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({ title, message }) => {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div className="bg-gray-100 p-6 rounded-[32px] mb-6">
        <Ghost className="w-12 h-12 text-gray-300" />
      </div>
      <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-500 font-medium max-w-[240px] leading-relaxed">
        {message}
      </p>
    </div>
  );
};

export default EmptyState;
