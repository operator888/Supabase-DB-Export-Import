import React, { useState } from 'react';
import { Download, FileText, Database, AlertCircle } from 'lucide-react';
import { SupabaseClient } from '@supabase/supabase-js';
import { ColumnInfo } from '../types/database';

interface ExportViewProps {
  tables: string[];
  client: SupabaseClient | null;
  getColumns: (tableName: string) => Promise<ColumnInfo[]>;
}

export const ExportView: React.FC<ExportViewProps> = ({ tables, client, getColumns }) => {
  const [selectedTables, setSelectedTables] = useState<string[]>([]);
  const [format, setFormat] = useState<'json' | 'sql'>('json');
  const [includeSchema, setIncludeSchema] = useState(true);
  const [includeData, setIncludeData] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [downloadFilename, setDownloadFilename] = useState<string>('');

  const handleTableToggle = (table: string) => {
    setSelectedTables(prev => 
      prev.includes(table) 
        ? prev.filter(t => t !== table)
        : [...prev, table]
    );
  };

  const handleSelectAll = () => {
    setSelectedTables(selectedTables.length === tables.length ? [] : tables);
  };

  const getTableSchema = async (tableName: string) => {
    if (!client) return null;
    
    try {
      return await getColumns(tableName);
    } catch (err) {
      console.error('Error fetching schema for', tableName, err);
      return null;
    }
  };

  const handleExport = async () => {
    console.log('Export button clicked!');
    console.log('Client exists:', !!client);
    console.log('Selected tables:', selectedTables);
    console.log('Include schema:', includeSchema);
    console.log('Include data:', includeData);
    
    if (!client) {
      console.error('No client available');
      setError('No database connection. Please connect to a database first.');
      return;
    }
    
    if (selectedTables.length === 0) {
      console.error('No tables selected');
      setError('Please select at least one table to export.');
      return;
    }
    
    if (!includeSchema && !includeData) {
      console.error('Neither schema nor data selected');
      setError('Please select either schema or data (or both) to export.');
      return;
    }

    setLoading(true);
    setError(null);
    setDownloadUrl(null);
    setDownloadFilename('');
    
    try {
      const exportData: any = {};
      
      for (const table of selectedTables) {
        console.log(`Processing table: ${table}`);
        const tableInfo: any = { name: table };
        
        if (includeSchema) {
          try {
            const schema = await getTableSchema(table);
            tableInfo.schema = schema;
            console.log(`Schema for ${table}:`, schema);
          } catch (schemaErr) {
            console.error(`Schema error for ${table}:`, schemaErr);
            tableInfo.schema = [];
            tableInfo.schemaError = schemaErr instanceof Error ? schemaErr.message : 'Unknown schema error';
          }
        }
        
        if (includeData) {
          try {
            console.log(`Fetching data for table: ${table}`);
            const { data: rows, error: dataError } = await client.from(table).select('*');
            if (dataError) {
              console.error(`Error fetching data for ${table}:`, dataError);
              tableInfo.data = [];
              tableInfo.dataError = dataError.message;
            } else {
              tableInfo.data = rows || [];
              console.log(`Fetched ${tableInfo.data.length} rows for ${table}`);
            }
          } catch (dataErr) {
            console.error(`Data fetch error for ${table}:`, dataErr);
            tableInfo.data = [];
            tableInfo.dataError = dataErr instanceof Error ? dataErr.message : 'Unknown data error';
          }
        }
        
        exportData[table] = tableInfo;
      }

      console.log('Export data prepared:', exportData);

      const exportContent = format === 'json' 
        ? JSON.stringify(exportData, null, 2)
        : generateSQLExport(exportData);

      console.log('Export content length:', exportContent.length);
      console.log('Export content preview:', exportContent.substring(0, 500));

      // Create and download the file
      try {
        const blob = new Blob([exportContent], { 
          type: format === 'json' ? 'application/json' : 'text/sql' 
        });
        
        console.log('Blob created:', blob.size, 'bytes');
        
        const url = URL.createObjectURL(blob);
        console.log('Object URL created:', url);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `supabase-export-${new Date().toISOString().split('T')[0]}.${format}`;
        a.style.display = 'none'; // Hide the link
        
        console.log('Download filename:', a.download);
        
        // Append to body, click, and remove
        document.body.appendChild(a);
        console.log('Link added to body, about to click...');
        
        // Use setTimeout to ensure the link is properly attached before clicking
        setTimeout(() => {
          try {
            a.click();
            console.log('Link clicked');
          } catch (clickError) {
            console.error('Error clicking download link:', clickError);
            // Fallback: provide manual download link
            setDownloadUrl(url);
            setDownloadFilename(a.download);
            setError('Automatic download failed. Please use the manual download link below.');
          }
          
          // Clean up
          try {
            document.body.removeChild(a);
            console.log('Link removed from body');
          } catch (removeError) {
            console.error('Error removing link:', removeError);
          }
          
          // Only clean up URL if not using for manual download
          if (!downloadUrl) {
            URL.revokeObjectURL(url);
            console.log('Object URL cleaned up');
          }
        }, 100);
        
        console.log('Export completed successfully');
      } catch (downloadError) {
        console.error('Error during download process:', downloadError);
        throw new Error('Failed to download file: ' + (downloadError instanceof Error ? downloadError.message : 'Unknown download error'));
      }
    } catch (error) {
      console.error('Export failed:', error);
      setError('Export failed: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const generateSQLExport = (data: any): string => {
    let sql = '-- Supabase Database Export\n';
    sql += `-- Generated on: ${new Date().toISOString()}\n`;
    sql += `-- Tables exported: ${Object.keys(data).join(', ')}\n\n`;
    
    Object.entries(data).forEach(([tableName, tableInfo]: [string, any]) => {
      sql += `-- ============================================\n`;
      sql += `-- Table: ${tableName}\n`;
      sql += `-- ============================================\n\n`;
      
      if (includeSchema && tableInfo.schema && Array.isArray(tableInfo.schema)) {
        sql += `-- Schema for table: ${tableName}\n`;
        sql += `DROP TABLE IF EXISTS "${tableName}" CASCADE;\n`;
        sql += `CREATE TABLE "${tableName}" (\n`;
        
        const columns = tableInfo.schema.map((col: any) => {
          let colDef = `  "${col.column_name}" ${col.data_type}`;
          
          if (col.character_maximum_length) {
            colDef += `(${col.character_maximum_length})`;
          } else if (col.numeric_precision) {
            colDef += `(${col.numeric_precision}${col.numeric_scale ? ',' + col.numeric_scale : ''})`;
          }
          
          if (col.is_nullable === 'NO') colDef += ' NOT NULL';
          if (col.column_default) colDef += ` DEFAULT ${col.column_default}`;
          
          return colDef;
        });
        
        sql += columns.join(',\n');
        sql += '\n);\n\n';
      }
      
      if (includeData && tableInfo.data && Array.isArray(tableInfo.data) && tableInfo.data.length > 0) {
        sql += `-- Data for table: ${tableName} (${tableInfo.data.length} rows)\n`;
        
        tableInfo.data.forEach((row: any, index: number) => {
          const columns = Object.keys(row).map(col => `"${col}"`).join(', ');
          const values = Object.values(row).map(val => {
            if (val === null || val === undefined) return 'NULL';
            if (typeof val === 'string') return `'${val.replace(/'/g, "''")}'`;
            if (typeof val === 'boolean') return val ? 'TRUE' : 'FALSE';
            if (typeof val === 'object') return `'${JSON.stringify(val).replace(/'/g, "''")}'`;
            return String(val);
          }).join(', ');
          
          sql += `INSERT INTO "${tableName}" (${columns}) VALUES (${values});\n`;
          
          // Add a comment every 100 rows for progress tracking
          if ((index + 1) % 100 === 0) {
            sql += `-- Inserted ${index + 1} rows so far...\n`;
          }
        });
        sql += '\n';
      }
      
      if (tableInfo.schemaError) {
        sql += `-- Schema Error: ${tableInfo.schemaError}\n`;
      }
      
      if (tableInfo.dataError) {
        sql += `-- Data Error: ${tableInfo.dataError}\n`;
      }
      
      sql += '\n';
    });
    
    sql += '-- Export completed\n';
    return sql;
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Export Database</h1>
        <p className="text-gray-600">
          Select tables and configure export options to download your database.
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <span className="text-red-700 text-sm">{error}</span>
        </div>
      )}

      {downloadUrl && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-blue-700 text-sm mb-3">Manual download required:</p>
          <a
            href={downloadUrl}
            download={downloadFilename}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            onClick={() => {
              // Clean up after manual download
              setTimeout(() => {
                URL.revokeObjectURL(downloadUrl);
                setDownloadUrl(null);
                setDownloadFilename('');
              }, 1000);
            }}
          >
            <Download className="w-4 h-4" />
            Download {downloadFilename}
          </a>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Select Tables</h3>
              <button
                onClick={handleSelectAll}
                className="text-sm text-blue-600 hover:text-blue-700 transition-colors"
              >
                {selectedTables.length === tables.length ? 'Deselect All' : 'Select All'}
              </button>
            </div>
            
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {tables.length === 0 ? (
                <p className="text-gray-500 text-sm">No tables found in the database.</p>
              ) : (
                tables.map((table) => (
                  <label
                    key={table}
                    className="flex items-center p-3 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={selectedTables.includes(table)}
                      onChange={() => handleTableToggle(table)}
                      className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                    />
                    <span className="ml-3 text-sm font-medium text-gray-900">
                      {table}
                    </span>
                  </label>
                ))
              )}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Export Options</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Format
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="format"
                      value="json"
                      checked={format === 'json'}
                      onChange={(e) => setFormat(e.target.value as 'json' | 'sql')}
                      className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">JSON</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="format"
                      value="sql"
                      checked={format === 'sql'}
                      onChange={(e) => setFormat(e.target.value as 'json' | 'sql')}
                      className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">SQL</span>
                  </label>
                </div>
              </div>

              <div className="space-y-3">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={includeSchema}
                    onChange={(e) => setIncludeSchema(e.target.checked)}
                    className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Include schema</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={includeData}
                    onChange={(e) => setIncludeData(e.target.checked)}
                    className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Include data</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Export Summary</h3>
          
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
              <Database className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {selectedTables.length} table{selectedTables.length !== 1 ? 's' : ''} selected
                </p>
                <p className="text-xs text-gray-600">
                  {selectedTables.length > 0 ? selectedTables.join(', ') : 'No tables selected'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
              <FileText className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {format.toUpperCase()} format
                </p>
                <p className="text-xs text-gray-600">
                  {includeSchema && includeData 
                    ? 'Schema and data included'
                    : includeSchema 
                    ? 'Schema only'
                    : 'Data only'}
                </p>
              </div>
            </div>

            <button
              onClick={handleExport}
              disabled={loading || selectedTables.length === 0 || (!includeSchema && !includeData)}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              title={
                loading ? 'Export in progress...' :
                selectedTables.length === 0 ? 'Please select at least one table' :
                (!includeSchema && !includeData) ? 'Please select schema and/or data to export' :
                'Click to export selected tables'
              }
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  Export Database
                </>
              )}
            </button>

            {/* Debug info - remove this after fixing */}
            <div className="text-xs text-gray-500 mt-2 p-2 bg-gray-50 rounded">
              <div>Debug Info:</div>
              <div>Loading: {loading ? 'Yes' : 'No'}</div>
              <div>Selected tables: {selectedTables.length}</div>
              <div>Include schema: {includeSchema ? 'Yes' : 'No'}</div>
              <div>Include data: {includeData ? 'Yes' : 'No'}</div>
              <div>Button disabled: {(loading || selectedTables.length === 0 || (!includeSchema && !includeData)) ? 'Yes' : 'No'}</div>
              <div>Client connected: {client ? 'Yes' : 'No'}</div>
            </div>

            {loading && (
              <div className="text-xs text-gray-600 text-center">
                This may take a moment for large databases...
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};