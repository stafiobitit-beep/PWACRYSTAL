import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import client from '../api/client';
import { toast } from 'react-hot-toast';
import { ArrowLeft, Calendar, User, MapPin, AlignLeft, Send } from 'lucide-react';

const CreateTask: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [cleaners, setCleaners] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    cleanerId: '',
    locationId: ''
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [cRes, lRes] = await Promise.all([
          client.get('/users/cleaners'),
          client.get('/locations')
        ]);
        setCleaners(cRes.data);
        setLocations(lRes.data);
      } catch (error) {
        toast.error('Data niet geladen');
      }
    };
    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.cleanerId || !formData.locationId) {
      toast.error('Vul alle verplichte velden in');
      return;
    }

    setLoading(true);
    try {
      await client.post('/tasks', formData);
      toast.success('Taak succesvol aangemaakt!');
      navigate('/');
    } catch (error) {
      toast.error('Taak aanmaken mislukt');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white px-4 pt-12 pb-4 border-b border-gray-100 flex items-center shrink-0">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-gray-500">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="flex-1 text-center font-black text-lg text-gray-900 pr-8">Nieuwe Taak</h1>
      </div>

      <form onSubmit={handleSubmit} className="flex-1 p-6 space-y-6 overflow-y-auto pb-12">
        <div className="space-y-2">
          <label className="text-xs font-black uppercase tracking-widest text-gray-400">Titel *</label>
          <div className="relative">
            <input 
              type="text"
              required
              className="w-full bg-white border-2 border-gray-100 rounded-2xl p-4 font-bold focus:border-primary-600 transition-all outline-none"
              placeholder="Bijv: Wekelijkse kuis kantoor"
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-black uppercase tracking-widest text-gray-400">Datum *</label>
          <div className="relative">
            <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
            <input 
              type="date"
              required
              className="w-full bg-white border-2 border-gray-100 rounded-2xl p-4 pl-12 font-bold focus:border-primary-600 transition-all outline-none"
              value={formData.date}
              onChange={(e) => setFormData({...formData, date: e.target.value})}
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-black uppercase tracking-widest text-gray-400">Locatie *</label>
          <div className="relative">
            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
            <select 
              required
              className="w-full bg-white border-2 border-gray-100 rounded-2xl p-4 pl-12 font-bold focus:border-primary-600 transition-all outline-none appearance-none"
              value={formData.locationId}
              onChange={(e) => setFormData({...formData, locationId: e.target.value})}
            >
              <option value="">Kies Locatie...</option>
              {locations.map(loc => (
                <option key={loc.id} value={loc.id}>{loc.name} ({loc.customer?.name})</option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-black uppercase tracking-widest text-gray-400">Kuiser *</label>
          <div className="relative">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
            <select 
              required
              className="w-full bg-white border-2 border-gray-100 rounded-2xl p-4 pl-12 font-bold focus:border-primary-600 transition-all outline-none appearance-none"
              value={formData.cleanerId}
              onChange={(e) => setFormData({...formData, cleanerId: e.target.value})}
            >
              <option value="">Kies Kuiser...</option>
              {cleaners.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-black uppercase tracking-widest text-gray-400">Instructies</label>
          <div className="relative">
            <AlignLeft className="absolute left-4 top-4 text-gray-400 w-5 h-5 pointer-events-none" />
            <textarea 
              rows={4}
              className="w-full bg-white border-2 border-gray-100 rounded-2xl p-4 pl-12 font-bold focus:border-primary-600 transition-all outline-none"
              placeholder="Geef hier extra details of wensen mee..."
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
            />
          </div>
        </div>

        <button 
          type="submit"
          disabled={loading}
          className="w-full bg-primary-600 text-white py-5 rounded-[24px] font-black shadow-xl shadow-primary-200 active:scale-95 transition-all text-lg flex items-center justify-center gap-3 disabled:opacity-50"
        >
          {loading ? 'Aanmaken...' : <><Send className="w-6 h-6" /> TAAL OPSLAAN</>}
        </button>
      </form>
    </div>
  );
};

export default CreateTask;
