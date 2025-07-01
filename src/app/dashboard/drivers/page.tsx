'use client';

import { useAuth } from '@/lib/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import { config } from '@/lib/config';
import jsPDF from 'jspdf';

interface Driver {
    profilePicture: string;
    firstName: string;
    lastName?: string;
    documentId: string;
    status: string;
    email?: string;
    phoneNumber?: string;
    licenseNumber?: string;
    licenseType?: string;
    address?: string;
    emergencyContactName?: string;
    emergencyContact?: string;
    dateOfBirth?: string;
    emergencyContactRelation?: string;
    licenseIssueDate?: string;
    companyId?: string;
    joinDate?: string;
    licenseExpireDate?: string;
    nicNumber?: string;
    id?: number;
    lastStatusUpdate?: {
        seconds: number;
        nanos: number;
    };
    [key: string]: any;
}

interface AllDriversSSEMessage {
    timestamp: number;
    type: string;
    totalCount: number;
    allDrivers: Driver[];
}

export default function DriversPage() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const [allDrivers, setAllDrivers] = useState<Driver[]>([]);
    const [totalCount, setTotalCount] = useState<number>(0);
    const [isConnected, setIsConnected] = useState<boolean>(false);
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [showRegisterModal, setShowRegisterModal] = useState<boolean>(false);
    const [isRegistering, setIsRegistering] = useState<boolean>(false);
    const sseRef = useRef<EventSource | null>(null);

    useEffect(() => {
        // Only redirect to login if we're certain the user is not authenticated
        // Wait for loading to complete and ensure we don't have a token
        if (!loading && !user) {
            // Double-check if we have a token in localStorage
            const token = localStorage.getItem('authToken');
            if (!token) {
                console.log('Drivers Page: No user and no token, redirecting to login');
                router.push('/auth/login');
            } else {
                console.log('Drivers Page: No user but token exists, waiting for auth to initialize');
                // Give AuthContext more time to initialize
                setTimeout(() => {
                    if (!user) {
                        console.log('Drivers Page: Still no user after waiting, redirecting to login');
                        router.push('/auth/login');
                    }
                }, 1000);
            }
        }
    }, [user, loading, router]);

    useEffect(() => {
        if (!user) return;

        console.log('🚀 Setting up all drivers SSE connection...');
        let reconnectAttempts = 0;
        const maxReconnectAttempts = 5;
        let reconnectTimeout: NodeJS.Timeout;

        const connectSSE = () => {
            if (sseRef.current) {
                sseRef.current.close();
                sseRef.current = null;
            }

            try {
                const eventSource = new EventSource(`${config.api.baseUrl}/api/drivers/all/stream`);
                sseRef.current = eventSource;

                eventSource.onopen = () => {
                    console.log('✅ All drivers SSE connection opened');
                    setIsConnected(true);
                    reconnectAttempts = 0;
                };

                // Listen for the correct 'allDriversUpdate' event (this is the actual event from backend)
                eventSource.addEventListener('allDriversUpdate', (event) => {
                    try {
                        console.log('📨 Raw allDriversUpdate event data:', event.data);
                        const data: AllDriversSSEMessage = JSON.parse(event.data);
                        console.log('📊 Parsed allDriversUpdate data:', data);

                        if (data && Array.isArray(data.allDrivers)) {
                            setAllDrivers(data.allDrivers);
                            setTotalCount(data.totalCount || data.allDrivers.length);
                            console.log('✅ All drivers updated via allDriversUpdate:', data.totalCount || data.allDrivers.length, 'drivers set in state');
                        } else {
                            console.warn('⚠️ allDriversUpdate data structure invalid:', data);
                        }
                    } catch (err) {
                        console.error('❌ Error parsing allDriversUpdate:', err);
                        console.error('Raw event data that failed:', event.data);
                    }
                });

                // Listen for 'initial' event type (based on your data)
                eventSource.addEventListener('initial', (event) => {
                    try {
                        console.log('📨 Raw initial event data:', event.data);
                        const data: AllDriversSSEMessage = JSON.parse(event.data);
                        console.log('📊 Parsed initial data:', data);

                        if (data && Array.isArray(data.allDrivers)) {
                            setAllDrivers(data.allDrivers);
                            setTotalCount(data.totalCount || data.allDrivers.length);
                            console.log('✅ All drivers updated via initial event:', data.totalCount || data.allDrivers.length, 'drivers set in state');
                        }
                    } catch (err) {
                        console.error('❌ Error parsing initial event:', err);
                    }
                });

                // Also listen for default message events as fallback
                eventSource.onmessage = (event) => {
                    try {
                        console.log('📨 Raw default message data:', event.data);
                        const data: AllDriversSSEMessage = JSON.parse(event.data);
                        console.log('📊 Parsed default message data:', data);

                        if (data && Array.isArray(data.allDrivers)) {
                            setAllDrivers(data.allDrivers);
                            setTotalCount(data.totalCount || data.allDrivers.length);
                            console.log('✅ All drivers updated via default message:', data.totalCount || data.allDrivers.length, 'drivers set in state');
                        } else {
                            console.warn('⚠️ Default message data structure invalid:', data);
                        }
                    } catch (err) {
                        console.error('❌ Error parsing default message:', err);
                        console.error('Raw event data that failed:', event.data);
                    }
                };

                // Add a generic event listener to catch ALL events  
                const handleAllEvents = (event: any) => {
                    console.log('🎯 Drivers - Caught event of type:', event.type);
                    console.log('🎯 Drivers - Event data:', event.data);
                    console.log('🎯 Drivers - Full event object:', event);

                    // Try to parse any event data
                    if (event.data && event.data !== '') {
                        try {
                            const parsedData = JSON.parse(event.data);
                            console.log('🎯 Drivers - Parsed event data:', parsedData);

                            // Check if this looks like driver data regardless of event type
                            if (parsedData && (parsedData.allDrivers || parsedData.drivers)) {
                                console.log('🎯 Drivers - Found driver data in', event.type, 'event');
                                const drivers = parsedData.allDrivers || parsedData.drivers || [];
                                const count = parsedData.totalCount || parsedData.count || drivers.length;

                                if (Array.isArray(drivers)) {
                                    console.log('🎯 Drivers - Updating from generic event:', drivers.length, 'drivers');
                                    setAllDrivers(drivers);
                                    setTotalCount(count);
                                }
                            }
                        } catch (e) {
                            console.log('🎯 Drivers - Non-JSON event data:', event.data);
                        }
                    }
                };

                // Listen to all possible event types including the correct one
                ['message', 'allDriversUpdate', 'driverUpdate', 'initial', 'data', 'update', 'ping', 'keepalive'].forEach(eventType => {
                    eventSource.addEventListener(eventType, handleAllEvents);
                });

                eventSource.onerror = (error) => {
                    console.error('❌ All drivers SSE error:', error);
                    setIsConnected(false);
                    eventSource.close();
                    sseRef.current = null;

                    // Attempt to reconnect with exponential backoff
                    if (reconnectAttempts < maxReconnectAttempts && user) {
                        const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000);
                        reconnectAttempts++;
                        console.log(`🔄 Reconnecting in ${delay}ms (attempt ${reconnectAttempts}/${maxReconnectAttempts})`);

                        reconnectTimeout = setTimeout(() => {
                            if (user) {
                                connectSSE();
                            }
                        }, delay);
                    }
                };

            } catch (error) {
                console.error('❌ Error creating SSE connection:', error);
                setIsConnected(false);
            }
        };

        connectSSE(); return () => {
            console.log('🧹 Cleaning up all drivers SSE connection');
            if (reconnectTimeout) {
                clearTimeout(reconnectTimeout);
            }
            if (sseRef.current) {
                sseRef.current.close();
                sseRef.current = null;
            }
            setIsConnected(false);
        };
    }, [user]);

    // Filter drivers based on search and status
    const filteredDrivers = allDrivers.filter((driver: Driver) => {
        const matchesSearch = searchQuery === '' ||
            driver.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (driver.lastName && driver.lastName.toLowerCase().includes(searchQuery.toLowerCase())) ||
            (driver.email && driver.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
            (driver.phoneNumber && driver.phoneNumber.includes(searchQuery)) ||
            driver.documentId.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesStatus = statusFilter === 'all' || driver.status === statusFilter;

        return matchesSearch && matchesStatus;
    });

    // Calculate active and inactive counts
    const activeDriversCount = allDrivers.filter(driver => driver.status === 'active').length;
    const inactiveDriversCount = allDrivers.filter(driver => driver.status === 'inactive').length;

    const getStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
            case 'active':
                return 'bg-green-600/20 text-green-400';
            case 'inactive':
                return 'bg-red-600/20 text-red-400';
            case 'on_break':
            case 'break':
                return 'bg-yellow-600/20 text-yellow-400';
            case 'suspended':
                return 'bg-orange-600/20 text-orange-400';
            default:
                return 'bg-gray-600/20 text-gray-400';
        }
    };

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

    const formatLastUpdate = (lastStatusUpdate?: { seconds: number; nanos: number }) => {
        if (!lastStatusUpdate) return 'Unknown';

        const date = new Date(lastStatusUpdate.seconds * 1000);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / (1000 * 60));

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
        return `${Math.floor(diffMins / 1440)}d ago`;
    };

    // Debug: Log state changes
    useEffect(() => {
        console.log('🔄 State updated - allDrivers:', {
            count: allDrivers.length,
            drivers: allDrivers,
            totalCount: totalCount,
            activeCount: activeDriversCount,
            inactiveCount: inactiveDriversCount,
            isConnected: isConnected
        });
    }, [allDrivers, totalCount, activeDriversCount, inactiveDriversCount, isConnected]);

    // Driver registration form data
    const [driverFormData, setDriverFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phoneNumber: '',
        password: '',
        address: '',
        nicNumber: '',
        dateOfBirth: '',
        licenseNumber: '',
        licenseType: '',
        licenseIssueDate: '',
        licenseExpireDate: '',
        emergencyContactName: '',
        emergencyContact: '',
        emergencyContactRelation: '',
        companyId: 'DriveOrbit',
        joinDate: new Date().toISOString().split('T')[0], // Today's date
    });

    // Password generation state
    const [useAutoPassword, setUseAutoPassword] = useState(true);
    const [generatedPassword, setGeneratedPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    // Password confirmation state for manual mode
    const [confirmPassword, setConfirmPassword] = useState('');

    // Generate secure password
    const generatePassword = () => {
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
        let password = '';

        // Ensure at least one of each type
        password += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 26)]; // Uppercase
        password += 'abcdefghijklmnopqrstuvwxyz'[Math.floor(Math.random() * 26)]; // Lowercase
        password += '0123456789'[Math.floor(Math.random() * 10)]; // Number
        password += '!@#$%^&*'[Math.floor(Math.random() * 8)]; // Special char

        // Fill the rest
        for (let i = 4; i < 12; i++) {
            password += characters[Math.floor(Math.random() * characters.length)];
        }

        // Shuffle the password
        return password.split('').sort(() => Math.random() - 0.5).join('');
    };

    // Copy password to clipboard
    const copyToClipboard = async (text: string) => {
        try {
            await navigator.clipboard.writeText(text);
            alert('Password copied to clipboard!');
        } catch (err) {
            console.error('Failed to copy password:', err);
            alert('Failed to copy password. Please copy manually.');
        }
    };

    // Generate PDF guideline
    const generatePDFGuideline = (driverData: any, password: string) => {
        const doc = new jsPDF();

        // Add logo and header
        doc.setFontSize(20);
        doc.setFont(undefined, 'bold');
        doc.text('DriveOrbit Driver Login Guide', 20, 30);

        // Add welcome message
        doc.setFontSize(14);
        doc.setFont(undefined, 'normal');
        doc.text(`Welcome ${driverData.firstName} ${driverData.lastName}!`, 20, 50);
        doc.text('Your driver account has been successfully created.', 20, 65);

        // Add login credentials section
        doc.setFontSize(16);
        doc.setFont(undefined, 'bold');
        doc.text('Login Credentials:', 20, 90);

        doc.setFontSize(12);
        doc.setFont(undefined, 'normal');
        doc.text(`Email: ${driverData.email}`, 30, 110);
        doc.text(`Password: ${password}`, 30, 125);

        // Add security notice
        doc.setFontSize(14);
        doc.setFont(undefined, 'bold');
        doc.text('Important Security Notice:', 20, 150);

        doc.setFontSize(10);
        doc.setFont(undefined, 'normal');
        doc.text('• Keep your login credentials secure and confidential', 30, 165);
        doc.text('• Do not share your password with anyone', 30, 175);
        doc.text('• Change your password regularly for better security', 30, 185);
        doc.text('• Log out completely when using shared devices', 30, 195);

        // Add app download section
        doc.setFontSize(14);
        doc.setFont(undefined, 'bold');
        doc.text('How to Access the DriveOrbit App:', 20, 220);

        doc.setFontSize(10);
        doc.setFont(undefined, 'normal');
        doc.text('1. Download the DriveOrbit Driver app from Google Play Store or App Store', 30, 235);
        doc.text('2. Open the app and tap "Login"', 30, 245);
        doc.text('3. Enter your email and password provided above', 30, 255);
        doc.text('4. Complete your profile setup if prompted', 30, 265);
        doc.text('5. Start accepting ride requests!', 30, 275);

        // Add contact section
        doc.setFontSize(12);
        doc.setFont(undefined, 'bold');
        doc.text('Need Help?', 20, 290);
        doc.setFont(undefined, 'normal');
        doc.text('Contact our support team: support@driveorbit.com', 30, 305);
        doc.text('Emergency contact: +94 11 234 5678', 30, 315);

        // Add footer
        doc.setFontSize(8);
        doc.text('Generated on: ' + new Date().toLocaleString(), 20, 340);
        doc.text('DriveOrbit Admin Dashboard - Confidential Document', 20, 350);

        // Save the PDF
        doc.save(`DriveOrbit_Login_Guide_${driverData.firstName}_${driverData.lastName}.pdf`);
    };

    // Effect to generate password when auto mode is enabled
    useEffect(() => {
        if (useAutoPassword) {
            const newPassword = generatePassword();
            setGeneratedPassword(newPassword);
            setDriverFormData(prev => ({
                ...prev,
                password: newPassword
            }));
        } else {
            setGeneratedPassword('');
            setDriverFormData(prev => ({
                ...prev,
                password: ''
            }));
        }
    }, [useAutoPassword]);

    // Register new driver
    const handleRegisterDriver = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsRegistering(true);

        try {
            // Validate required fields
            if (!driverFormData.firstName || !driverFormData.email || !driverFormData.phoneNumber || !driverFormData.password) {
                alert('Please fill in all required fields (First Name, Email, Phone Number, Password)');
                setIsRegistering(false);
                return;
            }

            // Validate password confirmation in manual mode
            if (!useAutoPassword && driverFormData.password !== confirmPassword) {
                alert('Passwords do not match. Please check and try again.');
                setIsRegistering(false);
                return;
            }

            // Clean and prepare the data
            const registrationData = {
                ...driverFormData,
                // Ensure all string fields are properly trimmed
                firstName: driverFormData.firstName.trim(),
                lastName: driverFormData.lastName?.trim() || '',
                email: driverFormData.email.trim(),
                phoneNumber: driverFormData.phoneNumber.trim(),
                address: driverFormData.address?.trim() || '',
                nicNumber: driverFormData.nicNumber?.trim() || '',
                licenseNumber: driverFormData.licenseNumber?.trim() || '',
                licenseType: driverFormData.licenseType?.trim() || '',
                emergencyContactName: driverFormData.emergencyContactName?.trim() || '',
                emergencyContact: driverFormData.emergencyContact?.trim() || '',
                emergencyContactRelation: driverFormData.emergencyContactRelation?.trim() || '',
                companyId: driverFormData.companyId?.trim() || 'DriveOrbit'
            };

            console.log('🚗 Registering new driver with cleaned data:', registrationData);
            console.log('📤 JSON payload being sent:', JSON.stringify(registrationData, null, 2));

            const response = await fetch(`${config.api.baseUrl}/api/drivers/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
                },
                body: JSON.stringify(registrationData),
            });

            let result;
            const contentType = response.headers.get('content-type');
            
            if (contentType && contentType.includes('application/json')) {
                result = await response.json();
            } else {
                // Handle text responses (like simple success messages)
                const textResult = await response.text();
                console.log('📄 Text response received:', textResult);
                
                // If the response is successful and contains success message, treat it as success
                if (response.ok && textResult.toLowerCase().includes('success')) {
                    result = { message: textResult, success: true };
                } else {
                    console.error('❌ Non-JSON error response:', textResult);
                    throw new Error(`Server error: ${textResult.substring(0, 100)}...`);
                }
            }

            if (response.ok && result) {
                console.log('✅ Driver registered successfully:', result);
                
                // Show success message from server or default
                const successMessage = result.message || result.success || 'Driver registered successfully!';
                alert(successMessage);

                // Generate and download PDF guideline
                const passwordToUse = useAutoPassword ? generatedPassword : driverFormData.password;
                generatePDFGuideline(registrationData, passwordToUse);

                // Reset form and close modal
                setDriverFormData({
                    firstName: '',
                    lastName: '',
                    email: '',
                    phoneNumber: '',
                    password: '',
                    address: '',
                    nicNumber: '',
                    dateOfBirth: '',
                    licenseNumber: '',
                    licenseType: '',
                    licenseIssueDate: '',
                    licenseExpireDate: '',
                    emergencyContactName: '',
                    emergencyContact: '',
                    emergencyContactRelation: '',
                    companyId: 'DriveOrbit',
                    joinDate: new Date().toISOString().split('T')[0],
                });
                
                // Reset confirm password
                setConfirmPassword('');
                
                // Reset password generation state
                if (useAutoPassword) {
                    const newPassword = generatePassword();
                    setGeneratedPassword(newPassword);
                }
                
                setShowRegisterModal(false);
            } else {
                console.error('❌ Driver registration failed. Response status:', response.status);
                console.error('❌ Driver registration failed. Result:', result);
                
                const errorMessage = result?.message || result?.error || result?.details || `Server error (${response.status})`;
                alert(`Registration failed: ${errorMessage}`);
            }
        } catch (error) {
            console.error('❌ Error registering driver:', error);
            
            if (error instanceof Error) {
                alert(`Error registering driver: ${error.message}`);
            } else {
                alert('Error registering driver. Please check your connection and try again.');
            }
        } finally {
            setIsRegistering(false);
        }
    };

    // Handle form input changes
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        
        if (name === 'confirmPassword') {
            setConfirmPassword(value);
            return;
        }
        
        setDriverFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    if (!user) return null;

    return (
        <div className="p-6">
            <div className="mb-6 flex justify-between items-start">
                <div>
                    <h1 className="text-2xl font-bold text-white mb-2">All Drivers</h1>
                    <p className="text-gray-400">Monitor all drivers and filter by status</p>
                </div>
                <button
                    onClick={() => setShowRegisterModal(true)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center space-x-2"
                >
                    <span>+</span>
                    <span>Register New Driver</span>
                </button>
            </div>

            {/* Search and Filters */}
            <div className="mb-6 space-y-4">
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1">
                        <input
                            type="text"
                            placeholder="Search drivers by name, email, or ID..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full px-4 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div className="flex gap-4">
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="px-4 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="all">All Status</option>
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                            <option value="on_break">On Break</option>
                            <option value="suspended">Suspended</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Drivers Grid */}
            {filteredDrivers.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredDrivers.map((driver) => (
                        <div
                            key={driver.documentId}
                            className="bg-gray-800/50 backdrop-blur-sm rounded-lg border border-gray-700/50 p-6 hover:bg-gray-800/70 transition-all duration-200"
                        >
                            <div className="flex items-center space-x-4 mb-4">
                                {driver.profilePicture && driver.profilePicture.startsWith('http') ? (
                                    <img
                                        src={driver.profilePicture}
                                        alt={`${driver.firstName}'s profile`}
                                        className="w-12 h-12 rounded-full object-cover"
                                        onError={(e) => {
                                            // Fallback to gradient avatar if image fails to load
                                            const target = e.target as HTMLImageElement;
                                            target.style.display = 'none';
                                            const fallback = target.nextElementSibling as HTMLElement;
                                            if (fallback) fallback.style.display = 'flex';
                                        }}
                                    />
                                ) : null}
                                <div
                                    className={`w-12 h-12 bg-gradient-to-r ${getGradientColors(driver.firstName)} rounded-full flex items-center justify-center text-white font-bold text-lg ${driver.profilePicture && driver.profilePicture.startsWith('http') ? 'hidden' : ''}`}
                                    style={driver.profilePicture && driver.profilePicture.startsWith('http') ? { display: 'none' } : {}}
                                >
                                    {driver.firstName.charAt(0).toUpperCase()}
                                    {driver.lastName ? driver.lastName.charAt(0).toUpperCase() : ''}
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-lg font-semibold text-white">
                                        {driver.firstName} {driver.lastName || ''}
                                    </h3>
                                    <p className="text-gray-400 text-sm">ID: {driver.documentId.substring(0, 8)}...</p>
                                </div>
                            </div>

                            <div className="space-y-2 mb-4">
                                {driver.email && (
                                    <div className="flex justify-between">
                                        <span className="text-gray-400 text-sm">Email:</span>
                                        <span className="text-white text-sm truncate ml-2">{driver.email}</span>
                                    </div>
                                )}
                                {driver.phoneNumber && (
                                    <div className="flex justify-between">
                                        <span className="text-gray-400 text-sm">Phone:</span>
                                        <span className="text-white text-sm">{driver.phoneNumber}</span>
                                    </div>
                                )}
                                {driver.licenseNumber && (
                                    <div className="flex justify-between">
                                        <span className="text-gray-400 text-sm">License:</span>
                                        <span className="text-white text-sm">{driver.licenseType} - {driver.licenseNumber}</span>
                                    </div>
                                )}
                                <div className="flex justify-between">
                                    <span className="text-gray-400 text-sm">Last Update:</span>
                                    <span className="text-white text-sm">{formatLastUpdate(driver.lastStatusUpdate)}</span>
                                </div>
                            </div>

                            <div className="flex items-center justify-between">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(driver.status)}`}>
                                    {driver.status.charAt(0).toUpperCase() + driver.status.slice(1)}
                                </span>
                                <div className="flex items-center space-x-1">
                                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                    <span className="text-green-400 text-xs">Live</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-12">
                    <div className="text-gray-400 text-lg mb-2">
                        {allDrivers.length === 0
                            ? (isConnected ? 'No drivers found' : 'Connecting to server...')
                            : 'No drivers match your filters'
                        }
                    </div>
                    <p className="text-gray-500 text-sm">
                        {allDrivers.length === 0
                            ? (isConnected ? 'No drivers are registered in the system' : 'Waiting for SSE connection...')
                            : 'Try adjusting your search or filter criteria'
                        }
                    </p>
                    {!isConnected && (
                        <p className="text-red-400 text-sm mt-2">
                            Check browser console for detailed connection logs
                        </p>
                    )}
                </div>
            )}

            {/* Register Driver Modal */}
            {showRegisterModal && (
                <div className="fixed inset-0 flex items-center justify-center z-50">
                    <div className="absolute inset-0 bg-black opacity-50"></div>
                    <div className="bg-gray-900 rounded-lg shadow-lg p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto z-10">
                        <h2 className="text-xl font-bold text-white mb-4">Register New Driver</h2>
                        <form onSubmit={handleRegisterDriver} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-gray-400 text-sm mb-1">First Name</label>
                                    <input
                                        type="text"
                                        name="firstName"
                                        value={driverFormData.firstName}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-gray-400 text-sm mb-1">Last Name</label>
                                    <input
                                        type="text"
                                        name="lastName"
                                        value={driverFormData.lastName}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-gray-400 text-sm mb-1">Email</label>
                                    <input
                                        type="email"
                                        name="email"
                                        value={driverFormData.email}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-gray-400 text-sm mb-1">Phone Number</label>
                                    <input
                                        type="text"
                                        name="phoneNumber"
                                        value={driverFormData.phoneNumber}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        required
                                    />
                                </div>
                            </div>
                            {/* Password Section */}
                            <div className="col-span-full">
                                <div className="mb-4">
                                    <div className="flex items-center space-x-4 mb-3">
                                        <label className="flex items-center space-x-2">
                                            <input
                                                type="radio"
                                                checked={useAutoPassword}
                                                onChange={() => setUseAutoPassword(true)}
                                                className="text-blue-500"
                                            />
                                            <span className="text-gray-400">Auto-generate password</span>
                                        </label>
                                        <label className="flex items-center space-x-2">
                                            <input
                                                type="radio"
                                                checked={!useAutoPassword}
                                                onChange={() => setUseAutoPassword(false)}
                                                className="text-blue-500"
                                            />
                                            <span className="text-gray-400">Enter password manually</span>
                                        </label>
                                    </div>

                                    {useAutoPassword ? (
                                        <div className="space-y-2">
                                            <div className="flex items-center space-x-2">
                                                <input
                                                    type={showPassword ? "text" : "password"}
                                                    value={generatedPassword}
                                                    readOnly
                                                    className="flex-1 px-4 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                    placeholder="Auto-generated password will appear here"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowPassword(!showPassword)}
                                                    className="px-3 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg transition-colors"
                                                >
                                                    {showPassword ? "Hide" : "Show"}
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => copyToClipboard(generatedPassword)}
                                                    className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                                                    disabled={!generatedPassword}
                                                >
                                                    Copy
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const newPassword = generatePassword();
                                                        setGeneratedPassword(newPassword);
                                                        setDriverFormData(prev => ({
                                                            ...prev,
                                                            password: newPassword
                                                        }));
                                                    }}
                                                    className="px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                                                >
                                                    Regenerate
                                                </button>
                                            </div>
                                            <p className="text-xs text-gray-500">
                                                Password includes uppercase, lowercase, numbers, and special characters (12 characters)
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-gray-400 text-sm mb-1">Password</label>
                                                <input
                                                    type="password"
                                                    name="password"
                                                    value={driverFormData.password}
                                                    onChange={handleInputChange}
                                                    className="w-full px-4 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                    required
                                                    placeholder="Enter password"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-gray-400 text-sm mb-1">Confirm Password</label>
                                                <input
                                                    type="password"
                                                    name="confirmPassword"
                                                    value={confirmPassword}
                                                    onChange={handleInputChange}
                                                    className="w-full px-4 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                    required
                                                    placeholder="Confirm password"
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-gray-400 text-sm mb-1">Address</label>
                                    <input
                                        type="text"
                                        name="address"
                                        value={driverFormData.address}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-gray-400 text-sm mb-1">NIC Number</label>
                                    <input
                                        type="text"
                                        name="nicNumber"
                                        value={driverFormData.nicNumber}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-gray-400 text-sm mb-1">Date of Birth</label>
                                    <input
                                        type="date"
                                        name="dateOfBirth"
                                        value={driverFormData.dateOfBirth}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-gray-400 text-sm mb-1">License Number</label>
                                    <input
                                        type="text"
                                        name="licenseNumber"
                                        value={driverFormData.licenseNumber}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-gray-400 text-sm mb-1">License Type</label>
                                    <select
                                        name="licenseType"
                                        value={driverFormData.licenseType}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="">Select License Type</option>
                                        <option value="LMV">LMV</option>
                                        <option value="HMV">HMV</option>
                                        <option value="Motorcycle">Motorcycle</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-gray-400 text-sm mb-1">License Issue Date</label>
                                    <input
                                        type="date"
                                        name="licenseIssueDate"
                                        value={driverFormData.licenseIssueDate}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-gray-400 text-sm mb-1">License Expiry Date</label>
                                    <input
                                        type="date"
                                        name="licenseExpireDate"
                                        value={driverFormData.licenseExpireDate}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-gray-400 text-sm mb-1">Emergency Contact Name</label>
                                    <input
                                        type="text"
                                        name="emergencyContactName"
                                        value={driverFormData.emergencyContactName}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-gray-400 text-sm mb-1">Emergency Contact</label>
                                    <input
                                        type="text"
                                        name="emergencyContact"
                                        value={driverFormData.emergencyContact}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-gray-400 text-sm mb-1">Emergency Contact Relation</label>
                                    <input
                                        type="text"
                                        name="emergencyContactRelation"
                                        value={driverFormData.emergencyContactRelation}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end gap-4">
                                <button
                                    onClick={() => setShowRegisterModal(false)}
                                    className="px-4 py-2 bg-gray-700 rounded-lg text-white font-semibold hover:bg-gray-600 transition-all duration-200"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isRegistering}
                                    className={`px-4 py-2 rounded-lg text-white font-semibold transition-all duration-200 flex items-center justify-center gap-2 ${isRegistering ? 'bg-gray-600 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-500'}`}
                                >
                                    {isRegistering && (
                                        <svg
                                            className="animate-spin h-5 w-5 text-white"
                                            xmlns="http://www.w3.org/2000/svg"
                                            viewBox="0 0 24 24"
                                        >
                                            <circle
                                                className="opacity-25"
                                                cx="12"
                                                cy="12"
                                                r="10"
                                                fill="none"
                                                strokeWidth="4"
                                                stroke="currentColor"
                                            />
                                            <path
                                                className="opacity-75"
                                                fill="currentColor"
                                                d="M4 12a8 8 0 018-8v8H4z"
                                            />
                                        </svg>
                                    )}
                                    Register Driver
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
