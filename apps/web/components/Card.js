/**
 * Card Component - VeloDoctor Design System
 *
 * Provides consistent card styling with:
 * - Subtle border
 * - Soft shadow
 * - Rounded corners (2xl)
 * - Hover effect
 */

export default function Card({
  children,
  className = '',
  hover = true,
  padding = 'default',
}) {
  // Padding variants
  const paddings = {
    sm: 'p-4',
    default: 'p-6 md:p-8',
    lg: 'p-8 md:p-10',
    none: '',
  };

  const hoverStyles = hover
    ? 'transition-shadow duration-200 hover:shadow-md'
    : '';

  return (
    <div
      className={`bg-white rounded-2xl border border-airBorder shadow-sm ${hoverStyles} ${paddings[padding]} ${className}`}
    >
      {children}
    </div>
  );
}
