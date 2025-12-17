import { useEffect, useState } from 'react'
import { ThemeVariant } from './defs'

export function useThemeStore() {
    // use a simple web based state for demonstration purposes
    const [theme, setTheme] = useState<string | null>(null)
    const [isLoaded, setIsLoaded] = useState(false)

    // load theme from localStorage on mount
    useEffect(() => {
        const storedTheme = localStorage.getItem('theme')
        if (storedTheme) {
            setTheme(storedTheme)
        }
        setIsLoaded(true)
    }, [])

    const updateTheme = (newTheme: ThemeVariant) => {
        localStorage.setItem('theme', newTheme)
        document.documentElement.className = ''
        document.documentElement.classList.add(newTheme)
        setTheme(newTheme)
    }

    return { theme, updateTheme, isLoaded }
}

export function ThemeInitializer() {
    const { theme, updateTheme, isLoaded } = useThemeStore()

    useEffect(() => {
        if (!isLoaded) return
        // Apply current theme on mount/hydration
        if (theme) {
            document.documentElement.className = ''
            document.documentElement.classList.add(theme)
        } else {
            // Fallback: detect system preference and set default theme
            const defaultTheme = 'default-dark'
            updateTheme(defaultTheme)
        }
    }, [theme, updateTheme])

    return null
}
