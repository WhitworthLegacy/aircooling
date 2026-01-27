import Container from './Container';

/**
 * Section Component - VeloDoctor Design System
 *
 * Provides consistent vertical spacing for page sections.
 * Desktop: py-16, Mobile: py-12
 */

export default function Section({
  children,
  className = '',
  containerSize = 'default',
  spacing = 'default',
  background = 'white',
}) {
  // Spacing variants - REDUCED for tighter layout
  const spacings = {
    sm: 'py-8 md:py-10',       // Smaller sections
    default: 'py-10 md:py-14', // Standard sections
    lg: 'py-12 md:py-20',      // Hero sections
    none: '',                   // No padding
  };

  // Background variants
  const backgrounds = {
    white: 'bg-white',
    surface: 'bg-airSurface',
    dark: 'bg-airDark text-white',
    primary: 'bg-airPrimary text-white',
  };

  return (
    <section className={`${spacings[spacing]} ${backgrounds[background]} ${className}`}>
      <Container size={containerSize}>{children}</Container>
    </section>
  );
}
