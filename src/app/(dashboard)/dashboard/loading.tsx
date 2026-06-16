/**
 * CSS-only loading skeleton for Dashboard.
 * Uses no Ant Design components — renders instantly with zero JS.
 */
export default function DashboardLoading() {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {/* Header skeleton */}
            <div>
                <div className="skeleton-block" style={{ width: 280, height: 28, borderRadius: 6 }} />
                <div className="skeleton-block" style={{ width: 420, height: 16, borderRadius: 4, marginTop: 8 }} />
            </div>

            {/* Stat cards skeleton */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} style={{ background: '#fff', borderRadius: 12, padding: '20px 24px' }}>
                        <div className="skeleton-block" style={{ width: 100, height: 14, borderRadius: 4 }} />
                        <div className="skeleton-block" style={{ width: 60, height: 32, borderRadius: 6, marginTop: 12 }} />
                    </div>
                ))}
            </div>

            {/* Content skeleton */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16 }}>
                <div style={{ background: '#fff', borderRadius: 12, padding: 24 }}>
                    <div className="skeleton-block" style={{ width: 160, height: 18, borderRadius: 4, marginBottom: 16 }} />
                    {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="skeleton-block" style={{ height: 40, borderRadius: 4, marginBottom: 8 }} />
                    ))}
                </div>
                <div style={{ background: '#fff', borderRadius: 12, padding: 24 }}>
                    <div className="skeleton-block" style={{ width: 140, height: 18, borderRadius: 4, marginBottom: 16 }} />
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="skeleton-block" style={{ height: 48, borderRadius: 4, marginBottom: 12 }} />
                    ))}
                </div>
            </div>
        </div>
    );
}
