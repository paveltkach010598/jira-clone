import { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { supabase } from './lib/supabaseClient'
import { setUser, setLoading } from './features/auth/authSlice'
import type { RootState } from './app/store'
import type { Profile } from './types'

import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import DashboardPage from './pages/DashboardPage'
import TasksPage from './pages/TasksPage'
import AdminPage from './pages/AdminPage'
import ProfilePage from './pages/ProfilePage'
import PrivateRoute from './components/PrivateRoute'
import Layout from './components/Layout'

export default function App() {
    const dispatch = useDispatch()
    const { user, isLoading } = useSelector((state: RootState) => state.auth)

    useEffect(() => {
        // Проверяем сессию при загрузке
        supabase.auth.getSession().then(async ({ data: { session } }) => {
            if (session?.user) {
                const { data } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', session.user.id)
                    .single()
                dispatch(setUser(data as Profile))
            } else {
                dispatch(setUser(null))
            }
        })

        // Слушаем изменения авторизации
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                if (session?.user) {
                    const { data } = await supabase
                        .from('profiles')
                        .select('*')
                        .eq('id', session.user.id)
                        .single()
                    dispatch(setUser(data as Profile))
                } else {
                    dispatch(setUser(null))
                }
            }
        )

        return () => subscription.unsubscribe()
    }, [dispatch])

    if (isLoading) return <div>Загрузка...</div>

    return (
        <Routes>
            <Route path="/login" element={!user ? <LoginPage /> : <Navigate to="/" />} />
            <Route path="/register" element={!user ? <RegisterPage /> : <Navigate to="/" />} />

            <Route element={<PrivateRoute />}>
                <Route element={<Layout />}>
                    <Route path="/" element={<DashboardPage />} />
                    <Route path="/tasks" element={<TasksPage />} />
                    <Route path="/profile" element={<ProfilePage />} />
                    <Route
                        path="/admin"
                        element={
                            user?.role === 'admin' ? <AdminPage /> : <Navigate to="/" />
                        }
                    />
                </Route>
            </Route>
        </Routes>
    )
}