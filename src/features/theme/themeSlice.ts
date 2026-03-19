import { createSlice } from '@reduxjs/toolkit'

interface ThemeState {
    mode: 'light' | 'dark'
}

const saved = localStorage.getItem('theme') as 'light' | 'dark' | null

const initialState: ThemeState = {
    mode: saved ?? 'light',
}

const themeSlice = createSlice({
    name: 'theme',
    initialState,
    reducers: {
        toggleTheme(state) {
            state.mode = state.mode === 'light' ? 'dark' : 'light'
            localStorage.setItem('theme', state.mode)
        },
    },
})

export const { toggleTheme } = themeSlice.actions
export default themeSlice.reducer