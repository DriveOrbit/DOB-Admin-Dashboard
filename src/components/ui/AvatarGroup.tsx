'use client';

import React from 'react';
import { Avatar, AvatarGroup as HeroAvatarGroup } from "@heroui/react";

interface ActiveDriver {
    profilePicture: string;
    firstName: string;
    lastName?: string;
    documentId: string;
    status: string;
}

interface AvatarGroupProps {
    drivers: ActiveDriver[];
    maxVisible?: number;
    size?: 'sm' | 'md' | 'lg';
}

const AvatarGroup: React.FC<AvatarGroupProps> = ({
    drivers,
    maxVisible = 5,
    size = 'md'
}) => {
    // Color variants for different initials
    const getGradientColors = (firstName: string) => {
        const colors = [
            'from-blue-500 to-purple-600',
            'from-green-500 to-teal-600',
            'from-orange-500 to-red-600',
            'from-pink-500 to-rose-600',
            'from-indigo-500 to-blue-600',
            'from-yellow-500 to-orange-600',
            'from-purple-500 to-indigo-600',
            'from-teal-500 to-cyan-600',
        ];

        const index = firstName.charCodeAt(0) % colors.length;
        return colors[index];
    };

    return (
        <HeroAvatarGroup isBordered max={maxVisible} total={drivers.length} size={size}>
            {drivers.map((driver) => (
                <Avatar
                    key={driver.documentId}
                    src={driver.profilePicture && driver.profilePicture.startsWith('http') ? driver.profilePicture : undefined}
                    name={`${driver.firstName} ${driver.lastName || ''}`}
                    showFallback
                    fallback={
                        <div className={`w-full h-full bg-gradient-to-br ${getGradientColors(driver.firstName)} flex items-center justify-center text-white font-bold text-sm`}>
                            {driver.firstName.charAt(0).toUpperCase()}{(driver.lastName || '').charAt(0).toUpperCase()}
                        </div>
                    }
                />
            ))}
        </HeroAvatarGroup>
    );
};

export default AvatarGroup;
