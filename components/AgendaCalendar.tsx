'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import moment from 'moment';
import 'moment/locale/pt-br';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import 'react-big-calendar/lib/css/react-big-calendar.css';

moment.locale('pt-br');

const localizer = momentLocalizer(moment);

type AgendaItem = {
  id: number;
  dataHora: string;
  cliente: { nome: string };
  servico: { nome: string; duracaoMinutos: number };
  status: string;
  profissional?: string | null;
};

const agendamentosAPI: AgendaItem[] = [
  {
    id: 1,
    dataHora: '2026-02-17T15:00:00',
    cliente: { nome: 'Juliana Oliveira' },
    servico: { nome: 'Coloração', duracaoMinutos: 120 },
    status: 'confirmado',
  },
  {
    id: 2,
    dataHora: '2026-02-17T10:00:00',
    cliente: { nome: 'Marina Souza' },
    servico: { nome: 'Corte Feminino', duracaoMinutos: 60 },
    status: 'agendado',
  },
  {
    id: 3,
    dataHora: '2026-02-18T14:30:00',
    cliente: { nome: 'Carla Mendes' },
    servico: { nome: 'Manicure', duracaoMinutos: 45 },
    status: 'concluido',
  },
];

const STATUS_COLORS: Record<string, string> = {
  confirmado: '#10B981',
  agendado: '#F59E0B',
  concluido: '#3B82F6',
  faturado: '#8B5CF6',
  cancelado: '#EF4444',
};

type CalendarEvent = {
  id: number;
  title: string;
  start: Date;
  end: Date;
  status?: string;
  servico?: string;
  cliente?: string;
  profissional?: string;
};

type AgendaCalendarProps = {
  agendamentos?: AgendaItem[];
  onSelectEvent?: (event: CalendarEvent) => void;
};

function AgendaEvent({ event }: { event: CalendarEvent }) {
  const horario = event.start && event.end
    ? `${moment(event.start).format('HH:mm')} - ${moment(event.end).format('HH:mm')}`
    : '';
  return (
    <div className="agenda-event">
      <div className="agenda-event-line">{horario}</div>
      <div className="agenda-event-line">{event.servico}</div>
      <div className="agenda-event-line">Cliente: {event.cliente}</div>
      <div className="agenda-event-line">Profissional: {event.profissional || '-'}</div>
    </div>
  );
}

export default function AgendaCalendar({ agendamentos, onSelectEvent }: AgendaCalendarProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [view, setView] = useState<'day' | 'week'>('week');
  const initialized = useRef(false);

  useEffect(() => {
    const media = window.matchMedia('(max-width: 640px)');
    const update = () => setIsMobile(media.matches);
    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true;
    }
    setView(isMobile ? 'day' : 'week');
  }, [isMobile]);

  const events = useMemo(() => {
    const source = agendamentos && agendamentos.length > 0 ? agendamentos : agendamentosAPI;
    return source.map((item) => {
      const start = moment(item.dataHora);
      const end = moment(item.dataHora).add(item.servico.duracaoMinutos, 'minutes');
      const status = item.status?.toLowerCase();
      const profissional = item.profissional || '';
      return {
        id: item.id,
        title: `${item.servico.nome} - ${item.cliente.nome}`,
        start: start.toDate(),
        end: end.toDate(),
        status,
        servico: item.servico.nome,
        cliente: item.cliente.nome,
        profissional: profissional || undefined,
      };
    });
  }, [agendamentos]);

  const Toolbar = () => (
    <div className="agenda-toolbar">
      <div className="agenda-toolbar-left">
        <div className="agenda-toolbar-title">
          {moment(currentDate).format('MMMM YYYY')}
        </div>
        <div className="agenda-toolbar-views">
          <button
            type="button"
            className={`agenda-view-button ${view === 'week' ? 'active' : ''}`}
            onClick={() => setView('week')}
          >
            Semana
          </button>
          <button
            type="button"
            className={`agenda-view-button ${view === 'day' ? 'active' : ''}`}
            onClick={() => setView('day')}
          >
            Dia
          </button>
        </div>
      </div>
      <div className="agenda-toolbar-actions">
        <input
          type="date"
          value={moment(currentDate).format('YYYY-MM-DD')}
          onChange={(e) => setCurrentDate(moment(e.target.value, 'YYYY-MM-DD').toDate())}
          className="agenda-date-input"
        />
      </div>
    </div>
  );

  return (
    <div className={`agenda-calendar bg-white rounded-2xl shadow-sm border border-gray-200 p-4 ${isMobile ? 'is-mobile' : ''} ${view === 'week' ? 'is-week' : ''}`}>
      <div className="agenda-calendar-scroll h-[600px]">
        <Calendar
          localizer={localizer}
          culture="pt-br"
          events={events}
          view={view}
          views={['day', 'week']}
          date={currentDate}
          onNavigate={(date) => setCurrentDate(date)}
          startAccessor="start"
          endAccessor="end"
          min={moment().hour(8).minute(0).toDate()}
          max={moment().hour(20).minute(0).toDate()}
          onSelectEvent={onSelectEvent}
          components={{ event: AgendaEvent, toolbar: Toolbar }}
          messages={{
            week: 'Semana',
            day: 'Dia',
            month: 'Mês',
            agenda: 'Agenda',
            date: 'Data',
            time: 'Horário',
            event: 'Evento',
            showMore: (total) => `+${total} mais`,
          }}
          formats={{
            timeGutterFormat: 'HH:mm',
            dayHeaderFormat: isMobile ? 'ddd, DD/MM' : 'ddd DD/MM',
            eventTimeRangeFormat: ({ start, end }) =>
              `${moment(end).format('HH:mm')}`,
          }}
          eventPropGetter={(event: { status?: string }) => {
            const backgroundColor = STATUS_COLORS[event.status || ''] || '#94A3B8';
            return {
              style: {
                backgroundColor,
                borderRadius: '8px',
                border: 'none',
                color: '#fff',
                padding: '2px 6px',
                fontWeight: 600,
              },
            };
          }}
        />
      </div>
    </div>
  );
}
