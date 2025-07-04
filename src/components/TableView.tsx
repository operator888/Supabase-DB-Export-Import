import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Save, X, RefreshCw, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { TableData, ColumnInfo } from '../types/database';

interface TableViewProps {
  tableName: string;
  tableData: TableData;
  onInsertRow: (data: Record<string, any>) => Promise<void>;
  onUpdateRow: (data: Record<string, any>, primaryKey: string, keyValue: any) => Promise<void>;
  onDeleteRow: (primaryKey: string, keyValue: any) => Promise<void>;
  onRefresh: () => void;
  loading: boolean;
}

export const TableView: React.FC<TableViewProps> = ({
  tableName,
  tableData,
  onInsertRow,
  onUpdateRow,
  onDeleteRow,
  onRefresh,
  loading
}) => {
  const [editingRow, setEditingRow] = useState<number | null>(null);
  const [editingData, setEditingData] = useState<Record<string, any>>({});
  const [isCreating, setIsCreating] = useState(false);
  const [newRowData, setNewRowData] = useState<Record<string, any>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [error, setError] = useState<string | null>(null);

  const rowsPerPage = 50;
  const primaryKey = tableData.columns.find(col => 
    col.column_name === 'id' || 
    col.column_name.includes('id') ||
    col.column_default?.includes('gen_random_uuid')
  )?.column_name || tableData.columns[0]?.column_name || '';

  useEffect(() => {
    // Initialize new row data with default values
    const initialData: Record<string, any> = {};
    tableData.columns.forEach(col => {
      if (col.column_default) {
        // Don't set defaults for auto-generated fields
        if (!col.column_default.includes('gen_random_uuid') && 
            !col.column_default.includes('nextval')) {
          initialData[col.column_name] = '';
        }
      } else {
        initialData[col.column_name] = '';
      }
    });
    setNewRowData(initialData);
  }, [tableData.columns]);

  const filteredRows = tableData.rows.filter(row =>
    Object.values(row).some(value =>
      String(value).toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const totalPages = Math.ceil(filteredRows.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const paginatedRows = filteredRows.slice(startIndex, startIndex + rowsPerPage);

  const handleEdit = (rowIndex: number, row: Record<string, any>) => {
    setEditingRow(rowIndex);
    setEditingData({ ...row });
    setError(null);
  };

  const handleSave = async (rowIndex: number) => {
    try {
      setError(null);
      const originalRow = paginatedRows[rowIndex];
      await onUpdateRow(editingData, primaryKey, originalRow[primaryKey]);
      setEditingRow(null);
      setEditingData({});
      onRefresh();
    } catch (error) {
      setError('Failed to update row: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  const handleDelete = async (row: Record<string, any>) => {
    if (window.confirm('Are you sure you want to delete this row? This action cannot be undone.')) {
      try {
        setError(null);
        await onDeleteRow(primaryKey, row[primaryKey]);
        onRefresh();
      } catch (error) {
        setError('Failed to delete row: ' + (error instanceof Error ? error.message : 'Unknown error'));
      }
    }
  };

  const handleCreate = async () => {
    try {
      setError(null);
      await onInsertRow(newRowData);
      setIsCreating(false);
      setNewRowData({});
      onRefresh();
    } catch (error) {
      setError('Failed to create row: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  const formatValue = (value: any, dataType: string): string => {
    if (value === null || value === undefined) return '';
    if (dataType.includes('json') || dataType.includes('jsonb')) {
      return typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value);
    }
    if (typeof value === 'object') return JSON.stringify(value);
    if (dataType.includes('timestamp') || dataType.includes('date')) {
      return new Date(value).toLocaleString();
    }
    return String(value);
  };

  const parseValue = (value: string, dataType: string): any => {
    if (value === '') return null;
    
    if (dataType.includes('json') || dataType.includes('jsonb')) {
      try {
        return JSON.parse(value);
      } catch {
        return value;
      }
    }
    
    if (dataType.includes('int') || dataType.includes('serial')) {
      const num = parseInt(value);
      return isNaN(num) ? null : num;
    }
    
    if (dataType.includes('numeric') || dataType.includes('decimal') || dataType.includes('float')) {
      const num = parseFloat(value);
      return isNaN(num) ? null : num;
    }
    
    if (dataType.includes('bool')) {
      return value.toLowerCase() === 'true' || value === '1';
    }
    
    return value;
  };

  const renderCell = (
    value: any,
    column: ColumnInfo,
    isEditing: boolean,
    onChange?: (value: any) => void
  ) => {
    const displayValue = formatValue(value, column.data_type);
    
    if (isEditing && onChange) {
      if (column.data_type.includes('bool')) {
        return (
          <select
            value={value ? 'true' : 'false'}
            onChange={(e) => onChange(e.target.value === 'true')}
            className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
          >
            <option value="true">true</option>
            <option value="false">false</option>
          </select>
        );
      }
      
      if (column.data_type.includes('text') && displayValue.length > 50) {
        return (
          <textarea
            value={displayValue}
            onChange={(e) => onChange(parseValue(e.target.value, column.data_type))}
            className="w-full px-2 py-1 border border-gray-300 rounded text-sm resize-none"
            rows={3}
          />
        );
      }
      
      return (
        <input
          type={column.data_type.includes('int') || column.data_type.includes('numeric') ? 'number' : 'text'}
          value={displayValue}
          onChange={(e) => onChange(parseValue(e.target.value, column.data_type))}
          className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
        />
      );
    }

    return (
      <div className="text-sm text-gray-900 max-w-xs">
        {displayValue.length > 100 ? (
          <details className="cursor-pointer">
            <summary className="truncate">{displayValue.substring(0, 100)}...</summary>
            <pre className="mt-2 text-xs bg-gray-50 p-2 rounded whitespace-pre-wrap">
              {displayValue}
            </pre>
          </details>
        ) : (
          <span className="block truncate">{displayValue}</span>
        )}
      </div>
    );
  };

  const isAutoGeneratedField = (column: ColumnInfo): boolean => {
    return column.column_default?.includes('gen_random_uuid') ||
           column.column_default?.includes('nextval') ||
           column.data_type.includes('serial');
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">{tableName}</h2>
            <p className="text-sm text-gray-600">
              {tableData.totalRows} total rows • {filteredRows.length} filtered • {tableData.columns.length} columns
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsCreating(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Row
            </button>
            <button
              onClick={onRefresh}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search in table data..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          {totalPages > 1 && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm text-gray-600">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="px-6 py-3 bg-red-50 border-b border-red-200">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {tableData.columns.map((column) => (
                <th
                  key={column.column_name}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  <div className="flex flex-col">
                    <span className="flex items-center gap-1">
                      {column.column_name}
                      {column.column_name === primaryKey && (
                        <span className="text-blue-600">🔑</span>
                      )}
                    </span>
                    <span className="text-xs text-gray-400 normal-case">
                      {column.data_type}
                      {column.is_nullable === 'NO' && ' • Required'}
                      {isAutoGeneratedField(column) && ' • Auto'}
                    </span>
                  </div>
                </th>
              ))}
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {isCreating && (
              <tr className="bg-blue-50">
                {tableData.columns.map((column) => (
                  <td key={column.column_name} className="px-6 py-4 whitespace-nowrap">
                    {isAutoGeneratedField(column) ? (
                      <span className="text-gray-400 text-sm italic">Auto-generated</span>
                    ) : (
                      <input
                        type={column.data_type.includes('int') || column.data_type.includes('numeric') ? 'number' : 'text'}
                        value={newRowData[column.column_name] || ''}
                        onChange={(e) => setNewRowData(prev => ({
                          ...prev,
                          [column.column_name]: parseValue(e.target.value, column.data_type)
                        }))}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                        placeholder={column.is_nullable === 'NO' ? 'Required' : 'Optional'}
                      />
                    )}
                  </td>
                ))}
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex items-center gap-2 justify-end">
                    <button
                      onClick={handleCreate}
                      className="text-green-600 hover:text-green-900 transition-colors"
                      title="Save"
                    >
                      <Save className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setIsCreating(false)}
                      className="text-gray-400 hover:text-gray-600 transition-colors"
                      title="Cancel"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            )}
            {paginatedRows.map((row, rowIndex) => (
              <tr key={row[primaryKey] || rowIndex} className="hover:bg-gray-50 transition-colors">
                {tableData.columns.map((column) => (
                  <td key={column.column_name} className="px-6 py-4">
                    {renderCell(
                      editingRow === rowIndex ? editingData[column.column_name] : row[column.column_name],
                      column,
                      editingRow === rowIndex,
                      editingRow === rowIndex ? (value) => setEditingData(prev => ({
                        ...prev,
                        [column.column_name]: value
                      })) : undefined
                    )}
                  </td>
                ))}
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex items-center gap-2 justify-end">
                    {editingRow === rowIndex ? (
                      <>
                        <button
                          onClick={() => handleSave(rowIndex)}
                          className="text-green-600 hover:text-green-900 transition-colors"
                          title="Save changes"
                        >
                          <Save className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setEditingRow(null);
                            setEditingData({});
                            setError(null);
                          }}
                          className="text-gray-400 hover:text-gray-600 transition-colors"
                          title="Cancel"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => handleEdit(rowIndex, row)}
                          className="text-blue-600 hover:text-blue-900 transition-colors"
                          title="Edit row"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(row)}
                          className="text-red-600 hover:text-red-900 transition-colors"
                          title="Delete row"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {paginatedRows.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">
            {searchTerm ? 'No rows match your search criteria.' : 'No data found in this table.'}
          </p>
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="mt-2 text-blue-600 hover:text-blue-700 text-sm"
            >
              Clear search
            </button>
          )}
        </div>
      )}
    </div>
  );
};