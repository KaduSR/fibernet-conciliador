import { Outfit } from 'next/font/google';
import './globals.css';
import "flatpickr/dist/flatpickr.css";
import { SidebarProvider } from '@/context/SidebarContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { AppProvider } from '@/context/AppContext';

const outfit = Outfit({
  subsets: ["latin"],
});

export const metadata = {
  title: 'FiberNet Conciliador',
  description: 'Conciliação financeira IXC × Sicoob — Telecom Fiber Net Ltda',
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body className={`${outfit.className} dark:bg-gray-900`}>
        <ThemeProvider>
          <SidebarProvider>
            <AppProvider>{children}</AppProvider>
          </SidebarProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
