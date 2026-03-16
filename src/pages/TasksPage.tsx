import { useRef, useMemo, useState, useEffect } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import {
    Box, Typography, Paper, Chip,
    Dialog, DialogTitle, DialogContent, Divider,
    Avatar, Button, MenuItem, Select, FormControl,
    InputLabel
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import { useGetTasksQuery, useUpdateTaskMutation } from '../features/tasks/tasksApi'
import { useSelector } from 'react-redux'
import type { RootState } from '../app/store'
import type { Task, TaskStatus } from '../types'
import CreateTaskModal from '../components/CreateTaskModal'
import EditIcon from '@mui/icons-material/Edit'
import EditTaskModal from '../components/EditTaskModal'


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

const STATUS_BG: Record<TaskStatus, string> = {
    assigned: '#9e9e9e',
    in_progress: '#ed6c02',
    review: '#0288d1',
    done: '#2e7d32',
}

const COLUMN_WIDTH = 180

function formatDate(date: Date): string {
    return date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' })
}

function formatDayOfWeek(date: Date): string {
    return date.toLocaleDateString('ru-RU', { weekday: 'short' })
}

function isSameDay(a: Date, b: Date): boolean {
    return a.getFullYear() === b.getFullYear() &&
        a.getMonth() === b.getMonth() &&
        a.getDate() === b.getDate()
}

function isToday(date: Date): boolean {
    return isSameDay(date, new Date())
}

type CalendarCard =
    | { type: 'task'; task: Task }
    | { type: 'deadline'; task: Task }

export default function TasksPage() {
    const { user } = useSelector((state: RootState) => state.auth)
    const { data: allTasks = [] } = useGetTasksQuery()
    const [updateTask] = useUpdateTaskMutation()
    const [selectedTask, setSelectedTask] = useState<Task | null>(null)
    const [createModalOpen, setCreateModalOpen] = useState(false)
    const [statusFilter, setStatusFilter] = useState<TaskStatus | 'all'>('all')
    const scrollRef = useRef<HTMLDivElement>(null)
    const hasScrolled = useRef(false)
    const [editModalOpen, setEditModalOpen] = useState(false)



    const canCreateTask = user?.role === 'admin' || user?.role === 'teamlead'
    const isManager = user?.role === 'admin' || user?.role === 'teamlead'

    // Фильтр по роли
    const myTasks = useMemo(() => {
        if (isManager) return allTasks
        return allTasks.filter(t => t.assignee_id === user?.id)
    }, [allTasks, isManager, user?.id])

    // Фильтр по статусу
    const tasks = useMemo(() => {
        if (statusFilter === 'all') return myTasks
        return myTasks.filter(t => t.status === statusFilter)
    }, [myTasks, statusFilter])

    const stats = useMemo(() => ({
        assigned: myTasks.filter(t => t.status === 'assigned').length,
        in_progress: myTasks.filter(t => t.status === 'in_progress').length,
        review: myTasks.filter(t => t.status === 'review').length,
        done: myTasks.filter(t => t.status === 'done').length,
    }), [myTasks])

    const dateCardsMap = useMemo(() => {
        const map: Record<string, CalendarCard[]> = {}

        const addToDate = (date: Date, card: CalendarCard) => {
            const d = new Date(date)
            d.setHours(0, 0, 0, 0)
            const key = d.toISOString()
            if (!map[key]) map[key] = []
            map[key].push(card)
        }

        tasks.forEach(task => {
            addToDate(new Date(task.created_at), { type: 'task', task })
            if (task.deadline) {
                const deadlineDate = new Date(task.deadline)
                const createdDate = new Date(task.created_at)
                // Показываем карточку дедлайна если дедлайн не совпадает с датой создания
                // ИЛИ если дедлайн сегодня — всё равно показываем
                if (!isSameDay(deadlineDate, createdDate) || isSameDay(deadlineDate, new Date())) {
                    addToDate(deadlineDate, { type: 'deadline', task })
                }
            }
        })

        return map
    }, [tasks])

    const dates = useMemo(() => {
        return Object.keys(dateCardsMap)
            .map(k => new Date(k))
            .sort((a, b) => a.getTime() - b.getTime())
    }, [dateCardsMap])

    const todayIndex = useMemo(() => {
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const idx = dates.findIndex(d => isSameDay(d, today))
        return idx >= 0 ? idx : 0
    }, [dates])

    const virtualizer = useVirtualizer({
        count: dates.length,
        getScrollElement: () => scrollRef.current,
        estimateSize: () => COLUMN_WIDTH,
        horizontal: true,
        overscan: 3,
    })

    useEffect(() => {
        if (!scrollRef.current || hasScrolled.current || dates.length === 0) return
        hasScrolled.current = true
        setTimeout(() => {
            const el = scrollRef.current
            if (!el) return
            const offset = todayIndex * COLUMN_WIDTH - el.clientWidth / 2 + COLUMN_WIDTH / 2
            el.scrollLeft = Math.max(0, offset)
        }, 100)
    }, [todayIndex, dates])

    // Смена статуса
    const handleStatusChange = async (task: Task, newStatus: TaskStatus) => {
        await updateTask({ id: task.id, updates: { status: newStatus } })
        if (selectedTask?.id === task.id) {
            setSelectedTask({ ...selectedTask, status: newStatus })
        }
    }

    // Доступные статусы для смены
    const getAvailableStatuses = (task: Task): TaskStatus[] => {
        const isAssignee = task.assignee_id === user?.id
        if (isManager) {
            return ['assigned', 'in_progress', 'review', 'done']
        }
        if (isAssignee) {
            if (task.status === 'assigned') return ['in_progress']
            if (task.status === 'in_progress') return ['review']
        }
        return []
    }

    return (
        <Box sx={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            p: 3,
            pb: 2,
            overflow: 'hidden',
            height: '100%',
        }}>
            {/* Заголовок */}
            <Box display="flex" alignItems="center" justifyContent="space-between" mb={2} flexShrink={0}>
                <Typography variant="h4" fontWeight={700}>Задачи</Typography>
                {canCreateTask && (
                    <Button variant="contained" startIcon={<AddIcon />} onClick={() => setCreateModalOpen(true)}>
                        Создать задачу
                    </Button>
                )}
            </Box>

            {/* Фильтры по статусу — кнопки */}
            <Box display="flex" gap={1.5} mb={2} flexShrink={0} flexWrap="wrap">
                <Box
                    onClick={() => setStatusFilter('all')}
                    sx={{
                        px: 2, py: 0.75,
                        borderRadius: 2,
                        cursor: 'pointer',
                        border: '1px solid',
                        borderColor: statusFilter === 'all' ? 'primary.main' : '#e0e0e0',
                        bgcolor: statusFilter === 'all' ? 'primary.main' : 'white',
                        color: statusFilter === 'all' ? 'white' : 'text.primary',
                        display: 'flex', alignItems: 'center', gap: 1,
                        transition: 'all 0.2s',
                        '&:hover': { borderColor: 'primary.main' },
                    }}
                >
                    <Typography variant="caption" fontWeight={600}>Все</Typography>
                    <Box sx={{
                        width: 20, height: 20, borderRadius: '50%',
                        bgcolor: statusFilter === 'all' ? 'rgba(255,255,255,0.3)' : '#e0e0e0',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                        <Typography variant="caption" fontWeight={700} fontSize={10}>
                            {myTasks.length}
                        </Typography>
                    </Box>
                </Box>

                {(Object.entries(stats) as [TaskStatus, number][]).map(([status, count]) => (
                    <Box
                        key={status}
                        onClick={() => setStatusFilter(statusFilter === status ? 'all' : status)}
                        sx={{
                            px: 2, py: 0.75,
                            borderRadius: 2,
                            cursor: 'pointer',
                            border: '1px solid',
                            borderColor: statusFilter === status ? STATUS_BG[status] : '#e0e0e0',
                            bgcolor: statusFilter === status ? STATUS_BG[status] : 'white',
                            color: statusFilter === status ? 'white' : 'text.primary',
                            display: 'flex', alignItems: 'center', gap: 1,
                            transition: 'all 0.2s',
                            '&:hover': { borderColor: STATUS_BG[status] },
                        }}
                    >
                        <Typography variant="caption" fontWeight={600}>{STATUS_LABELS[status]}</Typography>
                        <Box sx={{
                            width: 20, height: 20, borderRadius: '50%',
                            bgcolor: statusFilter === status ? 'rgba(255,255,255,0.3)' : STATUS_BG[status],
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                            <Typography variant="caption" fontWeight={700} fontSize={10} color="white">
                                {count}
                            </Typography>
                        </Box>
                    </Box>
                ))}
            </Box>

            {/* Календарь */}
            {dates.length === 0 ? (
                <Box display="flex" alignItems="center" justifyContent="center" flex={1}>
                    <Typography color="text.secondary">Задач не найдено</Typography>
                </Box>
            ) : (
                <Paper elevation={0} sx={{
                    flex: 1,
                    minHeight: 0,
                    border: '1px solid #e0e0e0',
                    borderRadius: 3,
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    mb: 1,
                }}>
                    <Box
                        ref={scrollRef}
                        sx={{
                            flex: 1,
                            minHeight: 0,
                            overflowX: 'auto',
                            overflowY: 'hidden',
                            '&::-webkit-scrollbar': { height: 6 },
                            '&::-webkit-scrollbar-track': { bgcolor: '#f5f5f5' },
                            '&::-webkit-scrollbar-thumb': { bgcolor: '#ccc', borderRadius: 3 },
                        }}
                    >
                        <Box sx={{
                            width: virtualizer.getTotalSize(),
                            height: '100%',
                            position: 'relative',
                        }}>
                            {virtualizer.getVirtualItems().map(virtualCol => {
                                const date = dates[virtualCol.index]
                                const dateKey = new Date(date).setHours(0, 0, 0, 0)
                                const cards = dateCardsMap[new Date(dateKey).toISOString()] ?? []
                                const today = isToday(date)
                                const isWeekend = date.getDay() === 0 || date.getDay() === 6

                                return (
                                    <Box
                                        key={virtualCol.key}
                                        sx={{
                                            position: 'absolute',
                                            top: 0,
                                            left: virtualCol.start,
                                            width: COLUMN_WIDTH,
                                            height: '100%',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            borderRight: '1px solid #e0e0e0',
                                            bgcolor: today ? 'rgba(25,118,210,0.03)' : isWeekend ? '#fafafa' : 'white',
                                        }}
                                    >
                                        <Box sx={{
                                            px: 1.5, py: 1,
                                            borderBottom: '1px solid #e0e0e0',
                                            bgcolor: today ? 'primary.main' : isWeekend ? '#f0f0f0' : '#fafafa',
                                            flexShrink: 0,
                                            textAlign: 'center',
                                        }}>
                                            <Typography variant="caption" fontWeight={600} sx={{
                                                color: today ? 'white' : 'text.secondary',
                                                display: 'block',
                                                textTransform: 'uppercase',
                                                fontSize: 10,
                                            }}>
                                                {formatDayOfWeek(date)}
                                            </Typography>
                                            <Typography variant="body2" fontWeight={700} sx={{
                                                color: today ? 'white' : 'text.primary'
                                            }}>
                                                {formatDate(date)}
                                            </Typography>
                                        </Box>

                                        <Box sx={{
                                            flex: 1,
                                            minHeight: 0,
                                            overflowY: 'auto',
                                            p: 1,
                                            display: 'flex',
                                            flexDirection: 'column',
                                            gap: 1,
                                            '&::-webkit-scrollbar': { width: 3 },
                                            '&::-webkit-scrollbar-thumb': { bgcolor: '#ddd', borderRadius: 2 },
                                        }}>
                                            {cards.map((card, idx) => (
                                                <TaskCard
                                                    key={`${card.task.id}-${card.type}-${idx}`}
                                                    card={card}
                                                    onClick={() => setSelectedTask(card.task)}
                                                />
                                            ))}
                                        </Box>
                                    </Box>
                                )
                            })}
                        </Box>
                    </Box>
                </Paper>
            )}

            <CreateTaskModal open={createModalOpen} onClose={() => setCreateModalOpen(false)} />

            {/* Модалка деталей */}
            <Dialog open={!!selectedTask} onClose={() => setSelectedTask(null)} maxWidth="sm" fullWidth>
                {selectedTask && (
                    <>
                        <DialogTitle>
                            <Box display="flex" justifyContent="space-between" alignItems="center">
                                <Typography variant="h6" fontWeight={700}>{selectedTask.title}</Typography>
                                <Box display="flex" alignItems="center" gap={1}>
                                    <Chip
                                        label={STATUS_LABELS[selectedTask.status]}
                                        color={STATUS_COLORS[selectedTask.status]}
                                        size="small"
                                    />
                                    {isManager && (
                                        <Button
                                            size="small"
                                            startIcon={<EditIcon />}
                                            onClick={() => setEditModalOpen(true)}
                                        >
                                            Изменить
                                        </Button>
                                    )}
                                </Box>
                            </Box>
                        </DialogTitle>
                        <DialogContent>
                            <Divider sx={{ mb: 2 }} />

                            {selectedTask.description && (
                                <Box mb={3}>
                                    <Typography variant="caption" color="text.secondary" fontWeight={600}>ОПИСАНИЕ</Typography>
                                    <Typography variant="body1" mt={0.5}>{selectedTask.description}</Typography>
                                </Box>
                            )}

                            <Box display="flex" flexDirection="column" gap={2}>
                                {selectedTask.assignee && (
                                    <Box display="flex" alignItems="center" gap={2}>
                                        <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ width: 100 }}>ИСПОЛНИТЕЛЬ</Typography>
                                        <Box display="flex" alignItems="center" gap={1}>
                                            <Avatar sx={{ width: 28, height: 28, fontSize: 13, bgcolor: 'primary.main' }}>
                                                {selectedTask.assignee.full_name?.[0]?.toUpperCase()}
                                            </Avatar>
                                            <Typography variant="body2">{selectedTask.assignee.full_name}</Typography>
                                        </Box>
                                    </Box>
                                )}
                                {selectedTask.creator && (
                                    <Box display="flex" alignItems="center" gap={2}>
                                        <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ width: 100 }}>СОЗДАЛ</Typography>
                                        <Typography variant="body2">{selectedTask.creator.full_name}</Typography>
                                    </Box>
                                )}
                                {selectedTask.deadline && (
                                    <Box display="flex" alignItems="center" gap={2}>
                                        <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ width: 100 }}>ДЕДЛАЙН</Typography>
                                        <Typography variant="body2">{new Date(selectedTask.deadline).toLocaleDateString('ru-RU')}</Typography>
                                    </Box>
                                )}
                                {selectedTask.github_url && (
                                    <Box display="flex" alignItems="center" gap={2}>
                                        <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ width: 100 }}>GITHUB</Typography>
                                        <Typography variant="body2" component="a" href={selectedTask.github_url} target="_blank" sx={{ color: 'primary.main' }}>
                                            {selectedTask.github_url}
                                        </Typography>
                                    </Box>
                                )}
                                <Box display="flex" alignItems="center" gap={2}>
                                    <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ width: 100 }}>СОЗДАНА</Typography>
                                    <Typography variant="body2">{new Date(selectedTask.created_at).toLocaleDateString('ru-RU')}</Typography>
                                </Box>

                                {/* Смена статуса */}
                                {getAvailableStatuses(selectedTask).length > 0 && (
                                    <Box display="flex" alignItems="center" gap={2}>
                                        <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ width: 100 }}>СТАТУС</Typography>
                                        <FormControl size="small" sx={{ minWidth: 160 }}>
                                            <InputLabel>Изменить статус</InputLabel>
                                            <Select
                                                value={selectedTask.status}
                                                label="Изменить статус"
                                                onChange={(e) => handleStatusChange(selectedTask, e.target.value as TaskStatus)}
                                            >
                                                {getAvailableStatuses(selectedTask).map(s => (
                                                    <MenuItem key={s} value={s}>{STATUS_LABELS[s]}</MenuItem>
                                                ))}
                                            </Select>
                                        </FormControl>
                                    </Box>
                                )}
                            </Box>
                        </DialogContent>
                    </>
                )}
            </Dialog>
            <EditTaskModal
                task={selectedTask}
                open={editModalOpen}
                onClose={() => {
                    setEditModalOpen(false)
                    setSelectedTask(null)
                }}
            />
        </Box>
    )
}

