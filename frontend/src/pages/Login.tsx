import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import client from '../api/client';
import { toast } from 'react-hot-toast';
import { LogIn } from 'lucide-react';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await client.post('/auth/login', { email, password });
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      toast.success('Welkom!');
      navigate('/dashboard');
    } catch (error) {
      toast.error('Ongeldige inloggegevens');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-primary-50">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl p-8">
        <div className="flex justify-center mb-8">
          <div className="bg-primary-600 p-4 rounded-2xl shadow-lg">
            <LogIn className="w-8 h-8 text-white" />
          </div>
        </div>
        <h1 className="text-3xl font-bold text-center text-gray-900 mb-2">Crystal Clear</h1>
        <p className="text-center text-gray-500 mb-8 font-medium">Log in om uw taken te bekijken</p>
        
        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">E-mail</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-4 rounded-2xl bg-gray-50 border-transparent focus:bg-white focus:ring-4 focus:ring-primary-100 transition-all text-lg"
              placeholder="e-mail@voorbeeld.com"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Wachtwoord</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-4 rounded-2xl bg-gray-50 border-transparent focus:bg-white focus:ring-4 focus:ring-primary-100 transition-all text-lg"
              placeholder="••••••••"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-primary-600 text-white rounded-2xl text-xl font-bold shadow-lg shadow-primary-200 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
          >
            {loading ? 'Bezig met inloggen...' : 'Log in'}
          </button>
        </form>
        
        <div className="mt-8 pt-8 border-t border-gray-100 text-center">
          <p className="text-sm text-gray-400">Phase 1 MVP - Demo Data Enabled</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
