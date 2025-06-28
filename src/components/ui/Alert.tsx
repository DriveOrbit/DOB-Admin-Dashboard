'use client';

import { Alert as HeroAlert } from "@heroui/alert";

interface AlertProps {
    type: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
    title?: string;
    message?: string;
    description?: string;
    onClose?: () => void;
    className?: string;
}

export function Alert({
    type = 'default',
    title,
    message,
    description,
    onClose,
    className = ""
}: AlertProps) {
    // Use message as title if title is not provided (for backward compatibility)
    const alertTitle = title || message;
    const alertDescription = description;

    return (
        <div className={className}>
            <HeroAlert
                color={type}
                title={alertTitle}
                description={alertDescription}
                isClosable={!!onClose}
                onClose={onClose}
                variant="flat"
            />
        </div>
    );
}

// Export a component that shows all alert types for demonstration
export function AllAlerts() {
    const alertTypes: Array<{ type: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger', title: string, description?: string }> = [
        {
            type: 'default',
            title: 'Default Alert',
            description: 'This is a default alert for general information.'
        },
        {
            type: 'primary',
            title: 'Primary Alert',
            description: 'This is a primary alert for important information.'
        },
        {
            type: 'secondary',
            title: 'Secondary Alert',
            description: 'This is a secondary alert for additional information.'
        },
        {
            type: 'success',
            title: 'Success Alert',
            description: 'Operation completed successfully! Everything is working as expected.'
        },
        {
            type: 'warning',
            title: 'Warning Alert',
            description: 'Please pay attention to this warning message.'
        },
        {
            type: 'danger',
            title: 'Danger Alert',
            description: 'Critical error occurred. Please take immediate action.'
        }
    ];

    return (
        <div className="flex flex-col w-full space-y-4">
            <h2 className="text-2xl font-bold text-white mb-4">All Alert Types</h2>
            {alertTypes.map((alert) => (
                <div key={alert.type} className="w-full">
                    <Alert
                        type={alert.type}
                        title={alert.title}
                        description={alert.description}
                        onClose={() => console.log(`${alert.type} alert closed`)}
                    />
                </div>
            ))}
        </div>
    );
}

// Individual alert components for specific use cases
export function SuccessAlert({ title = "Success!", description, onClose }: { title?: string; description?: string; onClose?: () => void }) {
    return <Alert type="success" title={title} description={description} onClose={onClose} />;
}

export function ErrorAlert({ title = "Error!", description, onClose }: { title?: string; description?: string; onClose?: () => void }) {
    return <Alert type="danger" title={title} description={description} onClose={onClose} />;
}

export function WarningAlert({ title = "Warning!", description, onClose }: { title?: string; description?: string; onClose?: () => void }) {
    return <Alert type="warning" title={title} description={description} onClose={onClose} />;
}

export function InfoAlert({ title = "Information", description, onClose }: { title?: string; description?: string; onClose?: () => void }) {
    return <Alert type="primary" title={title} description={description} onClose={onClose} />;
}
