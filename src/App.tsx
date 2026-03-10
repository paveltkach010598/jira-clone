import { useEffect, useState } from 'react'
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

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

async function fetchProfile(userId: string, accessToken: string): Promise<Profile | null> {
    const res = await fetch(
        `${SUPABASE_URL}/rest/v1/profiles?select=*&id=eq.${userId}`,
        {
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${accessToken}`,
            }
        }
    )
    const data = await res.json()
    return data?.[0] ?? null
}

export default function App() {
    const dispatch = useDispatch()
    const { user } = useSelector((state: RootState) => state.auth)
    const [initialized, setInitialized] = useState(false)

    useEffect(() => {
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                console.log('AUTH EVENT:', event, session?.user?.id)

                if (session?.user && session.access_token) {
                    const profile = await fetchProfile(session.user.id, session.access_token)
                    console.log('profile:', profile)
                    dispatch(setUser(profile))
                } else {
                    dispatch(setUser(null))
                }

                setInitialized(true)
            }
        )

        return () => subscription.unsubscribe()
    }, [dispatch])

    if (!initialized) return <div>Загрузка...</div>

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