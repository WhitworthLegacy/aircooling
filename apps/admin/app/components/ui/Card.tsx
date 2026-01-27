interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  padding?: 'none' | 'sm' | 'default' | 'lg';
  onClick?: () => void;
}

export default function Card({
  children,
  className = '',
  hover = false,
  padding = 'default',
  onClick,
}: CardProps) {
  const paddings = {
    none: '',
    sm: 'p-4',
    default: 'p-6',
    lg: 'p-8',
  };

  const hoverStyles = hover
    ? 'transition-shadow duration-200 hover:shadow-md cursor-pointer'
    : '';

  return (
    <div
      className={`bg-white rounded-2xl border border-brand-border shadow-sm ${hoverStyles} ${paddings[padding]} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
}
