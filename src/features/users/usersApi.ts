import { createApi, fakeBaseQuery } from '@reduxjs/toolkit/query/react'

import type { Profile, UserRole } from '../../types'
import {apiGet, apiPatch} from "../../lib/appClient.ts";

export const usersApi = createApi({
    reducerPath: 'usersApi',
    baseQuery: fakeBaseQuery(),
    tagTypes: ['User'],
    endpoints: (builder) => ({

        getUsers: builder.query<Profile[], void>({
            queryFn: async () => {
                try {
                    const data = await apiGet<Profile[]>('profiles?select=*&order=created_at.desc')
                    return { data }
                } catch (error) {
                    return { error }
                }
            },
            providesTags: ['User'],
        }),

        updateUserRole: builder.mutation<Profile, { id: string; role: UserRole }>({
            queryFn: async ({ id, role }) => {
                try {
                    const data = await apiPatch<Profile[]>(`profiles?id=eq.${id}`, { role })
                    return { data: Array.isArray(data) ? data[0] : data }
                } catch (error) {
                    return { error }
                }
            },
            invalidatesTags: ['User'],
        }),

        updateProfile: builder.mutation<Profile, { id: string; updates: Partial<Profile> }>({
            queryFn: async ({ id, updates }) => {
                try {
                    const data = await apiPatch<Profile[]>(`profiles?id=eq.${id}`, updates)
                    return { data: Array.isArray(data) ? data[0] : data }
                } catch (error) {
                    return { error }
                }
            },
            invalidatesTags: ['User'],
        }),

    }),
})

export const {
    useGetUsersQuery,
    useUpdateUserRoleMutation,
    useUpdateProfileMutation,
} = usersApi