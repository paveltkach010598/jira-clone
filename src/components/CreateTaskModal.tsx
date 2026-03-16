import { useState } from 'react'
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    Button, TextField, MenuItem, Select, FormControl,
    InputLabel, Box, CircularProgress, Alert
} from '@mui/material'
import { useCreateTaskMutation } from '../features/tasks/tasksApi'
import { useGetUsersQuery } from '../features/users/usersApi'
import { useSelector } from 'react-redux'
import type { RootState } from '../app/store'
import type { TaskStatus } from '../types'

interface Props {
    open: boolean
    onClose: () => void
}

export default function CreateTaskModal({ open, onClose }: Props) {
    const { user } = useSelector((state: RootState) => state.auth)
    const [createTask, { isLoading }] = useCreateTaskMutation()
    const { data: users = [] } = useGetUsersQuery()

    const [title, setTitle] = useState('')
    const [description, setDescription] = useState('')
    const [assigneeId, setAssigneeId] = useState('')
    const [deadline, setDeadline] = useState('')
    const [error, setError] = useState<string | null>(null)

    const handleSubmit = async () => {
        if (!title.trim()) {
            setError('Название задачи обязательно')
            return
        }
        if (!assigneeId) {
            setError('Выберите исполнителя')
            return
        }
        // Проверка дедлайна
        if (deadline) {
            const selectedDate = new Date(deadline)
            const today = new Date()
            today.setHours(0, 0, 0, 0)
            selectedDate.setHours(0, 0, 0, 0)
            if (selectedDate < today) {
                setError('Дедлайн не может быть в прошлом')
                return
            }
        }
        setError(null)
        try {
            await createTask({
                title: title.trim(),
                description: description.trim() || null,
                assignee_id: assigneeId,
                created_by: user?.id,
                status: 'assigned' as TaskStatus,
                deadline: deadline || null,
            }).unwrap()
            handleClose()
        } catch {
            setError('Ошибка при создании задачи')
        }
    }

    const handleClose = () => {
        setTitle('')
        setDescription('')
        setAssigneeId('')
        setDeadline('')
        setError(null)
        onClose()
    }

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
            <DialogTitle>Создать задачу</DialogTitle>
            <DialogContent>
                <Box display="flex" flexDirection="column" gap={2} pt={1}>
                    {error && <Alert severity="error">{error}</Alert>}

                    <TextField
                        fullWidth
                        label="Название задачи *"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        size="small"
                    />

                    <TextField
                        fullWidth
                        label="Описание"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        multiline
                        rows={3}
                        size="small"
                    />

                    <FormControl fullWidth size="small">
                        <InputLabel>Исполнитель *</InputLabel>
                        <Select
                            value={assigneeId}
                            label="Исполнитель *"
                            onChange={(e) => setAssigneeId(e.target.value)}
                        >
                            {users.map(u => (
                                <MenuItem key={u.id} value={u.id}>
                                    {u.full_name || u.email}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    <TextField
                        fullWidth
                        label="Дедлайн"
                        type="date"
                        value={deadline}
                        onChange={(e) => setDeadline(e.target.value)}
                        size="small"

                        InputLabelProps={{ shrink: true }}
                        inputProps={{
                            min: new Date().toISOString().split('T')[0]
                        }}
                    />
                </Box>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2 }}>
                <Button onClick={handleClose} color="inherit">Отмена</Button>
                <Button
                    variant="contained"
                    onClick={handleSubmit}
                    disabled={isLoading}
                    startIcon={isLoading ? <CircularProgress size={16} /> : null}
                >
                    Создать
                </Button>
            </DialogActions>
        </Dialog>
    )
}