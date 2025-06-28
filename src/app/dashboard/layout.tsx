'use client';

import { useAuth } from '@/lib/contexts/AuthContext';
import { Spotlight } from '@/components/ui/spotlight-new';
import { Sidebar, SidebarBody, SidebarLink } from '@/components/ui/sidebar';
import { Logo } from '@/components/ui/Logo';
import { Button } from '@/components/ui/Button';
import {
    IconDashboard,
    IconChartPie,
    IconCar,
    IconUser,
    IconBell,
    IconSettings,
    IconLogout,
} from '@tabler/icons-react';
import { useState } from 'react';
import { usePathname } from 'next/navigation';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { user, logout } = useAuth();
    const [open, setOpen] = useState(false);
    const pathname = usePathname();

    const links = [
        {
            label: 'Dashboard',
            href: '/dashboard',
            icon: <IconDashboard className="h-5 w-5 shrink-0" />,
        },
        {
            label: 'Overview',
            href: '/dashboard/overview',
            icon: <IconChartPie className="h-5 w-5 shrink-0" />,
        },
        {
            label: 'Vehicles',
            href: '/dashboard/vehicle',
            icon: <IconCar className="h-5 w-5 shrink-0" />,
        },
        {
            label: 'Drivers',
            href: '/dashboard/drivers',
            icon: <IconUser className="h-5 w-5 shrink-0" />,
        },
        {
            label: 'Notifications',
            href: '/dashboard/notification',
            icon: <IconBell className="h-5 w-5 shrink-0" />,
        },
        {
            label: 'Settings',
            href: '/dashboard/settings',
            icon: <IconSettings className="h-5 w-5 shrink-0" />,
        },
    ];

    return (
        <div className="min-h-screen bg-gray-900 relative overflow-hidden">
            {/* Animated Spotlight Background */}
            <Spotlight />

            <div className="flex h-screen">
                <Sidebar open={open} setOpen={setOpen}>
                    <SidebarBody className="justify-between gap-10 bg-gray-800/80 backdrop-blur-sm border-r border-gray-700/50">
                        <div className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
                            {/* Logo */}
                            <div className="flex items-center space-x-2 mb-8">
                                <Logo size="sm" showText={open} />
                            </div>

                            {/* Navigation Links */}
                            <div className="mt-8 flex flex-col gap-2">
                                {links.map((link, idx) => (
                                    <SidebarLink
                                        key={idx}
                                        link={link}
                                        isActive={pathname === link.href}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* User Section at Bottom */}
                        <div className="border-t border-gray-700/50 pt-4">
                            <div className="flex items-center space-x-2 mb-4">
                                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                                    <span className="text-white text-sm font-semibold">
                                        {user?.fullName?.charAt(0) || 'U'}
                                    </span>
                                </div>
                                {open && (
                                    <div className="flex-1">
                                        <p className="text-white font-medium text-sm truncate">
                                            {user?.fullName || 'User'}
                                        </p>
                                        <p className="text-gray-400 text-xs truncate">
                                            {user?.role || 'Role'}
                                        </p>
                                    </div>
                                )}
                            </div>

                            {open && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={logout}
                                    className="w-full flex items-center justify-center space-x-2 bg-gray-700/50 border-gray-600 hover:bg-gray-600/50 text-gray-300"
                                >
                                    <IconLogout className="h-4 w-4 text-gray-300" />
                                    <span>Sign Out</span>
                                </Button>
                            )}
                        </div>
                    </SidebarBody>
                </Sidebar>

                {/* Main Content */}
                <div className="flex-1 relative z-10 overflow-auto">
                    {children}
                </div>
            </div>
        </div>
    );
}
