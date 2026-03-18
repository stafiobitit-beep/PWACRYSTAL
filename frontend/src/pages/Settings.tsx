import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import client from '../api/client';
import { toast } from 'react-hot-toast';
import { ArrowLeft, Database, Globe, User, Key, Save, Play, RefreshCw, Check } from 'lucide-react';

const Settings: React.FC = () => {
  const [config, setConfig] = useState({
    url: '',
    db: '',
    username: '',
    apiKey: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [availableProjects, setAvailableProjects] = useState<any[]>([]);
  const [selectedProjectIds, setSelectedProjectIds] = useState<number[]>([]);
  const [fetchingProjects, setFetchingProjects] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const { data } = await client.get('/settings/odoo');
        setConfig(data);
      } catch (error) {
        console.error('Error fetching settings', error);
      } finally {
        setLoading(false);
      }
    };
    fetchConfig();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!config.url.startsWith('http')) {
      toast.error('URL moet beginnen met http:// of https://');
      return;
    }
    setSaving(true);
    try {
      await client.post('/settings/odoo', config);
      toast.success('Settings opgeslagen!');
    } catch (error) {
      toast.error('Fout bij opslaan settings');
    } finally {
      setSaving(false);
    }
  };

  const handleFetchProjects = async () => {
    setFetchingProjects(true);
    const id = toast.loading('Odoo projecten ophalen...');
    try {
      const { data } = await client.get('/odoo/projects');
      setAvailableProjects(data);
      toast.success(`${data.length} projecten gevonden`, { id });
    } catch (error) {
      toast.error('Odoo kon niet worden bereikt', { id });
    } finally {
      setFetchingProjects(false);
    }
  };

  const toggleProject = (projectId: number) => {
    setSelectedProjectIds(prev => 
      prev.includes(projectId) 
        ? prev.filter(id => id !== projectId) 
        : [...prev, projectId]
    );
  };

  const handleSync = async () => {
    if (selectedProjectIds.length === 0) {
      toast.error('Selecteer eerst minimaal één project');
      return;
    }
    const id = toast.loading('Synchroniseren met Odoo...');
    try {
      await client.post('/sync/all', { selectedProjectIds });
      toast.success('Synchronisatie voltooid!', { id });
    } catch (error) {
      toast.error('Synchronisatie mislukt', { id });
    }
  };

  if (loading) return <div className="p-6">Laden...</div>;

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="bg-white px-6 pt-12 pb-6 rounded-b-[40px] shadow-sm flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-xl active:bg-gray-100">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-2xl font-black text-gray-900">Settings</h1>
      </div>

      <div className="p-6">
        <div className="bg-white rounded-[32px] p-6 shadow-sm mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <Database className="text-primary-600" />
            Odoo Connectie
          </h2>

          <form onSubmit={handleSave} className="space-y-4">
            {/* ... config inputs remain same ... */}
            <div>
              <label className="text-sm font-bold text-gray-500 mb-2 block ml-1">Odoo URL</label>
              <div className="bg-gray-50 rounded-2xl flex items-center px-4 gap-3 border border-transparent focus-within:border-primary-200 focus-within:bg-white transition-all">
                <Globe className="w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={config.url}
                  onChange={(e) => setConfig({ ...config, url: e.target.value })}
                  placeholder="https://instancenaam.odoo.com"
                  className="bg-transparent border-none focus:ring-0 w-full py-4 text-sm font-medium"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-bold text-gray-500 mb-2 block ml-1">Database Naam</label>
              <div className="bg-gray-50 rounded-2xl flex items-center px-4 gap-3 border border-transparent focus-within:border-primary-200 focus-within:bg-white transition-all">
                <Database className="w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={config.db}
                  onChange={(e) => setConfig({ ...config, db: e.target.value })}
                  placeholder="db_naam"
                  className="bg-transparent border-none focus:ring-0 w-full py-4 text-sm font-medium"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-bold text-gray-500 mb-2 block ml-1">Gebruikersnaam</label>
              <div className="bg-gray-50 rounded-2xl flex items-center px-4 gap-3 border border-transparent focus-within:border-primary-200 focus-within:bg-white transition-all">
                <User className="w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={config.username}
                  onChange={(e) => setConfig({ ...config, username: e.target.value })}
                  placeholder="admin@example.com"
                  className="bg-transparent border-none focus:ring-0 w-full py-4 text-sm font-medium"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-bold text-gray-500 mb-2 block ml-1">API Key / Wachtwoord</label>
              <div className="bg-gray-50 rounded-2xl flex items-center px-4 gap-3 border border-transparent focus-within:border-primary-200 focus-within:bg-white transition-all">
                <Key className="w-5 h-5 text-gray-400" />
                <input
                  type="password"
                  value={config.apiKey}
                  onChange={(e) => setConfig({ ...config, apiKey: e.target.value })}
                  placeholder="••••••••"
                  className="bg-transparent border-none focus:ring-0 w-full py-4 text-sm font-medium"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full bg-primary-600 text-white font-bold py-4 rounded-2xl shadow-lg shadow-primary-200 active:scale-95 transition-all flex items-center justify-center gap-2 mt-4"
            >
              <Save className="w-5 h-5" />
              {saving ? 'Opslaan...' : 'Settings Opslaan'}
            </button>
          </form>
        </div>

        <div className="bg-white rounded-[32px] p-6 shadow-sm mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <Database className="text-primary-600" />
            Project Selectie
          </h2>
          
          <p className="text-xs text-gray-500 mb-6 font-medium leading-relaxed">
            Haal eerst je projecten op uit Odoo en selecteer welke je wilt synchroniseren naar de app.
          </p>

          <button
            onClick={handleFetchProjects}
            disabled={fetchingProjects}
            className="w-full bg-gray-100 text-gray-900 font-bold py-4 rounded-2xl active:scale-95 transition-all flex items-center justify-center gap-2 mb-6"
          >
            <Play className="w-5 h-5 text-primary-600" />
            Odoo Projecten Ophalen
          </button>

          {availableProjects.length > 0 && (
            <div className="space-y-2 mb-8 max-h-60 overflow-y-auto pr-2 no-scrollbar">
              {availableProjects.map((p) => (
                <div 
                  key={p.id} 
                  onClick={() => toggleProject(p.id)}
                  className={`p-4 rounded-2xl border-2 transition-all flex items-center justify-between cursor-pointer ${
                    selectedProjectIds.includes(p.id) 
                      ? 'border-primary-600 bg-primary-50 text-primary-900 font-bold' 
                      : 'border-gray-50 bg-gray-50 text-gray-500'
                  }`}
                >
                  <span className="text-sm truncate pr-4">{p.name}</span>
                  <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${
                    selectedProjectIds.includes(p.id) ? 'bg-primary-600 border-primary-600' : 'border-gray-300'
                  }`}>
                    {selectedProjectIds.includes(p.id) ? <Check className="w-3 h-3 text-white" /> : null}
                  </div>
                </div>
              ))}
            </div>
          )}

          <button
            onClick={handleSync}
            disabled={selectedProjectIds.length === 0}
            className={`w-full font-black py-5 rounded-[24px] shadow-xl transition-all flex items-center justify-center gap-3 ${
              selectedProjectIds.length > 0
                ? 'bg-primary-600 text-white shadow-primary-200 active:scale-95'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
          >
            <RefreshCw className={`w-6 h-6 ${fetchingProjects ? 'animate-spin' : ''}`} />
            GESELECTEERDE SYNCEN ({selectedProjectIds.length})
          </button>
        </div>

        <div className="bg-orange-50 rounded-[32px] p-6 border border-orange-100 italic text-orange-800 text-sm">
          <strong>Let op:</strong> Deze gegevens worden veilig opgeslagen in de backend en gebruikt voor alle synchronisaties met Odoo.
        </div>
      </div>
    </div>
  );
};

export default Settings;
