import { useRef, useMemo, useCallback, useState, useEffect } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import {
    Box, Typography, Paper, Chip, Avatar,
    Dialog, DialogTitle, DialogContent, Divider
} from '@mui/material'
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

const STATUS_BG: Record<TaskStatus, string> = {
    assigned: '#9e9e9e',
    in_progress: '#ed6c02',
    review: '#0288d1',
    done: '#2e7d32',
}

const COLUMN_WIDTH = 180
const COLUMN_GAP = 1

function generateDates(): Date[] {
    const dates: Date[] = []
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    for (let i = -10; i <= 20; i++) {
        const d = new Date(today)
        d.setDate(today.getDate() + i)
        dates.push(d)
    }
    return dates
}

function formatDate(date: Date): string {
    return date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' })
}

function formatDayOfWeek(date: Date): string {
    return date.toLocaleDateString('ru-RU', { weekday: 'short' })
}

function isSameDay(a: Date, b: Date): boolean {
    return (
        a.getFullYear() === b.getFullYear() &&
        a.getMonth() === b.getMonth() &&
        a.getDate() === b.getDate()
    )
}

function isToday(date: Date): boolean {
    return isSameDay(date, new Date())
}

export default function TasksPage() {
    const { data: tasks = [] } = useGetTasksQuery()
    const [selectedTask, setSelectedTask] = useState<Task | null>(null)
    const scrollRef = useRef<HTMLDivElement>(null)
    const hasScrolled = useRef(false)

    const dates = useMemo(() => generateDates(), [])

    const stats = useMemo(() => ({
        assigned: tasks.filter(t => t.status === 'assigned').length,
        in_progress: tasks.filter(t => t.status === 'in_progress').length,
        review: tasks.filter(t => t.status === 'review').length,
        done: tasks.filter(t => t.status === 'done').length,
    }), [tasks])

    const tasksByDate = useMemo(() => {
        const map: Record<string, Task[]> = {}
        tasks.forEach(task => {
            const date = new Date(task.created_at)
            date.setHours(0, 0, 0, 0)
            const key = date.toISOString()
            if (!map[key]) map[key] = []
            map[key].push(task)
        })
        return map
    }, [tasks])

    const todayIndex = useMemo(() => {
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        return dates.findIndex(d => isSameDay(d, today))
    }, [dates])

    const virtualizer = useVirtualizer({
        count: dates.length,
        getScrollElement: () => scrollRef.current,
        estimateSize: () => COLUMN_WIDTH + COLUMN_GAP,
        horizontal: true,
        overscan: 3,
    })

    // Скролл к сегодня по центру
    useEffect(() => {
        if (!scrollRef.current || hasScrolled.current) return
        hasScrolled.current = true
        setTimeout(() => {
            const el = scrollRef.current
            if (!el) return
            const offset = todayIndex * (COLUMN_WIDTH + COLUMN_GAP) - el.clientWidth / 2 + COLUMN_WIDTH / 2
            el.scrollLeft = Math.max(0, offset)
        }, 100)
    }, [todayIndex])

    return (
        <Box sx={{ height: 'calc(100vh - 48px)', display: 'flex', flexDirection: 'column' }}>

            {/* Заголовок */}
            <Typography variant="h4" fontWeight={700} mb={2}>Задачи</Typography>

            {/* Статистика — кружочки */}
            <Box display="flex" gap={2} mb={2}>
                {(Object.entries(stats) as [TaskStatus, number][]).map(([status, count]) => (
                    <Box key={status} display="flex" alignItems="center" gap={1}>
                        <Box sx={{
                            width: 32, height: 32,
                            borderRadius: '50%',
                            bgcolor: STATUS_BG[status],
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}>
                            <Typography variant="caption" fontWeight={700} color="white" fontSize={11}>
                                {count}
                            </Typography>
                        </Box>
                        <Typography variant="caption" color="text.secondary">
                            {STATUS_LABELS[status]}
                        </Typography>
                    </Box>
                ))}
            </Box>

            {/* Блок календаря */}
            <Paper
                elevation={0}
                sx={{
                    flex: 1,
                    border: '1px solid #e0e0e0',
                    borderRadius: 3,
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                }}
            >
                {/* Скроллируемый контейнер */}
                <Box
                    ref={scrollRef}
                    sx={{
                        flex: 1,
                        overflowX: 'auto',
                        overflowY: 'hidden',
                        '&::-webkit-scrollbar': { height: 6 },
                        '&::-webkit-scrollbar-track': { bgcolor: '#f5f5f5' },
                        '&::-webkit-scrollbar-thumb': { bgcolor: '#ccc', borderRadius: 3 },
                    }}
                >
                    <Box
                        sx={{
                            width: virtualizer.getTotalSize(),
                            height: '100%',
                            position: 'relative',
                            display: 'flex',
                        }}
                    >
                        {virtualizer.getVirtualItems().map(virtualCol => {
                            const date = dates[virtualCol.index]
                            const dateKey = new Date(date).setHours(0, 0, 0, 0)
                            const colTasks = tasksByDate[new Date(dateKey).toISOString()] ?? []
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
                                        bgcolor: today ? 'rgba(25, 118, 210, 0.03)' : isWeekend ? '#fafafa' : 'white',
                                    }}
                                >
                                    {/* Заголовок колонки */}
                                    <Box sx={{
                                        px: 1.5,
                                        py: 1,
                                        borderBottom: '1px solid #e0e0e0',
                                        bgcolor: today ? 'primary.main' : isWeekend ? '#f5f5f5' : '#fafafa',
                                        flexShrink: 0,
                                        textAlign: 'center',
                                    }}>
                                        <Typography
                                            variant="caption"
                                            fontWeight={600}
                                            sx={{
                                                color: today ? 'white' : 'text.secondary',
                                                display: 'block',
                                                textTransform: 'uppercase',
                                                fontSize: 10,
                                            }}
                                        >
                                            {formatDayOfWeek(date)}
                                        </Typography>
                                        <Typography
                                            variant="body2"
                                            fontWeight={700}
                                            sx={{ color: today ? 'white' : 'text.primary' }}
                                        >
                                            {formatDate(date)}
                                        </Typography>
                                    </Box>

                                    {/* Задачи */}
                                    <Box sx={{
                                        flex: 1,
                                        overflowY: 'auto',
                                        p: 1,
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: 1,
                                        '&::-webkit-scrollbar': { width: 3 },
                                        '&::-webkit-scrollbar-thumb': { bgcolor: '#ddd', borderRadius: 2 },
                                    }}>
                                        {colTasks.map(task => (
                                            <TaskCard
                                                key={task.id}
                                                task={task}
                                                onClick={() => setSelectedTask(task)}
                                            />
                                        ))}
                                    </Box>
                                </Box>
                            )
                        })}
                    </Box>
                </Box>
            </Paper>

            {/* Модалка */}
            <Dialog open={!!selectedTask} onClose={() => setSelectedTask(null)} maxWidth="sm" fullWidth>
                {selectedTask && (
                    <>
                        <DialogTitle>
                            <Box display="flex" justifyContent="space-between" alignItems="center">
                                <Typography variant="h6" fontWeight={700}>{selectedTask.title}</Typography>
                                <Chip
                                    label={STATUS_LABELS[selectedTask.status]}
                                    color={STATUS_COLORS[selectedTask.status]}
                                    size="small"
                                />
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
                            </Box>
                        </DialogContent>
                    </>
                )}
            </Dialog>
        </Box>
    )
}

const TaskCard = ({ task, onClick }: { task: Task; onClick: () => void }) => (
    <Paper
        elevation={0}
        onClick={onClick}
        sx={{
            p: 1.25,
            border: '1px solid #e8e8e8',
            borderRadius: 2,
            cursor: 'pointer',
            '&:hover': { borderColor: 'primary.main', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' },
            transition: 'all 0.15s ease',
        }}
    >
        <Typography variant="caption" fontWeight={600} sx={{
            display: 'block', mb: 0.75,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
            {task.title}
        </Typography>
        <Chip label={STATUS_LABELS[task.status]} color={STATUS_COLORS[task.status]} size="small" sx={{ fontSize: 10, height: 20 }} />
    </Paper>
)