const TaskCard = ({ card, onClick }: { card: CalendarCard; onClick: () => void }) => {
    const { task } = card
    const isDeadlineCard = card.type === 'deadline'

    const deadlineInfo = useMemo(() => {
        if (!task.deadline) return null
        const deadline = new Date(task.deadline)
        const now = new Date()
        now.setHours(0, 0, 0, 0)
        deadline.setHours(0, 0, 0, 0)
        if (task.status === 'done') return { color: '#2e7d32', bgcolor: '#e8f5e9' }
        if (deadline < now) return { color: '#e65100', bgcolor: '#fff3e0' }
        return { color: '#c62828', bgcolor: '#ffebee' }
    }, [task.deadline, task.status])

    if (isDeadlineCard) {
        return (
            <Paper elevation={0} onClick={onClick} sx={{
                p: 1.25,
                border: `1px solid ${deadlineInfo?.color ?? '#e0e0e0'}`,
                borderRadius: 2,
                cursor: 'pointer',
                flexShrink: 0,
                bgcolor: deadlineInfo?.bgcolor ?? '#fff',
                '&:hover': { boxShadow: '0 2px 8px rgba(0,0,0,0.08)' },
                transition: 'all 0.15s ease',
            }}>
                <Typography variant="caption" fontWeight={600} sx={{
                    display: 'block', mb: 0.5,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    color: deadlineInfo?.color,
                }}>
                    📅 Дедлайн: {task.title}
                </Typography>
                <Chip label={STATUS_LABELS[task.status]} color={STATUS_COLORS[task.status]} size="small" sx={{ fontSize: 10, height: 20 }} />
            </Paper>
        )
    }

    return (
        <Paper elevation={0} onClick={onClick} sx={{
            p: 1.25,
            border: '1px solid #e8e8e8',
            borderRadius: 2,
            cursor: 'pointer',
            flexShrink: 0,
            '&:hover': { borderColor: 'primary.main', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' },
            transition: 'all 0.15s ease',
        }}>
            <Typography variant="caption" fontWeight={600} sx={{
                display: 'block', mb: 0.75,
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
                {task.title}
            </Typography>
            <Box display="flex" alignItems="center" gap={0.5} flexWrap="wrap">
                <Chip label={STATUS_LABELS[task.status]} color={STATUS_COLORS[task.status]} size="small" sx={{ fontSize: 10, height: 20 }} />
                {task.deadline && deadlineInfo && (
                    <Box sx={{
                        px: 1, py: 0.25,
                        borderRadius: 1,
                        bgcolor: deadlineInfo.bgcolor,
                        color: deadlineInfo.color,
                        fontSize: 10,
                        fontWeight: 600,
                        whiteSpace: 'nowrap',
                    }}>
                        📅 {new Date(task.deadline).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' })}
                    </Box>
                )}

            </Box>
        </Paper>
    )
}