import {useMemo, useState} from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import {
    Box, List, ListItem, Typography, Avatar,
    Divider, AppBar, Toolbar, IconButton, Badge
} from '@mui/material'
import DashboardIcon from '@mui/icons-material/Dashboard'
import TaskIcon from '@mui/icons-material/Assignment'
import AdminIcon from '@mui/icons-material/AdminPanelSettings'
import PersonIcon from '@mui/icons-material/Person'
import LogoutIcon from '@mui/icons-material/Logout'
import MenuIcon from '@mui/icons-material/Menu'
import { supabase } from '../lib/supabaseClient'
import { setUser } from '../features/auth/authSlice'
import type { RootState } from '../app/store'
import { useGetTasksQuery } from '../features/tasks/tasksApi'

const DRAWER_WIDTH = 260
const DRAWER_COLLAPSED_WIDTH = 64

export default function Layout() {
    const navigate = useNavigate()
    const location = useLocation()
    const dispatch = useDispatch()
    const { user } = useSelector((state: RootState) => state.auth)
    const [expanded, setExpanded] = useState(false)
    const [mobileOpen, setMobileOpen] = useState(false)
    const { data: tasks } = useGetTasksQuery()

    const handleLogout = async () => {
        await supabase.auth.signOut()
        dispatch(setUser(null))
        navigate('/login')
    }

    const notDoneCount = useMemo(() => {
        if (!tasks || !user) return 0
        const isManager = user.role === 'admin' || user.role === 'teamlead'
        const filtered = isManager
            ? tasks.filter(t => t.status !== 'done')
            : tasks.filter(t => t.status !== 'done' && t.assignee_id === user.id)
        return filtered.length
    }, [tasks, user])

    const navItems = [
        { label: 'Дашборд', path: '/', icon: <DashboardIcon />, roles: ['user', 'hr', 'teamlead', 'admin'] },
        {
            label: 'Задачи', path: '/tasks',
            icon: <Badge badgeContent={notDoneCount} color="error" max={99}><TaskIcon /></Badge>,
            roles: ['user', 'hr', 'teamlead', 'admin']
        },
        { label: 'Админ панель', path: '/admin', icon: <AdminIcon />, roles: ['admin'] },
        { label: 'Профиль', path: '/profile', icon: <PersonIcon />, roles: ['user', 'hr', 'teamlead', 'admin'] },
    ]

    const filteredNavItems = navItems.filter(item =>
        user?.role ? item.roles.includes(user.role) : false
    )

    return (
        <Box sx={{ display: 'flex', minHeight: '100vh' }}>

            {/* Затемнение */}
            {expanded && (
                <Box
                    onClick={() => setExpanded(false)}
                    sx={{
                        position: 'fixed',
                        inset: 0,
                        bgcolor: 'rgba(0,0,0,0.3)',
                        zIndex: 1199,
                    }}
                />
            )}

            {/* Мобильный AppBar */}
            <AppBar position="fixed" sx={{ display: { sm: 'none' }, zIndex: 1201 }}>
                <Toolbar>
                    <IconButton color="inherit" onClick={() => setMobileOpen(!mobileOpen)}>
                        <MenuIcon />
                    </IconButton>
                    <Typography variant="h6" fontWeight={700}>TaskFlow</Typography>
                </Toolbar>
            </AppBar>

            {/* Десктопный сайдбар */}
            <Box
                onMouseEnter={() => setExpanded(true)}
                onMouseLeave={() => setExpanded(false)}
                sx={{
                    display: { xs: 'none', sm: 'flex' },
                    flexDirection: 'column',
                    position: 'fixed',
                    height: '100vh',
                    width: expanded ? DRAWER_WIDTH : DRAWER_COLLAPSED_WIDTH,
                    transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    zIndex: 1200,
                    bgcolor: 'white',
                    borderRight: '1px solid #e0e0e0',
                    overflow: 'hidden',
                }}
            >
                {/* Шапка */}
                <Box sx={{
                    height: 72,
                    borderBottom: '1px solid #e0e0e0',
                    display: 'flex',
                    alignItems: 'center',
                    flexShrink: 0,
                }}>
                    <Box sx={{
                        width: DRAWER_COLLAPSED_WIDTH,
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        flexShrink: 0,
                    }}>
                        <Avatar sx={{ width: 36, height: 36, bgcolor: 'primary.main', fontSize: 11, fontWeight: 700 }}>
                            TF
                        </Avatar>
                    </Box>
                    <Box sx={{
                        opacity: expanded ? 1 : 0,
                        transition: 'opacity 0.25s ease',
                        whiteSpace: 'nowrap',
                        flex: 1,
                        pr: 2,
                    }}>
                        <Typography variant="h6" fontWeight={700} color="primary" lineHeight={1.2}>TaskFlow</Typography>
                        <Typography variant="caption" color="text.secondary">Управление задачами</Typography>
                    </Box>
                </Box>

                {/* Юзер */}
                <Box sx={{
                    height: 64,
                    display: 'flex',
                    alignItems: 'center',
                    flexShrink: 0,
                }}>
                    <Box sx={{
                        width: DRAWER_COLLAPSED_WIDTH,
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        flexShrink: 0,
                    }}>
                        <Avatar sx={{ width: 36, height: 36, bgcolor: 'primary.main', fontSize: 14 }}>
                            {user?.full_name?.[0]?.toUpperCase()}
                        </Avatar>
                    </Box>
                    <Box sx={{
                        opacity: expanded ? 1 : 0,
                        transition: 'opacity 0.25s ease',
                        whiteSpace: 'nowrap',
                        flex: 1,
                        pr: 2,
                    }}>
                        <Typography variant="body2" fontWeight={600}>{user?.full_name || 'Пользователь'}</Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'capitalize' }}>{user?.role}</Typography>
                    </Box>
                </Box>

                <Divider />

                {/* Навигация */}
                <List sx={{ flex: 1, py: 2, px: 0 }}>
                    {filteredNavItems.map((item) => {
                        const isActive = location.pathname === item.path
                        return (
                            <ListItem key={item.path} disablePadding sx={{ mb: 0.5 }}>
                                <Box
                                    onClick={() => navigate(item.path)}
                                    sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        width: 'calc(100% - 16px)',
                                        mx: 1,
                                        borderRadius: 2,
                                        cursor: 'pointer',
                                        overflow: 'hidden',
                                        backgroundColor: isActive ? 'primary.main' : 'transparent',
                                        '&:hover': {
                                            backgroundColor: isActive ? 'primary.dark' : 'rgba(0,0,0,0.06)',
                                        },
                                        transition: 'background-color 0.2s ease',
                                    }}
                                >
                                    {/* Иконка — всегда на месте, фиксированная ширина */}
                                    <Box sx={{
                                        width: DRAWER_COLLAPSED_WIDTH - 16,
                                        minWidth: DRAWER_COLLAPSED_WIDTH - 16,
                                        height: 44,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: isActive ? 'white' : 'text.secondary',
                                        flexShrink: 0,
                                    }}>
                                        {item.icon}
                                    </Box>

                                    {/* Текст — появляется через opacity */}
                                    <Typography
                                        variant="body2"
                                        fontWeight={500}
                                        sx={{
                                            whiteSpace: 'nowrap',
                                            color: isActive ? 'white' : 'text.primary',
                                            opacity: expanded ? 1 : 0,
                                            transition: 'opacity 0.2s ease',
                                        }}
                                    >
                                        {item.label}
                                    </Typography>
                                </Box>
                            </ListItem>
                        )
                    })}
                </List>

                <Divider />

                {/* Выход */}
                <Box sx={{ py: 1 }}>
                    <Box
                        onClick={handleLogout}
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            width: 'calc(100% - 16px)',
                            mx: 1,
                            borderRadius: 2,
                            cursor: 'pointer',
                            overflow: 'hidden',
                            color: 'error.main',
                            '&:hover': { backgroundColor: 'rgba(211,47,47,0.06)' },
                            transition: 'background-color 0.2s ease',
                        }}
                    >
                        <Box sx={{
                            width: DRAWER_COLLAPSED_WIDTH - 16,
                            minWidth: DRAWER_COLLAPSED_WIDTH - 16,
                            height: 44,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                        }}>
                            <LogoutIcon fontSize="small" />
                        </Box>
                        <Typography
                            variant="body2"
                            fontWeight={500}
                            sx={{
                                whiteSpace: 'nowrap',
                                opacity: expanded ? 1 : 0,
                                transition: 'opacity 0.2s ease',
                            }}
                        >
                            Выйти
                        </Typography>
                    </Box>
                </Box>
            </Box>

            {/* Контент */}
            {/* Контент */}
            <Box
                component="main"
                sx={{
                    flexGrow: 1,
                    ml: { xs: 0, sm: `${DRAWER_COLLAPSED_WIDTH}px` },
                    mt: { xs: 8, sm: 0 },
                    bgcolor: '#f8f9fa',
                    minHeight: '100vh',
                    display: 'flex',
                    flexDirection: 'column',
                    position: 'relative',
                }}
            >
                <Outlet />
            </Box>
        </Box>
    )
}