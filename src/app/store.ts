import { configureStore } from '@reduxjs/toolkit'
import authReducer from '../features/auth/authSlice'
import { tasksApi } from '../features/tasks/tasksApi'
import { usersApi } from '../features/users/usersApi'
import {commentsApi} from "../features/comments/commentsApi.ts";
import themeReducer from '../features/theme/themeSlice.ts'

export const store = configureStore({
    reducer: {
        auth: authReducer,
        [tasksApi.reducerPath]: tasksApi.reducer,
        [usersApi.reducerPath]: usersApi.reducer,
        [commentsApi.reducerPath]: commentsApi.reducer,
        theme: themeReducer,

    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware()
            .concat(tasksApi.middleware)
            .concat(usersApi.middleware)
            .concat(commentsApi.middleware),
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch