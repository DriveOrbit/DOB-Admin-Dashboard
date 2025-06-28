import Image from 'next/image';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showText?: boolean;
}

export function Logo({ size = 'md', className = '', showText = true }: LogoProps) {
  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-12 w-12',
    lg: 'h-16 w-16',
  };

  const textSizeClasses = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-3xl',
  };

  return (
    <div className={`flex items-center space-x-3 ${className}`}>
      <Image
        src="/logo.png"
        alt="DriveOrbit Logo"
        width={64}
        height={64}
        className={`${sizeClasses[size]} object-contain`}
        priority
      />
      {showText && (
        <span className={`font-bold text-white ${textSizeClasses[size]}`}>
          DriveOrbit
        </span>
      )}
    </div>
  );
}
