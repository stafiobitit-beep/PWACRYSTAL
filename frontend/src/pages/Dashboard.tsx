import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import client from '../api/client';
import BottomNav from '../components/layout/BottomNav';
import TaskCard from '../components/tasks/TaskCard';
import { Skeleton, TaskCardSkeleton } from '../components/common/Skeleton';
import EmptyState from '../components/common/EmptyState';
import { Filter, Plus, Calendar, User } from 'lucide-react';

const Dashboard: React.FC = () => {
  const [tasks, setTasks] = useState<any[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [activeFilter, setActiveFilter] = useState('ALL');
  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      navigate('/login');
      return;
    }
    setUser(JSON.parse(storedUser));

    const fetchTasks = async () => {
      try {
        const { data } = await client.get('/tasks');
        setTasks(data);
        setFilteredTasks(data);
      } catch (error) {
        console.error('Error fetching tasks', error);
      } finally {
        setTimeout(() => setLoading(false), 800); // Simulate smooth feel
      }
    };
    fetchTasks();
  }, [navigate]);

  useEffect(() => {
    if (activeFilter === 'ALL') {
      setFilteredTasks(tasks);
    } else {
      setFilteredTasks(tasks.filter(t => t.status === activeFilter));
    }
  }, [activeFilter, tasks]);

  if (loading) return (
    <div className="min-h-screen bg-gray-50 p-6 pt-12">
      <Skeleton className="h-8 w-48 mb-8" />
      <TaskCardSkeleton />
      <TaskCardSkeleton />
      <TaskCardSkeleton />
      <BottomNav />
    </div>
  );

  const filters = [
    { id: 'ALL', label: 'Alles' },
    { id: 'PLANNED', label: 'Gepland' },
    { id: 'IN_PROGRESS', label: 'Bezig' },
    { id: 'DONE', label: 'Afgerond' },
    { id: 'ISSUE', label: 'Probleem' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-white px-6 pt-12 pb-6 rounded-b-[40px] shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-black text-gray-900">Hallo, {(user?.name || 'Vriend').split(' ')[0]}!</h1>
            <p className="text-gray-500 font-medium">Je hebt {tasks.length} taken vandaag</p>
          </div>
          <div className="w-12 h-12 bg-primary-100 rounded-2xl flex items-center justify-center">
            <User className="text-primary-600 w-6 h-6" />
          </div>
        </div>
        
        {/* Horizontal Filter Scroll */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2 -mx-2 px-2">
          {filters.map(f => (
            <button
              key={f.id}
              onClick={() => setActiveFilter(f.id)}
              className={`whitespace-nowrap px-5 py-2.5 rounded-2xl text-sm font-bold transition-all border ${
                activeFilter === f.id 
                  ? 'bg-primary-600 text-white border-primary-600 shadow-lg shadow-primary-100' 
                  : 'bg-gray-50 text-gray-500 border-transparent active:bg-gray-100'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Task List */}
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-900">Mijn Taken</h2>
        </div>
        
        {filteredTasks.length === 0 ? (
          <EmptyState 
            title="Geen taken gevonden" 
            message={activeFilter === 'ALL' ? "Je hebt momenteel geen toegewezen taken." : "Geen taken met deze status."} 
          />
        ) : (
          filteredTasks.map(task => (
            <TaskCard key={task.id} task={task} />
          ))
        )}
      </div>

      {/* FAB for Admin/Manager */}
      {user?.role === 'ADMIN' && (
        <button className="fixed bottom-28 right-6 bg-primary-600 text-white p-5 rounded-full shadow-xl shadow-primary-200 active:scale-90 transition-all z-40">
          <Plus className="w-8 h-8" />
        </button>
      )}

      <BottomNav />
    </div>
  );
};

export default Dashboard;
