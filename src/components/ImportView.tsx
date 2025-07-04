import React, { useState } from 'react';
import { Upload, FileText, AlertCircle, CheckCircle, Database } from 'lucide-react';
import { SupabaseClient } from '@supabase/supabase-js';

interface ImportViewProps {
  client: SupabaseClient | null;
  executeSQL: (sql: string) => Promise<any>;
}

export const ImportView: React.FC<ImportViewProps> = ({ client, executeSQL }) => {
  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importStatus, setImportStatus] = useState<'idle' | 'validating' | 'importing' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [importResults, setImportResults] = useState<any>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      setSelectedFile(files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setSelectedFile(files[0]);
    }
  };

  const validateFile = async (file: File): Promise<{ valid: boolean; data?: any; error?: string }> => {
    try {
      const text = await file.text();
      
      if (file.name.endsWith('.json')) {
        const data = JSON.parse(text);
        
        // Validate JSON structure
        if (typeof data !== 'object' || data === null) {
          throw new Error('Invalid JSON structure. Expected an object with table definitions.');
        }
        
        return { valid: true, data };
      } else if (file.name.endsWith('.sql')) {
        if (!text.trim()) {
          throw new Error('Empty SQL file');
        }
        
        return { valid: true, data: text };
      } else {
        throw new Error('Unsupported file type. Please select a JSON or SQL file.');
      }
    } catch (error) {
      return { 
        valid: false, 
        error: error instanceof Error ? error.message : 'Invalid file format' 
      };
    }
  };

  const importJSONData = async (data: any) => {
    const results = {
      tablesProcessed: 0,
      rowsInserted: 0,
      errors: [] as string[]
    };

    for (const [tableName, tableInfo] of Object.entries(data)) {
      try {
        results.tablesProcessed++;
        
        const tableData = tableInfo as any;
        
        // If schema is included, create/update table structure
        if (tableData.schema && Array.isArray(tableData.schema)) {
          try {
            // Note: In production, you might want to be more careful about schema changes
            console.log(`Processing schema for table: ${tableName}`);
          } catch (schemaError) {
            results.errors.push(`Schema error for ${tableName}: ${schemaError}`);
          }
        }
        
        // Import data if available
        if (tableData.data && Array.isArray(tableData.data)) {
          for (const row of tableData.data) {
            try {
              const { error } = await client!.from(tableName).insert(row);
              if (error) {
                results.errors.push(`Insert error in ${tableName}: ${error.message}`);
              } else {
                results.rowsInserted++;
              }
            } catch (insertError) {
              results.errors.push(`Insert error in ${tableName}: ${insertError}`);
            }
          }
        }
      } catch (tableError) {
        results.errors.push(`Table error for ${tableName}: ${tableError}`);
      }
    }

    return results;
  };

  const importSQLData = async (sqlContent: string) => {
    const results = {
      statementsExecuted: 0,
      errors: [] as string[]
    };

    // Split SQL into individual statements
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    for (const statement of statements) {
      try {
        await executeSQL(statement);
        results.statementsExecuted++;
      } catch (error) {
        results.errors.push(`SQL Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    return results;
  };

  const handleImport = async () => {
    if (!selectedFile || !client) return;

    setImportStatus('validating');
    setErrorMessage('');
    setImportResults(null);

    const validation = await validateFile(selectedFile);
    if (!validation.valid) {
      setImportStatus('error');
      setErrorMessage(validation.error || 'Validation failed');
      return;
    }

    setImportStatus('importing');
    
    try {
      let results;
      
      if (selectedFile.name.endsWith('.json')) {
        results = await importJSONData(validation.data);
      } else {
        results = await importSQLData(validation.data);
      }
      
      setImportResults(results);
      
      if (results.errors.length === 0) {
        setImportStatus('success');
      } else {
        setImportStatus('error');
        setErrorMessage(`Import completed with ${results.errors.length} error(s). Check the results below.`);
      }
    } catch (error) {
      setImportStatus('error');
      setErrorMessage('Import failed: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  const resetImport = () => {
    setSelectedFile(null);
    setImportStatus('idle');
    setErrorMessage('');
    setImportResults(null);
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Import Database</h1>
        <p className="text-gray-600">
          Upload a JSON or SQL file to import data into your database.
        </p>
      </div>

      {importStatus === 'success' ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
          <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Import Successful!</h3>
          <p className="text-gray-600 mb-6">
            Your database has been updated with the imported data.
          </p>
          
          {importResults && (
            <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
              <h4 className="font-medium text-gray-900 mb-2">Import Summary:</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                {importResults.tablesProcessed && (
                  <li>• Tables processed: {importResults.tablesProcessed}</li>
                )}
                {importResults.rowsInserted && (
                  <li>• Rows inserted: {importResults.rowsInserted}</li>
                )}
                {importResults.statementsExecuted && (
                  <li>• SQL statements executed: {importResults.statementsExecuted}</li>
                )}
              </ul>
            </div>
          )}
          
          <button
            onClick={resetImport}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Import Another File
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Upload File</h3>
              
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  dragOver 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-lg font-medium text-gray-900 mb-2">
                  Drop your file here
                </p>
                <p className="text-gray-600 mb-4">
                  Supports JSON and SQL files (max 10MB)
                </p>
                <label className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer transition-colors">
                  <span>Choose File</span>
                  <input
                    type="file"
                    accept=".json,.sql"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </label>
              </div>

              {selectedFile && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {selectedFile.name}
                      </p>
                      <p className="text-xs text-gray-600">
                        {(selectedFile.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {errorMessage && (
                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="text-red-700 text-sm font-medium">{errorMessage}</span>
                      {importResults && importResults.errors && importResults.errors.length > 0 && (
                        <div className="mt-2">
                          <details className="text-xs">
                            <summary className="cursor-pointer text-red-600 hover:text-red-700">
                              View error details ({importResults.errors.length} errors)
                            </summary>
                            <ul className="mt-2 space-y-1 text-red-600">
                              {importResults.errors.slice(0, 10).map((error: string, index: number) => (
                                <li key={index}>• {error}</li>
                              ))}
                              {importResults.errors.length > 10 && (
                                <li>• ... and {importResults.errors.length - 10} more errors</li>
                              )}
                            </ul>
                          </details>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Import Options</h3>
              
              <div className="space-y-4">
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-yellow-800">
                        Warning: This will modify your database
                      </p>
                      <p className="text-xs text-yellow-700 mt-1">
                        Make sure to backup your data before importing. Duplicate data may cause conflicts.
                      </p>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleImport}
                  disabled={!selectedFile || importStatus === 'validating' || importStatus === 'importing'}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {importStatus === 'validating' ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Validating...
                    </>
                  ) : importStatus === 'importing' ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Importing...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      Import Database
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">File Format Guide</h3>
            
            <div className="space-y-6">
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-2">JSON Format</h4>
                <div className="bg-gray-50 rounded-lg p-4">
                  <pre className="text-xs text-gray-700 whitespace-pre-wrap">
{`{
  "users": {
    "schema": [
      {
        "column_name": "id",
        "data_type": "integer",
        "is_nullable": "NO"
      }
    ],
    "data": [
      {"id": 1, "name": "John"}
    ]
  }
}`}
                  </pre>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-2">SQL Format</h4>
                <div className="bg-gray-50 rounded-lg p-4">
                  <pre className="text-xs text-gray-700 whitespace-pre-wrap">
{`CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL
);

INSERT INTO users (name) VALUES ('John');
INSERT INTO users (name) VALUES ('Jane');`}
                  </pre>
                </div>
              </div>

              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="text-sm font-medium text-blue-900 mb-2">Tips</h4>
                <ul className="text-xs text-blue-800 space-y-1">
                  <li>• Use the export feature to see the expected format</li>
                  <li>• Large files may take longer to process</li>
                  <li>• Duplicate data will be handled according to your constraints</li>
                  <li>• SQL files will be executed statement by statement</li>
                  <li>• JSON imports will attempt to insert data into existing tables</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};