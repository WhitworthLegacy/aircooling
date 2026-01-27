/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./content/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // VeloDoctor Brand - Using CSS Variables
        airPrimary: "var(--air-primary)",   // #00ACC2 Moonstone
        airAccent: "var(--air-accent)",     // #FF6D00 Pumpkin (CTAs)
        airDark: "var(--air-dark)",         // #293133 Gunmetal
        airMuted: "var(--air-muted)",       // #6B7280 Gray-500
        airSurface: "var(--air-surface)",   // #F7FAFB Light bg
        airBorder: "var(--air-border)",     // #E5E7EB Gray-200
      },
      fontFamily: {
        sans: ["var(--font-poppins)", "-apple-system", "sans-serif"],
      },
      boxShadow: {
        'vd-sm': '0 1px 3px rgba(0, 0, 0, 0.08)',
        'vd-md': '0 4px 12px rgba(0, 0, 0, 0.1)',
        'vd-lg': '0 8px 24px rgba(0, 0, 0, 0.12)',
      },
    },
  },
  plugins: [],
};
