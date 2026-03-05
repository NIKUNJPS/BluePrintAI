import React from 'react';

export const Spinner: React.FC = () => (
  <div className="flex justify-center items-center space-x-2 animate-pulse">
    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
    <div className="w-2 h-2 bg-blue-500 rounded-full delay-75"></div>
    <div className="w-2 h-2 bg-blue-500 rounded-full delay-150"></div>
  </div>
);

export const ThinkingIndicator: React.FC = () => (
  <div className="flex items-center space-x-3 text-blue-400 bg-blue-900/20 px-4 py-2 rounded-full border border-blue-500/30">
    <svg className="animate-spin h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
    <span className="text-sm font-mono font-medium tracking-wide">4XStruct Thinking...</span>
  </div>
);
