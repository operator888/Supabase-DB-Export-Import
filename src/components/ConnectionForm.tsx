import React, { useState } from 'react';
import { Database, Loader2, AlertCircle, Eye, EyeOff, ExternalLink } from 'lucide-react';
import { DatabaseConnection } from '../types/database';

interface ConnectionFormProps {
  onConnect: (connection: DatabaseConnection) => void;
  loading: boolean;
  error: string | null;
}

export const ConnectionForm: React.FC<ConnectionFormProps> = ({ onConnect, loading, error }) => {
  const [formData, setFormData] = useState({
    url: '',
    apiKey: '',
    name: ''
  });
  const [showApiKey, setShowApiKey] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    
    if (!formData.url.trim()) {
      errors.url = 'Supabase URL is required';
    } else if (!formData.url.includes('supabase.co')) {
      errors.url = 'Please enter a valid Supabase URL (should contain "supabase.co")';
    }
    
    if (!formData.apiKey.trim()) {
      errors.apiKey = 'API Key is required';
    } else if (formData.apiKey.length < 20) {
      errors.apiKey = 'API Key appears to be too short';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    onConnect(formData);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear validation error for this field
    if (validationErrors[name]) {
      setValidationErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handlePasteUrl = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text.includes('supabase.co')) {
        setFormData(prev => ({ ...prev, url: text.trim() }));
        setValidationErrors(prev => ({ ...prev, url: '' }));
      }
    } catch (err) {
      // Clipboard access failed, ignore
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md border border-gray-100">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full mb-4 shadow-lg">
            <Database className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Supabase DB Manager</h1>
          <p className="text-gray-600">Connect to your Supabase database to manage your data</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <span className="text-red-700 text-sm font-medium">Connection Failed</span>
              <p className="text-red-600 text-sm mt-1">{error}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Connection Name (Optional)
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              placeholder="My Production Database"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Supabase URL <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="url"
                name="url"
                value={formData.url}
                onChange={handleChange}
                required
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                  validationErrors.url ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
                placeholder="https://your-project.supabase.co"
              />
              <button
                type="button"
                onClick={handlePasteUrl}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 text-sm"
              >
                Paste
              </button>
            </div>
            {validationErrors.url && (
              <p className="mt-1 text-sm text-red-600">{validationErrors.url}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              API Key <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showApiKey ? 'text' : 'password'}
                name="apiKey"
                value={formData.apiKey}
                onChange={handleChange}
                required
                className={`w-full px-4 py-3 pr-12 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                  validationErrors.apiKey ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
                placeholder="Your anon or service_role key"
              />
              <button
                type="button"
                onClick={() => setShowApiKey(!showApiKey)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showApiKey ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {validationErrors.apiKey && (
              <p className="mt-1 text-sm text-red-600">{validationErrors.apiKey}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || !formData.url || !formData.apiKey}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 px-4 rounded-lg font-medium hover:from-blue-700 hover:to-indigo-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2 shadow-lg"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Connecting...
              </>
            ) : (
              <>
                <Database className="w-5 h-5" />
                Connect to Database
              </>
            )}
          </button>
        </form>

        <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <h3 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
            <ExternalLink className="w-4 h-4" />
            Need help finding your credentials?
          </h3>
          <p className="text-xs text-gray-600 mb-2">
            You can find your Supabase URL and API key in your project settings:
          </p>
          <ol className="text-xs text-gray-600 space-y-1 ml-4">
            <li>1. Go to your Supabase project dashboard</li>
            <li>2. Navigate to Settings → API</li>
            <li>3. Copy your Project URL and anon/service_role key</li>
          </ol>
        </div>
      </div>
    </div>
  );
};