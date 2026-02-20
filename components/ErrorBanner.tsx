// 3. ErrorBanner Component
const ErrorBanner: React.FC<{ error: string | null; onDismiss: () => void; }> = ({ error, onDismiss }) => {
  if (!error) return null;

  return (
    <div className="shrink-0 mb-4 p-3 bg-red-900/20 border border-red-800 text-red-300 rounded-xl flex items-center justify-between text-xs animate-in slide-in-from-top duration-300">
      <span className="flex-1 mr-2">{error}</span>
      <button onClick={onDismiss} className="p-1">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
};

export default ErrorBanner