import React from 'react';

interface StatusFilterChipsProps {
  selectedStatus: string;
  onSelectStatus: (status: string) => void;
  statusCounts: { [key: string]: number };
}

const statuses = ['Todos', 'Agendados', 'Confirmados', 'Concluidos', 'Faturados', 'Cancelados'];

const StatusFilterChips: React.FC<StatusFilterChipsProps> = ({ selectedStatus, onSelectStatus, statusCounts }) => (
  <div className="flex overflow-x-auto py-2 px-1 mb-6 no-scrollbar">
    {statuses.map((status) => {
      const count = statusCounts[status] || 0;
      const isSelected = selectedStatus === status;
      return (
        <button
          key={status}
          onClick={() => onSelectStatus(status)}
          className={`flex-shrink-0 mx-1 px-4 py-2 rounded-full text-sm font-medium transition-colors duration-200 ${isSelected ? 'bg-blue-600 text-white shadow-sm' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'}`}
        >
          {status} ({count})
        </button>
      );
    })}
  </div>
);

export default StatusFilterChips;
