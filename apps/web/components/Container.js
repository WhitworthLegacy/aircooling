/**
 * Container Component - VeloDoctor Design System
 *
 * Provides consistent max-width and horizontal padding
 * for content sections across the website.
 */

export default function Container({ children, className = '', size = 'default' }) {
  // Size variants for different content types
  const sizes = {
    sm: 'max-w-4xl',      // 896px - for focused content
    default: 'max-w-7xl', // 1280px - standard page width
    lg: 'max-w-[90rem]',  // 1440px - for wide layouts
    full: 'max-w-full',   // Full width
  };

  return (
    <div className={`container mx-auto px-4 sm:px-6 lg:px-8 ${sizes[size]} ${className}`}>
      {children}
    </div>
  );
}
