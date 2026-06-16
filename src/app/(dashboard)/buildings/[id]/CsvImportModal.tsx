'use client';

import React, { useState } from 'react';
import { Modal, Upload, Button, Table, Typography, Alert, message, Space } from 'antd';
import { UploadOutlined, FileExcelOutlined, DownloadOutlined } from '@ant-design/icons';
import type { RoomFormData, RoomType, RoomStatus } from '@/types/database';
import { bulkImportRooms } from './actions';

const { Text } = Typography;

interface CsvImportModalProps {
    open: boolean;
    buildingId: string;
    onClose: () => void;
    onSuccess: () => void;
}

interface ParsedRow extends RoomFormData {
    key: string;
    _error?: string;
}

// Parse CSV text into rows
function parseCsv(text: string): ParsedRow[] {
    const lines = text.trim().split('\n');
    if (lines.length < 2) return []; // Need header + at least 1 row

    const header = lines[0].toLowerCase().split(',').map((h) => h.trim());

    return lines.slice(1).map((line, idx) => {
        const values = line.split(',').map((v) => v.trim());
        const row: Record<string, string> = {};
        header.forEach((h, i) => {
            row[h] = values[i] || '';
        });

        const validTypes: RoomType[] = ['single', 'double', 'studio', 'other'];
        const validStatuses: RoomStatus[] = ['vacant', 'occupied', 'maintenance'];

        const roomType = (row.room_type || row['loai_phong'] || 'single') as RoomType;
        const status = (row.status || row['trang_thai'] || 'vacant') as RoomStatus;

        const parsed: ParsedRow = {
            key: String(idx),
            name: row.name || row['ten_phong'] || '',
            floor: parseInt(row.floor || row['tang'] || '1', 10) || 1,
            area_m2: parseFloat(row.area_m2 || row['dien_tich'] || '0') || undefined,
            room_type: validTypes.includes(roomType) ? roomType : 'single',
            default_rent: parseInt(row.default_rent || row['gia_thue'] || '0', 10) || 0,
            status: validStatuses.includes(status) ? status : 'vacant',
            notes: row.notes || row['ghi_chu'] || '',
        };

        // Validate
        if (!parsed.name) {
            parsed._error = 'Thiếu tên phòng';
        }

        return parsed;
    });
}

const previewColumns = [
    { title: 'Tên phòng', dataIndex: 'name', key: 'name' },
    { title: 'Tầng', dataIndex: 'floor', key: 'floor', width: 70 },
    { title: 'Loại', dataIndex: 'room_type', key: 'room_type', width: 80 },
    {
        title: 'Diện tích',
        dataIndex: 'area_m2',
        key: 'area_m2',
        width: 90,
        render: (v: number | undefined) => v || '—',
    },
    {
        title: 'Giá thuê',
        dataIndex: 'default_rent',
        key: 'default_rent',
        width: 110,
        render: (v: number) => (v ? new Intl.NumberFormat('vi-VN').format(v) : '—'),
    },
    { title: 'Trạng thái', dataIndex: 'status', key: 'status', width: 100 },
    {
        title: 'Lỗi',
        dataIndex: '_error',
        key: '_error',
        width: 140,
        render: (err: string | undefined) =>
            err ? <Text type="danger" style={{ fontSize: 12 }}>{err}</Text> : null,
    },
];

const CSV_TEMPLATE = `name,floor,room_type,area_m2,default_rent,status,notes
P.101,1,single,20,3500000,vacant,
P.102,1,double,30,4500000,vacant,Có ban công
P.201,2,single,20,3500000,vacant,
P.202,2,studio,35,5000000,vacant,Có bếp riêng`;

