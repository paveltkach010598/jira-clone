import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
    Box, Typography, Paper, Avatar, Chip
} from '@mui/material'
import { useGetUsersQuery } from '../features/users/usersApi'
import { useGetTasksQuery } from '../features/tasks/tasksApi'
import type { Profile, UserRole } from '../types'

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

const ROLE_ORDER: UserRole[] = ['admin', 'teamlead', 'hr', 'developer']

export default function TeamPage() {
    const navigate = useNavigate()
    const { data: users = [] } = useGetUsersQuery()
    const { data: tasks = [] } = useGetTasksQuery()

    // Группируем по роли
    const groupedUsers = useMemo(() => {
        const groups: Record<string, Profile[]> = {}
        ROLE_ORDER.forEach(role => {
            const roleUsers = users.filter(u => u.role === role)
            if (roleUsers.length > 0) groups[role] = roleUsers
        })
        return groups
    }, [users])

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" fontWeight={700} mb={1}>Команда</Typography>
            <Typography variant="body2" color="text.secondary" mb={3}>
                {users.length} участников
            </Typography>

            {Object.entries(groupedUsers).map(([role, roleUsers]) => (
                <Box key={role} mb={4}>
                    <Box display="flex" alignItems="center" gap={1.5} mb={2}>
                        <Typography variant="h6" fontWeight={700}>
                            {ROLE_LABELS[role as UserRole]}
                        </Typography>
                        <Chip
                            label={roleUsers.length}
                            size="small"
                            color={ROLE_COLORS[role as UserRole]}
                        />
                    </Box>

                    <Box display="grid" gridTemplateColumns="repeat(auto-fill, minmax(220px, 1fr))" gap={2}>
                        {roleUsers.map(user => {
                            const userTasks = tasks.filter(t => t.assignee_id === user.id)
                            const doneTasks = userTasks.filter(t => t.status === 'done')

                            return (
                                <Paper
                                    key={user.id}
                                    elevation={0}
                                    onClick={() => navigate(`/team/${user.id}`)}
                                    sx={{
                                        p: 2.5,
                                        border: '1px solid',
                                        borderColor:'divider',
                                        borderRadius: 3,
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                        '&:hover': {
                                            borderColor: 'primary.main',
                                            boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                                            transform: 'translateY(-2px)',
                                        }
                                    }}
                                >
                                    <Box display="flex" alignItems="center" gap={2} mb={2}>
                                        <Avatar sx={{
                                            width: 48, height: 48,
                                            bgcolor: 'primary.main',
                                            fontSize: 20, fontWeight: 700,
                                        }}>
                                            {user.full_name?.[0]?.toUpperCase() ?? '?'}
                                        </Avatar>
                                        <Box flex={1} overflow="hidden">
                                            <Typography variant="body1" fontWeight={600} sx={{
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                whiteSpace: 'nowrap',
                                            }}>
                                                {user.full_name || 'Без имени'}
                                            </Typography>
                                            <Chip
                                                label={ROLE_LABELS[user.role as UserRole] ?? user.role}
                                                color={ROLE_COLORS[user.role as UserRole]}
                                                size="small"
                                                sx={{ mt: 0.5, fontSize: 10, height: 20 }}
                                            />
                                        </Box>
                                    </Box>
                                    <Box display="flex" justifyContent="space-between" alignItems="center">
                                        <Typography variant="caption" color="text.secondary">
                                            Задач: {userTasks.length}
                                        </Typography>
                                        <Typography variant="caption" color="success.main" fontWeight={600}>
                                            ✓ {doneTasks.length} выполнено
                                        </Typography>
                                    </Box>
                                </Paper>
                            )
                        })}
                    </Box>
                </Box>
            ))}
        </Box>
    )
}