import LoadingSpinner from './LoadingSpinner';

interface LoadingPageProps {
  text?: string;
  className?: string;
}

export default function LoadingPage({ 
  text = '読み込み中...', 
  className = '' 
}: LoadingPageProps) {
  return (
    <div className={`min-h-screen flex items-center justify-center bg-gray-50 ${className}`}>
      <div className="text-center">
        <LoadingSpinner 
          size="xl" 
          color="indigo" 
          text={text}
          className="mb-4" 
        />
        <div className="text-gray-500 text-sm mt-4">
          しばらくお待ちください
        </div>
      </div>
    </div>
  );
}