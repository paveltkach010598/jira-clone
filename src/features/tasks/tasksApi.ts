import { createApi, fakeBaseQuery } from '@reduxjs/toolkit/query/react'
import { supabase } from '../../lib/supabaseClient'
import type { Task } from '../../types'

export const tasksApi = createApi({
    reducerPath: 'tasksApi',
    baseQuery: fakeBaseQuery(),
    tagTypes: ['Task'],
    endpoints: (builder) => ({

        getTasks: builder.query<Task[], void>({
            queryFn: async () => {
                const { data, error } = await supabase
                    .from('tasks')
                    .select(`
            *,
            assignee:profiles!tasks_assignee_id_fkey(id, full_name, avatar_url, role),
            creator:profiles!tasks_created_by_fkey(id, full_name)
          `)
                    .order('created_at', { ascending: false })

                if (error) return { error }
                return { data: data as Task[] }
            },
            providesTags: ['Task'],
        }),

        createTask: builder.mutation<Task, Partial<Task>>({
            queryFn: async (task) => {
                const { data, error } = await supabase
                    .from('tasks')
                    .insert(task)
                    .select()
                    .single()

                if (error) return { error }
                return { data }
            },
            invalidatesTags: ['Task'],
        }),

        updateTask: builder.mutation<Task, { id: string; updates: Partial<Task> }>({
            queryFn: async ({ id, updates }) => {
                const { data, error } = await supabase
                    .from('tasks')
                    .update({ ...updates, updated_at: new Date().toISOString() })
                    .eq('id', id)
                    .select()
                    .single()

                if (error) return { error }
                return { data }
            },
            invalidatesTags: ['Task'],
        }),

        deleteTask: builder.mutation<void, string>({
            queryFn: async (id) => {
                const { error } = await supabase
                    .from('tasks')
                    .delete()
                    .eq('id', id)

                if (error) return { error }
                return { data: undefined }
            },
            invalidatesTags: ['Task'],
        }),

    }),
})

export const {
    useGetTasksQuery,
    useCreateTaskMutation,
    useUpdateTaskMutation,
    useDeleteTaskMutation,
} = tasksApi