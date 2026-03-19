import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import client from '../api/client';
import { toast } from 'react-hot-toast';
import { ArrowLeft, Plus, Trash2, User, Mail, Lock, X, Link, MapPin } from 'lucide-react';

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
  customer?: { name: string };
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
        client.get('/customers'),
        client.get('/locations'),
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
      const { data } = await client.post('/customers', form);
      setCustomers(prev => [...prev, { ...data, locations: [] }]);
      toast.success('Klant aangemaakt');
      setShowModal(false);
      setForm({ name: '', email: '', password: '' });
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Aanmaken mislukt');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Klant "${name}" verwijderen?`)) return;
    try {
      await client.delete(`/customers/${id}`);
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
      await client.post(`/customers/${linkingCustomer.id}/locations`, { locationId: selectedLocationId });
      toast.success('Project gekoppeld!');
      setShowLinkModal(false);
      fetchData();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Koppelen mislukt');
    } finally {
      setSubmitting(false);
    }
  };

  const availableLocations = locations.filter(l => !l.customer || l.customer.name === linkingCustomer?.name);

  return (
    <div className="min-h-screen bg-gray-50 pb-32">
      <div className="bg-white px-6 pt-12 pb-5 flex items-center gap-3 shadow-sm">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-gray-500 active:bg-gray-100 rounded-xl">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl font-black text-gray-900">Klanten beheren</h1>
          <p className="text-xs text-gray-400 mt-0.5">Aanmaken en koppelen aan Odoo projecten</p>
        </div>
      </div>

      <div className="p-5 space-y-4">
        {loading ? (
          [1, 2, 3].map(i => (
            <div key={i} className="bg-white rounded-2xl p-4 border border-gray-100 animate-pulse">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 bg-gray-100 rounded-xl" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-100 rounded w-32" />
                  <div className="h-3 bg-gray-100 rounded w-48" />
                </div>
              </div>
            </div>
          ))
        ) : customers.length === 0 ? (
          <div className="py-20 text-center">
            <User className="w-14 h-14 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400 font-medium">Geen klanten gevonden</p>
            <p className="text-gray-300 text-sm mt-1">Gebruik de + knop om een klant aan te maken</p>
          </div>
        ) : (
          customers.map(customer => (
            <div key={customer.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="p-4 flex items-center gap-3">
                <div className="w-11 h-11 bg-green-50 rounded-xl flex items-center justify-center shrink-0">
                  <User className="text-green-600 w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-black text-gray-900">{customer.name}</p>
                  <p className="text-xs text-gray-500">{customer.email}</p>
                  {customer.odooPartnerId && (
                    <p className="text-[10px] text-blue-400 font-bold mt-0.5">Odoo partner #{customer.odooPartnerId}</p>
                  )}
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => openLinkModal(customer)}
                    className="p-2.5 bg-blue-50 text-blue-600 rounded-xl active:bg-blue-100 transition-all"
                    title="Koppel aan project"
                  >
                    <Link className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(customer.id, customer.name)}
                    className="p-2.5 bg-red-50 text-red-500 rounded-xl active:bg-red-100 transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              {customer.locations.length > 0 ? (
                <div className="border-t border-gray-50 px-4 py-3 space-y-2">
                  {customer.locations.map(loc => (
                    <div key={loc.id} className="flex items-center gap-2 text-xs">
                      <MapPin className="w-3 h-3 text-blue-400 shrink-0" />
                      <span className="font-bold text-gray-700">{loc.name}</span>
                      {loc.address && <span className="text-gray-400 truncate">{loc.address}</span>}
                      {loc.odooProjectId && (
                        <span className="ml-auto text-[10px] bg-blue-50 text-blue-500 font-bold px-1.5 py-0.5 rounded shrink-0">
                          Odoo #{loc.odooProjectId}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="border-t border-gray-50 px-4 py-2.5">
                  <p className="text-xs text-gray-300 italic">Koppel een project via de 🔗 knop</p>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      <button
        onClick={() => setShowModal(true)}
        className="fixed bottom-10 right-6 bg-blue-600 text-white p-4 rounded-full shadow-xl shadow-blue-200 active:scale-90 transition-all z-40"
      >
        <Plus className="w-6 h-6" />
      </button>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-end">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative w-full bg-white rounded-t-3xl p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-lg font-black text-gray-900">Klant toevoegen</h2>
              <button onClick={() => setShowModal(false)} className="p-2 text-gray-400"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 block">Naam</label>
                <div className="flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-3.5 border-2 border-transparent focus-within:border-blue-200 focus-within:bg-white transition-all">
                  <User className="text-gray-400 w-4 h-4 shrink-0" />
                  <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Bedrijfsnaam of naam klant" className="bg-transparent border-none p-0 focus:ring-0 text-sm font-bold w-full outline-none" required />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 block">E-mail (wordt login)</label>
                <div className="flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-3.5 border-2 border-transparent focus-within:border-blue-200 focus-within:bg-white transition-all">
                  <Mail className="text-gray-400 w-4 h-4 shrink-0" />
                  <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="klant@bedrijf.be" className="bg-transparent border-none p-0 focus:ring-0 text-sm font-bold w-full outline-none" required />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 block">Wachtwoord</label>
                <div className="flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-3.5 border-2 border-transparent focus-within:border-blue-200 focus-within:bg-white transition-all">
                  <Lock className="text-gray-400 w-4 h-4 shrink-0" />
                  <input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="Min. 6 tekens" className="bg-transparent border-none p-0 focus:ring-0 text-sm font-bold w-full outline-none" required minLength={6} />
                </div>
              </div>
              <div className="bg-blue-50 rounded-xl p-3 border border-blue-100">
                <p className="text-xs text-blue-700">💡 Na aanmaken gebruik je de 🔗 knop om de klant te koppelen aan een Odoo project.</p>
              </div>
              <button type="submit" disabled={submitting} className="w-full bg-blue-600 text-white py-4 rounded-xl font-black shadow-lg active:scale-95 transition-all disabled:opacity-50">
                {submitting ? 'Aanmaken...' : 'Klant aanmaken'}
              </button>
            </form>
          </div>
        </div>
      )}

      {showLinkModal && linkingCustomer && (
        <div className="fixed inset-0 z-50 flex items-end">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowLinkModal(false)} />
          <div className="relative w-full bg-white rounded-t-3xl p-6 shadow-2xl max-h-[80vh] flex flex-col">
            <div className="flex justify-between items-center mb-2 shrink-0">
              <div>
                <h2 className="text-lg font-black text-gray-900">Project koppelen</h2>
                <p className="text-sm text-gray-500">aan {linkingCustomer.name}</p>
              </div>
              <button onClick={() => setShowLinkModal(false)} className="p-2 text-gray-400"><X className="w-5 h-5" /></button>
            </div>
            <p className="text-xs text-gray-400 mb-3 shrink-0">Sync eerst projecten via Instellingen als de lijst leeg is.</p>
            <div className="flex-1 overflow-y-auto space-y-2 mb-4">
              {availableLocations.length === 0 ? (
                <div className="py-10 text-center">
                  <MapPin className="w-10 h-10 text-gray-200 mx-auto mb-2" />
                  <p className="text-gray-400 text-sm">Geen vrije projecten beschikbaar</p>
                </div>
              ) : (
                availableLocations.map(loc => (
                  <div
                    key={loc.id}
                    onClick={() => setSelectedLocationId(loc.id)}
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${selectedLocationId === loc.id ? 'border-blue-500 bg-blue-50' : 'border-gray-100 bg-gray-50'}`}
                  >
                    <p className="font-black text-gray-900">{loc.name}</p>
                    {loc.address && <p className="text-xs text-gray-500 mt-0.5">{loc.address}</p>}
                  </div>
                ))
              )}
            </div>
            <button
              onClick={handleLink}
              disabled={submitting || !selectedLocationId}
              className="w-full bg-blue-600 text-white py-4 rounded-xl font-black active:scale-95 transition-all disabled:opacity-50 shrink-0"
            >
              {submitting ? 'Koppelen...' : 'Project koppelen'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Customers;
