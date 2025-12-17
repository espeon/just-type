export type ThemeVariant =
    | 'default-light'
    | 'default-dark'
    | 'dutch-light'
    | 'dutch-dark'
    | 'catppuccin-latte'
    | 'catppuccin-frappe'
    | 'catppuccin-macchiato'
    | 'catppuccin-mocha'
    | 'github-light'
    | 'github-dark'
    | 'nord'
    | 'dracula'
    | 'gruvbox-light'
    | 'gruvbox-dark'
    | 'tokyo-night'
    | 'rose-pine'
    | 'rose-pine-moon'
    | 'rose-pine-dawn'
    | 'solarized-light'
    | 'solarized-dark'
    | 'monokai'
    | 'monokai-pro'
    | 'one-dark'
    | 'one-light'
    | 'atom-dark'
    | 'atom-light'
    | 'material-dark'
    | 'material-light'
    | 'palenight'
    | 'oceanic-next'
    | 'ayu-light'
    | 'ayu-mirage'
    | 'ayu-dark'
    | 'synthwave'
    | 'cyberpunk'
    | 'forest'
    | 'sunset'
    | 'minimal-light'
    | 'minimal-dark'
    | 'neon-city'
    | 'ocean-depths'
    | 'cherry-blossom'
    | 'autumn-leaves'
    | 'midnight-purple'
    | 'golden-hour'
    | 'arctic-aurora'
    | 'desert-sand'
    | 'cosmic-void'
    | 'emerald-dream'
    | 'crimson-tide'
    | 'lavender-mist'
    | 'volcano-ash'
    | 'ice-crystal'
    | 'retro-amber'
    | 'matrix-green'
    | 'cotton-candy'
    | 'storm-clouds'
    | 'rainbow-prism'
    | 'moonlit-beach'
    | 'electric-blue'
    | 'rose-gold'
    | 'space-nebula'
    | 'jungle-canopy'
    | 'winter-frost'
    | 'blood-moon'
    | 'coral-reef'
    | 'crystal-cave'
    | 'neon-pink'
    | 'deep-ocean'
    | 'fairy-tale'
    | 'steampunk'
    | 'quantum-realm'
    | 'twilight-zone'
    | 'vscode-dark'
    | 'vscode-light'
    | 'sublime-monokai'
    | 'sublime-material'
    | 'jetbrains-darcula'
    | 'jetbrains-light'
    | 'vim-desert'
    | 'vim-gruvbox'
    | 'emacs-doom-one'
    | 'emacs-spacemacs'
    | 'base16-tomorrow'
    | 'base16-ocean'
    | 'base16-default'
    | 'high-contrast-dark'
    | 'high-contrast-light'
    | 'dark-plus'
    | 'light-plus'
    | 'quiet-light'
    | 'red-theme'
    | 'kimbie-dark'
    | 'tomorrow-night'
    | 'tomorrow-night-blue'
    | 'tomorrow-night-bright'
    | 'tomorrow-night-eighties'
    | 'tomorrow-day'
    | 'panda-syntax'
    | 'cobalt2'
    | 'night-owl'
    | 'light-owl'
    | 'shades-of-purple'
    | 'winter-is-coming-dark'
    | 'winter-is-coming-light'
    | 'abyss'
    | 'slack-theme'
    | 'discord-dark'
    | 'notion-light'
    | 'notion-dark'
    | 'bear-theme'
    | 'obsidian-theme'

export interface ThemeDefinition {
    id: ThemeVariant
    name: string
    description: string
    category:
        | 'default'
        | 'catppuccin'
        | 'popular'
        | 'dutch'
        | 'editor'
        | 'aesthetic'
        | 'minimal'
    isDark: boolean
    preview: {
        background: string
        foreground: string
        primary: string
        accent: string
    }
}

