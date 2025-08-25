export const theme = {
  colors: {
    background: '#1a1a1a', // matte black
    surface: 'rgba(255,255,255,0.05)', // translucent for glassmorphism
    text: '#ffffff',
    accent: '#ff8c00', // orange highlight
    border: 'rgba(255,255,255,0.1)'
  },
  fonts: {
    body: 'Inter, system-ui, Avenir, Helvetica, Arial, sans-serif'
  }
} as const;
export type Theme = typeof theme;
