import { useState, useRef } from 'react'
import {
    Box, Typography, Paper, Avatar, Button,
    TextField, Divider, Alert, CircularProgress, Chip
} from '@mui/material'
import EditIcon from '@mui/icons-material/Edit'
import SaveIcon from '@mui/icons-material/Save'
import CancelIcon from '@mui/icons-material/Cancel'
import { useSelector, useDispatch } from 'react-redux'
import type { RootState } from '../app/store'
import { useUpdateProfileMutation } from '../features/users/usersApi'
import { setUser } from '../features/auth/authSlice'
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

export default function ProfilePage() {
    const { user } = useSelector((state: RootState) => state.auth)
    const dispatch = useDispatch()
    const [updateProfile, { isLoading }] = useUpdateProfileMutation()

    const [editing, setEditing] = useState(false)
    const [fullName, setFullName] = useState(user?.full_name ?? '')
    const [bio, setBio] = useState(user?.bio ?? '')
    const [success, setSuccess] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleSave = async () => {
        if (!user) return
        setError(null)
        try {
            const updated = await updateProfile({
                id: user.id,
                updates: { full_name: fullName, bio }
            }).unwrap()
            dispatch(setUser({ ...user, ...updated }))
            setSuccess(true)
            setEditing(false)
            setTimeout(() => setSuccess(false), 3000)
        } catch {
            setError('Ошибка при сохранении')
        }
    }

    const handleCancel = () => {
        setFullName(user?.full_name ?? '')
        setBio(user?.bio ?? '')
        setEditing(false)
        setError(null)
    }

    if (!user) return null

    return (
        <Box maxWidth={600}>
            <Typography variant="h4" fontWeight={700} mb={3}>Профиль</Typography>

            {success && <Alert severity="success" sx={{ mb: 2 }}>Профиль успешно обновлён</Alert>}
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

            <Paper elevation={0} sx={{ border: '1px solid #e0e0e0', borderRadius: 3, overflow: 'hidden' }}>

                {/* Шапка профиля */}
                <Box sx={{
                    bgcolor: 'primary.main',
                    height: 100,
                    position: 'relative',
                }}/>

                <Box sx={{ px: 3, pb: 3 }}>
                    {/* Аватар */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', mb: 2 }}>
                        <Avatar sx={{
                            width: 80, height: 80,
                            bgcolor: 'white',
                            color: 'primary.main',
                            fontSize: 32,
                            fontWeight: 700,
                            border: '4px solid white',
                            mt: -5,
                            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                        }}>
                            {user.full_name?.[0]?.toUpperCase() ?? '?'}
                        </Avatar>

                        {!editing ? (
                            <Button
                                startIcon={<EditIcon />}
                                variant="outlined"
                                size="small"
                                onClick={() => setEditing(true)}
                            >
                                Редактировать
                            </Button>
                        ) : (
                            <Box display="flex" gap={1}>
                                <Button
                                    startIcon={<CancelIcon />}
                                    variant="outlined"
                                    size="small"
                                    color="inherit"
                                    onClick={handleCancel}
                                >
                                    Отмена
                                </Button>
                                <Button
                                    startIcon={isLoading ? <CircularProgress size={16} /> : <SaveIcon />}
                                    variant="contained"
                                    size="small"
                                    onClick={handleSave}
                                    disabled={isLoading}
                                >
                                    Сохранить
                                </Button>
                            </Box>
                        )}
                    </Box>

                    {/* Имя и роль */}
                    {!editing ? (
                        <Box mb={2}>
                            <Typography variant="h5" fontWeight={700}>{user.full_name || 'Без имени'}</Typography>
                            <Box display="flex" alignItems="center" gap={1} mt={0.5}>
                                <Chip
                                    label={ROLE_LABELS[user.role as UserRole]}
                                    color={ROLE_COLORS[user.role as UserRole]}
                                    size="small"
                                />
                                <Typography variant="body2" color="text.secondary">{user.email}</Typography>
                            </Box>
                        </Box>
                    ) : (
                        <TextField
                            fullWidth
                            label="Имя и фамилия"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            sx={{ mb: 2 }}
                            size="small"
                        />
                    )}

                    <Divider sx={{ mb: 2 }} />

                    {/* О себе */}
                    <Box>
                        <Typography variant="caption" color="text.secondary" fontWeight={600}>О СЕБЕ</Typography>
                        {!editing ? (
                            <Typography variant="body2" mt={0.5} color={user.bio ? 'text.primary' : 'text.secondary'}>
                                {user.bio || 'Расскажите о себе...'}
                            </Typography>
                        ) : (
                            <TextField
                                fullWidth
                                multiline
                                rows={4}
                                placeholder="Расскажите о себе..."
                                value={bio}
                                onChange={(e) => setBio(e.target.value)}
                                sx={{ mt: 1 }}
                                size="small"
                            />
                        )}
                    </Box>

                    <Divider sx={{ my: 2 }} />

                    {/* Доп инфо */}
                    <Box display="flex" flexDirection="column" gap={1}>
                        <Box display="flex" gap={2}>
                            <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ width: 120 }}>
                                EMAIL
                            </Typography>
                            <Typography variant="caption">{user.email}</Typography>
                        </Box>
                        <Box display="flex" gap={2}>
                            <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ width: 120 }}>
                                ДАТА РЕГИСТРАЦИИ
                            </Typography>
                            <Typography variant="caption">
                                {new Date(user.created_at).toLocaleDateString('ru-RU')}
                            </Typography>
                        </Box>
                        <Box display="flex" gap={2}>
                            <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ width: 120 }}>
                                РОЛЬ
                            </Typography>
                            <Typography variant="caption">{ROLE_LABELS[user.role as UserRole]}</Typography>
                        </Box>
                    </Box>
                </Box>
            </Paper>
        </Box>
    )
}