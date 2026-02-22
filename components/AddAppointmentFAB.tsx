import Link from 'next/link';
import React from 'react';

const AddAppointmentFAB: React.FC = () => (
  <Link href="/admin/agendamentos/novo" passHref>
    <button className="fixed bottom-6 right-6 bg-stone-800 text-amber-400 p-4 rounded-full shadow-lg hover:bg-stone-700 hover:shadow-[0_0_16px_rgba(245,158,11,0.25)] border border-amber-600/50 focus:outline-none focus:ring-4 focus:ring-amber-500/50 transition-all duration-200 z-50">
      <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
      </svg>
    </button>
  </Link>
);

export default AddAppointmentFAB;
