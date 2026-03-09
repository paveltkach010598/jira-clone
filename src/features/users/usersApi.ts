import { createApi, fakeBaseQuery } from '@reduxjs/toolkit/query/react'
import { supabase } from '../../lib/supabaseClient'
import type { Profile, UserRole } from '../../types'

export const usersApi = createApi({
    reducerPath: 'usersApi',
    baseQuery: fakeBaseQuery(),
    tagTypes: ['User'],
    endpoints: (builder) => ({

        getUsers: builder.query<Profile[], void>({
            queryFn: async () => {
                const { data, error } = await supabase
                    .from('profiles')
                    .select('*')
                    .order('created_at', { ascending: false })

                if (error) return { error }
                return { data: data as Profile[] }
            },
            providesTags: ['User'],
        }),

        updateUserRole: builder.mutation<Profile, { id: string; role: UserRole }>({
            queryFn: async ({ id, role }) => {
                const { data, error } = await supabase
                    .from('profiles')
                    .update({ role })
                    .eq('id', id)
                    .select()
                    .single()

                if (error) return { error }
                return { data }
            },
            invalidatesTags: ['User'],
        }),

        updateProfile: builder.mutation<Profile, { id: string; updates: Partial<Profile> }>({
            queryFn: async ({ id, updates }) => {
                const { data, error } = await supabase
                    .from('profiles')
                    .update(updates)
                    .eq('id', id)
                    .select()
                    .single()

                if (error) return { error }
                return { data }
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