export const THEME_DEFINITIONS: Record<ThemeVariant, ThemeDefinition> = {
    'default-light': {
        id: 'default-light',
        name: 'Default Light',
        description: 'Clean minimal light theme',
        category: 'default',
        isDark: false,
        preview: {
            background: '#ffffff',
            foreground: '#0a0a0a',
            primary: '#171717',
            accent: '#f5f5f5'
        }
    },
    'default-dark': {
        id: 'default-dark',
        name: 'Default Dark',
        description: 'Clean minimal dark theme',
        category: 'default',
        isDark: true,
        preview: {
            background: '#0a0a0a',
            foreground: '#fafafa',
            primary: '#f5f5f5',
            accent: '#171717'
        }
    },
    'dutch-light': {
        id: 'dutch-light',
        name: 'Dutch Light',
        description: 'Orange and blue inspired by Dutch flag',
        category: 'dutch',
        isDark: false,
        preview: {
            background: '#fef9f5',
            foreground: '#1e293b',
            primary: '#ea580c',
            accent: '#f1f5f9'
        }
    },
    'dutch-dark': {
        id: 'dutch-dark',
        name: 'Dutch Dark',
        description: 'Deep canal blues with orange highlights',
        category: 'dutch',
        isDark: true,
        preview: {
            background: '#0f172a',
            foreground: '#f8fafc',
            primary: '#fb923c',
            accent: '#1e293b'
        }
    },
    'catppuccin-latte': {
        id: 'catppuccin-latte',
        name: 'Catppuccin Latte',
        description: 'Warm, pastel light theme',
        category: 'catppuccin',
        isDark: false,
        preview: {
            background: '#eff1f5',
            foreground: '#4c4f69',
            primary: '#1e66f5',
            accent: '#dce0e8'
        }
    },
    'catppuccin-frappe': {
        id: 'catppuccin-frappe',
        name: 'Catppuccin Frappé',
        description: 'Cozy, medium-contrast theme',
        category: 'catppuccin',
        isDark: true,
        preview: {
            background: '#303446',
            foreground: '#c6d0f5',
            primary: '#8caaee',
            accent: '#414559'
        }
    },
    'catppuccin-macchiato': {
        id: 'catppuccin-macchiato',
        name: 'Catppuccin Macchiato',
        description: 'Warm, darker catppuccin variant',
        category: 'catppuccin',
        isDark: true,
        preview: {
            background: '#24273a',
            foreground: '#cad3f5',
            primary: '#8aadf4',
            accent: '#363a4f'
        }
    },
    'catppuccin-mocha': {
        id: 'catppuccin-mocha',
        name: 'Catppuccin Mocha',
        description: 'Rich, deep dark theme',
        category: 'catppuccin',
        isDark: true,
        preview: {
            background: '#1e1e2e',
            foreground: '#cdd6f4',
            primary: '#89b4fa',
            accent: '#313244'
        }
    },
    'github-light': {
        id: 'github-light',
        name: 'GitHub Light',
        description: 'Clean, professional light theme',
        category: 'popular',
        isDark: false,
        preview: {
            background: '#ffffff',
            foreground: '#24292f',
            primary: '#0969da',
            accent: '#f6f8fa'
        }
    },
    'github-dark': {
        id: 'github-dark',
        name: 'GitHub Dark',
        description: 'Sophisticated dark theme',
        category: 'popular',
        isDark: true,
        preview: {
            background: '#0d1117',
            foreground: '#f0f6fc',
            primary: '#58a6ff',
            accent: '#21262d'
        }
    },
    nord: {
        id: 'nord',
        name: 'Nord',
        description: 'Arctic, north-bluish color palette',
        category: 'popular',
        isDark: true,
        preview: {
            background: '#2e3440',
            foreground: '#d8dee9',
            primary: '#5e81ac',
            accent: '#3b4252'
        }
    },
    dracula: {
        id: 'dracula',
        name: 'Dracula',
        description: 'Dark theme with vibrant colors',
        category: 'popular',
        isDark: true,
        preview: {
            background: '#282a36',
            foreground: '#f8f8f2',
            primary: '#bd93f9',
            accent: '#44475a'
        }
    },
    'gruvbox-light': {
        id: 'gruvbox-light',
        name: 'Gruvbox Light',
        description: 'Retro groove warm light theme',
        category: 'popular',
        isDark: false,
        preview: {
            background: '#fbf1c7',
            foreground: '#3c3836',
            primary: '#b57614',
            accent: '#f2e5bc'
        }
    },
    'gruvbox-dark': {
        id: 'gruvbox-dark',
        name: 'Gruvbox Dark',
        description: 'Retro groove warm dark theme',
        category: 'popular',
        isDark: true,
        preview: {
            background: '#282828',
            foreground: '#ebdbb2',
            primary: '#fabd2f',
            accent: '#3c3836'
        }
    },
    'tokyo-night': {
        id: 'tokyo-night',
        name: 'Tokyo Night',
        description: 'A clean dark theme inspired by Tokyo',
        category: 'popular',
        isDark: true,
        preview: {
            background: '#1a1b26',
            foreground: '#c0caf5',
            primary: '#7aa2f7',
            accent: '#24283b'
        }
    },
    'rose-pine': {
        id: 'rose-pine',
        name: 'Rosé Pine',
        description: 'All natural pine, faux fur and a bit of soho vibes',
        category: 'popular',
        isDark: true,
        preview: {
            background: '#191724',
            foreground: '#e0def4',
            primary: '#c4a7e7',
            accent: '#26233a'
        }
    },
    'solarized-light': {
        id: 'solarized-light',
        name: 'Solarized Light',
        description: 'Precision colors for machines and people',
        category: 'popular',
        isDark: false,
        preview: {
            background: '#fdf6e3',
            foreground: '#657b83',
            primary: '#268bd2',
            accent: '#eee8d5'
        }
    },
    'solarized-dark': {
        id: 'solarized-dark',
        name: 'Solarized Dark',
        description: 'Precision colors for machines and people',
        category: 'popular',
        isDark: true,
        preview: {
            background: '#002b36',
            foreground: '#839496',
            primary: '#268bd2',
            accent: '#073642'
        }
    },
    'rose-pine-moon': {
        id: 'rose-pine-moon',
        name: 'Rosé Pine Moon',
        description: 'Rosé Pine with a moonlit twist',
        category: 'popular',
        isDark: true,
        preview: {
            background: '#232136',
            foreground: '#e0def4',
            primary: '#c4a7e7',
            accent: '#393552'
        }
    },
    'rose-pine-dawn': {
        id: 'rose-pine-dawn',
        name: 'Rosé Pine Dawn',
        description: 'Light variant of Rosé Pine',
        category: 'popular',
        isDark: false,
        preview: {
            background: '#faf4ed',
            foreground: '#575279',
            primary: '#907aa9',
            accent: '#f2e9e1'
        }
    },
    monokai: {
        id: 'monokai',
        name: 'Monokai',
        description: 'Classic code editor theme',
        category: 'editor',
        isDark: true,
        preview: {
            background: '#272822',
            foreground: '#f8f8f2',
            primary: '#66d9ef',
            accent: '#383830'
        }
    },
    'monokai-pro': {
        id: 'monokai-pro',
        name: 'Monokai Pro',
        description: 'Modern take on the classic Monokai',
        category: 'editor',
        isDark: true,
        preview: {
            background: '#2d2a2e',
            foreground: '#fcfcfa',
            primary: '#78dce8',
            accent: '#403e41'
        }
    },
    'one-dark': {
        id: 'one-dark',
        name: 'One Dark',
        description: "Atom's iconic One Dark theme",
        category: 'editor',
        isDark: true,
        preview: {
            background: '#282c34',
            foreground: '#abb2bf',
            primary: '#61afef',
            accent: '#353b45'
        }
    },
    'one-light': {
        id: 'one-light',
        name: 'One Light',
        description: "Atom's clean One Light theme",
        category: 'editor',
        isDark: false,
        preview: {
            background: '#fafafa',
            foreground: '#383a42',
            primary: '#4078f2',
            accent: '#f0f0f1'
        }
    },
    'atom-dark': {
        id: 'atom-dark',
        name: 'Atom Dark',
        description: 'Classic Atom editor dark theme',
        category: 'editor',
        isDark: true,
        preview: {
            background: '#1d1f21',
            foreground: '#c5c8c6',
            primary: '#81a2be',
            accent: '#282a2e'
        }
    },
    'atom-light': {
        id: 'atom-light',
        name: 'Atom Light',
        description: 'Classic Atom editor light theme',
        category: 'editor',
        isDark: false,
        preview: {
            background: '#ffffff',
            foreground: '#555555',
            primary: '#4271ae',
            accent: '#f7f7f7'
        }
    },
    'material-dark': {
        id: 'material-dark',
        name: 'Material Dark',
        description: 'Google Material Design dark theme',
        category: 'editor',
        isDark: true,
        preview: {
            background: '#212121',
            foreground: '#eeffff',
            primary: '#82b1ff',
            accent: '#292929'
        }
    },
    'material-light': {
        id: 'material-light',
        name: 'Material Light',
        description: 'Google Material Design light theme',
        category: 'editor',
        isDark: false,
        preview: {
            background: '#fafafa',
            foreground: '#90a4ae',
            primary: '#6182b8',
            accent: '#f4f4f4'
        }
    },
    palenight: {
        id: 'palenight',
        name: 'Palenight',
        description: 'Material Theme Palenight variant',
        category: 'editor',
        isDark: true,
        preview: {
            background: '#292d3e',
            foreground: '#a6accd',
            primary: '#82b1ff',
            accent: '#32374d'
        }
    },
    'oceanic-next': {
        id: 'oceanic-next',
        name: 'Oceanic Next',
        description: 'Sublime Material Theme evolved',
        category: 'editor',
        isDark: true,
        preview: {
            background: '#1b2b34',
            foreground: '#c0c5ce',
            primary: '#6699cc',
            accent: '#343d46'
        }
    },
    'ayu-light': {
        id: 'ayu-light',
        name: 'Ayu Light',
        description: 'Simple theme with bright colors',
        category: 'editor',
        isDark: false,
        preview: {
            background: '#fafafa',
            foreground: '#5c6166',
            primary: '#36a3d9',
            accent: '#f0f0f0'
        }
    },
    'ayu-mirage': {
        id: 'ayu-mirage',
        name: 'Ayu Mirage',
        description: 'Ayu with desaturated colors',
        category: 'editor',
        isDark: true,
        preview: {
            background: '#1f2430',
            foreground: '#cbccc6',
            primary: '#5ccfe6',
            accent: '#272d38'
        }
    },
    'ayu-dark': {
        id: 'ayu-dark',
        name: 'Ayu Dark',
        description: 'Ayu with dark background',
        category: 'editor',
        isDark: true,
        preview: {
            background: '#0a0e14',
            foreground: '#b3b1ad',
            primary: '#39bae6',
            accent: '#151a1e'
        }
    },
    synthwave: {
        id: 'synthwave',
        name: "Synthwave '84",
        description: 'Retro cyberpunk neon aesthetic',
        category: 'aesthetic',
        isDark: true,
        preview: {
            background: '#2a2139',
            foreground: '#f8f8f2',
            primary: '#ff7edb',
            accent: '#36294a'
        }
    },
    cyberpunk: {
        id: 'cyberpunk',
        name: 'Cyberpunk',
        description: 'High-tech low-life neon theme',
        category: 'aesthetic',
        isDark: true,
        preview: {
            background: '#000b1e',
            foreground: '#0abdc6',
            primary: '#ea00d9',
            accent: '#091833'
        }
    },
    forest: {
        id: 'forest',
        name: 'Forest',
        description: 'Natural green woodland theme',
        category: 'aesthetic',
        isDark: true,
        preview: {
            background: '#1e2326',
            foreground: '#d3c6aa',
            primary: '#a7c080',
            accent: '#2d353b'
        }
    },
    sunset: {
        id: 'sunset',
        name: 'Sunset',
        description: 'Warm orange and pink sunset colors',
        category: 'aesthetic',
        isDark: true,
        preview: {
            background: '#1a1a2e',
            foreground: '#eee6e2',
            primary: '#ff6b6b',
            accent: '#16213e'
        }
    },
    'minimal-light': {
        id: 'minimal-light',
        name: 'Minimal Light',
        description: 'Ultra-clean minimal light theme',
        category: 'minimal',
        isDark: false,
        preview: {
            background: '#ffffff',
            foreground: '#2e3440',
            primary: '#5e81ac',
            accent: '#f8f9fa'
        }
    },
    'minimal-dark': {
        id: 'minimal-dark',
        name: 'Minimal Dark',
        description: 'Ultra-clean minimal dark theme',
        category: 'minimal',
        isDark: true,
        preview: {
            background: '#0d1117',
            foreground: '#c9d1d9',
            primary: '#58a6ff',
            accent: '#161b22'
        }
    },
    'neon-city': {
        id: 'neon-city',
        name: 'Neon City',
        description: 'Vibrant cyberpunk cityscape with electric colors',
        category: 'aesthetic',
        isDark: true,
        preview: {
            background: '#0a0a0f',
            foreground: '#00ffff',
            primary: '#ff0080',
            accent: '#1a1a2e'
        }
    },
    'ocean-depths': {
        id: 'ocean-depths',
        name: 'Ocean Depths',
        description: 'Deep sea blues with bioluminescent accents',
        category: 'aesthetic',
        isDark: true,
        preview: {
            background: '#001122',
            foreground: '#87ceeb',
            primary: '#00ced1',
            accent: '#003344'
        }
    },
    'cherry-blossom': {
        id: 'cherry-blossom',
        name: 'Cherry Blossom',
        description: 'Soft pink petals and spring morning light',
        category: 'aesthetic',
        isDark: false,
        preview: {
            background: '#fef7f0',
            foreground: '#4a4a4a',
            primary: '#ff69b4',
            accent: '#ffe4e1'
        }
    },
    'autumn-leaves': {
        id: 'autumn-leaves',
        name: 'Autumn Leaves',
        description: 'Warm oranges, reds, and golden yellows',
        category: 'aesthetic',
        isDark: false,
        preview: {
            background: '#fff8e7',
            foreground: '#654321',
            primary: '#d2691e',
            accent: '#ffeaa7'
        }
    },
    'midnight-purple': {
        id: 'midnight-purple',
        name: 'Midnight Purple',
        description: 'Deep purples with mystical violet undertones',
        category: 'aesthetic',
        isDark: true,
        preview: {
            background: '#1a0d26',
            foreground: '#e6e6fa',
            primary: '#9370db',
            accent: '#2e1a47'
        }
    },
    'golden-hour': {
        id: 'golden-hour',
        name: 'Golden Hour',
        description: 'Warm sunset glow with honey-colored light',
        category: 'aesthetic',
        isDark: false,
        preview: {
            background: '#fff9e6',
            foreground: '#8b4513',
            primary: '#ffa500',
            accent: '#ffecb3'
        }
    },
    'arctic-aurora': {
        id: 'arctic-aurora',
        name: 'Arctic Aurora',
        description: 'Northern lights dancing across icy landscape',
        category: 'aesthetic',
        isDark: true,
        preview: {
            background: '#0f1419',
            foreground: '#e1f5fe',
            primary: '#00ff9f',
            accent: '#1e3a5f'
        }
    },
    'desert-sand': {
        id: 'desert-sand',
        name: 'Desert Sand',
        description: 'Warm earth tones and sun-bleached landscapes',
        category: 'aesthetic',
        isDark: false,
        preview: {
            background: '#faf0e6',
            foreground: '#8b4513',
            primary: '#cd853f',
            accent: '#f5deb3'
        }
    },
    'cosmic-void': {
        id: 'cosmic-void',
        name: 'Cosmic Void',
        description: 'Deep space darkness with distant starlight',
        category: 'aesthetic',
        isDark: true,
        preview: {
            background: '#000014',
            foreground: '#ffffff',
            primary: '#4169e1',
            accent: '#191970'
        }
    },
    'emerald-dream': {
        id: 'emerald-dream',
        name: 'Emerald Dream',
        description: 'Mystical forest greens with jade highlights',
        category: 'aesthetic',
        isDark: true,
        preview: {
            background: '#0d1b0d',
            foreground: '#98fb98',
            primary: '#00ff7f',
            accent: '#1a331a'
        }
    },
    'crimson-tide': {
        id: 'crimson-tide',
        name: 'Crimson Tide',
        description: 'Deep reds with burgundy and wine accents',
        category: 'aesthetic',
        isDark: true,
        preview: {
            background: '#1a0a0a',
            foreground: '#ffb6c1',
            primary: '#dc143c',
            accent: '#331a1a'
        }
    },
    'lavender-mist': {
        id: 'lavender-mist',
        name: 'Lavender Mist',
        description: 'Soft purples and gentle morning hues',
        category: 'aesthetic',
        isDark: false,
        preview: {
            background: '#f8f5ff',
            foreground: '#483d8b',
            primary: '#9370db',
            accent: '#e6e6fa'
        }
    },
    'volcano-ash': {
        id: 'volcano-ash',
        name: 'Volcano Ash',
        description: 'Smoky grays with molten orange highlights',
        category: 'aesthetic',
        isDark: true,
        preview: {
            background: '#1c1c1c',
            foreground: '#d3d3d3',
            primary: '#ff4500',
            accent: '#2f2f2f'
        }
    },
    'ice-crystal': {
        id: 'ice-crystal',
        name: 'Ice Crystal',
        description: 'Crystalline blues with frozen white accents',
        category: 'aesthetic',
        isDark: false,
        preview: {
            background: '#f0ffff',
            foreground: '#2f4f4f',
            primary: '#87ceeb',
            accent: '#e0ffff'
        }
    },
    'retro-amber': {
        id: 'retro-amber',
        name: 'Retro Amber',
        description: 'Vintage terminal amber on dark background',
        category: 'aesthetic',
        isDark: true,
        preview: {
            background: '#1a1a0d',
            foreground: '#ffbf00',
            primary: '#ffa500',
            accent: '#2d2d1a'
        }
    },
    'matrix-green': {
        id: 'matrix-green',
        name: 'Matrix Green',
        description: 'Digital rain cascading green code streams',
        category: 'aesthetic',
        isDark: true,
        preview: {
            background: '#0d1a0d',
            foreground: '#00ff00',
            primary: '#32cd32',
            accent: '#1a331a'
        }
    },
    'cotton-candy': {
        id: 'cotton-candy',
        name: 'Cotton Candy',
        description: 'Sweet pastel pinks and blues',
        category: 'aesthetic',
        isDark: false,
        preview: {
            background: '#fff0f5',
            foreground: '#4b0082',
            primary: '#ff69b4',
            accent: '#ffc0cb'
        }
    },
    'storm-clouds': {
        id: 'storm-clouds',
        name: 'Storm Clouds',
        description: 'Dramatic grays with electric lightning',
        category: 'aesthetic',
        isDark: true,
        preview: {
            background: '#2f2f2f',
            foreground: '#e6e6e6',
            primary: '#00bfff',
            accent: '#4a4a4a'
        }
    },
    'rainbow-prism': {
        id: 'rainbow-prism',
        name: 'Rainbow Prism',
        description: 'Vibrant spectrum with prismatic effects',
        category: 'aesthetic',
        isDark: false,
        preview: {
            background: '#ffffff',
            foreground: '#333333',
            primary: '#ff6b6b',
            accent: '#f0f0f0'
        }
    },
    'moonlit-beach': {
        id: 'moonlit-beach',
        name: 'Moonlit Beach',
        description: 'Serene blues with silver moonbeams',
        category: 'aesthetic',
        isDark: true,
        preview: {
            background: '#0a1a2e',
            foreground: '#e6f3ff',
            primary: '#87ceeb',
            accent: '#16213e'
        }
    },
    'electric-blue': {
        id: 'electric-blue',
        name: 'Electric Blue',
        description: 'High-voltage blues with neon intensity',
        category: 'aesthetic',
        isDark: true,
        preview: {
            background: '#001a33',
            foreground: '#e6f3ff',
            primary: '#0080ff',
            accent: '#003366'
        }
    },
    'rose-gold': {
        id: 'rose-gold',
        name: 'Rose Gold',
        description: 'Elegant metallic pinks and warm golds',
        category: 'aesthetic',
        isDark: false,
        preview: {
            background: '#fff5f5',
            foreground: '#8b4513',
            primary: '#e91e63',
            accent: '#fde2e7'
        }
    },
    'space-nebula': {
        id: 'space-nebula',
        name: 'Space Nebula',
        description: 'Cosmic dust clouds with stellar formations',
        category: 'aesthetic',
        isDark: true,
        preview: {
            background: '#1a0d26',
            foreground: '#e6ccff',
            primary: '#8a2be2',
            accent: '#330d4d'
        }
    },
    'jungle-canopy': {
        id: 'jungle-canopy',
        name: 'Jungle Canopy',
        description: 'Lush greens with dappled sunlight',
        category: 'aesthetic',
        isDark: false,
        preview: {
            background: '#f0fff0',
            foreground: '#006400',
            primary: '#228b22',
            accent: '#e6ffe6'
        }
    },
    'winter-frost': {
        id: 'winter-frost',
        name: 'Winter Frost',
        description: 'Crisp whites with icy blue undertones',
        category: 'aesthetic',
        isDark: false,
        preview: {
            background: '#ffffff',
            foreground: '#2f4f4f',
            primary: '#4682b4',
            accent: '#f0f8ff'
        }
    },
    'blood-moon': {
        id: 'blood-moon',
        name: 'Blood Moon',
        description: 'Crimson lunar eclipse with dark shadows',
        category: 'aesthetic',
        isDark: true,
        preview: {
            background: '#1a0000',
            foreground: '#ffcccc',
            primary: '#8b0000',
            accent: '#330000'
        }
    },
    'coral-reef': {
        id: 'coral-reef',
        name: 'Coral Reef',
        description: 'Vibrant underwater ecosystem colors',
        category: 'aesthetic',
        isDark: false,
        preview: {
            background: '#f0ffff',
            foreground: '#008080',
            primary: '#ff7f50',
            accent: '#e0ffff'
        }
    },
    'crystal-cave': {
        id: 'crystal-cave',
        name: 'Crystal Cave',
        description: 'Prismatic minerals with amethyst glow',
        category: 'aesthetic',
        isDark: true,
        preview: {
            background: '#1a1a2e',
            foreground: '#e6e6fa',
            primary: '#9966cc',
            accent: '#2e2e4d'
        }
    },
    'neon-pink': {
        id: 'neon-pink',
        name: 'Neon Pink',
        description: 'Electric magenta with cyber punk vibes',
        category: 'aesthetic',
        isDark: true,
        preview: {
            background: '#1a0d1a',
            foreground: '#ffe6ff',
            primary: '#ff1493',
            accent: '#330d33'
        }
    },
    'deep-ocean': {
        id: 'deep-ocean',
        name: 'Deep Ocean',
        description: 'Abyssal depths with mysterious blues',
        category: 'aesthetic',
        isDark: true,
        preview: {
            background: '#000033',
            foreground: '#b3d9ff',
            primary: '#0066cc',
            accent: '#001a4d'
        }
    },
    'fairy-tale': {
        id: 'fairy-tale',
        name: 'Fairy Tale',
        description: 'Magical pastels with enchanted forest hues',
        category: 'aesthetic',
        isDark: false,
        preview: {
            background: '#fff0f8',
            foreground: '#663399',
            primary: '#da70d6',
            accent: '#f5e6f0'
        }
    },
    steampunk: {
        id: 'steampunk',
        name: 'Steampunk',
        description: 'Victorian brass and copper machinery',
        category: 'aesthetic',
        isDark: true,
        preview: {
            background: '#1a1410',
            foreground: '#daa520',
            primary: '#cd853f',
            accent: '#2d251a'
        }
    },
    'quantum-realm': {
        id: 'quantum-realm',
        name: 'Quantum Realm',
        description: 'Particle physics with subatomic energy',
        category: 'aesthetic',
        isDark: true,
        preview: {
            background: '#0d0d1a',
            foreground: '#ccccff',
            primary: '#6666ff',
            accent: '#1a1a33'
        }
    },
    'twilight-zone': {
        id: 'twilight-zone',
        name: 'Twilight Zone',
        description: 'Mysterious dusk with otherworldly atmosphere',
        category: 'aesthetic',
        isDark: true,
        preview: {
            background: '#1a1a2e',
            foreground: '#ddd6ff',
            primary: '#8866cc',
            accent: '#2e2e4d'
        }
    },
    'vscode-dark': {
        id: 'vscode-dark',
        name: 'VS Code Dark+',
        description: 'Microsoft VS Code default dark theme',
        category: 'popular',
        isDark: true,
        preview: {
            background: '#1e1e1e',
            foreground: '#d4d4d4',
            primary: '#007acc',
            accent: '#2d2d30'
        }
    },
    'vscode-light': {
        id: 'vscode-light',
        name: 'VS Code Light+',
        description: 'Microsoft VS Code default light theme',
        category: 'popular',
        isDark: false,
        preview: {
            background: '#ffffff',
            foreground: '#000000',
            primary: '#0066cc',
            accent: '#f3f3f3'
        }
    },
    'sublime-monokai': {
        id: 'sublime-monokai',
        name: 'Sublime Monokai',
        description: 'Sublime Text classic Monokai theme',
        category: 'editor',
        isDark: true,
        preview: {
            background: '#272822',
            foreground: '#f8f8f2',
            primary: '#a6e22e',
            accent: '#383830'
        }
    },
    'sublime-material': {
        id: 'sublime-material',
        name: 'Sublime Material',
        description: 'Material Design theme for Sublime Text',
        category: 'editor',
        isDark: true,
        preview: {
            background: '#263238',
            foreground: '#eeffff',
            primary: '#80cbc4',
            accent: '#37474f'
        }
    },
    'jetbrains-darcula': {
        id: 'jetbrains-darcula',
        name: 'JetBrains Darcula',
        description: 'IntelliJ IDEA default dark theme',
        category: 'editor',
        isDark: true,
        preview: {
            background: '#2b2b2b',
            foreground: '#a9b7c6',
            primary: '#6897bb',
            accent: '#3c3f41'
        }
    },
    'jetbrains-light': {
        id: 'jetbrains-light',
        name: 'JetBrains Light',
        description: 'IntelliJ IDEA default light theme',
        category: 'editor',
        isDark: false,
        preview: {
            background: '#ffffff',
            foreground: '#000000',
            primary: '#0000ff',
            accent: '#f0f0f0'
        }
    },
    'vim-desert': {
        id: 'vim-desert',
        name: 'Vim Desert',
        description: 'Classic Vim desert colorscheme',
        category: 'editor',
        isDark: true,
        preview: {
            background: '#333333',
            foreground: '#ffffff',
            primary: '#87ceeb',
            accent: '#4d4d4d'
        }
    },
    'vim-gruvbox': {
        id: 'vim-gruvbox',
        name: 'Vim Gruvbox',
        description: 'Popular Vim gruvbox colorscheme',
        category: 'editor',
        isDark: true,
        preview: {
            background: '#282828',
            foreground: '#ebdbb2',
            primary: '#fe8019',
            accent: '#3c3836'
        }
    },
    'emacs-doom-one': {
        id: 'emacs-doom-one',
        name: 'Emacs Doom One',
        description: 'Doom Emacs One Dark inspired theme',
        category: 'editor',
        isDark: true,
        preview: {
            background: '#282c34',
            foreground: '#bbc2cf',
            primary: '#51afef',
            accent: '#3f444a'
        }
    },
    'emacs-spacemacs': {
        id: 'emacs-spacemacs',
        name: 'Emacs Spacemacs',
        description: 'Spacemacs default dark theme',
        category: 'editor',
        isDark: true,
        preview: {
            background: '#292b2e',
            foreground: '#b2b2b2',
            primary: '#4f97d7',
            accent: '#34323e'
        }
    },
    'base16-tomorrow': {
        id: 'base16-tomorrow',
        name: 'Base16 Tomorrow',
        description: 'Base16 Tomorrow Night theme',
        category: 'popular',
        isDark: true,
        preview: {
            background: '#1d1f21',
            foreground: '#c5c8c6',
            primary: '#81a2be',
            accent: '#373b41'
        }
    },
    'base16-ocean': {
        id: 'base16-ocean',
        name: 'Base16 Ocean',
        description: 'Base16 Ocean dark theme',
        category: 'popular',
        isDark: true,
        preview: {
            background: '#2b303b',
            foreground: '#c0c5ce',
            primary: '#8fa1b3',
            accent: '#343d46'
        }
    },
    'base16-default': {
        id: 'base16-default',
        name: 'Base16 Default',
        description: 'Base16 default dark theme',
        category: 'popular',
        isDark: true,
        preview: {
            background: '#181818',
            foreground: '#d8d8d8',
            primary: '#7cafc2',
            accent: '#383838'
        }
    },
    'high-contrast-dark': {
        id: 'high-contrast-dark',
        name: 'High Contrast Dark',
        description: 'High contrast dark theme for accessibility',
        category: 'popular',
        isDark: true,
        preview: {
            background: '#000000',
            foreground: '#ffffff',
            primary: '#00ff00',
            accent: '#1a1a1a'
        }
    },
    'high-contrast-light': {
        id: 'high-contrast-light',
        name: 'High Contrast Light',
        description: 'High contrast light theme for accessibility',
        category: 'popular',
        isDark: false,
        preview: {
            background: '#ffffff',
            foreground: '#000000',
            primary: '#0000ff',
            accent: '#f0f0f0'
        }
    },
    'dark-plus': {
        id: 'dark-plus',
        name: 'Dark+ (VS Code)',
        description: 'Enhanced VS Code Dark+ theme',
        category: 'popular',
        isDark: true,
        preview: {
            background: '#1e1e1e',
            foreground: '#d4d4d4',
            primary: '#569cd6',
            accent: '#252526'
        }
    },
    'light-plus': {
        id: 'light-plus',
        name: 'Light+ (VS Code)',
        description: 'Enhanced VS Code Light+ theme',
        category: 'popular',
        isDark: false,
        preview: {
            background: '#ffffff',
            foreground: '#000000',
            primary: '#0451a5',
            accent: '#f8f8f8'
        }
    },
    'quiet-light': {
        id: 'quiet-light',
        name: 'Quiet Light',
        description: 'Soft, minimal light theme',
        category: 'popular',
        isDark: false,
        preview: {
            background: '#f5f5f5',
            foreground: '#333333',
            primary: '#4078c0',
            accent: '#e8e8e8'
        }
    },
    'red-theme': {
        id: 'red-theme',
        name: 'Red Theme',
        description: 'Bold red accent theme',
        category: 'popular',
        isDark: true,
        preview: {
            background: '#390000',
            foreground: '#f8c8c8',
            primary: '#f14c4c',
            accent: '#5d1a1a'
        }
    },
    'kimbie-dark': {
        id: 'kimbie-dark',
        name: 'Kimbie Dark',
        description: 'Dark theme with warm orange accents',
        category: 'editor',
        isDark: true,
        preview: {
            background: '#221a0f',
            foreground: '#d3af86',
            primary: '#dc9656',
            accent: '#362712'
        }
    },
    'tomorrow-night': {
        id: 'tomorrow-night',
        name: 'Tomorrow Night',
        description: 'Classic Tomorrow Night theme',
        category: 'popular',
        isDark: true,
        preview: {
            background: '#1d1f21',
            foreground: '#c5c8c6',
            primary: '#81a2be',
            accent: '#373b41'
        }
    },
    'tomorrow-night-blue': {
        id: 'tomorrow-night-blue',
        name: 'Tomorrow Night Blue',
        description: 'Tomorrow Night with blue tones',
        category: 'popular',
        isDark: true,
        preview: {
            background: '#002451',
            foreground: '#ffffff',
            primary: '#99ffff',
            accent: '#003f8e'
        }
    },
    'tomorrow-night-bright': {
        id: 'tomorrow-night-bright',
        name: 'Tomorrow Night Bright',
        description: 'Brighter version of Tomorrow Night',
        category: 'popular',
        isDark: true,
        preview: {
            background: '#000000',
            foreground: '#eaeaea',
            primary: '#99cccc',
            accent: '#2a2a2a'
        }
    },
    'tomorrow-night-eighties': {
        id: 'tomorrow-night-eighties',
        name: 'Tomorrow Night Eighties',
        description: 'Retro 80s inspired Tomorrow Night',
        category: 'popular',
        isDark: true,
        preview: {
            background: '#2d2d2d',
            foreground: '#cccccc',
            primary: '#99cc99',
            accent: '#515151'
        }
    },
    'tomorrow-day': {
        id: 'tomorrow-day',
        name: 'Tomorrow Day',
        description: 'Light version of Tomorrow theme',
        category: 'popular',
        isDark: false,
        preview: {
            background: '#ffffff',
            foreground: '#4d4d4c',
            primary: '#4271ae',
            accent: '#efefef'
        }
    },
    'panda-syntax': {
        id: 'panda-syntax',
        name: 'Panda Syntax',
        description: 'Colorful panda theme with vibrant syntax',
        category: 'popular',
        isDark: true,
        preview: {
            background: '#292a2b',
            foreground: '#e6e6e6',
            primary: '#19f9d8',
            accent: '#3d3e40'
        }
    },
    cobalt2: {
        id: 'cobalt2',
        name: 'Cobalt2',
        description: 'Modern take on the classic Cobalt theme',
        category: 'popular',
        isDark: true,
        preview: {
            background: '#193549',
            foreground: '#ffffff',
            primary: '#ffc600',
            accent: '#1e4a5f'
        }
    },
    'night-owl': {
        id: 'night-owl',
        name: 'Night Owl',
        description: 'Theme for night owls, easy on the eyes',
        category: 'popular',
        isDark: true,
        preview: {
            background: '#011627',
            foreground: '#d6deeb',
            primary: '#82aaff',
            accent: '#1d3b53'
        }
    },
    'light-owl': {
        id: 'light-owl',
        name: 'Light Owl',
        description: 'Light version of Night Owl theme',
        category: 'popular',
        isDark: false,
        preview: {
            background: '#fbfbfb',
            foreground: '#403f53',
            primary: '#0c969b',
            accent: '#f0f0f0'
        }
    },
    'shades-of-purple': {
        id: 'shades-of-purple',
        name: 'Shades of Purple',
        description: 'Professional purple theme',
        category: 'popular',
        isDark: true,
        preview: {
            background: '#2d2b55',
            foreground: '#a599e9',
            primary: '#fad000',
            accent: '#3d3a6b'
        }
    },
    'winter-is-coming-dark': {
        id: 'winter-is-coming-dark',
        name: 'Winter is Coming Dark',
        description: 'Game of Thrones inspired dark theme',
        category: 'popular',
        isDark: true,
        preview: {
            background: '#0e1419',
            foreground: '#d4d4d4',
            primary: '#68c9ef',
            accent: '#1e252c'
        }
    },
    'winter-is-coming-light': {
        id: 'winter-is-coming-light',
        name: 'Winter is Coming Light',
        description: 'Game of Thrones inspired light theme',
        category: 'popular',
        isDark: false,
        preview: {
            background: '#ffffff',
            foreground: '#383a42',
            primary: '#0184bc',
            accent: '#f5f5f5'
        }
    },
    abyss: {
        id: 'abyss',
        name: 'Abyss',
        description: 'Dark theme inspired by the abyss',
        category: 'popular',
        isDark: true,
        preview: {
            background: '#000c18',
            foreground: '#6688cc',
            primary: '#22dddd',
            accent: '#001122'
        }
    },
    'slack-theme': {
        id: 'slack-theme',
        name: 'Slack Theme',
        description: 'Inspired by Slack modern interface',
        category: 'popular',
        isDark: false,
        preview: {
            background: '#ffffff',
            foreground: '#1d1c1d',
            primary: '#1264a3',
            accent: '#f8f8f8'
        }
    },
    'discord-dark': {
        id: 'discord-dark',
        name: 'Discord Dark',
        description: 'Discord default dark theme',
        category: 'popular',
        isDark: true,
        preview: {
            background: '#36393f',
            foreground: '#dcddde',
            primary: '#7289da',
            accent: '#2f3136'
        }
    },
    'notion-light': {
        id: 'notion-light',
        name: 'Notion Light',
        description: 'Clean Notion-inspired light theme',
        category: 'popular',
        isDark: false,
        preview: {
            background: '#ffffff',
            foreground: '#37352f',
            primary: '#2383e2',
            accent: '#f7f6f3'
        }
    },
    'notion-dark': {
        id: 'notion-dark',
        name: 'Notion Dark',
        description: 'Clean Notion-inspired dark theme',
        category: 'popular',
        isDark: true,
        preview: {
            background: '#191919',
            foreground: '#e9e9e7',
            primary: '#3b7cff',
            accent: '#2f2f2f'
        }
    },
    'bear-theme': {
        id: 'bear-theme',
        name: 'Bear Theme',
        description: 'Warm, note-taking inspired theme',
        category: 'popular',
        isDark: false,
        preview: {
            background: '#fafafa',
            foreground: '#3e3e3e',
            primary: '#bf0000',
            accent: '#f5f4f1'
        }
    },
    'obsidian-theme': {
        id: 'obsidian-theme',
        name: 'Obsidian Theme',
        description: 'Knowledge graph inspired dark theme',
        category: 'popular',
        isDark: true,
        preview: {
            background: '#0d1117',
            foreground: '#dcddde',
            primary: '#8b5cf6',
            accent: '#161b22'
        }
    }
}

export const THEME_CATEGORIES = {
    default: 'Default',
    dutch: 'Dutch Themes',
    catppuccin: 'Catppuccin',
    popular: 'Popular Themes',
    editor: 'Code Editor Themes',
    aesthetic: 'Aesthetic Themes',
    minimal: 'Minimal Themes'
} as const

export const getThemesByCategory = () => {
    const categories: Record<keyof typeof THEME_CATEGORIES, ThemeDefinition[]> =
        {
            default: [],
            dutch: [],
            catppuccin: [],
            popular: [],
            editor: [],
            aesthetic: [],
            minimal: []
        }

    Object.values(THEME_DEFINITIONS).forEach((theme) => {
        categories[theme.category].push(theme)
    })

    return categories
}
