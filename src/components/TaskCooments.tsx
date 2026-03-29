import { useState } from 'react'
import {
    Box, Typography,  TextField,
    Button, IconButton, CircularProgress, Divider
} from '@mui/material'
import DeleteIcon from '@mui/icons-material/Delete'
import SendIcon from '@mui/icons-material/Send'
import { useGetCommentsQuery, useAddCommentMutation, useDeleteCommentMutation } from '../features/comments/commentsApi'
import { useSelector } from 'react-redux'
import type { RootState } from '../app/store'
import UserAvatar from "./ui/UserAvatar.tsx";

interface Props {
    taskId: string
}

export default function TaskComments({ taskId }: Props) {
    const { user } = useSelector((state: RootState) => state.auth)
    const { data: comments = [], isLoading } = useGetCommentsQuery(taskId)
    const [addComment, { isLoading: isAdding }] = useAddCommentMutation()
    const [deleteComment] = useDeleteCommentMutation()
    const [text, setText] = useState('')

    const handleSubmit = async () => {
        if (!text.trim() || !user) return
        await addComment({
            task_id: taskId,
            user_id: user.id,
            text: text.trim(),
        })
        setText('')
    }

    const handleDelete = async (commentId: string) => {
        await deleteComment(commentId)
    }

    return (
        <Box mt={3}>
            <Divider sx={{ mb: 2 }} />
            <Typography variant="subtitle2" fontWeight={700} mb={2} color="text.secondary">
                КОММЕНТАРИИ {comments.length > 0 && `(${comments.length})`}
            </Typography>

            {/* Список комментариев */}
            {isLoading ? (
                <Box display="flex" justifyContent="center" py={2}>
                    <CircularProgress size={24} />
                </Box>
            ) : comments.length === 0 ? (
                <Typography variant="body2" color="text.secondary" mb={2}>
                    Комментариев пока нет
                </Typography>
            ) : (
                <Box display="flex" flexDirection="column" gap={2} mb={2}>
                    {comments.map(comment => {
                        const isOwn = comment.user_id === user?.id
                        const isAdmin = user?.role === 'admin'
                        const canDelete = isOwn || isAdmin

                        return (
                            <Box key={comment.id} display="flex" gap={1.5} alignItems="flex-start">
                                <UserAvatar user={comment.user} size={32} />
                                <Box flex={1}>
                                    <Box display="flex" alignItems="center" justifyContent="space-between">
                                        <Box display="flex" alignItems="center" gap={1}>
                                            <Typography variant="caption" fontWeight={700}>
                                                {comment.user?.full_name ?? 'Пользователь'}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                {new Date(comment.created_at).toLocaleString('ru-RU', {
                                                    day: '2-digit', month: '2-digit',
                                                    hour: '2-digit', minute: '2-digit'
                                                })}
                                            </Typography>
                                        </Box>
                                        {canDelete && (
                                            <IconButton
                                                size="small"
                                                onClick={() => handleDelete(comment.id)}
                                                sx={{ color: 'text.disabled', '&:hover': { color: 'error.main' } }}
                                            >
                                                <DeleteIcon fontSize="small" />
                                            </IconButton>
                                        )}
                                    </Box>
                                    <Box sx={{
                                        mt: 0.5, p: 1.5,
                                        bgcolor: isOwn ? '#e3f2fd' : '#f5f5f5',
                                        borderRadius: 2,
                                        borderTopLeftRadius: isOwn ? 2 : 0,
                                        borderTopRightRadius: isOwn ? 0 : 2,
                                    }}>
                                        <Typography variant="body2">{comment.text}</Typography>
                                    </Box>
                                </Box>
                            </Box>
                        )
                    })}
                </Box>
            )}

            {/* Поле ввода */}
            <Box display="flex" gap={1} alignItems="flex-end">
                <UserAvatar user={user} size={32} />
                <TextField
                    fullWidth
                    multiline
                    maxRows={4}
                    size="small"
                    placeholder="Написать комментарий..."
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault()
                            handleSubmit()
                        }
                    }}
                />
                <Button
                    variant="contained"
                    size="small"
                    onClick={handleSubmit}
                    disabled={!text.trim() || isAdding}
                    sx={{ minWidth: 40, px: 1.5 }}
                >
                    {isAdding ? <CircularProgress size={16} color="inherit" /> : <SendIcon fontSize="small" />}
                </Button>
            </Box>
        </Box>
    )
}