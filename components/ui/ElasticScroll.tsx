'use client';

import React from 'react';

interface ElasticScrollProps {
  children: React.ReactNode;
  className?: string;
}

export function ElasticScroll({ children, className = '' }: ElasticScrollProps) {
  return (
    <div
      className={`overflow-y-auto overscroll-auto ${className}`.trim()}
      style={{ WebkitOverflowScrolling: 'touch' }}
    >
      {children}
    </div>
  );
}
