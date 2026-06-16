'use client';
 
import React, { useState, useMemo } from 'react';
import dayjs from 'dayjs';
import { Button, Tooltip } from 'antd';
import { LeftOutlined, RightOutlined, PlusOutlined } from '@ant-design/icons';
import BookingModal from './BookingModal';
import type { Booking, Room } from '@/types/database';
 
interface TimelineCalendarClientProps {
    initialRooms: Room[];
    initialBookings: Booking[];
}
 
const CELL_WIDTH = 100; // px
const ROW_HEIGHT = 60; // px
 
export default function TimelineCalendarClient({ initialRooms, initialBookings }: TimelineCalendarClientProps) {
    const [baseDate, setBaseDate] = useState(dayjs());
    const [bookings, setBookings] = useState<Booking[]>(initialBookings);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedBooking, setSelectedBooking] = useState<Partial<Booking> | null>(null);

    // Sync bookings if initialBookings changes (from server revalidation)
    React.useEffect(() => {
        setBookings(initialBookings);
    }, [initialBookings]);

    // Generate 45 days timeline (15 days before baseDate, 30 days after)
    const dates = useMemo(() => {
        const arr = [];
        for (let i = -15; i <= 30; i++) {
            arr.push(baseDate.add(i, 'day'));
        }
        return arr;
    }, [baseDate]);

    const handlePrevious = () => setBaseDate(prev => prev.subtract(7, 'day'));
    const handleNext = () => setBaseDate(prev => prev.add(7, 'day'));
    const handleToday = () => setBaseDate(dayjs());

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'confirmed': return 'bg-blue-500 border-blue-600';
            case 'checked_in': return 'bg-teal-500 border-teal-600';
            case 'checked_out': return 'bg-slate-400 border-slate-500';
            case 'pending': return 'bg-amber-500 border-amber-600';
            default: return 'bg-gray-400 border-gray-500';
        }
    };

    return (
        <div className="flex flex-col h-full bg-white w-full">
            {/* Toolbar */}
            <div className="p-3 border-b flex justify-between items-center bg-white z-10">
                <div className="flex items-center gap-4">
                    <Button.Group>
                        <Button icon={<LeftOutlined />} onClick={handlePrevious} />
                        <Button onClick={handleToday}>Hôm nay</Button>
                        <Button icon={<RightOutlined />} onClick={handleNext} />
                    </Button.Group>
                    <div className="text-md font-semibold text-slate-700">
                        {dates[0].format('DD/MM/YYYY')} - {dates[dates.length - 1].format('DD/MM/YYYY')}
                    </div>
                </div>
                <div>
                    <Button type="primary" icon={<PlusOutlined />} className="bg-teal-600" onClick={() => {
                        setSelectedBooking(null);
                        setIsModalOpen(true);
                    }}>Thêm Booking</Button>
                </div>
            </div>

            {/* Timeline Container */}
            <div className="flex-1 overflow-auto relative bg-slate-50" style={{ height: 'calc(100vh - 200px)' }}>
                <div className="inline-flex min-w-full">
                    
                    {/* Fixed Left Column: Rooms */}
                    <div className="sticky left-0 z-20 bg-white border-r border-slate-200 shadow-[2px_0_5px_rgba(0,0,0,0.05)] w-48 flex-shrink-0">
                        <div className="h-14 border-b border-slate-200 flex items-center justify-center bg-slate-100 font-semibold text-slate-600">
                            Phòng
                        </div>
                        {initialRooms.map(room => (
                            <div key={room.id} className="border-b border-slate-100 px-3 flex flex-col justify-center" style={{ height: ROW_HEIGHT }}>
                                <div className="font-semibold text-slate-800 text-sm truncate">{room.name}</div>
                                <div className="text-xs text-slate-500 truncate">{room.room_type} • {room.default_rent.toLocaleString()}đ</div>
                            </div>
                        ))}
                    </div>

                    {/* Timeline Grid */}
                    <div className="relative">
                        {/* Header Dates */}
                        <div className="flex h-14 border-b border-slate-200 bg-white sticky top-0 z-10">
                            {dates.map((d, i) => (
                                <div key={i} className="flex flex-col items-center justify-center border-r border-slate-100 bg-slate-50" style={{ width: CELL_WIDTH, minWidth: CELL_WIDTH }}>
                                    <span className="text-xs font-semibold text-slate-500">{d.format('ddd')}</span>
                                    <span className={`text-sm font-bold ${d.isSame(dayjs(), 'day') ? 'text-teal-600 bg-teal-50 px-2 rounded-full' : 'text-slate-800'}`}>
                                        {d.format('DD')}
                                    </span>
                                </div>
                            ))}
                        </div>

                        {/* Room Rows & Bookings */}
                        <div className="relative bg-white">
                            {/* Grid Lines */}
                            <div className="absolute inset-0 flex pointer-events-none">
                                {dates.map((_, i) => (
                                    <div key={i} className="border-r border-slate-100 h-full" style={{ width: CELL_WIDTH, minWidth: CELL_WIDTH }} />
                                ))}
                            </div>

                            {/* Rows */}
                            {initialRooms.map(room => {
                                // Find bookings for this room
                                const roomBookings = bookings.filter(b => b.room_id === room.id);

                                return (
                                    <div key={room.id} className="relative border-b border-slate-100 flex group hover:bg-slate-50 transition-colors" style={{ height: ROW_HEIGHT }}>
                                        {dates.map((d, i) => (
                                            <div key={i} className="h-full cursor-pointer hover:bg-teal-50/50 transition-colors" style={{ width: CELL_WIDTH, minWidth: CELL_WIDTH }} />
                                        ))}

                                        {/* Render Booking Blocks */}
                                        {roomBookings.map(booking => {
                                            const checkIn = dayjs(booking.check_in_date);
                                            const checkOut = dayjs(booking.check_out_date);
                                            
                                            // Calculate position
                                            const startDiff = checkIn.diff(dates[0], 'day');
                                            const duration = checkOut.diff(checkIn, 'day');
                                            
                                            // If booking is completely outside view, don't render
                                            if (startDiff + duration < 0 || startDiff >= dates.length) return null;

                                            // Adjust for bookings partially in view
                                            const left = Math.max(0, startDiff * CELL_WIDTH);
                                            
                                            // Calculate actual rendered width
                                            let width = duration * CELL_WIDTH;
                                            
                                            // Adjust width if it starts before view
                                            if (startDiff < 0) {
                                                width = (duration + startDiff) * CELL_WIDTH;
                                            }

                                            return (
                                                <Tooltip 
                                                    key={booking.id} 
                                                    title={
                                                        <div>
                                                            <div className="font-bold">{booking.guest_name}</div>
                                                            <div>{checkIn.format('DD/MM')} - {checkOut.format('DD/MM')}</div>
                                                            <div>{booking.total_amount?.toLocaleString()}đ</div>
                                                        </div>
                                                    }
                                                >
                                                    <div 
                                                        className={`absolute top-2 bottom-2 rounded-md shadow-sm border text-white text-xs px-2 py-1 flex flex-col justify-center cursor-pointer hover:brightness-110 transition-all overflow-hidden ${getStatusColor(booking.status)}`}
                                                        style={{ 
                                                            left: `${left}px`, 
                                                            width: `${width}px`,
                                                            zIndex: 5 
                                                        }}
                                                        onClick={() => {
                                                            setSelectedBooking(booking);
                                                            setIsModalOpen(true);
                                                        }}
                                                    >
                                                        <div className="font-bold truncate">{booking.guest_name}</div>
                                                        <div className="truncate opacity-90">{booking.payment_status === 'paid' ? 'Đã TT' : 'Chưa TT'}</div>
                                                    </div>
                                                </Tooltip>
                                            );
                                        })}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
            
            {/* Status Legend */}
            <div className="p-3 bg-white border-t flex gap-4 text-xs font-medium text-slate-600">
                <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-sm bg-amber-500"></div> Chờ xác nhận</div>
                <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-sm bg-blue-500"></div> Đã xác nhận</div>
                <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-sm bg-teal-500"></div> Đang ở</div>
                <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-sm bg-slate-400"></div> Đã trả phòng</div>
            </div>

            {isModalOpen && (
                <BookingModal
                    open={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    initialData={selectedBooking}
                    rooms={initialRooms}
                />
            )}
        </div>
    );
}
