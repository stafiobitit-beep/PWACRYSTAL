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
  const [syncWarnings, setSyncWarnings] = useState<string[]>([]);
  const [syncResults, setSyncResults] = useState<any>(null);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const { data } = await client.get('/settings/odoo');
        setConfig({
          url: data.url || '',
          db: data.db || '',
          username: data.username || '',
          apiKey: data.apiKey || '',
        });
        if (data.syncedProjectIds) {
          try {
            setSelectedProjectIds(JSON.parse(data.syncedProjectIds));
          } catch (e) {
            console.error('Error parsing syncedProjectIds', e);
          }
        }
        if (data.lastSyncedAt) {
          setLastSyncedAt(data.lastSyncedAt);
        }
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
    setSyncWarnings([]);
    setSyncResults(null);
    try {
      const { data } = await client.post('/sync/all', { selectedProjectIds });
      setSyncResults(data.results);
      if (data.warnings && data.warnings.length > 0) {
        setSyncWarnings(data.warnings);
        toast.success('Sync voltooid met waarschuwingen', { id });
      } else {
        toast.success('Synchronisatie succesvol voltooid!', { id });
      }
      setLastSyncedAt(new Date().toISOString());
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || 'Synchronisatie mislukt';
      toast.error(errorMsg, { id });
    }
  };

  if (loading) return <div className="p-6">Laden...</div>;

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="bg-white px-6 pt-12 pb-6 rounded-b-[40px] shadow-sm flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-xl active:bg-gray-100">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-black text-gray-900">Settings</h1>
          {lastSyncedAt && (
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mt-1">
              Laatst gesynct: {new Date(lastSyncedAt).toLocaleString('nl-BE')}
            </p>
          )}
        </div>
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

          {syncResults && (
            <div className="mt-6 grid grid-cols-3 gap-2">
              <div className="bg-blue-50 p-3 rounded-2xl text-center">
                <div className="text-blue-600 font-black text-lg">{syncResults.partners}</div>
                <div className="text-[10px] text-blue-400 font-bold uppercase">Klanten</div>
              </div>
              <div className="bg-purple-50 p-3 rounded-2xl text-center">
                <div className="text-purple-600 font-black text-lg">{syncResults.locations}</div>
                <div className="text-[10px] text-purple-400 font-bold uppercase">Locaties</div>
              </div>
              <div className="bg-green-50 p-3 rounded-2xl text-center">
                <div className="text-green-600 font-black text-lg">{syncResults.tasks}</div>
                <div className="text-[10px] text-green-400 font-bold uppercase">Taken</div>
              </div>
            </div>
          )}

          {syncWarnings.length > 0 && (
            <div className="mt-6 bg-red-50 rounded-3xl p-5 border border-red-100">
              <h3 className="text-red-800 font-bold text-sm mb-3 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                Aandachtspunten ({syncWarnings.length})
              </h3>
              <ul className="space-y-2 max-h-40 overflow-y-auto pr-2 no-scrollbar">
                {syncWarnings.map((warning, i) => (
                  <li key={i} className="text-[11px] text-red-600 font-medium leading-relaxed bg-white/50 p-2 rounded-xl border border-red-50/50">
                    {warning}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="bg-blue-600 rounded-[32px] p-6 shadow-xl shadow-blue-100 mb-6 flex items-center gap-4">
          <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
            <RefreshCw className="w-6 h-6 text-white animate-spin" />
          </div>
          <div>
            <h3 className="text-white font-bold">Auto-Sync actief</h3>
            <p className="text-blue-100 text-xs">Wijzigingen in Odoo worden elke 5 minuten automatisch verwerkt.</p>
          </div>
        </div>

        <div className="bg-orange-50 rounded-[32px] p-6 border border-orange-100 italic text-orange-800 text-sm">
          <strong>Let op:</strong> Deze gegevens worden veilig opgeslagen in de backend en gebruikt voor alle synchronisaties met Odoo.
        </div>
      </div>
    </div>
  );
};

export default Settings;
