import React, { useState } from 'react';
import { Database, Table, Download, Upload, Settings, LogOut, Coffee } from 'lucide-react';
import { DatabaseConnection } from '../types/database';

interface SidebarProps {
  connection: DatabaseConnection;
  tables: string[];
  selectedTable: string | null;
  onTableSelect: (table: string) => void;
  onExportClick: () => void;
  onImportClick: () => void;
  onDisconnect: () => void;
  currentView: 'tables' | 'export' | 'import';
  setCurrentView: (view: 'tables' | 'export' | 'import') => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  connection,
  tables,
  selectedTable,
  onTableSelect,
  onExportClick,
  onImportClick,
  onDisconnect,
  currentView,
  setCurrentView
}) => {
  const [showQR, setShowQR] = useState(false);

  return (
    <div className="w-64 bg-white border-r border-gray-200 h-screen flex flex-col">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center gap-3 mb-2">
          <Database className="w-6 h-6 text-blue-600" />
          <span className="font-semibold text-gray-900">DB Manager</span>
        </div>
        <p className="text-sm text-gray-600 truncate">
          {connection.name || 'Connected Database'}
        </p>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        <button
          onClick={() => setCurrentView('tables')}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
            currentView === 'tables' 
              ? 'bg-blue-100 text-blue-700' 
              : 'hover:bg-gray-100 text-gray-700'
          }`}
        >
          <Table className="w-5 h-5" />
          <span className="font-medium">Tables</span>
        </button>

        <button
          onClick={() => setCurrentView('export')}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
            currentView === 'export' 
              ? 'bg-blue-100 text-blue-700' 
              : 'hover:bg-gray-100 text-gray-700'
          }`}
        >
          <Download className="w-5 h-5" />
          <span className="font-medium">Export</span>
        </button>

        <button
          onClick={() => setCurrentView('import')}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
            currentView === 'import' 
              ? 'bg-blue-100 text-blue-700' 
              : 'hover:bg-gray-100 text-gray-700'
          }`}
        >
          <Upload className="w-5 h-5" />
          <span className="font-medium">Import</span>
        </button>

        {currentView === 'tables' && (
          <div className="mt-6">
            <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
              Tables ({tables.length})
            </h3>
            <div className="space-y-1 max-h-96 overflow-y-auto">
              {tables.map((table) => (
                <button
                  key={table}
                  onClick={() => onTableSelect(table)}
                  className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                    selectedTable === table
                      ? 'bg-blue-50 text-blue-700 border-l-2 border-blue-600'
                      : 'hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  <span className="text-sm font-medium">{table}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </nav>

      <div className="p-4 border-t border-gray-200">
        {/* Buy Me a Coffee Donation */}
        <div className="mb-3 relative">
          <a
            href="https://coff.ee/theodorosdc"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left text-amber-600 hover:bg-amber-50 transition-colors"
            onMouseEnter={() => setShowQR(true)}
            onMouseLeave={() => setShowQR(false)}
          >
            <Coffee className="w-5 h-5" />
            <span className="font-medium">Buy me a coffee</span>
          </a>
          
          {showQR && (
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 z-10">
              <div className="bg-white p-2 rounded-lg shadow-lg border">
                <img 
                  src="/bmc_qr.png" 
                  alt="Buy me a coffee QR code" 
                  className="w-32 h-32"
                />
              </div>
            </div>
          )}
        </div>

        <button
          onClick={onDisconnect}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left text-red-600 hover:bg-red-50 transition-colors"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">Disconnect</span>
        </button>
      </div>
    </div>
  );
};