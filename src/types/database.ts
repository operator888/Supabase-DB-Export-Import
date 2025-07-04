export interface DatabaseConnection {
  url: string;
  apiKey: string;
  name?: string;
}

export interface TableInfo {
  table_name: string;
  table_schema: string;
  table_type: string;
}

export interface ColumnInfo {
  column_name: string;
  data_type: string;
  is_nullable: string;
  column_default: string | null;
  ordinal_position: number;
  character_maximum_length?: number;
  numeric_precision?: number;
  numeric_scale?: number;
}

export interface TableData {
  columns: ColumnInfo[];
  rows: Record<string, any>[];
  totalRows: number;
}

export interface ExportOptions {
  format: 'json' | 'sql';
  tables: string[];
  includeSchema: boolean;
  includeData: boolean;
}

export interface ImportResult {
  tablesProcessed?: number;
  rowsInserted?: number;
  statementsExecuted?: number;
  errors: string[];
}