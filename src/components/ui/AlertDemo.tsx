'use client';

import { Alert } from './Alert';

export function AlertDemo() {
    const alertTypes: Array<{
        type: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
        title: string;
        description: string;
    }> = [
            {
                type: 'default',
                title: 'Default Alert',
                description: 'This is a default alert for general information and neutral messages.'
            },
            {
                type: 'primary',
                title: 'Primary Alert',
                description: 'This is a primary alert for important information that needs attention.'
            },
            {
                type: 'secondary',
                title: 'Secondary Alert',
                description: 'This is a secondary alert for additional context or supporting information.'
            },
            {
                type: 'success',
                title: 'Success Alert',
                description: 'Operation completed successfully! Your changes have been saved.'
            },
            {
                type: 'warning',
                title: 'Warning Alert',
                description: 'Please review this warning before proceeding with your action.'
            },
            {
                type: 'danger',
                title: 'Danger Alert',
                description: 'Critical error occurred. Immediate action required to resolve this issue.'
            }
        ];

    return (
        <div className="space-y-6 p-6">
            <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-white mb-2">HeroUI Alert Components</h1>
                <p className="text-gray-400">All available alert types with different variants</p>
            </div>

            {/* Basic Alerts */}
            <section>
                <h2 className="text-xl font-semibold text-white mb-4">Basic Alert Types</h2>
                <div className="space-y-4">
                    {alertTypes.map((alert) => (
                        <Alert
                            key={alert.type}
                            type={alert.type}
                            title={alert.title}
                            description={alert.description}
                            onClose={() => console.log(`${alert.type} alert closed`)}
                        />
                    ))}
                </div>
            </section>

            {/* Title Only Alerts */}
            <section>
                <h2 className="text-xl font-semibold text-white mb-4">Title Only Alerts</h2>
                <div className="space-y-4">
                    {alertTypes.map((alert) => (
                        <Alert
                            key={`title-${alert.type}`}
                            type={alert.type}
                            title={alert.title}
                        />
                    ))}
                </div>
            </section>

            {/* Non-closable Alerts */}
            <section>
                <h2 className="text-xl font-semibold text-white mb-4">Non-closable Alerts</h2>
                <div className="space-y-4">
                    {alertTypes.slice(0, 3).map((alert) => (
                        <Alert
                            key={`non-closable-${alert.type}`}
                            type={alert.type}
                            title={alert.title}
                            description={alert.description}
                        />
                    ))}
                </div>
            </section>

            {/* Common Use Cases */}
            <section>
                <h2 className="text-xl font-semibold text-white mb-4">Common Use Cases</h2>
                <div className="space-y-4">
                    <Alert
                        type="success"
                        title="Login Successful"
                        description="Welcome back! You have been successfully logged in."
                        onClose={() => console.log('Login success alert closed')}
                    />

                    <Alert
                        type="danger"
                        title="Authentication Failed"
                        description="Invalid credentials. Please check your email and password."
                        onClose={() => console.log('Auth error alert closed')}
                    />

                    <Alert
                        type="warning"
                        title="Session Expiring Soon"
                        description="Your session will expire in 5 minutes. Please save your work."
                        onClose={() => console.log('Session warning alert closed')}
                    />

                    <Alert
                        type="primary"
                        title="New Feature Available"
                        description="Check out our new dashboard analytics feature!"
                        onClose={() => console.log('Feature alert closed')}
                    />
                </div>
            </section>
        </div>
    );
}

// Individual alert components for easy use
export function SuccessAlert({
    title = "Success!",
    description,
    onClose
}: {
    title?: string;
    description?: string;
    onClose?: () => void
}) {
    return <Alert type="success" title={title} description={description} onClose={onClose} />;
}

export function ErrorAlert({
    title = "Error!",
    description,
    onClose
}: {
    title?: string;
    description?: string;
    onClose?: () => void
}) {
    return <Alert type="danger" title={title} description={description} onClose={onClose} />;
}

export function WarningAlert({
    title = "Warning!",
    description,
    onClose
}: {
    title?: string;
    description?: string;
    onClose?: () => void
}) {
    return <Alert type="warning" title={title} description={description} onClose={onClose} />;
}

export function InfoAlert({
    title = "Information",
    description,
    onClose
}: {
    title?: string;
    description?: string;
    onClose?: () => void
}) {
    return <Alert type="primary" title={title} description={description} onClose={onClose} />;
}
