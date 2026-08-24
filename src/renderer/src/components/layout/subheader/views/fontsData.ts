export interface FontOption {
  id: string
  name: string
  family: string
  category: 'sans' | 'serif' | 'mono'
}

export const AVAILABLE_FONTS: FontOption[] = [
  // Sans-Serif
  { id: 'inter', name: 'Inter (Default)', family: "'Inter', sans-serif", category: 'sans' },
  { id: 'outfit', name: 'Outfit', family: "'Outfit', sans-serif", category: 'sans' },
  { id: 'poppins', name: 'Poppins', family: "'Poppins', sans-serif", category: 'sans' },
  {
    id: 'plus-jakarta',
    name: 'Plus Jakarta Sans',
    family: "'Plus Jakarta Sans', sans-serif",
    category: 'sans'
  },
  { id: 'roboto', name: 'Roboto', family: "'Roboto', sans-serif", category: 'sans' },

  // Serif
  {
    id: 'merriweather',
    name: 'Merriweather',
    family: "'Merriweather', 'Georgia', serif",
    category: 'serif'
  },
  {
    id: 'playfair',
    name: 'Playfair Display',
    family: "'Playfair Display', serif",
    category: 'serif'
  },
  { id: 'lora', name: 'Lora', family: "'Lora', serif", category: 'serif' },
  {
    id: 'source-serif',
    name: 'Source Serif 4',
    family: "'Source Serif 4', serif",
    category: 'serif'
  },

  // Monospace
  {
    id: 'jetbrains-mono',
    name: 'JetBrains Mono',
    family: "'JetBrains Mono', monospace",
    category: 'mono'
  },
  { id: 'fira-code', name: 'Fira Code', family: "'Fira Code', monospace", category: 'mono' },
  {
    id: 'source-code-pro',
    name: 'Source Code Pro',
    family: "'Source Code Pro', monospace",
    category: 'mono'
  },
  {
    id: 'roboto-mono',
    name: 'Roboto Mono',
    family: "'Roboto Mono', monospace",
    category: 'mono'
  }
]

export const DEFAULT_RECENT_FONTS: FontOption[] = [
  { id: 'inter', name: 'Inter', family: "'Inter', sans-serif", category: 'sans' },
  {
    id: 'merriweather',
    name: 'Merriweather',
    family: "'Merriweather', 'Georgia', serif",
    category: 'serif'
  },
  {
    id: 'jetbrains-mono',
    name: 'JetBrains Mono',
    family: "'JetBrains Mono', monospace",
    category: 'mono'
  }
]
