interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  color?: 'indigo' | 'gray' | 'white';
  text?: string;
  className?: string;
}

export default function LoadingSpinner({ 
  size = 'md', 
  color = 'indigo', 
  text,
  className = '' 
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12'
  };

  const colorClasses = {
    indigo: 'border-indigo-600',
    gray: 'border-gray-600',
    white: 'border-white'
  };

  const textColorClasses = {
    indigo: 'text-indigo-600',
    gray: 'text-gray-600',
    white: 'text-white'
  };

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div className="flex flex-col items-center space-y-2">
        <div 
          className={`
            ${sizeClasses[size]} 
            border-2 border-transparent 
            ${colorClasses[color]} 
            border-t-transparent 
            rounded-full 
            animate-spin
          `}
          role="status"
          aria-label="読み込み中"
        />
        {text && (
          <div className={`text-sm font-medium ${textColorClasses[color]}`}>
            {text}
          </div>
        )}
      </div>
    </div>
  );
}