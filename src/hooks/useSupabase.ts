import { useState, useCallback } from 'react';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { DatabaseConnection, TableInfo, ColumnInfo, TableData } from '../types/database';

export const useSupabase = () => {
  const [client, setClient] = useState<SupabaseClient | null>(null);
  const [connection, setConnection] = useState<DatabaseConnection | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const connect = useCallback(async (connectionData: DatabaseConnection) => {
    setLoading(true);
    setError(null);
    
    try {
      // Validate URL format
      if (!connectionData.url.includes('supabase.co')) {
        throw new Error('Please enter a valid Supabase URL');
      }

      const supabase = createClient(connectionData.url, connectionData.apiKey);
      
      // Test connection by trying to access the REST API schema
      try {
        const response = await fetch(`${connectionData.url}/rest/v1/`, {
          headers: {
            'apikey': connectionData.apiKey,
            'Authorization': `Bearer ${connectionData.apiKey}`,
            'Accept': 'application/json'
          }
        });
        
        if (!response.ok) {
          throw new Error(`Connection failed: ${response.status} ${response.statusText}`);
        }
      } catch (testErr) {
        throw new Error('Unable to connect to Supabase. Please check your URL and API key.');
      }
      
      setClient(supabase);
      setConnection(connectionData);
      setIsConnected(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Connection failed');
    } finally {
      setLoading(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    setClient(null);
    setConnection(null);
    setIsConnected(false);
    setError(null);
  }, []);

  const getTables = useCallback(async (): Promise<TableInfo[]> => {
    if (!client || !connection) throw new Error('Not connected');
    
    try {
      console.log('Discovering tables...');
      
      // Method 1: Get all available endpoints from the OpenAPI schema
      const response = await fetch(`${connection.url}/rest/v1/`, {
        headers: {
          'apikey': connection.apiKey,
          'Authorization': `Bearer ${connection.apiKey}`,
          'Accept': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch schema: ${response.status}`);
      }
      
      const schema = await response.json();
      const discoveredTables: TableInfo[] = [];
      
      // Parse OpenAPI schema to extract all table endpoints
      if (schema.paths) {
        console.log('Found paths in schema:', Object.keys(schema.paths));
        
        Object.keys(schema.paths).forEach(path => {
          // Match paths like /tablename (but not /rpc/functionname)
          const match = path.match(/^\/([a-zA-Z_][a-zA-Z0-9_]*)$/);
          if (match && match[1] !== 'rpc') {
            const tableName = match[1];
            console.log('Found table:', tableName);
            discoveredTables.push({
              table_name: tableName,
              table_schema: 'public',
              table_type: 'BASE TABLE'
            });
          }
        });
      }
      
      // Method 2: If OpenAPI parsing didn't work, try to discover by testing endpoints
      if (discoveredTables.length === 0) {
        console.log('OpenAPI parsing failed, trying endpoint discovery...');
        
        // Get a list of potential table names by trying common patterns
        const potentialTables = [
          'users', 'profiles', 'posts', 'comments', 'products', 'orders', 'todos', 'items',
          'categories', 'tags', 'files', 'uploads', 'settings', 'notifications', 'messages',
          'events', 'bookings', 'payments', 'invoices', 'customers', 'suppliers', 'inventory',
          'articles', 'pages', 'media', 'galleries', 'reviews', 'ratings', 'favorites',
          'subscriptions', 'plans', 'transactions', 'logs', 'analytics', 'reports',
          'teams', 'organizations', 'projects', 'tasks', 'issues', 'milestones',
          'contacts', 'addresses', 'phones', 'emails', 'documents', 'attachments'
        ];
        
        // Test each potential table name
        for (const tableName of potentialTables) {
          try {
            const { data, error } = await client
              .from(tableName)
              .select('*')
              .limit(1);
            
            if (!error) {
              console.log('Discovered table via testing:', tableName);
              discoveredTables.push({
                table_name: tableName,
                table_schema: 'public',
                table_type: 'BASE TABLE'
              });
            }
          } catch (err) {
            // Table doesn't exist or no access, continue
          }
        }
      }
      
      // Method 3: Try to use PostgREST introspection if available
      if (discoveredTables.length === 0) {
        console.log('Trying PostgREST introspection...');
        
        try {
          // Some Supabase instances expose table information via special endpoints
          const introspectionResponse = await fetch(`${connection.url}/rest/v1/?select=table_name`, {
            headers: {
              'apikey': connection.apiKey,
              'Authorization': `Bearer ${connection.apiKey}`,
              'Accept': 'application/json'
            }
          });
          
          if (introspectionResponse.ok) {
            const introspectionData = await introspectionResponse.json();
            console.log('Introspection data:', introspectionData);
          }
        } catch (introspectionErr) {
          console.log('Introspection failed:', introspectionErr);
        }
      }
      
      // Method 4: Brute force discovery with alphabet combinations
      if (discoveredTables.length === 0) {
        console.log('Trying brute force discovery...');
        
        const commonPrefixes = ['', 'app_', 'user_', 'admin_', 'public_', 'data_'];
        const commonSuffixes = ['', 's', '_data', '_info', '_details', '_records'];
        const commonWords = [
          'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z',
          'data', 'info', 'list', 'item', 'record', 'entry', 'log', 'event', 'action', 'status', 'type', 'kind', 'group', 'set'
        ];
        
        for (const prefix of commonPrefixes) {
          for (const word of commonWords) {
            for (const suffix of commonSuffixes) {
              const tableName = prefix + word + suffix;
              if (tableName.length > 0 && tableName.length <= 20) {
                try {
                  const { data, error } = await client
                    .from(tableName)
                    .select('*')
                    .limit(1);
                  
                  if (!error) {
                    console.log('Discovered table via brute force:', tableName);
                    discoveredTables.push({
                      table_name: tableName,
                      table_schema: 'public',
                      table_type: 'BASE TABLE'
                    });
                  }
                } catch (err) {
                  // Continue
                }
              }
            }
          }
        }
      }
      
      console.log('Total discovered tables:', discoveredTables.length);
      
      // Remove duplicates
      const uniqueTables = discoveredTables.filter((table, index, self) => 
        index === self.findIndex(t => t.table_name === table.table_name)
      );
      
      return uniqueTables;
    } catch (err) {
      console.error('Table discovery error:', err);
      throw new Error('Failed to load tables: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  }, [client, connection]);

  const getColumns = useCallback(async (tableName: string): Promise<ColumnInfo[]> => {
    if (!client) throw new Error('Not connected');
    
    try {
      // Get column information by querying the table and examining the first row
      const { data: sampleData, error: sampleError } = await client
        .from(tableName)
        .select('*')
        .limit(1);
      
      if (sampleError) {
        throw new Error(`Cannot access table "${tableName}": ${sampleError.message}`);
      }
      
      // Infer columns from sample data
      if (sampleData && sampleData.length > 0) {
        const sampleRow = sampleData[0];
        return Object.keys(sampleRow).map((key, index) => ({
          column_name: key,
          data_type: inferDataType(sampleRow[key]),
          is_nullable: 'YES',
          column_default: null,
          ordinal_position: index + 1
        }));
      } else {
        // If no data, try to get an empty result to see the structure
        const { data: emptyData, error: emptyError } = await client
          .from(tableName)
          .select('*')
          .limit(0);
        
        if (!emptyError && emptyData !== null) {
          // Even with no rows, we might get column information
          return [];
        }
        
        throw new Error(`Table "${tableName}" appears to be empty and column structure cannot be determined`);
      }
    } catch (err) {
      throw new Error('Failed to load columns: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  }, [client]);

  const inferDataType = (value: any): string => {
    if (value === null || value === undefined) return 'text';
    if (typeof value === 'boolean') return 'boolean';
    if (typeof value === 'number') {
      return Number.isInteger(value) ? 'integer' : 'numeric';
    }
    if (typeof value === 'string') {
      // Check if it looks like a UUID
      if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)) {
        return 'uuid';
      }
      // Check if it looks like a timestamp
      if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value)) {
        return 'timestamp with time zone';
      }
      return 'text';
    }
    if (typeof value === 'object') return 'jsonb';
    return 'text';
  };

  const getTableData = useCallback(async (
    tableName: string,
    page: number = 1,
    limit: number = 50
  ): Promise<TableData> => {
    if (!client) throw new Error('Not connected');
    
    try {
      const offset = (page - 1) * limit;
      
      const [columnsResult, dataResult, countResult] = await Promise.all([
        getColumns(tableName),
        client.from(tableName).select('*').range(offset, offset + limit - 1),
        client.from(tableName).select('*', { count: 'exact', head: true })
      ]);
      
      if (dataResult.error) throw dataResult.error;
      if (countResult.error) throw countResult.error;
      
      return {
        columns: columnsResult,
        rows: dataResult.data || [],
        totalRows: countResult.count || 0
      };
    } catch (err) {
      throw new Error('Failed to load table data: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  }, [client, getColumns]);

  const insertRow = useCallback(async (tableName: string, rowData: Record<string, any>) => {
    if (!client) throw new Error('Not connected');
    
    try {
      // Clean up empty strings and convert to appropriate types
      const cleanedData = Object.entries(rowData).reduce((acc, [key, value]) => {
        if (value === '') {
          acc[key] = null;
        } else {
          acc[key] = value;
        }
        return acc;
      }, {} as Record<string, any>);

      const { error } = await client.from(tableName).insert(cleanedData);
      if (error) throw error;
    } catch (err) {
      throw new Error('Failed to insert row: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  }, [client]);

  const updateRow = useCallback(async (
    tableName: string,
    rowData: Record<string, any>,
    primaryKey: string,
    keyValue: any
  ) => {
    if (!client) throw new Error('Not connected');
    
    try {
      // Clean up empty strings and convert to appropriate types
      const cleanedData = Object.entries(rowData).reduce((acc, [key, value]) => {
        if (value === '') {
          acc[key] = null;
        } else {
          acc[key] = value;
        }
        return acc;
      }, {} as Record<string, any>);

      const { error } = await client
        .from(tableName)
        .update(cleanedData)
        .eq(primaryKey, keyValue);
      
      if (error) throw error;
    } catch (err) {
      throw new Error('Failed to update row: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  }, [client]);

  const deleteRow = useCallback(async (
    tableName: string,
    primaryKey: string,
    keyValue: any
  ) => {
    if (!client) throw new Error('Not connected');
    
    try {
      const { error } = await client
        .from(tableName)
        .delete()
        .eq(primaryKey, keyValue);
      
      if (error) throw error;
    } catch (err) {
      throw new Error('Failed to delete row: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  }, [client]);

  const executeSQL = useCallback(async (query: string) => {
    if (!client) throw new Error('Not connected');
    
    try {
      // Note: Direct SQL execution is not available without custom RPC functions
      // This would require creating a custom function in your Supabase database
      throw new Error('Direct SQL execution requires custom database functions. Please use the table interface instead.');
    } catch (err) {
      throw new Error('SQL execution not available: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  }, [client]);

  return {
    client,
    connection,
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
    deleteRow,
    executeSQL
  };
};