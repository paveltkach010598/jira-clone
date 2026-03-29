import { useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
    Box, Typography, Paper, Chip,
    Button, Divider, LinearProgress
} from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import { useGetUsersQuery } from '../features/users/usersApi'
import { useGetTasksQuery } from '../features/tasks/tasksApi'
import ActivityChart from '../components/ActivityChart'
import type { UserRole, TaskStatus } from '../types'
import UserAvatar from "../components/ui/UserAvatar.tsx";

const ROLE_LABELS: Record<UserRole, string> = {
    developer: 'Программист',
    hr: 'HR',
    teamlead: 'Тимлид',
    admin: 'Админ',
}

const ROLE_COLORS: Record<UserRole, 'default' | 'primary' | 'secondary' | 'error'> = {
    developer: 'default',
    hr: 'secondary',
    teamlead: 'primary',
    admin: 'error',
}

const STATUS_LABELS: Record<TaskStatus, string> = {
    assigned: 'Назначена',
    in_progress: 'В работе',
    review: 'На проверке',
    done: 'Выполнена',
}

const STATUS_COLORS: Record<TaskStatus, string> = {
    assigned: '#9e9e9e',
    in_progress: '#ed6c02',
    review: '#0288d1',
    done: '#2e7d32',
}

export default function UserProfilePage() {
    const { userId } = useParams<{ userId: string }>()
    const navigate = useNavigate()
    const { data: users = [] } = useGetUsersQuery()
    const { data: allTasks = [] } = useGetTasksQuery()

    const user = useMemo(() => users.find(u => u.id === userId), [users, userId])
    const userTasks = useMemo(() => allTasks.filter(t => t.assignee_id === userId), [allTasks, userId])

    const stats = useMemo(() => ({
        assigned: userTasks.filter(t => t.status === 'assigned').length,
        in_progress: userTasks.filter(t => t.status === 'in_progress').length,
        review: userTasks.filter(t => t.status === 'review').length,
        done: userTasks.filter(t => t.status === 'done').length,
        total: userTasks.length,
    }), [userTasks])

    const donePercent = stats.total > 0 ? Math.round((stats.done / stats.total) * 100) : 0

    if (!user) return (
        <Box sx={{ p: 3 }}>
            <Typography>Пользователь не найден</Typography>
        </Box>
    )

    return (
        <Box sx={{ p: 3, maxWidth: 900, mx: 'auto' }}>
            <Button
                startIcon={<ArrowBackIcon />}
                onClick={() => navigate('/team')}
                sx={{ mb: 3 }}
                color="inherit"
            >
                Назад к команде
            </Button>

            {/* Шапка профиля */}
            <Paper elevation={0} sx={{ border: '1px solid #e0e0e0', borderRadius: 3, overflow: 'hidden', mb: 3 }}>
                <Box sx={{ bgcolor: 'primary.main', height: 80 }} />
                <Box sx={{ px: 3, pb: 3 }}>
                    <Box display="flex" alignItems="flex-end" justifyContent="space-between" mb={2}>
                        <UserAvatar
                            user={user}
                            size={72}
                            sx={{
                                border: '4px solid white',
                                mt: -4.5,
                                boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                            }}
                        />
                        <Chip
                            label={ROLE_LABELS[user.role as UserRole] ?? user.role}
                            color={ROLE_COLORS[user.role as UserRole]}
                        />
                    </Box>

                    <Typography variant="h5" fontWeight={700}>{user.full_name || 'Без имени'}</Typography>
                    <Typography variant="body2" color="text.secondary" mb={1}>{user.email}</Typography>

                    {user.bio && (
                        <Typography variant="body2" color="text.secondary" mt={1}>
                            {user.bio}
                        </Typography>
                    )}

                    <Divider sx={{ mt: 2, mb: 2 }} />

                    <Typography variant="caption" color="text.secondary">
                        В команде с {new Date(user.created_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </Typography>
                </Box>
            </Paper>

            <Box display="grid" gridTemplateColumns={{ xs: '1fr', md: '1fr 1fr' }} gap={3} mb={3}>
                {/* Статистика задач */}
                <Paper elevation={0} sx={{ p: 3, border: '1px solid #e0e0e0', borderRadius: 3 }}>
                    <Typography variant="h6" fontWeight={700} mb={2}>Статистика задач</Typography>

                    <Box display="flex" justifyContent="space-between" mb={1}>
                        <Typography variant="body2" color="text.secondary">Выполнено</Typography>
                        <Typography variant="body2" fontWeight={700}>{donePercent}%</Typography>
                    </Box>
                    <LinearProgress
                        variant="determinate"
                        value={donePercent}
                        sx={{
                            height: 8, borderRadius: 4, mb: 2,
                            bgcolor: '#e0e0e0',
                            '& .MuiLinearProgress-bar': { bgcolor: '#2e7d32', borderRadius: 4 }
                        }}
                    />

                    <Box display="grid" gridTemplateColumns="1fr 1fr" gap={1.5}>
                        {(Object.entries(STATUS_LABELS) as [TaskStatus, string][]).map(([status, label]) => (
                            <Box key={status} sx={{
                                p: 1.5,
                                borderRadius: 2,
                                border: '1px solid #e0e0e0',
                                borderLeft: `3px solid ${STATUS_COLORS[status]}`,
                            }}>
                                <Typography variant="h5" fontWeight={700} color={STATUS_COLORS[status]}>
                                    {stats[status]}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">{label}</Typography>
                            </Box>
                        ))}
                    </Box>
                </Paper>

                {/* Последние задачи */}
                <Paper elevation={0} sx={{ p: 3, border: '1px solid #e0e0e0', borderRadius: 3 }}>
                    <Typography variant="h6" fontWeight={700} mb={2}>Последние задачи</Typography>
                    {userTasks.length === 0 ? (
                        <Typography variant="body2" color="text.secondary">Задач нет</Typography>
                    ) : (
                        <Box display="flex" flexDirection="column" gap={1.5}>
                            {[...userTasks]
                                .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                                .slice(0, 5)
                                .map(task => (
                                    <Box key={task.id} display="flex" alignItems="center" justifyContent="space-between">
                                        <Typography variant="body2" sx={{
                                            flex: 1, mr: 1,
                                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                                        }}>
                                            {task.title}
                                        </Typography>
                                        <Chip
                                            label={STATUS_LABELS[task.status]}
                                            size="small"
                                            sx={{
                                                bgcolor: STATUS_COLORS[task.status],
                                                color: 'white',
                                                fontSize: 10, height: 20, flexShrink: 0
                                            }}
                                        />
                                    </Box>
                                ))}
                        </Box>
                    )}
                </Paper>
            </Box>

            {/* График активности */}
            <ActivityChart tasks={userTasks} />
        </Box>
    )
}