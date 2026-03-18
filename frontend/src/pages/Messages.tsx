import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import client from '../api/client';
import BottomNav from '../components/layout/BottomNav';
import { MessageSquare, ChevronRight, MapPin, User } from 'lucide-react';

const Messages: React.FC = () => {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data } = await client.get('/tasks');
        // Sort by last message timestamp, tasks with messages first
        const sorted = [...data].sort((a, b) => {
          const aLast = a.messages?.[a.messages.length - 1]?.timestamp || a.createdAt;
          const bLast = b.messages?.[b.messages.length - 1]?.timestamp || b.createdAt;
          return new Date(bLast).getTime() - new Date(aLast).getTime();
        });
        setTasks(sorted);
      } catch (e) {}
      finally { setLoading(false); }
    };
    fetch();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="bg-white px-6 pt-12 pb-6 rounded-b-[40px] shadow-sm">
        <h1 className="text-2xl font-black text-gray-900">Berichten</h1>
        <p className="text-gray-500 font-medium">Gesprekken per taak</p>
      </div>

      <div className="p-4 space-y-3 mt-4">
        {loading && <p className="text-center text-gray-400 py-12">Laden...</p>}
        {!loading && tasks.length === 0 && (
          <p className="text-center text-gray-400 py-12 font-medium">Geen gesprekken gevonden</p>
        )}
        {tasks.map(task => {
          const lastMsg = task.messages?.[task.messages.length - 1];
          const unread = false; // future: implement unread count
          return (
            <div
              key={task.id}
              onClick={() => navigate(`/tasks/${task.id}`, { state: { tab: 'CHAT' } })}
              className="bg-white rounded-[24px] p-4 shadow-sm border border-gray-50 flex items-center gap-4 active:scale-[0.98] transition-all cursor-pointer"
            >
              <div className="w-12 h-12 bg-primary-100 rounded-2xl flex items-center justify-center shrink-0">
                <MessageSquare className="text-primary-600 w-6 h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start mb-1">
                  <p className="font-black text-gray-900 truncate pr-2">{task.title}</p>
                  {lastMsg && (
                    <p className="text-[10px] text-gray-400 font-medium shrink-0">
                      {new Date(lastMsg.timestamp).toLocaleTimeString('nl-BE', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  )}
                </div>
                <p className="text-xs text-gray-500 font-medium flex items-center gap-1 mb-1">
                  <MapPin className="w-3 h-3" />{task.location?.name}
                </p>
                {lastMsg ? (
                  <p className="text-sm text-gray-400 truncate font-medium">
                    <span className="font-bold text-gray-600">{lastMsg.sender?.name || 'Onbekend'}: </span>
                    {lastMsg.content}
                  </p>
                ) : (
                  <p className="text-sm text-gray-300 italic">Nog geen berichten</p>
                )}
              </div>
              <ChevronRight className="text-gray-300 w-5 h-5 shrink-0" />
            </div>
          );
        })}
      </div>

      <BottomNav />
    </div>
  );
};

export default Messages;
