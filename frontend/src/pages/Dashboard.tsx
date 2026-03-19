import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import client from '../api/client';
import BottomNav from '../components/layout/BottomNav';
import { 
  Plus, 
  Calendar, 
  User, 
  RefreshCw, 
  MessageSquare, 
  ChevronRight, 
  MapPin,
  Clock,
  CheckCircle2,
  AlertCircle,
  PlayCircle
} from 'lucide-react';
import { motion } from 'framer-motion';

const Dashboard: React.FC = () => {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState('ALL');
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const fetchTasks = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    else setRefreshing(true);
    try {
      const { data } = await client.get('/tasks');
      setTasks(data);
    } catch (error) {
      console.error('Error fetching tasks', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchTasks();
    const interval = setInterval(() => fetchTasks(true), 30000);
    return () => clearInterval(interval);
  }, [fetchTasks]);

  const getStats = () => ({
    planned: tasks.filter(t => t.status === 'PLANNED').length,
    in_progress: tasks.filter(t => t.status === 'IN_PROGRESS').length,
    done: tasks.filter(t => t.status === 'DONE').length,
    issue: tasks.filter(t => t.status === 'ISSUE').length,
  });

  const StatsRow = () => {
    const stats = getStats();
    return (
      <div className="grid grid-cols-4 gap-2 mb-6">
        {[
          { label: 'Gepland', count: stats.planned, color: 'bg-blue-50 text-blue-600 border-blue-100' },
          { label: 'Bezig', count: stats.in_progress, color: 'bg-amber-50 text-amber-600 border-amber-100' },
          { label: 'Afgerond', count: stats.done, color: 'bg-green-50 text-green-600 border-green-100' },
          { label: 'Probleem', count: stats.issue, color: 'bg-red-50 text-red-600 border-red-100' },
        ].map(s => (
          <div key={s.label} className={`${s.color} border rounded-2xl p-2 text-center`}>
            <p className="text-[10px] font-black uppercase mb-0.5 opacity-70 leading-tight">{s.label}</p>
            <p className="text-lg font-black">{s.count}</p>
          </div>
        ))}
      </div>
    );
  };

  const MiniTaskCard = ({ task }: { task: any }) => {
    const statusColors: any = {
      PLANNED: 'bg-blue-500',
      IN_PROGRESS: 'bg-amber-500',
      DONE: 'bg-green-500',
      ISSUE: 'bg-red-500'
    };
    
    const latestMsg = task.messages?.[0];

    return (
      <div 
        onClick={() => navigate(`/tasks/${task.id}`)}
        className="bg-white rounded-[24px] shadow-sm border border-gray-50 flex overflow-hidden active:scale-[0.98] transition-all cursor-pointer mb-3"
      >
        <div className={`w-1.5 ${statusColors[task.status] || 'bg-gray-300'} shrink-0`} />
        <div className="p-4 flex-1 min-w-0">
          <div className="flex justify-between items-start mb-2">
            <div className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase flex items-center gap-1 ${
              task.status === 'PLANNED' ? 'bg-blue-50 text-blue-600' :
              task.status === 'IN_PROGRESS' ? 'bg-amber-50 text-amber-600' :
              task.status === 'DONE' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
            }`}>
              {task.status === 'PLANNED' ? <Calendar className="w-2.5 h-2.5" /> :
               task.status === 'IN_PROGRESS' ? <PlayCircle className="w-2.5 h-2.5" /> :
               task.status === 'DONE' ? <CheckCircle2 className="w-2.5 h-2.5" /> : <AlertCircle className="w-2.5 h-2.5" />}
              {task.status}
              <span className="opacity-40 mx-1">|</span>
              {new Date(task.date).toLocaleDateString('nl-BE', { day: '2-digit', month: 'short' })}
            </div>
            <ChevronRight className="w-4 h-4 text-gray-300" />
          </div>
          <h4 className="font-black text-gray-900 truncate mb-1">{task.title}</h4>
          <div className="flex items-center gap-3 text-[11px] text-gray-500 mb-2">
             <span className="flex items-center gap-1 min-w-0"><MapPin className="w-3 h-3 shrink-0" /> <span className="truncate">{task.location?.name}</span></span>
             {task.cleaner && <span className="flex items-center gap-1 shrink-0"><User className="w-3 h-3" /> {task.cleaner.name.split(' ')[0]}</span>}
          </div>
          {latestMsg && (
            <div className="bg-gray-50 rounded-xl p-2 flex items-start gap-2">
              <MessageSquare className="w-3 h-3 text-primary-400 mt-0.5 shrink-0" />
              <p className="text-[10px] text-gray-500 line-clamp-1 italic">
                {latestMsg.content}
              </p>
            </div>
          )}
        </div>
      </div>
    );
  };

  const CleanerDashboard = () => {
    const todayStr = new Date().toISOString().split('T')[0];
    const active = tasks.filter(t => t.status === 'IN_PROGRESS');
    const today = tasks.filter(t => t.status === 'PLANNED' && t.date.split('T')[0] === todayStr);
    const upcoming = tasks.filter(t => t.status === 'PLANNED' && t.date.split('T')[0] > todayStr);

    return (
      <>
        <div className="mb-8">
          <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-4 ml-1">Actief</h3>
          {active.length > 0 ? active.map(t => <MiniTaskCard key={t.id} task={t} />) : <p className="text-xs text-gray-300 font-bold ml-1 italic">Geen lopende taken</p>}
        </div>
        <div className="mb-8">
          <h3 className="text-xs font-black uppercase tracking-widest text-primary-600 mb-4 ml-1">Vandaag</h3>
          {today.length > 0 ? today.map(t => <MiniTaskCard key={t.id} task={t} />) : <p className="text-xs text-gray-300 font-bold ml-1 italic">Geen taken voor vandaag</p>}
        </div>
        <div>
          <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-4 ml-1">Aankomend</h3>
          {upcoming.map(t => <MiniTaskCard key={t.id} task={t} />)}
        </div>
      </>
    );
  };

  const CustomerDashboard = () => {
    const active = tasks.filter(t => ['PLANNED', 'IN_PROGRESS', 'ISSUE'].includes(t.status));
    const done = tasks.filter(t => t.status === 'DONE');

    return (
      <>
        <StatsRow />
        <div className="mb-8">
          <h3 className="text-xs font-black uppercase tracking-widest text-primary-600 mb-4 ml-1">Actieve diensten</h3>
          {active.map(t => <MiniTaskCard key={t.id} task={t} />)}
        </div>
        <div>
          <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-4 ml-1">Afgewerkt</h3>
          {done.map(t => <MiniTaskCard key={t.id} task={t} />)}
        </div>
      </>
    );
  };

  const AdminDashboard = () => {
    const filters = [
      { id: 'ALL', label: 'Alles', count: tasks.length },
      { id: 'PLANNED', label: 'Gepland', count: getStats().planned },
      { id: 'IN_PROGRESS', label: 'Bezig', count: getStats().in_progress },
      { id: 'DONE', label: 'Afgerond', count: getStats().done },
      { id: 'ISSUE', label: 'Problemen', count: getStats().issue },
    ];

    const filtered = activeFilter === 'ALL' ? tasks : tasks.filter(t => t.status === activeFilter);
    const grouped = filtered.reduce((acc: any, t: any) => {
      const loc = t.location?.name || 'Zonder locatie';
      if (!acc[loc]) acc[loc] = [];
      acc[loc].push(t);
      return acc;
    }, {});

    return (
      <>
        <StatsRow />
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-6 -mx-6 px-6">
          {filters.map(f => (
            <button
              key={f.id}
              onClick={() => setActiveFilter(f.id)}
              className={`whitespace-nowrap px-4 py-2 rounded-2xl text-xs font-black transition-all border flex items-center gap-2 ${
                activeFilter === f.id 
                  ? 'bg-primary-600 text-white border-primary-600 shadow-lg shadow-primary-100' 
                  : 'bg-white text-gray-500 border-gray-100'
              }`}
            >
              {f.label}
              <span className={`px-1.5 py-0.5 rounded-md text-[10px] ${activeFilter === f.id ? 'bg-primary-500 text-white' : 'bg-gray-100 text-gray-400'}`}>
                {f.count}
              </span>
            </button>
          ))}
        </div>

        {Object.entries(grouped).map(([loc, locTasks]: [string, any]) => (
          <div key={loc} className="mb-8">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-4 ml-1">{loc}</h3>
            <div className="space-y-1">
              {locTasks.map((t: any) => <MiniTaskCard key={t.id} task={t} />)}
            </div>
          </div>
        ))}
      </>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-32">
      {/* Header */}
      <div className="bg-white px-6 pt-12 pb-8 rounded-b-[40px] shadow-sm mb-6">
        <div className="flex justify-between items-start">
          <div>
             <h1 className="text-2xl font-black text-gray-900">
               {user.role === 'CLEANER' ? `Hallo, ${user.name.split(' ')[0]}!` : 
                user.role === 'CUSTOMER' ? `Welkom, ${user.name.split(' ')[0]}` : 'Beheer Panel'}
             </h1>
             <p className="text-gray-500 font-medium text-sm">
               {user.role === 'CLEANER' ? 'Klaar voor de volgende kuis?' : 
                user.role === 'CUSTOMER' ? 'Uw schoonmaak overzicht' : 'Status van alle projecten'}
             </p>
          </div>
          <button 
            onClick={() => fetchTasks()}
            className={`p-3 bg-gray-50 rounded-2xl text-gray-400 active:rotate-180 transition-all duration-500 ${refreshing ? 'animate-spin' : ''}`}
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="px-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 opacity-20">
            <RefreshCw className="w-12 h-12 animate-spin mb-4" />
            <p className="font-black uppercase tracking-widest text-xs">Synchroniseren...</p>
          </div>
        ) : (
          user.role === 'ADMIN' ? <AdminDashboard /> :
          user.role === 'CUSTOMER' ? <CustomerDashboard /> :
          <CleanerDashboard />
        )}
      </div>

      {user.role === 'ADMIN' && (
        <button 
          onClick={() => navigate('/create-task')}
          className="fixed bottom-28 right-6 bg-primary-600 text-white p-5 rounded-3xl shadow-2xl shadow-primary-200 active:scale-90 transition-all z-40 border-4 border-white"
        >
          <Plus className="w-8 h-8" />
        </button>
      )}

      <BottomNav />
    </div>
  );
};

export default Dashboard;
