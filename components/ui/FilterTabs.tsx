import React from 'react';

interface FilterTabsProps {
  filters: Array<{
    key: string;
    label: string;
    count?: number;
  }>;
  activeFilter: string;
  onFilterChange: (filter: string) => void;
  className?: string;
}

export function FilterTabs({ filters, activeFilter, onFilterChange, className = '' }: FilterTabsProps) {
  return (
    <div className={`filter-container ${className}`}>
      {filters.map((filter) => (
        <button
          key={filter.key}
          onClick={() => onFilterChange(filter.key)}
          className={
            activeFilter === filter.key
              ? 'filter-tab-active'
              : 'filter-tab-inactive'
          }
        >
          {filter.label}
          {filter.count !== undefined && (
            <span className="ml-2 bg-white bg-opacity-20 text-xs px-1.5 py-0.5 rounded-full">
              {filter.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
