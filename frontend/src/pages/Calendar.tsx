import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import client from '../api/client';
import BottomNav from '../components/layout/BottomNav';
import { ChevronLeft, ChevronRight, MapPin, User } from 'lucide-react';

const DAYS_NL = ['Zo', 'Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za'];
const MONTHS_NL = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Aug','Sep','Okt','Nov','Dec'];

const Calendar: React.FC = () => {
  const [tasks, setTasks] = useState<any[]>([]);
  const [weekOffset, setWeekOffset] = useState(0); // 0 = current week
  const navigate = useNavigate();

  useEffect(() => {
    client.get('/tasks').then(({ data }) => setTasks(data)).catch(() => {});
  }, []);

  // Calculate the 7 days of the current week + offset
  const getWeekDays = () => {
    const now = new Date();
    const monday = new Date(now);
    monday.setDate(now.getDate() - ((now.getDay() + 6) % 7) + weekOffset * 7);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      return d;
    });
  };

  const weekDays = getWeekDays();

  const getTasksForDay = (date: Date) =>
    tasks.filter(t => {
      const td = new Date(t.date);
      return td.toDateString() === date.toDateString();
    });

  const statusColors: any = {
    PLANNED: 'bg-blue-100 text-blue-700',
    IN_PROGRESS: 'bg-yellow-100 text-yellow-700',
    DONE: 'bg-green-100 text-green-700',
    ISSUE: 'bg-red-100 text-red-700',
  };

  const today = new Date().toDateString();

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-white px-6 pt-12 pb-4 rounded-b-[40px] shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-black text-gray-900">Planning</h1>
          <div className="flex gap-2">
            <button onClick={() => setWeekOffset(w => w - 1)} className="p-2 bg-gray-100 rounded-xl active:bg-gray-200">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button onClick={() => setWeekOffset(0)} className="px-3 py-2 bg-primary-100 text-primary-700 rounded-xl text-xs font-black">
              NU
            </button>
            <button onClick={() => setWeekOffset(w => w + 1)} className="p-2 bg-gray-100 rounded-xl active:bg-gray-200">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Day selector strip */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          {weekDays.map((day, i) => {
            const isToday = day.toDateString() === today;
            const count = getTasksForDay(day).length;
            return (
              <div key={i} className={`flex flex-col items-center px-3 py-2 rounded-2xl min-w-[52px] ${isToday ? 'bg-primary-600 text-white' : 'bg-gray-50 text-gray-500'}`}>
                <span className="text-[10px] font-bold">{DAYS_NL[day.getDay()]}</span>
                <span className="text-lg font-black">{day.getDate()}</span>
                {count > 0 && (
                  <span className={`text-[10px] font-black rounded-full w-4 h-4 flex items-center justify-center mt-0.5 ${isToday ? 'bg-white text-primary-600' : 'bg-primary-100 text-primary-600'}`}>
                    {count}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Task list per day */}
      <div className="p-4 space-y-6 mt-4">
        {weekDays.map((day, i) => {
          const dayTasks = getTasksForDay(day);
          if (dayTasks.length === 0) return null;
          return (
            <div key={i}>
              <h3 className="text-xs font-black uppercase tracking-widest text-primary-600 mb-3">
                {DAYS_NL[day.getDay()]} {day.getDate()} {MONTHS_NL[day.getMonth()]}
              </h3>
              <div className="space-y-3">
                {dayTasks.map((task: any) => (
                  <div
                    key={task.id}
                    onClick={() => navigate(`/tasks/${task.id}`)}
                    className="bg-white rounded-[20px] p-4 shadow-sm border border-gray-50 flex items-center gap-3 active:scale-[0.98] transition-all cursor-pointer"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-black text-gray-900 truncate">{task.title}</p>
                      <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3" />{task.location?.name}
                      </p>
                      {task.cleaner?.name && (
                        <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                          <User className="w-3 h-3" />{task.cleaner.name}
                        </p>
                      )}
                    </div>
                    <span className={`text-[10px] font-black px-2 py-1 rounded-full ${statusColors[task.status]}`}>
                      {task.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
        {weekDays.every(d => getTasksForDay(d).length === 0) && (
          <p className="text-center text-gray-400 py-12 font-medium">Geen taken deze week</p>
        )}
      </div>

      <BottomNav />
    </div>
  );
};

export default Calendar;
