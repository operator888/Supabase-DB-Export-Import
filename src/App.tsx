import React, { useState, useEffect } from 'react';
import { Database } from 'lucide-react';
import { ConnectionForm } from './components/ConnectionForm';
import { Sidebar } from './components/Sidebar';
import { TableView } from './components/TableView';
import { ExportView } from './components/ExportView';
import { ImportView } from './components/ImportView';
import { useSupabase } from './hooks/useSupabase';
import { DatabaseConnection, TableInfo, TableData } from './types/database';

function App() {
  const {
    client,
    isConnected,
    error,
    loading,
    connect,
    disconnect,
    getTables,
    getColumns,
    getTableData,
    insertRow,
    updateRow,
    deleteRow
  } = useSupabase();

  const [tables, setTables] = useState<string[]>([]);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [tableData, setTableData] = useState<TableData | null>(null);
  const [tableLoading, setTableLoading] = useState(false);
  const [currentView, setCurrentView] = useState<'tables' | 'export' | 'import'>('tables');
  const [appError, setAppError] = useState<string | null>(null);

  const handleConnect = async (connectionData: DatabaseConnection) => {
    try {
      setAppError(null);
      await connect(connectionData);
    } catch (err) {
      setAppError(err instanceof Error ? err.message : 'Connection failed');
    }
  };

  const loadTables = async () => {
    try {
      setAppError(null);
      const tablesData = await getTables();
      setTables(tablesData.map(t => t.table_name));
    } catch (error) {
      console.error('Error loading tables:', error);
      setAppError('Failed to load tables: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  const loadTableData = async (tableName: string) => {
    setTableLoading(true);
    try {
      setAppError(null);
      const data = await getTableData(tableName);
      setTableData(data);
    } catch (error) {
      console.error('Error loading table data:', error);
      setAppError('Failed to load table data: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setTableLoading(false);
    }
  };

  const handleTableSelect = (tableName: string) => {
    setSelectedTable(tableName);
    setCurrentView('tables');
    loadTableData(tableName);
  };

  const handleRefresh = () => {
    if (selectedTable) {
      loadTableData(selectedTable);
    }
  };

  const handleInsertRow = async (data: Record<string, any>) => {
    if (!selectedTable) return;
    await insertRow(selectedTable, data);
  };

  const handleUpdateRow = async (data: Record<string, any>, primaryKey: string, keyValue: any) => {
    if (!selectedTable) return;
    await updateRow(selectedTable, data, primaryKey, keyValue);
  };

  const handleDeleteRow = async (primaryKey: string, keyValue: any) => {
    if (!selectedTable) return;
    await deleteRow(selectedTable, primaryKey, keyValue);
  };

  const handleDisconnect = () => {
    disconnect();
    setTables([]);
    setSelectedTable(null);
    setTableData(null);
    setCurrentView('tables');
    setAppError(null);
  };

  useEffect(() => {
    if (isConnected) {
      loadTables();
    }
  }, [isConnected]);

  if (!isConnected) {
    return (
      <ConnectionForm 
        onConnect={handleConnect}
        loading={loading}
        error={error || appError}
      />
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar
        connection={{ url: '', apiKey: '' }}
        tables={tables}
        selectedTable={selectedTable}
        onTableSelect={handleTableSelect}
        onExportClick={() => setCurrentView('export')}
        onImportClick={() => setCurrentView('import')}
        onDisconnect={handleDisconnect}
        currentView={currentView}
        setCurrentView={setCurrentView}
      />
      
      <div className="flex-1 overflow-hidden">
        {appError && (
          <div className="bg-red-50 border-b border-red-200 px-6 py-3">
            <p className="text-red-700 text-sm">{appError}</p>
          </div>
        )}
        
        <div className="h-full overflow-y-auto">
          {currentView === 'tables' && selectedTable && tableData && (
            <div className="p-6">
              <TableView
                tableName={selectedTable}
                tableData={tableData}
                onInsertRow={handleInsertRow}
                onUpdateRow={handleUpdateRow}
                onDeleteRow={handleDeleteRow}
                onRefresh={handleRefresh}
                loading={tableLoading}
              />
            </div>
          )}
          
          {currentView === 'tables' && !selectedTable && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center max-w-md">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Database className="w-8 h-8 text-blue-600" />
                </div>
                <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                  Welcome to Supabase DB Manager
                </h2>
                <p className="text-gray-600 mb-4">
                  Select a table from the sidebar to start managing your data, or use the export/import features to backup and restore your database.
                </p>
                {tables.length === 0 && (
                  <p className="text-sm text-gray-500">
                    No tables found in your database. Create some tables in your Supabase dashboard first.
                  </p>
                )}
              </div>
            </div>
          )}
          
          {currentView === 'export' && (
            <ExportView 
              tables={tables} 
              client={client}
              getColumns={getColumns}
            />
          )}
          
          {currentView === 'import' && (
            <ImportView />
          )}
        </div>
      </div>
    </div>
  );
}

export default App;