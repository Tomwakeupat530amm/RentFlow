'use client';

import React, { useState, useCallback } from 'react';
import { Input } from 'antd';
import { SearchOutlined } from '@ant-design/icons';

interface SearchInputProps {
    /** Placeholder text */
    placeholder?: string;
    /** Callback when search value changes (debounced) */
    onSearch: (value: string) => void;
    /** Debounce delay in ms */
    debounceMs?: number;
    /** Additional CSS styles */
    style?: React.CSSProperties;
    /** Tailwind classes */
    className?: string;
    /** Allow clearing the input */
    allowClear?: boolean;
}

/**
 * Search input with built-in debounce. Prevents excessive API calls
 * when users type quickly. Used in table headers for filtering data.
 */
export default function SearchInput({
    placeholder = 'Tìm kiếm...',
    onSearch,
    debounceMs = 300,
    style,
    className,
    allowClear = true,
}: SearchInputProps) {
    const [timerId, setTimerId] = useState<NodeJS.Timeout | null>(null);

    const handleChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const value = e.target.value;

            if (timerId) {
                clearTimeout(timerId);
            }

            const newTimer = setTimeout(() => {
                onSearch(value);
            }, debounceMs);

            setTimerId(newTimer);
        },
        [onSearch, debounceMs, timerId]
    );

    return (
        <Input
            prefix={<SearchOutlined style={{ color: '#94a3b8' }} />}
            placeholder={placeholder}
            onChange={handleChange}
            allowClear={allowClear}
            className={className}
            style={{
                borderRadius: 8,
                ...style,
            }}
        />
    );
}
