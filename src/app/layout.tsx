import type { Metadata } from 'next';
import { Inter, Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';
import StyledComponentsRegistry from '@/theme/AntdRegistry';
import ThemeProvider from '@/theme/ThemeProvider';

const inter = Inter({
    subsets: ['latin', 'vietnamese'],
    variable: '--font-inter',
});

const plusJakartaSans = Plus_Jakarta_Sans({
    subsets: ['latin', 'vietnamese'],
    variable: '--font-plus-jakarta',
});

export const metadata: Metadata = {
    title: 'RentFlow - Giải pháp quản lý phòng trọ',
    description: 'RentFlow giúp chủ nhà quản lý vận hành phòng trọ, căn hộ dịch vụ chuyên nghiệp, tạo hoá đơn tự động và quản lý sự cố hiệu quả.',
    keywords: ['quản lý phòng trọ', 'căn hộ dịch vụ', 'thuê nhà', 'phần mềm quản lý', 'RentFlow'],
    openGraph: {
        title: 'RentFlow - Giải pháp quản lý phòng trọ',
        description: 'RentFlow giúp chủ nhà quản lý vận hành phòng trọ, căn hộ dịch vụ chuyên nghiệp.',
        type: 'website',
        locale: 'vi_VN',
        siteName: 'RentFlow',
    },
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="vi" suppressHydrationWarning>
            <body className={`${inter.variable} ${plusJakartaSans.variable}`}>
                <StyledComponentsRegistry>
                    <ThemeProvider>
                        {children}
                    </ThemeProvider>
                </StyledComponentsRegistry>
            </body>
        </html>
    );
}

