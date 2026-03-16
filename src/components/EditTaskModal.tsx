import { useState, useEffect } from 'react'
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    Button, TextField, MenuItem, Select, FormControl,
    InputLabel, Box, CircularProgress, Alert
} from '@mui/material'
import { useUpdateTaskMutation, useDeleteTaskMutation } from '../features/tasks/tasksApi'
import { useGetUsersQuery } from '../features/users/usersApi'
import type { Task, TaskStatus } from '../types'

interface Props {
    task: Task | null
    open: boolean
    onClose: () => void
}

export default function EditTaskModal({ task, open, onClose }: Props) {
    const [updateTask, { isLoading: isUpdating }] = useUpdateTaskMutation()
    const [deleteTask, { isLoading: isDeleting }] = useDeleteTaskMutation()
    const { data: users = [] } = useGetUsersQuery()

    const [title, setTitle] = useState('')
    const [description, setDescription] = useState('')
    const [assigneeId, setAssigneeId] = useState('')
    const [deadline, setDeadline] = useState('')
    const [status, setStatus] = useState<TaskStatus>('assigned')
    const [error, setError] = useState<string | null>(null)
    const [confirmDelete, setConfirmDelete] = useState(false)

    useEffect(() => {
        if (task) {
            setTitle(task.title)
            setDescription(task.description ?? '')
            setAssigneeId(task.assignee_id ?? '')
            setDeadline(task.deadline ? task.deadline.split('T')[0] : '')
            setStatus(task.status)
            setError(null)
            setConfirmDelete(false)
        }
    }, [task])

    const handleSave = async () => {
        if (!task) return
        if (!title.trim()) {
            setError('Название задачи обязательно')
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
            await updateTask({
                id: task.id,
                updates: {
                    title: title.trim(),
                    description: description.trim() || null,
                    assignee_id: assigneeId || null,
                    deadline: deadline || null,
                    status,
                }
            }).unwrap()
            onClose()
        } catch {
            setError('Ошибка при сохранении')
        }
    }

    const handleDelete = async () => {
        if (!task) return
        if (!confirmDelete) {
            setConfirmDelete(true)
            return
        }
        try {
            await deleteTask(task.id).unwrap()
            onClose()
        } catch {
            setError('Ошибка при удалении')
        }
    }

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>Редактировать задачу</DialogTitle>
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
                        <InputLabel>Исполнитель</InputLabel>
                        <Select
                            value={assigneeId}
                            label="Исполнитель"
                            onChange={(e) => setAssigneeId(e.target.value)}
                        >
                            {users.map(u => (
                                <MenuItem key={u.id} value={u.id}>
                                    {u.full_name || u.email}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    <FormControl fullWidth size="small">
                        <InputLabel>Статус</InputLabel>
                        <Select
                            value={status}
                            label="Статус"
                            onChange={(e) => setStatus(e.target.value as TaskStatus)}
                        >
                            <MenuItem value="assigned">Назначена</MenuItem>
                            <MenuItem value="in_progress">В работе</MenuItem>
                            <MenuItem value="review">На проверке</MenuItem>
                            <MenuItem value="done">Выполнена</MenuItem>
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
            <DialogActions sx={{ px: 3, pb: 2, justifyContent: 'space-between' }}>
                <Button
                    color="error"
                    variant={confirmDelete ? 'contained' : 'outlined'}
                    onClick={handleDelete}
                    disabled={isDeleting}
                    startIcon={isDeleting ? <CircularProgress size={16} /> : null}
                >
                    {confirmDelete ? 'Подтвердить удаление' : 'Удалить'}
                </Button>
                <Box display="flex" gap={1}>
                    <Button onClick={onClose} color="inherit">Отмена</Button>
                    <Button
                        variant="contained"
                        onClick={handleSave}
                        disabled={isUpdating}
                        startIcon={isUpdating ? <CircularProgress size={16} /> : null}
                    >
                        Сохранить
                    </Button>
                </Box>
            </DialogActions>
        </Dialog>
    )
}