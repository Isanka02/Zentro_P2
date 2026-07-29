import { AlertTriangle } from "lucide-react";

const ErrorState = ({ onRetry }: { onRetry: () => void }) => {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <AlertTriangle size={48} className="text-red-300 mb-3" />
      <h3 className="text-gray-900 font-medium">Something went wrong</h3>
      <p className="text-gray-500 text-sm mt-1 mb-4">We couldn't load products right now.</p>
      <button
        onClick={onRetry}
        className="bg-blue-600 text-white text-sm px-4 py-2 rounded-md hover:bg-blue-700"
      >
        Try again
      </button>
    </div>
  );
};

export default ErrorState;