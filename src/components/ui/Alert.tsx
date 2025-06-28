'use client';

interface AlertProps {
    type: 'success' | 'error' | 'warning' | 'info';
    message: string;
    onClose?: () => void;
}

export function Alert({ type, message, onClose }: AlertProps) {
    const typeClasses = {
        success: 'bg-green-900 border-green-600 text-green-200',
        error: 'bg-red-900 border-red-600 text-red-200',
        warning: 'bg-yellow-900 border-yellow-600 text-yellow-200',
        info: 'bg-blue-900 border-blue-600 text-blue-200',
    };

    return (
        <div className={`border-l-4 p-4 rounded ${typeClasses[type]}`}>
            <div className="flex justify-between items-center">
                <p className="text-sm">{message}</p>
                {onClose && (
                    <button
                        onClick={onClose}
                        className="ml-2 text-current hover:opacity-75"
                    >
                        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                            <path
                                fillRule="evenodd"
                                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                                clipRule="evenodd"
                            />
                        </svg>
                    </button>
                )}
            </div>
        </div>
    );
}
