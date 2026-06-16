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
    title: 'RentFlow - Quản lý phòng trọ',
    description: 'Giải pháp quản lý vận hành phòng trọ chuyên nghiệp bằng phần mềm',
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

