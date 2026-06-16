import type { ThemeConfig } from 'antd';

const theme: ThemeConfig = {
    cssVar: true,
    token: {
        fontSize: 14,
        colorPrimary: '#0D9488',
        colorInfo: '#0D9488',
        colorSuccess: '#22c55e',
        colorWarning: '#f59e0b',
        colorError: '#ef4444',
        borderRadius: 10,
        wireframe: false,
        fontFamily:
            'var(--font-inter), -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        colorBgContainer: '#ffffff',
        colorBgLayout: '#f0f2f5',
    },
    components: {
        Button: {
            borderRadius: 8,
            controlHeight: 40,
            fontWeight: 500,
        },
        Layout: {
            siderBg: '#0f172a',
            headerBg: '#ffffff',
            bodyBg: '#f0f2f5',
        },
        Menu: {
            darkItemBg: '#0f172a',
            darkItemSelectedBg: 'rgba(13, 148, 136, 0.2)',
            darkItemSelectedColor: '#5eead4',
            darkItemHoverBg: 'rgba(255, 255, 255, 0.06)',
            darkItemColor: 'rgba(255, 255, 255, 0.65)',
            itemBorderRadius: 8,
            itemMarginInline: 8,
            iconSize: 18,
        },
        Card: {
            borderRadiusLG: 12,
            boxShadowTertiary:
                '0 1px 2px 0 rgba(0, 0, 0, 0.03), 0 1px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px 0 rgba(0, 0, 0, 0.02)',
        },
        Table: {
            borderRadius: 8,
            headerBg: '#f8fafc',
        },
        Input: {
            borderRadius: 8,
            controlHeight: 40,
        },
        Tag: {
            borderRadiusSM: 6,
        },
        Statistic: {
            contentFontSize: 28,
        },
    },
};

export default theme;
