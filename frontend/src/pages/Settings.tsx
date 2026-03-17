import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import client from '../api/client';
import { toast } from 'react-hot-toast';
import { ArrowLeft, Database, Globe, User, Key, Save, Play } from 'lucide-react';

const Settings: React.FC = () => {
  const [config, setConfig] = useState({
    url: '',
    db: '',
    username: '',
    apiKey: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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

        <div className="bg-orange-50 rounded-[32px] p-6 border border-orange-100 italic text-orange-800 text-sm">
          <strong>Let op:</strong> Deze gegevens worden veilig opgeslagen in de backend en gebruikt voor alle synchronisaties met Odoo.
        </div>
      </div>
    </div>
  );
};

export default Settings;
