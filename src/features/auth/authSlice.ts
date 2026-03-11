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
            console.log('setUser вызван:', action.payload)
            state.user = action.payload
            state.isLoading = false
        },
    },
})

export const { setUser } = authSlice.actions
export default authSlice.reducer