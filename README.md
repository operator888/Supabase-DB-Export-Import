# Supabase DB Manager

A modern, web-based database management interface for Supabase databases. Built with React, TypeScript, and Tailwind CSS, this application provides a comprehensive solution for managing your Supabase database tables with an intuitive user interface.

![Supabase DB Manager](https://images.pexels.com/photos/1181671/pexels-photo-1181671.jpeg?auto=compress&cs=tinysrgb&w=1200&h=400&fit=crop)

## 🚀 Features

### Core Functionality
- **Universal Database Connection**: Connect to any Supabase database using URL and API key
- **Intelligent Table Discovery**: Advanced table detection using multiple discovery methods
- **Complete CRUD Operations**: Create, read, update, and delete records with full validation
- **Smart Data Type Inference**: Automatically detects and handles various data types
- **Real-time Data Management**: Live updates and refresh capabilities

### Advanced Features
- **Export Capabilities**: Export database schema and data in JSON or SQL formats
- **Import Functionality**: Import data from JSON and SQL files with validation
- **Search & Pagination**: Efficient data browsing with search and pagination
- **Responsive Design**: Works seamlessly across desktop, tablet, and mobile devices
- **Error Handling**: Comprehensive error handling with user-friendly messages

### User Experience
- **Modern UI**: Clean, professional interface with smooth animations
- **Intuitive Navigation**: Easy-to-use sidebar navigation and table selection
- **Visual Feedback**: Loading states, progress indicators, and status messages
- **Data Visualization**: Smart formatting for different data types (JSON, timestamps, UUIDs)

## 🛠️ Technical Architecture

### Frontend Stack
- **React 18**: Modern React with hooks and functional components
- **TypeScript**: Full type safety and enhanced developer experience
- **Tailwind CSS**: Utility-first CSS framework for rapid UI development
- **Vite**: Fast build tool and development server
- **Lucide React**: Beautiful, customizable icons

### Backend Integration
- **Supabase Client**: Official Supabase JavaScript client
- **REST API**: Direct integration with Supabase REST API
- **PostgREST**: Leverages PostgREST for database operations

### Key Components

#### Connection Management (`useSupabase` Hook)
- Handles Supabase client initialization and connection management
- Implements multiple table discovery strategies
- Provides unified interface for all database operations

#### Table Discovery System
The application uses a sophisticated multi-method approach to discover tables:

1. **OpenAPI Schema Parsing**: Analyzes Supabase's auto-generated OpenAPI schema
2. **Endpoint Testing**: Tests common table name patterns
3. **PostgREST Introspection**: Attempts to use PostgREST's introspection capabilities
4. **Brute Force Discovery**: Systematic testing of potential table names

#### Data Type System
- **Automatic Type Inference**: Determines data types from sample data
- **Smart Formatting**: Context-aware display formatting for different data types
- **Type Conversion**: Handles conversion between display and storage formats

### File Structure
```
src/
├── components/           # React components
│   ├── ConnectionForm.tsx    # Database connection interface
│   ├── Sidebar.tsx          # Navigation and table listing
│   ├── TableView.tsx        # Main table data interface
│   ├── ExportView.tsx       # Database export functionality
│   └── ImportView.tsx       # Database import functionality
├── hooks/               # Custom React hooks
│   └── useSupabase.ts       # Supabase integration hook
├── types/               # TypeScript type definitions
│   └── database.ts          # Database-related types
└── App.tsx             # Main application component
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm
- A Supabase project with database access
- Supabase URL and API key (anon or service_role)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd supabase-db-manager
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to `http://localhost:5173`

### Configuration

1. **Get your Supabase credentials**
   - Go to your Supabase project dashboard
   - Navigate to Settings → API
   - Copy your Project URL and API key

2. **Connect to your database**
   - Enter your Supabase URL (e.g., `https://your-project.supabase.co`)
   - Enter your API key (anon key for read-only, service_role for full access)
   - Optionally provide a connection name for easy identification

## 📖 Usage Guide

### Connecting to a Database
1. Launch the application
2. Enter your Supabase URL and API key
3. Click "Connect to Database"
4. Wait for table discovery to complete

### Managing Table Data
1. Select a table from the sidebar
2. View, edit, or delete existing records
3. Add new records using the "Add Row" button
4. Use search functionality to find specific data
5. Navigate through pages for large datasets

### Exporting Data
1. Click "Export" in the sidebar
2. Select tables to export
3. Choose format (JSON or SQL)
4. Configure options (schema, data)
5. Click "Export Database" to download

### Importing Data
1. Click "Import" in the sidebar
2. Upload a JSON or SQL file
3. Review the validation results
4. Click "Import Database" to proceed

## 🔧 Development

### Available Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Code Quality
- **TypeScript**: Strict type checking enabled
- **ESLint**: Comprehensive linting rules
- **Prettier**: Code formatting (recommended)

### Environment Setup
The application runs entirely in the browser and doesn't require environment variables. All configuration is done through the UI.

## 🚀 Future Improvements

### Short-term Enhancements
- **Query Builder**: Visual query construction interface
- **Schema Editor**: Visual database schema modification
- **Bulk Operations**: Multi-row operations and bulk data management
- **Data Validation**: Custom validation rules and constraints
- **Keyboard Shortcuts**: Power user keyboard navigation

### Medium-term Features
- **Relationship Visualization**: Interactive database relationship diagrams
- **Advanced Filtering**: Complex filter conditions and saved filters
- **Data Transformation**: Built-in data transformation and cleaning tools
- **Backup Scheduling**: Automated backup and restore functionality
- **User Management**: Multi-user access with role-based permissions

### Long-term Vision
- **SQL Query Interface**: Full SQL editor with syntax highlighting
- **Performance Analytics**: Database performance monitoring and optimization
- **Migration Tools**: Database migration and version control
- **API Documentation**: Auto-generated API documentation from schema
- **Plugin System**: Extensible architecture for custom functionality

### Technical Improvements
- **Offline Support**: Progressive Web App with offline capabilities
- **Real-time Collaboration**: Multi-user real-time editing
- **Advanced Caching**: Intelligent data caching and synchronization
- **Performance Optimization**: Virtual scrolling for large datasets
- **Accessibility**: Full WCAG 2.1 AA compliance

## 🤝 Contributing

### Development Guidelines
1. Follow TypeScript best practices
2. Maintain component modularity
3. Write comprehensive error handling
4. Include proper type definitions
5. Test across different Supabase configurations

### Code Style
- Use functional components with hooks
- Implement proper error boundaries
- Follow React best practices
- Maintain consistent naming conventions

## 📝 License

This project is open source and available under the [MIT License](LICENSE).

## 🆘 Support

### Common Issues
- **Connection Failed**: Verify your Supabase URL and API key
- **Tables Not Found**: Ensure your API key has proper permissions
- **Export Errors**: Check table permissions and data integrity
- **Import Failures**: Validate file format and data structure

### Getting Help
- Check the browser console for detailed error messages
- Verify Supabase project settings and permissions
- Ensure your database has the required tables and data

## 🔒 Security Considerations

- **API Key Security**: Never expose service_role keys in production
- **Data Validation**: All user inputs are validated and sanitized
- **Error Handling**: Sensitive information is not exposed in error messages
- **Connection Security**: All connections use HTTPS encryption

## 🌟 Acknowledgments

- **Supabase Team**: For the excellent database-as-a-service platform
- **React Community**: For the robust ecosystem and best practices
- **Tailwind CSS**: For the utility-first CSS framework
- **Lucide**: For the beautiful icon library

---

Built with ❤️ for the Supabase community