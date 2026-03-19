import { createTheme } from '@mui/material/styles'

export const lightTheme = createTheme({
    palette: {
        mode: 'light',
        primary: { main: '#1976d2' },
        background: {
            default: '#f8f9fa',
            paper: '#ffffff',
        },
    },
})

export const darkTheme = createTheme({
    palette: {
        mode: 'dark',
        primary: { main: '#90caf9' },
        background: {
            default: '#0a0a0a',
            paper: '#1a1a1a',
        },
    },
})