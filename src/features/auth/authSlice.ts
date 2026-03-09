import { createSlice } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'
import type { Profile } from '../../types'

interface AuthState {
    user: Profile | null
    isLoading: boolean
}

const initialState: AuthState = {
    user: null,
    isLoading: true,
}

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        setUser(state, action: PayloadAction<Profile | null>) {
            state.user = action.payload
            state.isLoading = false
        },
        setLoading(state, action: PayloadAction<boolean>) {
            state.isLoading = action.payload
        },
    },
})

export const { setUser, setLoading } = authSlice.actions
export default authSlice.reducer