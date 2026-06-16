/**
 * Excel Export Utility (Premium Feature)
 * Generates CSV data that can be opened in Excel
 */

export function generateCSV(
    columns: { key: string; title: string }[],
    data: Record<string, unknown>[],
): string {
    // BOM for UTF-8 encoding in Excel
    const BOM = '\uFEFF';

    // Header row
    const header = columns.map(col => `"${col.title}"`).join(',');

    // Data rows
    const rows = data.map(row =>
        columns.map(col => {
            const value = row[col.key];
            if (value === null || value === undefined) return '""';
            const strValue = String(value).replace(/"/g, '""');
            return `"${strValue}"`;
        }).join(',')
    );

    return BOM + [header, ...rows].join('\n');
}

export function downloadCSV(csv: string, filename: string) {
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
}

// Preset export configs
export const EXPORT_CONFIGS = {
    tenants: {
        columns: [
            { key: 'full_name', title: 'Họ và tên' },
            { key: 'phone', title: 'Số điện thoại' },
            { key: 'email', title: 'Email' },
            { key: 'id_number', title: 'CCCD/CMND' },
            { key: 'permanent_address', title: 'Địa chỉ thường trú' },
            { key: 'is_active', title: 'Trạng thái' },
        ],
        filename: 'danh_sach_khach_thue',
    },
    invoices: {
        columns: [
            { key: 'invoice_number', title: 'Mã hoá đơn' },
            { key: 'room_name', title: 'Phòng' },
            { key: 'tenant_name', title: 'Khách thuê' },
            { key: 'total_amount', title: 'Tổng tiền' },
            { key: 'status', title: 'Trạng thái' },
            { key: 'due_date', title: 'Hạn thanh toán' },
            { key: 'paid_date', title: 'Ngày thanh toán' },
        ],
        filename: 'danh_sach_hoa_don',
    },
    rooms: {
        columns: [
            { key: 'name', title: 'Tên phòng' },
            { key: 'floor', title: 'Tầng' },
            { key: 'area_m2', title: 'Diện tích (m²)' },
            { key: 'room_type', title: 'Loại phòng' },
            { key: 'default_rent', title: 'Giá thuê' },
            { key: 'status', title: 'Trạng thái' },
        ],
        filename: 'danh_sach_phong',
    },
    incidents: {
        columns: [
            { key: 'title', title: 'Tiêu đề' },
            { key: 'room_name', title: 'Phòng' },
            { key: 'priority', title: 'Ưu tiên' },
            { key: 'status', title: 'Trạng thái' },
            { key: 'description', title: 'Mô tả' },
            { key: 'created_at', title: 'Ngày tạo' },
        ],
        filename: 'danh_sach_su_co',
    },
};
