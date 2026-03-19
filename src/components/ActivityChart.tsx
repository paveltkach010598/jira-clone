import ReactECharts from 'echarts-for-react'
import { useMemo } from 'react'
import { Paper, Typography } from '@mui/material'
import type { Task } from '../types'

interface Props {
    tasks: Task[]
}

export default function ActivityChart({ tasks }: Props) {
    const chartData = useMemo(() => {
        const today = new Date()
        today.setHours(0, 0, 0, 0)

        // Последние 14 дней
        const days = Array.from({ length: 14 }, (_, i) => {
            const d = new Date(today)
            d.setDate(today.getDate() - (13 - i))
            return d
        })

        const created = days.map(day => ({
            date: day.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' }),
            count: tasks.filter(t => {
                const d = new Date(t.created_at)
                d.setHours(0, 0, 0, 0)
                return d.getTime() === day.getTime()
            }).length
        }))

        const done = days.map(day => ({
            date: day.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' }),
            count: tasks.filter(t => {
                if (t.status !== 'done') return false
                const d = new Date(t.updated_at)
                d.setHours(0, 0, 0, 0)
                return d.getTime() === day.getTime()
            }).length
        }))

        return { dates: created.map(d => d.date), created, done }
    }, [tasks])

    const option = {
        tooltip: {
            trigger: 'axis',
            axisPointer: { type: 'cross' }
        },
        legend: {
            data: ['Создано', 'Выполнено'],
            bottom: 0,
        },
        grid: {
            left: '3%',
            right: '4%',
            bottom: '40px',
            top: '10px',
            containLabel: true
        },
        xAxis: {
            type: 'category',
            data: chartData.dates,
            axisLabel: { fontSize: 11 }
        },
        yAxis: {
            type: 'value',
            minInterval: 1,
            axisLabel: { fontSize: 11 }
        },
        series: [
            {
                name: 'Создано',
                type: 'bar',
                data: chartData.created.map(d => d.count),
                itemStyle: { color: '#1976d2', borderRadius: [4, 4, 0, 0] },
                barMaxWidth: 40,
            },
            {
                name: 'Выполнено',
                type: 'bar',
                data: chartData.done.map(d => d.count),
                itemStyle: { color: '#2e7d32', borderRadius: [4, 4, 0, 0] },
                barMaxWidth: 40,
            }
        ]
    }

    return (
        <Paper elevation={0} sx={{ p: 3, border: '1px solid #e0e0e0', borderRadius: 3 }}>
            <Typography variant="h6" fontWeight={700} mb={2}>Активность за 14 дней</Typography>
            <ReactECharts
                option={option}
                style={{ height: 220 }}
                opts={{ renderer: 'canvas' }}
            />
        </Paper>
    )
}