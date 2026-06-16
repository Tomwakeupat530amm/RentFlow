/**
 * CSS-only loading skeleton for module pages.
 * Renders instantly — zero JS, zero Ant Design imports.
 */
export default function ModuleLoading() {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {/* Breadcrumb skeleton */}
            <div className="skeleton-block" style={{ width: 200, height: 14, borderRadius: 4 }} />

            {/* PageHeader skeleton */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <div className="skeleton-block" style={{ width: 200, height: 28, borderRadius: 6 }} />
                    <div className="skeleton-block" style={{ width: 320, height: 16, borderRadius: 4, marginTop: 6 }} />
                </div>
                <div className="skeleton-block" style={{ width: 140, height: 40, borderRadius: 8 }} />
            </div>

            {/* Content skeleton */}
            <div style={{ background: '#fff', borderRadius: 12, padding: 24 }}>
                <div className="skeleton-block" style={{ height: 40, borderRadius: 6, marginBottom: 16 }} />
                {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="skeleton-block" style={{ height: 44, borderRadius: 4, marginBottom: 8 }} />
                ))}
            </div>
        </div>
    );
}
