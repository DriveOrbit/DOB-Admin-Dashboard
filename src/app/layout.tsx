import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/contexts/AuthContext";

export const metadata: Metadata = {
    title: "DriveOrbit Admin Dashboard",
    description: "A modern admin dashboard built with Next.js",
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en">
            <body className="antialiased bg-gray-900">
                <AuthProvider>
                    {children}
                </AuthProvider>
            </body>
        </html>
    );
}
