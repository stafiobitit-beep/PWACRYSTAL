import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/layout/BottomNav';
import { User, LogOut, Settings as SettingsIcon, ShieldCheck, Users } from 'lucide-react';
import { toast } from 'react-hot-toast';

const Profile: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    toast.success('Uitgelogd');
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="bg-white px-6 pt-12 pb-12 rounded-b-[40px] shadow-sm flex flex-col items-center">
        <div className="w-24 h-24 bg-primary-100 rounded-[32px] flex items-center justify-center mb-4">
          <User className="text-primary-600 w-12 h-12" />
        </div>
        <h1 className="text-2xl font-black text-gray-900">{user?.name}</h1>
        <div className="flex items-center gap-1 text-primary-600 font-bold text-sm bg-primary-50 px-3 py-1 rounded-full mt-2">
          <ShieldCheck className="w-4 h-4" />
          {user?.role}
        </div>
      </div>

      <div className="p-6 space-y-4">
        {user?.role === 'ADMIN' && (
          <>
            <button
              onClick={() => navigate('/cleaners')}
              className="w-full bg-white p-6 rounded-[32px] shadow-sm flex items-center justify-between group active:bg-gray-50 transition-all border border-transparent active:border-primary-100"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center group-active:bg-primary-100 transition-colors">
                  <Users className="text-gray-500 group-active:text-primary-600" />
                </div>
                <div className="text-left">
                  <p className="font-bold text-gray-900">Kuisers beheren</p>
                  <p className="text-xs font-medium text-gray-500">Accounts aanmaken & verwijderen</p>
                </div>
              </div>
            </button>

            <button
              onClick={() => navigate('/customers')}
              className="w-full bg-white p-6 rounded-[32px] shadow-sm flex items-center justify-between group active:bg-gray-50 transition-all border border-transparent active:border-primary-100"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center group-active:bg-primary-100 transition-colors">
                  <User className="text-gray-500 group-active:text-primary-600" />
                </div>
                <div className="text-left">
                  <p className="font-bold text-gray-900">Klanten beheren</p>
                  <p className="text-xs font-medium text-gray-500">Aanmaken en koppelen aan projecten</p>
                </div>
              </div>
            </button>

            <button 
              onClick={() => navigate('/settings')}
              className="w-full bg-white p-6 rounded-[32px] shadow-sm flex items-center justify-between group active:bg-gray-50 transition-all border border-transparent active:border-primary-100"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center group-active:bg-primary-100 transition-colors">
                  <SettingsIcon className="text-gray-500 group-active:text-primary-600" />
                </div>
                <div className="text-left">
                  <p className="font-bold text-gray-900">App Settings</p>
                  <p className="text-xs font-medium text-gray-500">Configureer Odoo connectie</p>
                </div>
              </div>
            </button>
          </>
        )}

        <button 
          onClick={handleLogout}
          className="w-full bg-white p-6 rounded-[32px] shadow-sm flex items-center justify-between group active:bg-red-50 transition-all border border-transparent active:border-red-100"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center group-active:bg-red-100 transition-colors">
              <LogOut className="text-red-500" />
            </div>
            <div className="text-left">
              <p className="font-bold text-red-500">Uitloggen</p>
              <p className="text-xs font-medium text-gray-500">Sessie beëindigen</p>
            </div>
          </div>
        </button>
      </div>

      <BottomNav />
    </div>
  );
};

export default Profile;
