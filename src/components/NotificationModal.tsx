import {useState, useEffect, useLayoutEffect} from 'react'
import {
    Box, Typography, Paper, Chip, IconButton,
    Backdrop
} from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import { useNavigate } from 'react-router-dom'
import { useGetTasksQuery } from '../features/tasks/tasksApi'
import { useSelector } from 'react-redux'
import type { RootState } from '../app/store'
import type { Task, TaskStatus } from '../types'

const STATUS_LABELS: Record<TaskStatus, string> = {
    assigned: 'Назначена',
    in_progress: 'В работе',
    review: 'На проверке',
    done: 'Выполнена',
}

const STATUS_COLORS: Record<TaskStatus, 'default' | 'warning' | 'info' | 'success'> = {
    assigned: 'default',
    in_progress: 'warning',
    review: 'info',
    done: 'success',
}

export default function NotificationModal() {
    const { user } = useSelector((state: RootState) => state.auth)
    const { data: allTasks = [], isSuccess } = useGetTasksQuery()
    const navigate = useNavigate()
    const [open, setOpen] = useState(false)
    const [hasShown, setHasShown] = useState(false)

    const myOpenTasks = allTasks.filter(t =>
        t.assignee_id === user?.id && t.status !== 'done'
    )

    useEffect(() => {
        if (isSuccess && user && myOpenTasks.length > 0 && !hasShown) {
            setOpen(true)
            setHasShown(true)
        }
    }, [isSuccess, myOpenTasks.length, user?.id])

    const handleTaskClick = (task: Task) => {
        setOpen(false)
        navigate('/tasks')
    }

    if (!open) return null

    return (
        <>
            {/* Затемнение */}
            <Backdrop
                open={open}
                sx={{ zIndex: 1300, bgcolor: 'rgba(0,0,0,0.3)' }}
                onClick={() => setOpen(false)}
            />

            {/* Модалка */}
            <Box sx={{
                position: 'fixed',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: 420,
                maxWidth: '90vw',
                zIndex: 1400,
                bgcolor: 'white',
                borderRadius: 3,
                boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
                overflow: 'hidden',
            }}>
                {/* Заголовок */}
                <Box sx={{
                    px: 3, py: 2,
                    bgcolor: 'primary.main',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                }}>
                    <Box>
                        <Typography variant="h6" fontWeight={700} color="white">
                            У вас есть незакрытые задачи
                        </Typography>
                        <Typography variant="caption" color="rgba(255,255,255,0.8)">
                            {myOpenTasks.length} задач ожидают вашего внимания
                        </Typography>
                    </Box>
                    <IconButton onClick={() => setOpen(false)} sx={{ color: 'white' }}>
                        <CloseIcon />
                    </IconButton>
                </Box>

                {/* Список задач */}
                <Box sx={{
                    maxHeight: 400,
                    overflowY: 'auto',
                    p: 2,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 1,
                }}>
                    {myOpenTasks.map(task => {
                        const isOverdue = task.deadline && task.status !== 'done' &&
                            new Date(task.deadline) < new Date()

                        return (
                            <Paper
                                key={task.id}
                                elevation={0}
                                onClick={() => handleTaskClick(task)}
                                sx={{
                                    p: 2,
                                    border: `1px solid ${isOverdue ? '#ffccbc' : '#e0e0e0'}`,
                                    bgcolor: isOverdue ? '#fff8f5' : 'white',
                                    borderRadius: 2,
                                    cursor: 'pointer',
                                    '&:hover': {
                                        borderColor: 'primary.main',
                                        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                                    },
                                    transition: 'all 0.15s ease',
                                }}
                            >
                                <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                                    <Typography variant="body2" fontWeight={600} flex={1} mr={1} sx={{
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap',
                                    }}>
                                        {task.title}
                                    </Typography>
                                    <Chip
                                        label={STATUS_LABELS[task.status]}
                                        color={STATUS_COLORS[task.status]}
                                        size="small"
                                        sx={{ fontSize: 10, height: 20, flexShrink: 0 }}
                                    />
                                </Box>
                                {task.deadline && (
                                    <Typography variant="caption" sx={{
                                        color: isOverdue ? '#e65100' : 'text.secondary',
                                        mt: 0.5,
                                        display: 'block',
                                    }}>
                                        {isOverdue ? '⚠️ Просрочено: ' : '📅 Дедлайн: '}
                                        {new Date(task.deadline).toLocaleDateString('ru-RU')}
                                    </Typography>
                                )}
                            </Paper>
                        )
                    })}
                </Box>

                {/* Футер */}
                <Box sx={{
                    px: 3, py: 2,
                    borderTop: '1px solid #e0e0e0',
                    display: 'flex',
                    justifyContent: 'flex-end',
                }}>
                    <Typography
                        variant="body2"
                        color="primary"
                        sx={{ cursor: 'pointer', fontWeight: 600 }}
                        onClick={() => { setOpen(false); navigate('/tasks') }}
                    >
                        Перейти к задачам →
                    </Typography>
                </Box>
            </Box>
        </>
    )
}