import React from 'react';

interface DayStripCalendarProps {
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
}

const DayStripCalendar: React.FC<DayStripCalendarProps> = ({ selectedDate, onSelectDate }) => {
  const days = [];
  for (let i = 0; i < 7; i++) {
    const date = new Date();
    date.setDate(date.getDate() + i);
    days.push(date);
  }

  return (
    <div className="flex overflow-x-auto py-2 px-1 mb-6 bg-white rounded-xl shadow-sm">
      {days.map((day) => {
        const isSelected = selectedDate.toDateString() === day.toDateString();
        return (
          <button
            key={day.toISOString()}
            onClick={() => onSelectDate(day)}
            className={`flex-shrink-0 mx-1 p-3 rounded-lg text-center transition-colors duration-200 ${isSelected ? 'bg-blue-600 text-white shadow-md' : 'text-gray-700 hover:bg-gray-100'}`}
          >
            <p className="text-sm font-semibold">{day.toLocaleDateString('pt-BR', { weekday: 'short' })}</p>
            <p className="text-lg font-bold">{day.getDate()}</p>
          </button>
        );
      })}
    </div>
  );
};

export default DayStripCalendar;
