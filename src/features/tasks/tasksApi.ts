import { createApi, fakeBaseQuery } from '@reduxjs/toolkit/query/react'
// import { apiGet, apiPost, apiPatch, apiDelete } from '../../lib/apiClient'
import type { Task } from '../../types'
import {apiDelete, apiGet, apiPatch, apiPost} from "../../lib/appClient.ts";

export const tasksApi = createApi({
    reducerPath: 'tasksApi',
    baseQuery: fakeBaseQuery(),
    tagTypes: ['Task'],
    endpoints: (builder) => ({

        getTasks: builder.query<Task[], void>({
            queryFn: async () => {
                try {
                    const data = await apiGet<Task[]>(
                        'tasks?select=*,assignee:profiles!tasks_assignee_id_fkey(id,full_name,avatar_url,role),creator:profiles!tasks_created_by_fkey(id,full_name)&order=created_at.desc'
                    )
                    return { data }
                } catch (error) {
                    return { error }
                }
            },
            providesTags: ['Task'],
        }),

        createTask: builder.mutation<Task, Partial<Task>>({
            queryFn: async (task) => {
                try {
                    const data = await apiPost<Task[]>('tasks', task)
                    return { data: Array.isArray(data) ? data[0] : data }
                } catch (error) {
                    return { error }
                }
            },
            invalidatesTags: ['Task'],
        }),

        updateTask: builder.mutation<Task, { id: string; updates: Partial<Task> }>({
            queryFn: async ({ id, updates }) => {
                try {
                    const data = await apiPatch<Task[]>(
                        `tasks?id=eq.${id}`,
                        { ...updates, updated_at: new Date().toISOString() }
                    )
                    return { data: Array.isArray(data) ? data[0] : data }
                } catch (error) {
                    return { error }
                }
            },
            invalidatesTags: ['Task'],
        }),

        deleteTask: builder.mutation<void, string>({
            queryFn: async (id) => {
                try {
                    await apiDelete(`tasks?id=eq.${id}`)
                    return { data: undefined }
                } catch (error) {
                    return { error }
                }
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