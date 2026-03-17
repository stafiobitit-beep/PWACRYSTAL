import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Calendar, MessageSquare, User } from 'lucide-react';

const BottomNav: React.FC = () => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 py-3 px-6 flex justify-between items-center z-50 shadow-[0_-4px_10px_rgba(0,0,0,0.02)] pb-safe">
      <NavLink to="/dashboard" className={({ isActive }) => `flex flex-col items-center gap-1 min-w-[64px] py-2 ${isActive ? 'text-primary-600' : 'text-gray-400'}`}>
        <LayoutDashboard className="w-6 h-6" />
        <span className="text-[10px] font-bold">Dashboard</span>
      </NavLink>
      <NavLink to="/calendar" className={({ isActive }) => `flex flex-col items-center gap-1 min-w-[64px] py-2 ${isActive ? 'text-primary-600' : 'text-gray-400'}`}>
        <Calendar className="w-6 h-6" />
        <span className="text-[10px] font-bold">Planning</span>
      </NavLink>
      <NavLink to="/messages" className={({ isActive }) => `flex flex-col items-center gap-1 min-w-[64px] py-2 ${isActive ? 'text-primary-600' : 'text-gray-400'}`}>
        <MessageSquare className="w-6 h-6" />
        <span className="text-[10px] font-bold">Berichten</span>
      </NavLink>
      <NavLink to="/profile" className={({ isActive }) => `flex flex-col items-center gap-1 min-w-[64px] py-2 ${isActive ? 'text-primary-600' : 'text-gray-400'}`}>
        <User className="w-6 h-6" />
        <span className="text-[10px] font-bold">Profiel</span>
      </NavLink>
    </nav>
  );
};

export default BottomNav;
