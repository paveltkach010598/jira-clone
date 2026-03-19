import { createApi, fakeBaseQuery } from '@reduxjs/toolkit/query/react'

import type { Comment } from '../../types'
import {apiDelete, apiGet, apiPost} from "../../lib/appClient.ts";

export const commentsApi = createApi({
    reducerPath: 'commentsApi',
    baseQuery: fakeBaseQuery(),
    tagTypes: ['Comment'],
    endpoints: (builder) => ({

        getComments: builder.query<Comment[], string>({
            queryFn: async (taskId) => {
                try {
                    const data = await apiGet<Comment[]>(
                        `comments?task_id=eq.${taskId}&select=*,user:profiles!comments_user_id_fkey(id,full_name,avatar_url)&order=created_at.asc`
                    )
                    return { data }
                } catch (error) {
                    return { error }
                }
            },
            providesTags: ['Comment'],
        }),

        addComment: builder.mutation<Comment, { task_id: string; user_id: string; text: string }>({
            queryFn: async (comment) => {
                try {
                    const data = await apiPost<Comment[]>('comments', comment)
                    return { data: Array.isArray(data) ? data[0] : data }
                } catch (error) {
                    return { error }
                }
            },
            invalidatesTags: ['Comment'],
        }),

        deleteComment: builder.mutation<void, string>({
            queryFn: async (id) => {
                try {
                    await apiDelete(`comments?id=eq.${id}`)
                    return { data: undefined }
                } catch (error) {
                    return { error }
                }
            },
            invalidatesTags: ['Comment'],
        }),

    }),
})

export const {
    useGetCommentsQuery,
    useAddCommentMutation,
    useDeleteCommentMutation,
} = commentsApi