import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AuthProvider } from "@/contexts/mock-auth-context";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
    display: 'swap',
});

const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
    display: 'swap',
});

export const viewport: Viewport = {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 5,
    userScalable: true,
    themeColor: [
        { media: '(prefers-color-scheme: light)', color: '#ffffff' },
        { media: '(prefers-color-scheme: dark)', color: '#0f172a' },
    ],
};

export const metadata: Metadata = {
    title: {
        default: "Async Code - AI Code Automation",
        template: "%s | Async Code"
    },
    description: "Manage parallel AI code agents (Codex & Claude) for automated development",
    keywords: ["AI", "automation", "code generation", "Claude", "Codex"],
    authors: [{ name: "Async Code Team" }],
    creator: "Async Code",
    publisher: "Async Code",
    formatDetection: {
        email: false,
        address: false,
        telephone: false,
    },
    manifest: "/manifest.json",
    appleWebApp: {
        capable: true,
        statusBarStyle: "default",
        title: "Async Code",
    },
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" className="scroll-smooth">
            <body
                className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen`}
            >
                <AuthProvider>
                    {children}
                    <Toaster 
                        position="top-center"
                        expand={false}
                        richColors
                        closeButton
                    />
                </AuthProvider>
            </body>
        </html>
    );
}
