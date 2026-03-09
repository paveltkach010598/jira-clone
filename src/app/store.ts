import { configureStore } from '@reduxjs/toolkit'
import authReducer from '../features/auth/authSlice'
import { tasksApi } from '../features/tasks/tasksApi'
import { usersApi } from '../features/users/usersApi'

export const store = configureStore({
    reducer: {
        auth: authReducer,
        [tasksApi.reducerPath]: tasksApi.reducer,
        [usersApi.reducerPath]: usersApi.reducer,
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware()
            .concat(tasksApi.middleware)
            .concat(usersApi.middleware),
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch