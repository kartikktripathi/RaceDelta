import React from 'react';

export default function LoadingState({ message = 'Loading...' }) {
  return (
    <div className="state-container">
      <div className="spinner"></div>
      <p className="text-muted">{message}</p>
    </div>
  );
}
