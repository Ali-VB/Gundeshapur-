import React from 'react';

const Spinner: React.FC<{ small?: boolean }> = ({ small }) => {
  const size = small ? "w-5 h-5" : "w-12 h-12";
  return (
    <div className="inline-flex items-center justify-center mx-2">
      <div
        className={`${size} rounded-full animate-spin border-2 border-solid border-current border-t-transparent`}
        style={{ animation: 'spin 1s linear infinite' }}
        role="status"
        aria-live="polite"
      >
         <span className="sr-only">Loading...</span>
      </div>
    </div>
  );
};

export default Spinner;