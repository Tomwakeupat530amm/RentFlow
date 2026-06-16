/**
 * CSS-only loading spinner for auth pages.
 * Zero JS — renders instantly.
 */
export default function AuthLoading() {
    return (
        <div
            style={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#f0f2f5',
            }}
        >
            <div className="auth-spinner" />
            <style>{`
        .auth-spinner {
          width: 40px;
          height: 40px;
          border: 3px solid #e2e8f0;
          border-top-color: #0d9488;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
        </div>
    );
}
