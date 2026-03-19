import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import client from '../api/client';
import { toast } from 'react-hot-toast';
import { ArrowLeft, Plus, Trash2, X, User, Mail, Lock, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Skeleton } from '../components/common/Skeleton';

interface Cleaner {
  id: string;
  name: string;
  email: string;
}

const Cleaners: React.FC = () => {
  const [cleaners, setCleaners] = useState<Cleaner[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '' });

  // Odoo Import State
  const [showOdooModal, setShowOdooModal] = useState(false);
  const [odooUsers, setOdooUsers] = useState<any[]>([]);
  const [loadingOdoo, setLoadingOdoo] = useState(false);
  const [selectedOdooUser, setSelectedOdooUser] = useState<any>(null);
  const [importPassword, setImportPassword] = useState('');
  const [importing, setImporting] = useState(false);

  const navigate = useNavigate();

  const fetchCleaners = async () => {
    try {
      const { data } = await client.get('/users/cleaners');
      setCleaners(data);
    } catch (error) {
      toast.error('Fout bij ophalen kuisers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCleaners();
  }, []);

  const fetchOdooUsers = async () => {
    setLoadingOdoo(true);
    try {
      const { data } = await client.get('/api/odoo/users');
      // Filter out users already in our system
      const existingEmails = new Set(cleaners.map(c => c.email));
      setOdooUsers(data.filter((u: any) => !existingEmails.has(u.login)));
    } catch (e: any) {
      toast.error('Odoo niet bereikbaar');
    } finally {
      setLoadingOdoo(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || form.password.length < 6) {
      toast.error('Vul alle velden in (wachtwoord min. 6 tekens)');
      return;
    }

    setSubmitting(true);
    try {
      const { data } = await client.post('/users/cleaners', form);
      setCleaners(prev => [...prev, data]);
      toast.success('Kuiser aangemaakt');
      setShowModal(false);
      setForm({ name: '', email: '', password: '' });
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Aanmaken mislukt');
    } finally {
      setSubmitting(false);
    }
  };

  const handleImport = async () => {
    if (!selectedOdooUser || importPassword.length < 6) {
      toast.error('Selecteer een gebruiker en geef een wachtwoord in (min 6 tekens)');
      return;
    }
    setImporting(true);
    try {
      const { data } = await client.post('/api/odoo/users/import', {
        odooUserId: selectedOdooUser.id,
        name: selectedOdooUser.name,
        email: selectedOdooUser.login,
        password: importPassword,
      });
      setCleaners(prev => [...prev, data]);
      toast.success(`${data.name} geïmporteerd als kuiser`);
      setShowOdooModal(false);
      setSelectedOdooUser(null);
      setImportPassword('');
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Importeren mislukt');
    } finally {
      setImporting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Weet je zeker dat je deze kuiser wilt verwijderen?')) return;

    try {
      await client.delete(`/users/${id}`);
      setCleaners(prev => prev.filter(c => c.id !== id));
      toast.success('Kuiser verwijderd');
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Verwijderen mislukt');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-32 overflow-x-hidden">
      {/* Header */}
      <div className="bg-white px-6 pt-12 pb-6 flex items-center gap-4 shadow-sm relative z-10 transition-all">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-gray-500 active:bg-gray-100 rounded-full transition-all">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-xl font-black text-gray-900">Kuisers beheren</h1>
      </div>

      <div className="p-6 space-y-4">
        {loading ? (
          // Skeleton loading
          [1, 2, 3].map(i => (
            <div key={i} className="bg-white rounded-[24px] p-4 shadow-sm border border-gray-50 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Skeleton className="w-12 h-12 rounded-2xl" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-48" />
                </div>
              </div>
            </div>
          ))
        ) : cleaners.length === 0 ? (
          <div className="py-20 text-center">
            <User className="w-16 h-16 text-gray-200 mx-auto mb-4" />
            <p className="text-gray-400 font-bold">Geen kuisers gevonden</p>
          </div>
        ) : (
          cleaners.map(cleaner => (
            <div key={cleaner.id} className="bg-white rounded-[24px] p-4 shadow-sm border border-gray-50 flex items-center justify-between animate-fade-in transition-all active:scale-[0.98]">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-primary-50 rounded-2xl flex items-center justify-center">
                  <User className="text-primary-600 w-6 h-6" />
                </div>
                <div>
                  <p className="font-black text-gray-900">{cleaner.name}</p>
                  <p className="text-xs text-gray-500 font-medium">{cleaner.email}</p>
                </div>
              </div>
              <button 
                onClick={() => handleDelete(cleaner.id)}
                className="p-3 bg-red-50 text-red-500 rounded-2xl active:bg-red-100 transition-all"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          ))
        )}
      </div>

      {/* FABs */}
      <div className="fixed bottom-10 right-6 flex flex-col gap-4 z-40">
        <button 
          onClick={() => { setShowOdooModal(true); fetchOdooUsers(); }}
          className="bg-white border-2 border-primary-600 text-primary-600 p-4 rounded-full shadow-lg active:scale-90 transition-all"
          title="Importeer uit Odoo"
        >
          <RefreshCw className="w-6 h-6" />
        </button>

        <button 
          onClick={() => setShowModal(true)}
          className="bg-primary-600 text-white p-5 rounded-full shadow-xl shadow-primary-200 active:scale-90 transition-all"
        >
          <Plus className="w-8 h-8" />
        </button>
      </div>

      {/* Modal Sheet - Create */}
      <AnimatePresence>
        {showModal && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowModal(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            />
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed bottom-0 left-0 right-0 bg-white rounded-t-[32px] p-6 z-50 shadow-2xl max-h-[85vh] overflow-y-auto no-scrollbar"
            >
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-xl font-black text-gray-900">Kuiser toevoegen</h2>
                <button 
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-gray-100 rounded-xl text-gray-500 font-black text-xs uppercase tracking-widest active:bg-gray-200 transition-all"
                >
                  SLUIT
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-gray-400 ml-1">Naam</label>
                  <div className="flex items-center gap-3 bg-gray-50 p-4 rounded-2xl border-2 border-transparent focus-within:border-primary-100 focus-within:bg-white transition-all">
                    <User className="text-gray-400 w-5 h-5" />
                    <input 
                      type="text" 
                      value={form.name}
                      onChange={e => setForm({...form, name: e.target.value})}
                      placeholder="Volledige naam"
                      className="bg-transparent border-none p-0 focus:ring-0 text-sm font-bold w-full outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-gray-400 ml-1">E-mail</label>
                  <div className="flex items-center gap-3 bg-gray-50 p-4 rounded-2xl border-2 border-transparent focus-within:border-primary-100 focus-within:bg-white transition-all">
                    <Mail className="text-gray-400 w-5 h-5" />
                    <input 
                      type="email" 
                      value={form.email}
                      onChange={e => setForm({...form, email: e.target.value})}
                      placeholder="bijv: kuis@crystalclear.be"
                      className="bg-transparent border-none p-0 focus:ring-0 text-sm font-bold w-full outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-gray-400 ml-1">Wachtwoord</label>
                  <div className="flex items-center gap-3 bg-gray-50 p-4 rounded-2xl border-2 border-transparent focus-within:border-primary-100 focus-within:bg-white transition-all">
                    <Lock className="text-gray-400 w-5 h-5" />
                    <input 
                      type="password" 
                      value={form.password}
                      onChange={e => setForm({...form, password: e.target.value})}
                      placeholder="Minimaal 6 tekens"
                      className="bg-transparent border-none p-0 focus:ring-0 text-sm font-bold w-full outline-none"
                    />
                  </div>
                </div>

                <button 
                  type="submit" 
                  disabled={submitting}
                  className="w-full bg-primary-600 text-white py-5 rounded-2xl font-black text-sm shadow-xl shadow-primary-100 active:scale-95 transition-all disabled:opacity-50 mt-4"
                >
                  {submitting ? 'BEZIG...' : 'KUISER AANMAKEN'}
                </button>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Modal - Odoo Import */}
      <AnimatePresence>
        {showOdooModal && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowOdooModal(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            />
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed bottom-0 left-0 right-0 bg-white rounded-t-[32px] p-6 z-50 shadow-2xl max-h-[85vh] overflow-y-auto no-scrollbar"
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-black text-gray-900">Importeer uit Odoo</h2>
                <button onClick={() => setShowOdooModal(false)} className="p-2 text-gray-400"><X className="w-5 h-5" /></button>
              </div>
              <p className="text-sm text-gray-500 mb-6 font-medium">Selecteer een Odoo gebruiker en stel een app-wachtwoord in.</p>

              {loadingOdoo && <p className="text-center text-gray-400 py-8 font-black uppercase tracking-widest text-xs">Odoo gebruikers laden...</p>}

              {!loadingOdoo && odooUsers.length === 0 && (
                <p className="text-center text-gray-400 py-8 italic text-sm">Geen nieuwe Odoo gebruikers gevonden</p>
              )}

              <div className="space-y-2 mb-6">
                {odooUsers.map(u => (
                  <div
                    key={u.id}
                    onClick={() => setSelectedOdooUser(u)}
                    className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                      selectedOdooUser?.id === u.id
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-gray-100 bg-gray-50'
                    }`}
                  >
                    <p className="font-black text-gray-900">{u.name}</p>
                    <p className="text-xs text-gray-500 font-medium">{u.login}</p>
                  </div>
                ))}
              </div>

              {selectedOdooUser && (
                <div className="mb-6 space-y-2 scale-in">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1 block">App wachtwoord voor {selectedOdooUser.name}</label>
                  <div className="flex items-center gap-3 bg-gray-50 rounded-2xl px-4 py-4 border-2 border-transparent focus-within:border-primary-100 focus-within:bg-white transition-all">
                    <Lock className="text-gray-400 w-5 h-5 shrink-0" />
                    <input
                      type="password"
                      value={importPassword}
                      onChange={e => setImportPassword(e.target.value)}
                      placeholder="Min. 6 tekens"
                      className="bg-transparent border-none p-0 focus:ring-0 text-sm font-bold w-full outline-none"
                    />
                  </div>
                </div>
              )}

              <button
                onClick={handleImport}
                disabled={importing || !selectedOdooUser || importPassword.length < 6}
                className="w-full bg-primary-600 text-white py-5 rounded-2xl font-black text-sm shadow-xl shadow-primary-100 active:scale-95 transition-all disabled:opacity-50"
              >
                {importing ? 'BEZIG...' : 'KUISER IMPORTEREN'}
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Cleaners;
