import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import {
    Box, Button, TextField, Typography, Paper, Alert
} from '@mui/material'

export default function LoginPage() {
    const navigate = useNavigate()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)

    const handleLogin = async () => {
        setLoading(true)
        setError(null)

        const { error } = await supabase.auth.signInWithPassword({ email, password })

        if (error) {
            setError(error.message)
        } else {
            navigate('/')
        }

        setLoading(false)
    }

    return (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh" bgcolor="#f5f5f5">
            <Paper elevation={3} sx={{ p: 4, width: 400 }}>
                <Typography variant="h5" fontWeight={600} mb={3}>Вход в систему</Typography>

                {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

                <TextField
                    fullWidth label="Email" type="email"
                    value={email} onChange={(e) => setEmail(e.target.value)}
                    sx={{ mb: 2 }}
                />
                <TextField
                    fullWidth label="Пароль" type="password"
                    value={password} onChange={(e) => setPassword(e.target.value)}
                    sx={{ mb: 3 }}
                    onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                />

                <Button
                    fullWidth variant="contained" size="large"
                    onClick={handleLogin} disabled={loading}
                >
                    {loading ? 'Входим...' : 'Войти'}
                </Button>

                <Typography mt={2} textAlign="center" variant="body2">
                    Нет аккаунта?{' '}
                    <Link to="/register" style={{ color: '#1976d2' }}>Зарегистрироваться</Link>
                </Typography>
            </Paper>
        </Box>
    )
}