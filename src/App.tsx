import { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { supabase } from './lib/supabaseClient'
import { setUser } from './features/auth/authSlice'
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
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                console.log('EVENT:', event, 'USER:', session?.user?.id)

                if (session?.user && session.access_token) {
                    try {
                        const res = await fetch(
                            `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/profiles?select=*&id=eq.${session.user.id}`,
                            {
                                headers: {
                                    'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY,
                                    'Authorization': `Bearer ${session.access_token}`,
                                }
                            }
                        )

                        if (!res.ok) {
                            throw new Error(`HTTP error! status: ${res.status}`)
                        }

                        const data = await res.json()
                        const profile = data?.[0] ?? null
                        console.log('profile:', profile)
                        dispatch(setUser(profile as Profile))
                    } catch (error) {
                        console.error('Error fetching profile:', error)
                        dispatch(setUser(null))
                    }
                } else {
                    dispatch(setUser(null))
                }
            }
        )

        // Проверяем существующую сессию при загрузке
        const initAuth = async () => {
            const { data: { session } } = await supabase.auth.getSession()
            if (session?.user && session.access_token) {
                try {
                    const res = await fetch(
                        `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/profiles?select=*&id=eq.${session.user.id}`,
                        {
                            headers: {
                                'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY,
                                'Authorization': `Bearer ${session.access_token}`,
                            }
                        }
                    )
                    const data = await res.json()
                    const profile = data?.[0] ?? null
                    dispatch(setUser(profile as Profile))
                } catch (error) {
                    console.error('Error fetching profile in init:', error)
                    dispatch(setUser(null))
                }
            } else {
                dispatch(setUser(null))
            }
        }

        initAuth()

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
                        element={user?.role === 'admin' ? <AdminPage /> : <Navigate to="/" />}
                    />
                </Route>
            </Route>
        </Routes>
    )
}