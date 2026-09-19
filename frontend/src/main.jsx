import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('App Crash caught by ErrorBoundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#f8fafc',
          padding: '24px',
          fontFamily: 'system-ui, sans-serif'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '32px',
            maxWidth: '480px',
            width: '100%',
            boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
            textAlign: 'center'
          }}>
            <h2 style={{ color: '#0f172a', marginBottom: '8px' }}>Something went wrong</h2>
            <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '20px' }}>
              {this.state.error?.message || 'An unexpected error occurred in the clinic UI.'}
            </p>
            <button
              onClick={() => window.location.reload()}
              style={{
                background: '#0284c7',
                color: 'white',
                border: 'none',
                padding: '10px 24px',
                borderRadius: '9999px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
