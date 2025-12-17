import './global.css'

import AppRouter from '@/app/router'
import AppProvider from '@/app/provider'
import { ThemeInitializer } from '@/features/themes/loader'

export default function App() {
    return (
        <AppProvider>
            <ThemeInitializer />
            <AppRouter />
        </AppProvider>
    )
}
