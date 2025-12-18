import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/app'
import { initializeFont } from '@/features/themes/fonts'

// Initialize font on app load
initializeFont()

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
)
