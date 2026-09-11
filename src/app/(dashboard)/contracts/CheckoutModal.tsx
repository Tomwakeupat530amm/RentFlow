'use client';

import React, { useState, useEffect } from 'react';
import {
    Modal, Form, Input, InputNumber, DatePicker, Button, Typography,
    Divider, Space, message, Card, Popconfirm, Result,
} from 'antd';
import {
    PlusOutlined, DeleteOutlined, CopyOutlined,
    CalculatorOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import type { Contract, SettlementData, SettlementDeduction } from '@/types/database';
import { checkoutContract, getLastMeterReadings } from './actions';

interface Props {
    open: boolean;
    onClose: () => void;
    onSuccess: () => void;
    contract: Contract | null;
}

export default function CheckoutModal({ open, onClose, onSuccess, contract }: Props) {
    const [form] = Form.useForm();
    const [submitting, setSubmitting] = useState(false);
    const [completedData, setCompletedData] = useState<SettlementData | null>(null);

    // Initial meter readings
    const [oldElectric, setOldElectric] = useState<number>(0);
    const [oldWater, setOldWater] = useState<number>(0);

    // Calculations
    const [newElectric, setNewElectric] = useState<number>(0);
    const [electricPrice, setElectricPrice] = useState<number>(3500);

    const [newWater, setNewWater] = useState<number>(0);
    const [waterPrice, setWaterPrice] = useState<number>(25000);

    const [unpaidRent, setUnpaidRent] = useState<number>(0);
    const [deductions, setDeductions] = useState<SettlementDeduction[]>([]);
    const [newDeductionTitle, setNewDeductionTitle] = useState('');
    const [newDeductionAmount, setNewDeductionAmount] = useState<number>(0);

    useEffect(() => {
        if (!open || !contract) {
            setCompletedData(null);
            return;
        }

        setCompletedData(null);
        setDeductions([]);
        setUnpaidRent(0);

        getLastMeterReadings(contract.room_id).then((res) => {
            setOldElectric(res.electricity);
            setNewElectric(res.electricity);
            setOldWater(res.water);
            setNewWater(res.water);
        });

        form.setFieldsValue({
            checkout_date: dayjs(),
        });
    }, [open, contract, form]);

    if (!contract) return null;

    const deposit = Number(contract.deposit || 0);

    // Electricity
    const electricUsage = Math.max(0, newElectric - oldElectric);
    const electricAmount = electricUsage * electricPrice;

    // Water
    const waterUsage = Math.max(0, newWater - oldWater);
    const waterAmount = waterUsage * waterPrice;

    // Deductions
    const totalCustomDeductions = deductions.reduce((sum, d) => sum + Number(d.amount || 0), 0);
    const totalDeductions = electricAmount + waterAmount + unpaidRent + totalCustomDeductions;
    const refundAmount = deposit - totalDeductions;

    const handleAddDeduction = () => {
        if (!newDeductionTitle.trim()) {
            message.warning('Vui lòng nhập lý do khấu trừ (vd: Vệ sinh phòng, đền bù chốt cửa...)');
            return;
        }
        if (newDeductionAmount <= 0) {
            message.warning('Vui lòng nhập số tiền khấu trừ');
            return;
        }
        setDeductions((prev) => [...prev, { title: newDeductionTitle.trim(), amount: newDeductionAmount }]);
        setNewDeductionTitle('');
        setNewDeductionAmount(0);
    };

    const handleRemoveDeduction = (index: number) => {
        setDeductions((prev) => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async () => {
        try {
            const values = await form.validateFields();
            setSubmitting(true);

            const settlementData: SettlementData = {
                checkout_date: values.checkout_date.format('YYYY-MM-DD'),
                final_electric: {
                    old: oldElectric,
                    new: newElectric,
                    usage: electricUsage,
                    unit_price: electricPrice,
                    amount: electricAmount,
                },
                final_water: {
                    old: oldWater,
                    new: newWater,
                    usage: waterUsage,
                    unit_price: waterPrice,
                    amount: waterAmount,
                },
                unpaid_rent: unpaidRent,
                deductions,
                deposit_amount: deposit,
                total_deductions: totalDeductions,
                refund_amount: refundAmount,
                notes: values.notes || null,
                settled_at: new Date().toISOString(),
            };

            const result = await checkoutContract(contract.id, settlementData);
            if (result.error) {
                message.error(result.error);
            } else {
                message.success('Đã hoàn tất quyết toán trả phòng!');
                setCompletedData(settlementData);
                onSuccess();
            }
        } catch {
            // Validation error
        } finally {
            setSubmitting(false);
        }
    };

    const generateZaloSettlementText = (data: SettlementData) => {
        const lines: string[] = [];
        lines.push(`📑 BIÊN BẢN QUYẾT TOÁN TRẢ PHÒNG & HOÀN CỌC`);
        lines.push(`━━━━━━━━━━━━━━━━━━━━`);
        lines.push(`📍 Phòng: ${contract.room?.name || '---'}${contract.room?.building ? ` (${contract.room.building.name})` : ''}`);
        lines.push(`👤 Khách thuê: ${contract.tenant?.full_name || 'Quý khách'}`);
        lines.push(`📅 Ngày trả phòng: ${dayjs(data.checkout_date).format('DD/MM/YYYY')}`);
        lines.push(``);
        lines.push(`💰 TIỀN CỌC BAN ĐẦU: ${data.deposit_amount.toLocaleString()} đ`);
        lines.push(``);
        lines.push(`📋 CÁC KHOẢN KHẤU TRỪ PHÁT SINH:`);
        if (data.final_electric && data.final_electric.amount > 0) {
            lines.push(`• Tiền điện ngày cuối: ${data.final_electric.new} - ${data.final_electric.old} = ${data.final_electric.usage} kWh x ${data.final_electric.unit_price.toLocaleString()} đ = ${data.final_electric.amount.toLocaleString()} đ`);
        }
        if (data.final_water && data.final_water.amount > 0) {
            lines.push(`• Tiền nước ngày cuối: ${data.final_water.new} - ${data.final_water.old} = ${data.final_water.usage} m3 x ${data.final_water.unit_price.toLocaleString()} đ = ${data.final_water.amount.toLocaleString()} đ`);
        }
        if (data.unpaid_rent > 0) {
            lines.push(`• Tiền phòng lẻ / nợ cũ: ${data.unpaid_rent.toLocaleString()} đ`);
        }
        data.deductions.forEach((d) => {
            lines.push(`• ${d.title}: ${d.amount.toLocaleString()} đ`);
        });
        lines.push(`────────────────────`);
        lines.push(`🔻 TỔNG CÁC KHOẢN TRỪ: ${data.total_deductions.toLocaleString()} đ`);
        lines.push(``);
        if (data.refund_amount >= 0) {
            lines.push(`💵 SỐ TIỀN CHỦ NHÀ HOÀN LẠI CỌC: ${data.refund_amount.toLocaleString()} đ`);
        } else {
            lines.push(`⚠️ SỐ TIỀN KHÁCH CẦN THANH TOÁN BÙ: ${Math.abs(data.refund_amount).toLocaleString()} đ`);
        }
        lines.push(``);
        lines.push(`Cảm ơn bạn đã đồng hành cùng nhà trọ trong thời gian qua! Chúc bạn mọi điều may mắn! 🙏`);
        return lines.join('\n');
    };

    const handleCopyZalo = () => {
        if (!completedData) return;
        const text = generateZaloSettlementText(completedData);
        navigator.clipboard.writeText(text);
        message.success('Đã sao chép biên bản quyết toán gửi Zalo!');
    };

    return (
        <Modal
            title={
                <Space>
                    <CalculatorOutlined style={{ color: '#0d9488', fontSize: 20 }} />
                    <span>Trả Phòng & Quyết Toán Cọc - Phòng {contract.room?.name}</span>
                </Space>
            }
            open={open}
            onCancel={onClose}
            width={720}
            footer={
                completedData
                    ? [
                          <Button key="close" type="primary" onClick={onClose}>
                              Hoàn tất & Đóng
                          </Button>,
                      ]
                    : [
                          <Button key="cancel" onClick={onClose}>
                              Hủy
                          </Button>,
                          <Popconfirm
                              key="submit"
                              title="Xác nhận trả phòng?"
                              description="Thao tác này sẽ chấm dứt hợp đồng, chuyển phòng về trạng thái Trống và chốt quyết toán cọc."
                              onConfirm={handleSubmit}
                              okText="Đồng ý trả phòng"
                              cancelText="Xem lại"
                              okButtonProps={{ danger: true, loading: submitting }}
                          >
                              <Button type="primary" danger loading={submitting}>
                                  Xác nhận Quyết toán & Trả phòng
                              </Button>
                          </Popconfirm>,
                      ]
            }
        >
            {completedData ? (
                <Result
                    status="success"
                    title="Quyết toán trả phòng thành công!"
                    subTitle={`Hợp đồng đã được chuyển sang trạng thái đã thanh lý. Phòng ${contract.room?.name} đã sẵn sàng đón khách mới.`}
                    extra={[
                        <Card key="summary" className="bg-slate-50 border-slate-200 text-left mb-4">
                            <div className="flex justify-between items-center text-base mb-2">
                                <span className="font-semibold text-slate-700">Tiền cọc ban đầu:</span>
                                <span className="font-bold">{completedData.deposit_amount.toLocaleString()} đ</span>
                            </div>
                            <div className="flex justify-between items-center text-sm text-red-600 mb-2">
                                <span>Tổng các khoản khấu trừ:</span>
                                <span>-{completedData.total_deductions.toLocaleString()} đ</span>
                            </div>
                            <Divider className="my-2" />
                            <div className="flex justify-between items-center text-base">
                                <span className="font-bold text-slate-900">
                                    {completedData.refund_amount >= 0 ? 'Số tiền hoàn lại cho khách:' : 'Khách cần thanh toán bù:'}
                                </span>
                                <span className={`text-xl font-extrabold ${completedData.refund_amount >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                    {Math.abs(completedData.refund_amount).toLocaleString()} đ
                                </span>
                            </div>
                        </Card>,
                        <Button
                            key="copy"
                            type="primary"
                            icon={<CopyOutlined />}
                            size="large"
                            onClick={handleCopyZalo}
                            style={{ backgroundColor: '#0068ff' }}
                        >
                            Sao chép Biên bản gửi Zalo cho khách
                        </Button>,
                    ]}
                />
            ) : (
                <Form form={form} layout="vertical" className="space-y-4 pt-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Form.Item
                            name="checkout_date"
                            label="Ngày trả phòng thực tế"
                            rules={[{ required: true, message: 'Chọn ngày trả phòng' }]}
                        >
                            <DatePicker className="w-full" format="DD/MM/YYYY" />
                        </Form.Item>
                        <div>
                            <Typography.Text type="secondary" className="block text-xs mb-1">
                                Tiền cọc hợp đồng:
                            </Typography.Text>
                            <div className="text-lg font-bold text-teal-700 py-1 px-3 bg-teal-50 border border-teal-200 rounded-lg">
                                {deposit.toLocaleString()} đ
                            </div>
                        </div>
                    </div>

                    <Divider className="my-2">1. Chốt chỉ số Điện & Nước cuối kỳ</Divider>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-3 rounded-lg border border-slate-200">
                        {/* Electric */}
                        <div className="space-y-2">
                            <Typography.Text strong className="text-amber-700">⚡ Điện</Typography.Text>
                            <div className="flex items-center space-x-2 text-xs">
                                <span>Số cũ: <strong>{oldElectric}</strong></span>
                                <span>→ Số mới:</span>
                                <InputNumber
                                    min={oldElectric}
                                    value={newElectric}
                                    onChange={(v) => setNewElectric(Number(v || oldElectric))}
                                    size="small"
                                    className="w-24"
                                />
                            </div>
                            <div className="flex items-center space-x-2 text-xs">
                                <span>Đơn giá:</span>
                                <InputNumber
                                    value={electricPrice}
                                    onChange={(v) => setElectricPrice(Number(v || 0))}
                                    size="small"
                                    className="w-24"
                                    formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                />
                                <span>đ/kWh</span>
                            </div>
                            <div className="text-xs text-slate-600">
                                Tiêu thụ: <strong>{electricUsage} kWh</strong> → <span className="font-bold text-red-600">{electricAmount.toLocaleString()} đ</span>
                            </div>
                        </div>

                        {/* Water */}
                        <div className="space-y-2">
                            <Typography.Text strong className="text-blue-700">💧 Nước</Typography.Text>
                            <div className="flex items-center space-x-2 text-xs">
                                <span>Số cũ: <strong>{oldWater}</strong></span>
                                <span>→ Số mới:</span>
                                <InputNumber
                                    min={oldWater}
                                    value={newWater}
                                    onChange={(v) => setNewWater(Number(v || oldWater))}
                                    size="small"
                                    className="w-24"
                                />
                            </div>
                            <div className="flex items-center space-x-2 text-xs">
                                <span>Đơn giá:</span>
                                <InputNumber
                                    value={waterPrice}
                                    onChange={(v) => setWaterPrice(Number(v || 0))}
                                    size="small"
                                    className="w-24"
                                    formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                />
                                <span>đ/m3</span>
                            </div>
                            <div className="text-xs text-slate-600">
                                Tiêu thụ: <strong>{waterUsage} m3</strong> → <span className="font-bold text-red-600">{waterAmount.toLocaleString()} đ</span>
                            </div>
                        </div>
                    </div>

                    <Divider className="my-2">2. Tiền phòng lẻ & Khấu trừ tài sản</Divider>
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-sm">Tiền phòng ở lẻ / nợ cũ chưa trả:</span>
                            <InputNumber
                                value={unpaidRent}
                                onChange={(v) => setUnpaidRent(Number(v || 0))}
                                className="w-48"
                                formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                addonAfter="đ"
                            />
                        </div>

                        {/* Custom Deductions List */}
                        <div className="space-y-2">
                            <Typography.Text strong className="text-xs text-slate-700">
                                Các khoản phạt / chi phí hư hỏng / vệ sinh phòng:
                            </Typography.Text>
                            {deductions.map((d, index) => (
                                <div key={index} className="flex justify-between items-center p-2 bg-red-50 border border-red-100 rounded text-sm">
                                    <span>{d.title}</span>
                                    <Space>
                                        <span className="font-semibold text-red-600">-{d.amount.toLocaleString()} đ</span>
                                        <Button
                                            type="text"
                                            danger
                                            size="small"
                                            icon={<DeleteOutlined />}
                                            onClick={() => handleRemoveDeduction(index)}
                                        />
                                    </Space>
                                </div>
                            ))}

                            <div className="flex items-center space-x-2 pt-1">
                                <Input
                                    placeholder="Lý do khấu trừ (vd: Hỏng chốt cửa, phí dọn phòng...)"
                                    value={newDeductionTitle}
                                    onChange={(e) => setNewDeductionTitle(e.target.value)}
                                    className="flex-1"
                                />
                                <InputNumber
                                    placeholder="Số tiền"
                                    value={newDeductionAmount}
                                    onChange={(v) => setNewDeductionAmount(Number(v || 0))}
                                    className="w-36"
                                    formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                    addonAfter="đ"
                                />
                                <Button
                                    type="dashed"
                                    icon={<PlusOutlined />}
                                    onClick={handleAddDeduction}
                                >
                                    Thêm
                                </Button>
                            </div>
                        </div>
                    </div>

                    <Divider className="my-2">3. Bảng Quyết Toán Hoàn Cọc</Divider>
                    <Card size="small" className="bg-slate-900 text-white border-0 shadow-sm">
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-slate-400">Tiền cọc ban đầu:</span>
                                <span className="font-semibold text-emerald-400">+{deposit.toLocaleString()} đ</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-400">Tiền điện cuối kỳ:</span>
                                <span className="text-red-400">-{electricAmount.toLocaleString()} đ</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-400">Tiền nước cuối kỳ:</span>
                                <span className="text-red-400">-{waterAmount.toLocaleString()} đ</span>
                            </div>
                            {unpaidRent > 0 && (
                                <div className="flex justify-between">
                                    <span className="text-slate-400">Tiền phòng lẻ / nợ cũ:</span>
                                    <span className="text-red-400">-{unpaidRent.toLocaleString()} đ</span>
                                </div>
                            )}
                            {totalCustomDeductions > 0 && (
                                <div className="flex justify-between">
                                    <span className="text-slate-400">Hư hại & Phạt vi phạm ({deductions.length} mục):</span>
                                    <span className="text-red-400">-{totalCustomDeductions.toLocaleString()} đ</span>
                                </div>
                            )}
                            <Divider className="my-2 bg-slate-700" />
                            <div className="flex justify-between items-center text-base pt-1">
                                <span className="font-bold text-white">
                                    {refundAmount >= 0 ? 'SỐ TIỀN HOÀN LẠI CHO KHÁCH:' : 'KHÁCH CẦN THANH TOÁN BÙ:'}
                                </span>
                                <span className={`text-xl font-extrabold ${refundAmount >= 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
                                    {Math.abs(refundAmount).toLocaleString()} đ
                                </span>
                            </div>
                        </div>
                    </Card>

                    <Form.Item name="notes" label="Ghi chú thêm biên bản bàn giao (tùy chọn)">
                        <Input.TextArea rows={2} placeholder="Ghi chú về chìa khóa, hiện trạng phòng..." />
                    </Form.Item>
                </Form>
            )}
        </Modal>
    );
}
