import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import client from '../api/client';
import { toast } from 'react-hot-toast';
import { ArrowLeft, Plus, Trash2, User, Mail, Lock, X, Link, MapPin } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Skeleton } from '../components/common/Skeleton';

interface Customer {
  id: string;
  name: string;
  email: string;
  odooPartnerId: number | null;
  locations: { id: string; name: string; address: string; odooProjectId: number | null }[];
}

interface Location {
  id: string;
  name: string;
  address: string;
  customerId?: string;
}

const Customers: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkingCustomer, setLinkingCustomer] = useState<Customer | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [selectedLocationId, setSelectedLocationId] = useState('');
  const navigate = useNavigate();

  const fetchData = async () => {
    try {
      const [cRes, lRes] = await Promise.all([
        client.get('/api/customers'),
        client.get('/api/locations'),
      ]);
      setCustomers(cRes.data);
      setLocations(lRes.data);
    } catch {
      toast.error('Fout bij laden');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || form.password.length < 6) {
      toast.error('Vul alle velden in (wachtwoord min 6 tekens)');
      return;
    }
    setSubmitting(true);
    try {
      const { data } = await client.post('/api/customers', form);
      setCustomers(prev => [...prev, { ...data, locations: [] }]);
      toast.success('Klant aangemaakt');
      setShowModal(false);
      setForm({ name: '', email: '', password: '' });
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Aanmaken mislukt');
    } finally {
      setSubmitting(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Klant verwijderen?')) return;
    try {
      await client.delete(`/api/customers/${id}`);
      setCustomers(prev => prev.filter(c => c.id !== id));
      toast.success('Klant verwijderd');
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Verwijderen mislukt');
    }
  };

  const openLinkModal = (customer: Customer) => {
    setLinkingCustomer(customer);
    setSelectedLocationId('');
    setShowLinkModal(true);
  };

  const handleLink = async () => {
    if (!linkingCustomer || !selectedLocationId) return;
    setSubmitting(true);
    try {
      await client.post(`/api/customers/${linkingCustomer.id}/locations`, {
        locationId: selectedLocationId
      });
      toast.success('Project gekoppeld!');
      setShowLinkModal(false);
      fetchData(); // refresh to show updated links
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Koppelen mislukt');
    } finally {
      setSubmitting(false);
    }
  };

  // Locations not yet linked to any customer (or linked to this customer)
  const availableLocations = locations.filter(l => !l.customerId || l.customerId === linkingCustomer?.id);

  return (
    <div className="min-h-screen bg-gray-50 pb-32">
      {/* Header */}
      <div className="bg-white px-6 pt-12 pb-5 flex items-center gap-4 shadow-sm relative z-10 transition-all">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-gray-500 active:bg-gray-100 rounded-full transition-all">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div>
          <h1 className="text-xl font-black text-gray-900">Klanten beheren</h1>
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">Projecten koppelen</p>
        </div>
      </div>

      <div className="p-6 space-y-4">
        {loading ? (
          [1,2,3].map(i => (
            <div key={i} className="bg-white rounded-[24px] p-5 border border-gray-50 shadow-sm animate-pulse">
              <div className="flex items-center gap-4 mb-4">
                <Skeleton className="w-12 h-12 rounded-2xl" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-48" />
                </div>
              </div>
            </div>
          ))
        ) : customers.length === 0 ? (
          <div className="py-20 text-center">
            <User className="w-16 h-16 text-gray-200 mx-auto mb-4" />
            <p className="text-gray-400 font-bold">Geen klanten gevonden</p>
          </div>
        ) : (
          customers.map(customer => (
            <div key={customer.id} className="bg-white rounded-[24px] border border-gray-50 shadow-sm overflow-hidden animate-fade-in transition-all">
              <div className="p-5 flex items-center gap-4">
                <div className="w-12 h-12 bg-green-50 rounded-2xl flex items-center justify-center shrink-0">
                  <User className="text-green-600 w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-black text-gray-900 truncate">{customer.name}</p>
                  <p className="text-xs text-gray-500 font-medium truncate">{customer.email}</p>
                  {customer.odooPartnerId && (
                    <p className="text-[9px] text-primary-500 font-black uppercase mt-1">Odoo partner #{customer.odooPartnerId}</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => openLinkModal(customer)}
                    className="p-3 bg-primary-50 text-primary-600 rounded-2xl active:bg-primary-100 transition-all"
                    title="Koppel aan project"
                  >
                    <Link className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleDelete(customer.id)}
                    className="p-3 bg-red-50 text-red-500 rounded-2xl active:bg-red-100 transition-all"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Linked locations */}
              {customer.locations.length > 0 && (
                <div className="bg-gray-50/50 px-5 py-4 space-y-2">
                   <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-1">Gekoppelde projecten</p>
                  {customer.locations.map(loc => (
                    <div key={loc.id} className="flex items-center gap-2 text-xs text-gray-600">
                      <MapPin className="w-3 h-3 text-primary-400 shrink-0" />
                      <span className="font-bold text-gray-800">{loc.name}</span>
                      {loc.odooProjectId && (
                        <span className="ml-auto text-[9px] text-primary-400 font-black shrink-0">
                          OD-{loc.odooProjectId}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {customer.locations.length === 0 && (
                <div className="bg-gray-50/50 px-5 py-4">
                  <p className="text-xs text-gray-300 italic">Geen projecten gekoppeld</p>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* FAB */}
      <button
        onClick={() => setShowModal(true)}
        className="fixed bottom-10 right-6 bg-primary-600 text-white p-5 rounded-full shadow-xl shadow-primary-200 active:scale-90 transition-all z-40"
      >
        <Plus className="w-8 h-8" />
      </button>

      {/* Create customer modal */}
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
                <h2 className="text-xl font-black text-gray-900">Klant toevoegen</h2>
                <button 
                   onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-gray-100 rounded-xl text-gray-500 font-black text-xs uppercase tracking-widest active:bg-gray-200 transition-all"
                >
                  SLUIT
                </button>
              </div>

              <form onSubmit={handleCreate} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-gray-400 ml-1">Naam</label>
                  <div className="flex items-center gap-3 bg-gray-50 p-4 rounded-2xl border-2 border-transparent focus-within:border-primary-100 focus-within:bg-white transition-all">
                    <User className="text-gray-400 w-5 h-5 shrink-0" />
                    <input type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="Bedrijfsnaam of klant" className="bg-transparent border-none p-0 focus:ring-0 text-sm font-bold w-full outline-none" required />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-gray-400 ml-1">E-mail</label>
                  <div className="flex items-center gap-3 bg-gray-50 p-4 rounded-2xl border-2 border-transparent focus-within:border-primary-100 focus-within:bg-white transition-all">
                    <Mail className="text-gray-400 w-5 h-5 shrink-0" />
                    <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} placeholder="klant@bedrijf.be" className="bg-transparent border-none p-0 focus:ring-0 text-sm font-bold w-full outline-none" required />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-gray-400 ml-1">Wachtwoord</label>
                  <div className="flex items-center gap-3 bg-gray-50 p-4 rounded-2xl border-2 border-transparent focus-within:border-primary-100 focus-within:bg-white transition-all">
                    <Lock className="text-gray-400 w-5 h-5 shrink-0" />
                    <input type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} placeholder="Min. 6 tekens" className="bg-transparent border-none p-0 focus:ring-0 text-sm font-bold w-full outline-none" required minLength={6} />
                  </div>
                </div>

                <div className="bg-primary-50 rounded-2xl p-4 border border-primary-100">
                  <p className="text-xs text-primary-700 font-bold leading-relaxed">
                    💡 Na aanmaken koppel je de klant aan een project via de 🔗 knop.
                  </p>
                </div>

                <button type="submit" disabled={submitting} className="w-full bg-primary-600 text-white py-5 rounded-2xl font-black text-sm shadow-xl shadow-primary-100 active:scale-95 transition-all disabled:opacity-50">
                  {submitting ? 'BEZIG...' : 'KLANT AANMAKEN'}
                </button>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Link location modal */}
      <AnimatePresence>
        {showLinkModal && linkingCustomer && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowLinkModal(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            />
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed bottom-0 left-0 right-0 bg-white rounded-t-[32px] p-6 z-50 shadow-2xl max-h-[85vh] overflow-y-auto no-scrollbar"
            >
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-xl font-black text-gray-900">Project koppelen</h2>
                  <p className="text-sm text-gray-500 font-medium">aan {linkingCustomer.name}</p>
                </div>
                <button onClick={() => setShowLinkModal(false)} className="p-2 text-gray-400"><X className="w-6 h-6" /></button>
              </div>

              {availableLocations.length === 0 ? (
                <div className="py-12 text-center">
                  <p className="text-gray-400 text-sm font-bold">Geen beschikbare projecten</p>
                </div>
              ) : (
                <div className="space-y-2 mb-6">
                  {availableLocations.map(loc => (
                    <div
                      key={loc.id}
                      onClick={() => setSelectedLocationId(loc.id)}
                      className={`p-5 rounded-2xl border-2 cursor-pointer transition-all ${
                        selectedLocationId === loc.id
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-gray-100 bg-gray-50'
                      }`}
                    >
                      <p className="font-black text-gray-900">{loc.name}</p>
                      {loc.address && <p className="text-xs text-gray-500 truncate mt-1">{loc.address}</p>}
                    </div>
                  ))}
                </div>
              )}

              <button
                onClick={handleLink}
                disabled={submitting || !selectedLocationId}
                className="w-full bg-primary-600 text-white py-5 rounded-2xl font-black shadow-xl shadow-primary-100 active:scale-95 transition-all disabled:opacity-50"
              >
                {submitting ? 'BEZIG...' : 'PROJECT KOPPELEN'}
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Customers;
