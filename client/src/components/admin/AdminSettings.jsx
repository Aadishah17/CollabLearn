import React, { createElement, useState, useEffect } from 'react';
import {
  Settings,
  Lock,
  Database,
  Globe,
  RefreshCw,
  AlertTriangle,
  Save,
  Loader,
  CheckCircle,
  XCircle,
  Sparkles,
  Sliders,
  Shield,
} from 'lucide-react';
import AdminNavbar from '../../navbar/adminNavbar.jsx';
import { API_URL } from '../../config';

export default function AdminSettings() {
  const [settings, setSettings] = useState({
    siteName: 'CollabLearn',
    maintenanceMode: false,
    minPasswordLength: 8,
    geminiApiKey: '',
  });
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState(null);

  useEffect(() => {
    const fetchSettings = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/api/admin/settings`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const result = await response.json();
        if (result.success) {
          setSettings(result.data || {});
        } else {
          console.error('Failed to fetch settings:', result.message);
        }
      } catch (error) {
        console.error('Error fetching settings:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSettings((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaveStatus('saving');
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/admin/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(settings),
      });
      const result = await response.json();

      if (result.success) {
        setSaveStatus('success');
      } else {
        setSaveStatus('error');
      }
    } catch (error) {
      setSaveStatus('error');
      console.error('Failed to save settings:', error);
    } finally {
      setTimeout(() => setSaveStatus(null), 3500);
    }
  };

  const handleDataAction = (actionName) => {
    alert(`Triggered: '${actionName}'. In production, this runs background database maintenance.`);
  };

  const SettingsSection = ({ icon, title, description, children }) => (
    <div className="surface-card card-spotlight p-6 md:p-8 mb-6">
      <div className="flex items-center gap-3 mb-2">
        <div className="p-2 rounded-xl bg-red-500/10 border border-red-400/25 text-red-300">
          {createElement(icon, { size: 18 })}
        </div>
        <h2 className="text-lg font-bold text-white">{title}</h2>
      </div>
      <p className="text-xs text-zinc-400 mb-6">{description}</p>
      {children}
    </div>
  );

  if (loading) {
    return (
      <div className="glass-page min-h-screen text-zinc-100 flex items-center justify-center font-sans">
        <AdminNavbar />
        <div className="text-center">
          <Loader size={36} className="animate-spin text-red-400 mx-auto" />
          <p className="mt-3 text-sm text-zinc-400">Loading configuration parameters...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-page min-h-screen text-zinc-100 font-sans">
      <AdminNavbar />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 pt-28 pb-16">
        <header className="mb-8">
          <div className="eyebrow mb-3">
            <Sliders size={14} className="text-red-300" />
            System Control
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            Administrator Settings
          </h1>
          <p className="mt-2 text-zinc-400 text-sm max-w-xl">
            Configure global site parameters, AI orchestration providers, and operational runtime
            policies.
          </p>
        </header>

        <form onSubmit={handleSave}>
          <SettingsSection
            icon={Globe}
            title="General Platform Identity"
            description="Control public site naming, brand metadata, and maintenance gating."
          >
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="siteName"
                  className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2"
                >
                  Platform Name
                </label>
                <input
                  type="text"
                  id="siteName"
                  name="siteName"
                  value={settings.siteName || ''}
                  onChange={handleInputChange}
                  className="glass-input w-full max-w-md"
                  required
                />
              </div>

              <div className="flex items-center justify-between p-4 rounded-2xl border border-white/10 bg-white/[0.02]">
                <div className="flex items-center gap-3">
                  <AlertTriangle size={18} className="text-amber-400 shrink-0" />
                  <div>
                    <span className="text-sm font-bold text-white block">Maintenance Mode</span>
                    <span className="text-xs text-zinc-400">
                      Temporarily gate student signups and non-admin routes.
                    </span>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    id="maintenanceMode"
                    name="maintenanceMode"
                    checked={Boolean(settings.maintenanceMode)}
                    onChange={handleInputChange}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                </label>
              </div>
            </div>
          </SettingsSection>

          <SettingsSection
            icon={Lock}
            title="Security & Auth Policies"
            description="Enforce password complexity, session duration limits, and token expiration standards."
          >
            <div>
              <label
                htmlFor="minPasswordLength"
                className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2"
              >
                Minimum Password Length
              </label>
              <input
                type="number"
                id="minPasswordLength"
                name="minPasswordLength"
                value={settings.minPasswordLength || 8}
                onChange={handleInputChange}
                className="glass-input w-full max-w-xs"
                min="6"
                max="32"
                required
              />
              <p className="text-xs text-zinc-400 mt-2">
                Default requirement is 8 characters. Recommended 10+ for administrative roles.
              </p>
            </div>
          </SettingsSection>

          <SettingsSection
            icon={Sparkles}
            title="AI Engine Configuration"
            description="The platform operates on the isolated multi-provider AI pipeline. You can provide credentials for external inference engines here."
          >
            <div>
              <label
                htmlFor="geminiApiKey"
                className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2"
              >
                External Provider API Key (Optional)
              </label>
              <div className="relative max-w-lg">
                <input
                  type="password"
                  id="geminiApiKey"
                  name="geminiApiKey"
                  value={settings.geminiApiKey || ''}
                  onChange={handleInputChange}
                  placeholder="AIzaSy... / sk-proj-..."
                  className="glass-input w-full font-mono text-xs pr-10"
                />
                <Sparkles
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-amber-400/80"
                  size={16}
                />
              </div>
              <p className="mt-2 text-xs text-zinc-400">
                When left blank, the system automatically uses the local inference fallback engine
                without downtime.
              </p>
            </div>
          </SettingsSection>

          <SettingsSection
            icon={Database}
            title="Maintenance & Database Utilities"
            description="Trigger maintenance jobs, refresh cached metrics, and manage collection backups."
          >
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => handleDataAction('Full Database Backup')}
                className="glass-outline-btn flex items-center gap-2 text-xs font-semibold"
              >
                <Database size={15} />
                <span>Trigger Backup</span>
              </button>
              <button
                type="button"
                onClick={() => handleDataAction('Clear Application Cache')}
                className="glass-outline-btn flex items-center gap-2 text-xs font-semibold"
              >
                <RefreshCw size={15} />
                <span>Purge Redis Cache</span>
              </button>
            </div>
          </SettingsSection>

          {/* Action Row */}
          <div className="flex items-center justify-end gap-4 mt-8">
            {saveStatus && (
              <div
                className={`flex items-center text-xs font-bold px-3 py-1.5 rounded-full border ${
                  saveStatus === 'success'
                    ? 'bg-emerald-500/15 border-emerald-400/30 text-emerald-300'
                    : saveStatus === 'error'
                      ? 'bg-rose-500/15 border-rose-400/30 text-rose-300'
                      : 'bg-blue-500/15 border-blue-400/30 text-blue-300'
                }`}
              >
                {saveStatus === 'saving' && <Loader size={14} className="animate-spin mr-1.5" />}
                {saveStatus === 'success' && <CheckCircle size={14} className="mr-1.5" />}
                {saveStatus === 'error' && <XCircle size={14} className="mr-1.5" />}
                <span>
                  {saveStatus === 'saving'
                    ? 'Saving changes...'
                    : saveStatus === 'success'
                      ? 'Configuration persisted successfully'
                      : 'Failed to persist configuration'}
                </span>
              </div>
            )}

            <button
              type="submit"
              disabled={saveStatus === 'saving'}
              className="glass-cta flex items-center gap-2 text-sm font-semibold disabled:opacity-50"
            >
              <Save size={16} />
              <span>Save Changes</span>
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