export default function CsvImportModal({ open, buildingId, onClose, onSuccess }: CsvImportModalProps) {
    const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
    const [importing, setImporting] = useState(false);
    const [fileSelected, setFileSelected] = useState(false);

    const handleFile = (file: File) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const text = e.target?.result as string;
            const rows = parseCsv(text);
            setParsedRows(rows);
            setFileSelected(true);
        };
        reader.readAsText(file);
        return false; // Prevention default upload
    };

    const handleImport = async () => {
        const valid = parsedRows.filter((r) => !r._error);
        if (valid.length === 0) {
            message.error('Không có dữ liệu hợp lệ để import');
            return;
        }

        setImporting(true);
        const result = await bulkImportRooms(
            buildingId,
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            valid.map(({ key, _error, ...data }) => data)
        );

        if (result.error) {
            message.error(result.error);
        } else {
            message.success(`Import thành công ${result.count} phòng!`);
            handleReset();
            onClose();
            onSuccess();
        }
        setImporting(false);
    };

    const handleReset = () => {
        setParsedRows([]);
        setFileSelected(false);
    };

    const handleDownloadTemplate = () => {
        const blob = new Blob([CSV_TEMPLATE], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'template_import_phong.csv';
        a.click();
        URL.revokeObjectURL(url);
    };

    const errorCount = parsedRows.filter((r) => r._error).length;
    const validCount = parsedRows.length - errorCount;

    return (
        <Modal
            open={open}
            title={
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <FileExcelOutlined style={{ color: '#0d9488' }} />
                    <span style={{ fontWeight: 700, fontSize: 16 }}>Import phòng từ CSV</span>
                </div>
            }
            width={800}
            centered
            onCancel={() => {
                handleReset();
                onClose();
            }}
            footer={
                fileSelected
                    ? [
                        <Button key="reset" onClick={handleReset}>Chọn file khác</Button>,
                        <Button
                            key="import"
                            type="primary"
                            loading={importing}
                            onClick={handleImport}
                            disabled={validCount === 0}
                        >
                            Import {validCount} phòng
                        </Button>,
                    ]
                    : null
            }
        >
            {!fileSelected ? (
                <div style={{ textAlign: 'center', padding: '24px 0' }}>
                    <div style={{ marginBottom: 16 }}>
                        <Text type="secondary">
                            Upload file CSV chứa danh sách phòng. File cần có header row với các cột:
                        </Text>
                        <div style={{
                            marginTop: 8,
                            padding: '8px 12px',
                            background: '#f8fafc',
                            borderRadius: 6,
                            fontFamily: 'monospace',
                            fontSize: 12,
                            color: '#64748b',
                        }}>
                            name, floor, room_type, area_m2, default_rent, status, notes
                        </div>
                    </div>

                    <Space direction="vertical" size={12}>
                        <Upload
                            accept=".csv,.txt"
                            showUploadList={false}
                            beforeUpload={handleFile}
                        >
                            <Button icon={<UploadOutlined />} size="large" type="primary">
                                Chọn file CSV
                            </Button>
                        </Upload>

                        <Button
                            type="link"
                            icon={<DownloadOutlined />}
                            onClick={handleDownloadTemplate}
                            style={{ fontSize: 13 }}
                        >
                            Tải file mẫu (template)
                        </Button>
                    </Space>
                </div>
            ) : (
                <div>
                    {errorCount > 0 && (
                        <Alert
                            type="warning"
                            message={`${errorCount} dòng có lỗi sẽ bị bỏ qua khi import`}
                            style={{ marginBottom: 12 }}
                            showIcon
                        />
                    )}
                    <Alert
                        type="info"
                        message={`Tìm thấy ${parsedRows.length} dòng — ${validCount} hợp lệ`}
                        style={{ marginBottom: 12 }}
                        showIcon
                    />
                    <Table
                        columns={previewColumns}
                        dataSource={parsedRows}
                        size="small"
                        pagination={false}
                        scroll={{ y: 300 }}
                        rowClassName={(record) => (record._error ? 'ant-table-row-error' : '')}
                    />
                </div>
            )}
        </Modal>
    );
}
