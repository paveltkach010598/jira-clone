import { useState } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import {
    Box, Drawer, List, ListItem, ListItemButton,
    ListItemIcon, ListItemText, Typography, Avatar,
    Divider, IconButton, AppBar, Toolbar
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

const DRAWER_WIDTH = 260

export default function Layout() {
    const navigate = useNavigate()
    const location = useLocation()
    const dispatch = useDispatch()
    const { user } = useSelector((state: RootState) => state.auth)
    const [mobileOpen, setMobileOpen] = useState(false)

    const handleLogout = async () => {
        await supabase.auth.signOut()
        dispatch(setUser(null))
        navigate('/login')
    }

    const navItems = [
        {
            label: 'Дашборд',
            path: '/',
            icon: <DashboardIcon />,
            roles: ['user', 'hr', 'teamlead', 'admin'],
        },
        {
            label: 'Задачи',
            path: '/tasks',
            icon: <TaskIcon />,
            roles: ['user', 'hr', 'teamlead', 'admin'],
        },
        {
            label: 'Админ панель',
            path: '/admin',
            icon: <AdminIcon />,
            roles: ['admin'],
        },
        {
            label: 'Профиль',
            path: '/profile',
            icon: <PersonIcon />,
            roles: ['user', 'hr', 'teamlead', 'admin'],
        },
    ]

    const filteredNavItems = navItems.filter(item =>
        user?.role ? item.roles.includes(user.role) : false
    )

    const drawer = (
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            {/* Шапка сайдбара */}
            <Box sx={{ p: 3, borderBottom: '1px solid #e0e0e0' }}>
                <Typography variant="h6" fontWeight={700} color="primary">
                    TaskFlow
                </Typography>
                <Typography variant="caption" color="text.secondary">
                    Управление задачами
                </Typography>
            </Box>

            {/* Информация о юзере */}
            <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar
                    src={user?.avatar_url || undefined}
                    sx={{ width: 40, height: 40, bgcolor: 'primary.main' }}
                >
                    {user?.full_name?.[0]?.toUpperCase()}
                </Avatar>
                <Box>
                    <Typography variant="body2" fontWeight={600}>
                        {user?.full_name || 'Пользователь'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'capitalize' }}>
                        {user?.role}
                    </Typography>
                </Box>
            </Box>

            <Divider />

            {/* Навигация */}
            <List sx={{ flex: 1, px: 1, py: 2 }}>
                {filteredNavItems.map((item) => {
                    const isActive = location.pathname === item.path
                    return (
                        <ListItem key={item.path} disablePadding sx={{ mb: 0.5 }}>
                            <ListItemButton
                                onClick={() => {
                                    navigate(item.path)
                                    setMobileOpen(false)
                                }}
                                sx={{
                                    borderRadius: 2,
                                    backgroundColor: isActive ? 'primary.main' : 'transparent',
                                    color: isActive ? 'white' : 'text.primary',
                                    '&:hover': {
                                        backgroundColor: isActive ? 'primary.dark' : 'action.hover',
                                    },
                                    '& .MuiListItemIcon-root': {
                                        color: isActive ? 'white' : 'text.secondary',
                                    },
                                }}
                            >
                                <ListItemIcon sx={{ minWidth: 40 }}>
                                    {item.icon}
                                </ListItemIcon>
                                <ListItemText primary={item.label} />
                            </ListItemButton>
                        </ListItem>
                    )
                })}
            </List>

            <Divider />

            {/* Кнопка выхода */}
            <List sx={{ px: 1, py: 1 }}>
                <ListItem disablePadding>
                    <ListItemButton
                        onClick={handleLogout}
                        sx={{ borderRadius: 2, color: 'error.main',
                            '& .MuiListItemIcon-root': { color: 'error.main' }
                        }}
                    >
                        <ListItemIcon sx={{ minWidth: 40 }}>
                            <LogoutIcon />
                        </ListItemIcon>
                        <ListItemText primary="Выйти" />
                    </ListItemButton>
                </ListItem>
            </List>
        </Box>
    )

    return (
        <Box sx={{ display: 'flex', minHeight: '100vh' }}>
            {/* Мобильный AppBar */}
            <AppBar
                position="fixed"
                sx={{ display: { sm: 'none' }, zIndex: (theme) => theme.zIndex.drawer + 1 }}
            >
                <Toolbar>
                    <IconButton color="inherit" onClick={() => setMobileOpen(!mobileOpen)}>
                        <MenuIcon />
                    </IconButton>
                    <Typography variant="h6" fontWeight={700}>TaskFlow</Typography>
                </Toolbar>
            </AppBar>

            {/* Мобильный Drawer */}
            <Drawer
                variant="temporary"
                open={mobileOpen}
                onClose={() => setMobileOpen(false)}
                ModalProps={{ keepMounted: true }}
                sx={{
                    display: { xs: 'block', sm: 'none' },
                    '& .MuiDrawer-paper': { width: DRAWER_WIDTH },
                }}
            >
                {drawer}
            </Drawer>

            {/* Десктопный Drawer */}
            <Drawer
                variant="permanent"
                sx={{
                    display: { xs: 'none', sm: 'block' },
                    '& .MuiDrawer-paper': {
                        width: DRAWER_WIDTH,
                        boxSizing: 'border-box',
                        borderRight: '1px solid #e0e0e0',
                    },
                }}
                open
            >
                {drawer}
            </Drawer>

            {/* Основной контент */}
            <Box
                component="main"
                sx={{
                    flexGrow: 1,
                    p: 3,
                    width: { sm: `calc(100% - ${DRAWER_WIDTH}px)` },
                    mt: { xs: 8, sm: 0 },
                    bgcolor: '#f8f9fa',
                    minHeight: '100vh',
                }}
            >
                <Outlet />
            </Box>
        </Box>
    )
}