import { Avatar } from '@mui/material'
import type { SxProps, Theme } from '@mui/material'
import type { Profile } from '../../types'

interface Props {
    user?: Pick<Profile, 'full_name' | 'avatar_url'> | null
    size?: number
    sx?: SxProps<Theme>
}

export default function UserAvatar({ user, size = 36, sx }: Props) {
    const letter = user?.full_name?.[0]?.toUpperCase() ?? '?'

    return (
        <Avatar
            src={user?.avatar_url ?? undefined}
            sx={{
                width: size,
                height: size,
                bgcolor: 'primary.main',
                fontSize: size * 0.4,
                fontWeight: 700,
                ...sx,
            }}
        >
            {/* Буква показывается только если нет фото */}
            {!user?.avatar_url && letter}
        </Avatar>
    )
}