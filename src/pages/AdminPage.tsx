import { useState } from 'react'
import {
    Box, Typography, Paper, Avatar, Chip,
    Select, MenuItem, FormControl, CircularProgress,
    Alert, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow
} from '@mui/material'
import { useGetUsersQuery, useUpdateUserRoleMutation } from '../features/users/usersApi'
import { useSelector } from 'react-redux'
import type { RootState } from '../app/store'
import type { UserRole, Profile } from '../types'

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

export default function AdminPage() {
    const { user: currentUser } = useSelector((state: RootState) => state.auth)
    const { data: users = [], isLoading } = useGetUsersQuery()
    const [updateUserRole] = useUpdateUserRoleMutation()
    const [updatingId, setUpdatingId] = useState<string | null>(null)
    const [successId, setSuccessId] = useState<string | null>(null)

    const handleRoleChange = async (userId: string, newRole: UserRole) => {
        if (userId === currentUser?.id) return
        setUpdatingId(userId)
        try {
            await updateUserRole({ id: userId, role: newRole })
            setSuccessId(userId)
            setTimeout(() => setSuccessId(null), 2000)
        } finally {
            setUpdatingId(null)
        }
    }

    if (isLoading) return (
        <Box display="flex" justifyContent="center" mt={4} >
            <CircularProgress />
        </Box>
    )

    return (
        <Box sx={{p:3}}>
            <Typography variant="h4" fontWeight={700} mb={1}>Админ панель</Typography>
            <Typography variant="body2" color="text.secondary" mb={3}>
                Управление ролями пользователей
            </Typography>

            {successId && (
                <Alert severity="success" sx={{ mb: 2 }}>
                    Роль успешно обновлена
                </Alert>
            )}

            <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid',
                borderColor: 'divider', borderRadius: 3 }}>
                <Table>
                    <TableHead>
                        <TableRow sx={{ bgcolor: 'background.default' }}>
                            <TableCell fontWeight={600}>Программист</TableCell>
                            <TableCell>Email</TableCell>
                            <TableCell>Текущая роль</TableCell>
                            <TableCell>Изменить роль</TableCell>
                            <TableCell>Дата регистрации</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {users.map((user: Profile) => (
                            <TableRow
                                key={user.id}
                                sx={{
                                    '&:hover': { bgcolor: 'action.hover' },
                                    opacity: updatingId === user.id ? 0.6 : 1,
                                    transition: 'opacity 0.2s',
                                }}
                            >
                                <TableCell>
                                    <Box display="flex" alignItems="center" gap={1.5}>
                                        <Avatar sx={{ width: 36, height: 36, bgcolor: 'primary.main', fontSize: 14 }}>
                                            {user.full_name?.[0]?.toUpperCase() ?? '?'}
                                        </Avatar>
                                        <Box>
                                            <Typography variant="body2" fontWeight={600}>
                                                {user.full_name || 'Без имени'}
                                            </Typography>
                                            {user.id === currentUser?.id && (
                                                <Typography variant="caption" color="primary">это вы</Typography>
                                            )}
                                        </Box>
                                    </Box>
                                </TableCell>
                                <TableCell>
                                    <Typography variant="body2" color="text.secondary">{user.email}</Typography>
                                </TableCell>
                                <TableCell>
                                    <Chip
                                        label={ROLE_LABELS[user.role as UserRole]}
                                        color={ROLE_COLORS[user.role as UserRole]}
                                        size="small"
                                    />
                                </TableCell>
                                <TableCell>
                                    {user.id === currentUser?.id ? (
                                        <Typography variant="caption" color="text.secondary">
                                            Нельзя изменить свою роль
                                        </Typography>
                                    ) : (
                                        <FormControl size="small" sx={{ minWidth: 150 }}>
                                            <Select
                                                value={user.role}
                                                onChange={(e) => handleRoleChange(user.id, e.target.value as UserRole)}
                                                disabled={updatingId === user.id}
                                            >
                                                <MenuItem value="developer">Программист</MenuItem>
                                                <MenuItem value="hr">HR</MenuItem>
                                                <MenuItem value="teamlead">Тимлид</MenuItem>
                                                <MenuItem value="admin">Админ</MenuItem>
                                            </Select>
                                        </FormControl>
                                    )}
                                </TableCell>
                                <TableCell>
                                    <Typography variant="caption" color="text.secondary">
                                        {new Date(user.created_at).toLocaleDateString('ru-RU')}
                                    </Typography>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    )
}