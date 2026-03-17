import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, MapPin, Clock, ChevronRight } from 'lucide-react';

interface TaskCardProps {
  task: any;
}

const TaskCard: React.FC<TaskCardProps> = ({ task }) => {
  const navigate = useNavigate();
  
  const statusColors: any = {
    PLANNED: 'bg-blue-50 text-blue-600 border-blue-100',
    IN_PROGRESS: 'bg-yellow-50 text-yellow-600 border-yellow-100',
    DONE: 'bg-green-50 text-green-600 border-green-100',
    ISSUE: 'bg-red-50 text-red-600 border-red-100',
  };

  const statusLabels: any = {
    PLANNED: 'Gepland',
    IN_PROGRESS: 'Bezig',
    DONE: 'Afgerond',
    ISSUE: 'Probleem',
  };

  return (
    <div 
      onClick={() => navigate(`/tasks/${task.id}`)}
      className="bg-white rounded-3xl p-5 mb-4 shadow-sm border border-gray-50 active:scale-[0.98] transition-all cursor-pointer flex items-center justify-between"
    >
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-2">
          <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase border ${statusColors[task.status]}`}>
            {statusLabels[task.status]}
          </span>
          <span className="text-gray-400 text-xs font-medium flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {new Date(task.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
        <h3 className="text-lg font-bold text-gray-900 mb-1">{task.title}</h3>
        <p className="text-gray-500 text-sm flex items-center gap-1">
          <MapPin className="w-3 h-3" />
          {task.location?.name}
        </p>
      </div>
      <ChevronRight className="text-gray-300 w-6 h-6" />
    </div>
  );
};

export default TaskCard;
