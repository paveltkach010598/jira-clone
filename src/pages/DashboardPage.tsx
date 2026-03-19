import { useMemo } from 'react'
import { Box, Typography, Paper, Avatar, Chip, LinearProgress } from '@mui/material'
import { useGetTasksQuery } from '../features/tasks/tasksApi'
import { useGetUsersQuery } from '../features/users/usersApi'
import { useSelector } from 'react-redux'
import type { RootState } from '../app/store'
import type { TaskStatus, UserRole } from '../types'
import ActivityChart from '../components/ActivityChart'



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

const ROLE_LABELS: Record<UserRole, string> = {
    developer: 'Программист',
    hr: 'HR',
    teamlead: 'Тимлид',
    admin: 'Админ',
}

export default function DashboardPage() {
    const { user } = useSelector((state: RootState) => state.auth)
    const { data: allTasks = [] } = useGetTasksQuery()
    const { data: users = [] } = useGetUsersQuery()

    const isManager = user?.role === 'admin' || user?.role === 'teamlead'

    const myTasks = useMemo(() => {
        if (isManager) return allTasks
        return allTasks.filter(t => t.assignee_id === user?.id)
    }, [allTasks, isManager, user?.id])

    const stats = useMemo(() => ({
        assigned: myTasks.filter(t => t.status === 'assigned').length,
        in_progress: myTasks.filter(t => t.status === 'in_progress').length,
        review: myTasks.filter(t => t.status === 'review').length,
        done: myTasks.filter(t => t.status === 'done').length,
        total: myTasks.length,
    }), [myTasks])

    const overdueCount = useMemo(() => {
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        return myTasks.filter(t => {
            if (!t.deadline || t.status === 'done') return false
            return new Date(t.deadline) < today
        }).length
    }, [myTasks])

    const recentTasks = useMemo(() => {
        return [...myTasks]
            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
            .slice(0, 5)
    }, [myTasks])

    const donePercent = stats.total > 0 ? Math.round((stats.done / stats.total) * 100) : 0

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" fontWeight={700} mb={1}>
                Добро пожаловать, {user?.full_name?.split(' ')[0]} 👋
            </Typography>
            <Typography variant="body2" color="text.secondary" mb={3}>
                {new Date().toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' })}
            </Typography>

            {/* Карточки статистики */}
            <Box display="grid" gridTemplateColumns="repeat(auto-fit, minmax(200px, 1fr))" gap={2} mb={3}>
                {(Object.entries(STATUS_LABELS) as [TaskStatus, string][]).map(([status, label]) => (
                    <Paper
                        key={status}
                        elevation={0}
                        sx={{
                            p: 2.5,
                            border: '1px solid #e0e0e0',
                            borderRadius: 3,
                            borderLeft: `4px solid ${STATUS_COLORS[status]}`,
                        }}
                    >
                        <Typography variant="h3" fontWeight={700} color={STATUS_COLORS[status]}>
                            {stats[status]}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">{label}</Typography>
                    </Paper>
                ))}

                {overdueCount > 0 && (
                    <Paper elevation={0} sx={{
                        p: 2.5,
                        border: '1px solid #ffccbc',
                        borderRadius: 3,
                        borderLeft: '4px solid #e65100',
                        bgcolor: '#fff8f5',
                    }}>
                        <Typography variant="h3" fontWeight={700} color="#e65100">{overdueCount}</Typography>
                        <Typography variant="body2" color="#e65100">Просрочено</Typography>
                    </Paper>
                )}
            </Box>

            <Box display="grid" gridTemplateColumns={{ xs: '1fr', md: '1fr 1fr' }} gap={2}>

                {/* Прогресс выполнения */}
                <Paper elevation={0} sx={{ p: 3, border: '1px solid #e0e0e0', borderRadius: 3 }}>
                    <Typography variant="h6" fontWeight={700} mb={2}>Прогресс</Typography>
                    <Box display="flex" justifyContent="space-between" mb={1}>
                        <Typography variant="body2" color="text.secondary">Выполнено задач</Typography>
                        <Typography variant="body2" fontWeight={700}>{donePercent}%</Typography>
                    </Box>
                    <LinearProgress
                        variant="determinate"
                        value={donePercent}
                        sx={{
                            height: 10,
                            borderRadius: 5,
                            bgcolor: '#e0e0e0',
                            '& .MuiLinearProgress-bar': { bgcolor: '#2e7d32', borderRadius: 5 }
                        }}
                    />
                    <Typography variant="caption" color="text.secondary" mt={1} display="block">
                        {stats.done} из {stats.total} задач выполнено
                    </Typography>
                </Paper>

                {/* Последние задачи */}
                <Paper elevation={0} sx={{ p: 3, border: '1px solid #e0e0e0', borderRadius: 3 }}>
                    <Typography variant="h6" fontWeight={700} mb={2}>Последние задачи</Typography>
                    {recentTasks.length === 0 ? (
                        <Typography variant="body2" color="text.secondary">Задач пока нет</Typography>
                    ) : (
                        <Box display="flex" flexDirection="column" gap={1.5}>
                            {recentTasks.map(task => (
                                <Box key={task.id} display="flex" alignItems="center" justifyContent="space-between">
                                    <Box flex={1} mr={1}>
                                        <Typography variant="body2" fontWeight={500} sx={{
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap',
                                        }}>
                                            {task.title}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            {new Date(task.created_at).toLocaleDateString('ru-RU')}
                                        </Typography>
                                    </Box>
                                    <Chip
                                        label={STATUS_LABELS[task.status]}
                                        size="small"
                                        sx={{
                                            bgcolor: STATUS_COLORS[task.status],
                                            color: 'white',
                                            fontSize: 10,
                                            height: 20,
                                            flexShrink: 0,
                                        }}
                                    />
                                </Box>
                            ))}
                        </Box>
                    )}
                </Paper>

                {/* Команда — только для менеджеров */}
                {isManager && (
                    <Paper elevation={0} sx={{ p: 3, border: '1px solid #e0e0e0', borderRadius: 3 }}>
                        <Typography variant="h6" fontWeight={700} mb={2}>
                            Команда ({users.length})
                        </Typography>
                        <Box display="flex" flexDirection="column" gap={1.5}>
                            {users.map(u => {
                                const userTaskCount = allTasks.filter(t => t.assignee_id === u.id).length
                                const userDoneCount = allTasks.filter(t => t.assignee_id === u.id && t.status === 'done').length
                                return (
                                    <Box key={u.id} display="flex" alignItems="center" gap={1.5}>
                                        <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main', fontSize: 13 }}>
                                            {u.full_name?.[0]?.toUpperCase() ?? '?'}
                                        </Avatar>
                                        <Box flex={1}>
                                            <Typography variant="body2" fontWeight={500}>{u.full_name}</Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                {userDoneCount}/{userTaskCount} задач выполнено
                                            </Typography>
                                        </Box>
                                        <Chip
                                            label={ROLE_LABELS[u.role as UserRole] ?? u.role}
                                            size="small"
                                            variant="outlined"
                                            sx={{ fontSize: 10, height: 20 }}
                                        />
                                    </Box>
                                )
                            })}
                        </Box>
                    </Paper>
                )}

                {/* Ближайшие дедлайны */}
                <Paper elevation={0} sx={{ p: 3, border: '1px solid #e0e0e0', borderRadius: 3 }}>
                    <Typography variant="h6" fontWeight={700} mb={2}>Ближайшие дедлайны</Typography>
                    {(() => {
                        const today = new Date()
                        today.setHours(0, 0, 0, 0)
                        const upcoming = myTasks
                            .filter(t => t.deadline && t.status !== 'done')
                            .sort((a, b) => new Date(a.deadline!).getTime() - new Date(b.deadline!).getTime())
                            .slice(0, 5)

                        if (upcoming.length === 0) return (
                            <Typography variant="body2" color="text.secondary">Нет ближайших дедлайнов</Typography>
                        )

                        return upcoming.map(task => {
                            const deadline = new Date(task.deadline!)
                            deadline.setHours(0, 0, 0, 0)
                            const diffDays = Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
                            const isOverdue = diffDays < 0
                            const isUrgent = diffDays <= 2 && !isOverdue

                            return (
                                <Box key={task.id} display="flex" alignItems="center" justifyContent="space-between" mb={1.5}>
                                    <Box flex={1} mr={1}>
                                        <Typography variant="body2" fontWeight={500} sx={{
                                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                                        }}>
                                            {task.title}
                                        </Typography>
                                        <Typography variant="caption" sx={{
                                            color: isOverdue ? '#e65100' : isUrgent ? '#ed6c02' : 'text.secondary'
                                        }}>
                                            {isOverdue
                                                ? `Просрочено на ${Math.abs(diffDays)} дн.`
                                                : diffDays === 0 ? 'Сегодня!'
                                                    : `Через ${diffDays} дн.`}
                                        </Typography>
                                    </Box>
                                    <Typography variant="caption" color="text.secondary" flexShrink={0}>
                                        {deadline.toLocaleDateString('ru-RU')}
                                    </Typography>
                                </Box>
                            )
                        })
                    })()}
                </Paper>
                {/* График активности */}
                <Box sx={{ gridColumn: { md: '1 / -1' }, mb: 2 }}>
                    <ActivityChart tasks={myTasks} />
                </Box>
            </Box>

        </Box>
    )
}