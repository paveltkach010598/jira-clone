// src/pages/ProfilePage.tsx

import { useState, useRef } from 'react'
import {
    Box, Typography, Paper, Button,
    TextField, Divider, Alert, CircularProgress, Chip, IconButton, Tooltip
} from '@mui/material'
import EditIcon from '@mui/icons-material/Edit'
import SaveIcon from '@mui/icons-material/Save'
import CancelIcon from '@mui/icons-material/Cancel'
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera'
import { useSelector, useDispatch } from 'react-redux'
import type { RootState } from '../app/store'
import { useUpdateProfileMutation } from '../features/users/usersApi'
import { setUser } from '../features/auth/authSlice'
import { supabase } from '../lib/supabaseClient'
import type { UserRole } from '../types'
import UserAvatar from '../components/ui/UserAvatar'
import AvatarCropModal from '../components/ui/AvatarCropModal'

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
    const [avatarUploading, setAvatarUploading] = useState(false)
    const [cropModalOpen, setCropModalOpen] = useState(false)
    const [rawImageSrc, setRawImageSrc] = useState<string>('')   // исходник для кропа


    const fileInputRef = useRef<HTMLInputElement>(null)

    // ─── Загрузка аватара ──────────────────────────────────────────────
    const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file || !user) return

        if (!file.type.startsWith('image/')) {
            setError('Можно загружать только изображения')
            return
        }
        if (file.size > 10 * 1024 * 1024) {
            setError('Файл слишком большой. Максимум 10 МБ')
            return
        }

        // Читаем файл как base64 и открываем кроппер
        const reader = new FileReader()
        reader.onload = () => {
            setRawImageSrc(reader.result as string)
            setCropModalOpen(true)
        }
        reader.readAsDataURL(file)

        // Сбрасываем input сразу
        if (fileInputRef.current) fileInputRef.current.value = ''
    }
    const handleCropDone = async (blob: Blob) => {
        if (!user) return
        setAvatarUploading(true)
        setError(null)

        try {
            // Blob от canvas всегда jpeg, имя не важно
            const filePath = `${user.id}/avatar.jpg`

            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, blob, { upsert: true, contentType: 'image/jpeg' })

            if (uploadError) throw uploadError

            const { data: urlData } = supabase.storage
                .from('avatars')
                .getPublicUrl(filePath)

            const avatarUrl = `${urlData.publicUrl}?t=${Date.now()}`

            const updated = await updateProfile({
                id: user.id,
                updates: { avatar_url: avatarUrl },
            }).unwrap()

            dispatch(setUser({ ...user, ...updated, avatar_url: avatarUrl }))
            setCropModalOpen(false)
            setSuccess(true)
            setTimeout(() => setSuccess(false), 3000)
        } catch (err) {
            console.error(err)
            setError('Ошибка при загрузке аватара')
        } finally {
            setAvatarUploading(false)
        }
    }

    // ─── Сохранение имени и bio ────────────────────────────────────────
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
        <Box maxWidth={600} sx={{ p: 3 }}>
            <Typography variant="h4" fontWeight={700} mb={3}>Профиль</Typography>

            {success && <Alert severity="success" sx={{ mb: 2 }}>Профиль успешно обновлён</Alert>}
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

            {/* Скрытый file input — открывается кнопкой-камерой */}
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleAvatarChange}
            />

            <Paper elevation={0} sx={{
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 3,
                overflow: 'hidden',
            }}>

                {/* Цветная шапка */}
                <Box sx={{ bgcolor: 'primary.main', height: 100, position: 'relative' }} />

                <Box sx={{ px: 3, pb: 3 }}>

                    {/* Аватар + кнопки редактирования */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', mb: 2 }}>

                        {/* Аватар с кнопкой-камерой поверх */}
                        <Box sx={{ position: 'relative', mt: -5 }}>
                            <UserAvatar
                                user={user}
                                size={80}
                                sx={{
                                    border: '4px solid',
                                    borderColor: 'background.paper',
                                    boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                                    opacity: avatarUploading ? 0.6 : 1,
                                    transition: 'opacity 0.2s',
                                }}
                            />
                            <Tooltip title="Изменить фото">
                                <IconButton
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={avatarUploading}
                                    size="small"
                                    sx={{
                                        position: 'absolute',
                                        bottom: -4,
                                        right: -4,
                                        bgcolor: 'primary.main',
                                        color: 'white',
                                        width: 28,
                                        height: 28,
                                        border: '2px solid',
                                        borderColor: 'background.paper',
                                        '&:hover': { bgcolor: 'primary.dark' },
                                        '&:disabled': { bgcolor: 'action.disabled' },
                                    }}
                                >
                                    {avatarUploading
                                        ? <CircularProgress size={12} color="inherit" />
                                        : <PhotoCameraIcon sx={{ fontSize: 14 }} />
                                    }
                                </IconButton>
                            </Tooltip>
                        </Box>

                        {/* Кнопки редактирования профиля */}
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

                    {/* Имя и роль — просмотр или редактирование */}
                    {!editing ? (
                        <Box mb={2}>
                            <Typography variant="h5" fontWeight={700}>
                                {user.full_name || 'Без имени'}
                            </Typography>
                            <Box display="flex" alignItems="center" gap={1} mt={0.5}>
                                <Chip
                                    label={ROLE_LABELS[user.role as UserRole]}
                                    color={ROLE_COLORS[user.role as UserRole]}
                                    size="small"
                                />
                                <Typography variant="body2" color="text.secondary">
                                    {user.email}
                                </Typography>
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
                        <Typography variant="caption" color="text.secondary" fontWeight={600}>
                            О СЕБЕ
                        </Typography>
                        {!editing ? (
                            <Typography
                                variant="body2"
                                mt={0.5}
                                color={user.bio ? 'text.primary' : 'text.secondary'}
                            >
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

                    {/* Дополнительная информация */}
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
                            <Typography variant="caption">
                                {ROLE_LABELS[user.role as UserRole]}
                            </Typography>
                        </Box>
                    </Box>
                </Box>
            </Paper>
            <AvatarCropModal
                open={cropModalOpen}
                imageSrc={rawImageSrc}
                onClose={() => setCropModalOpen(false)}
                onCropDone={handleCropDone}
                isUploading={avatarUploading}
            />
        </Box>
    )
}