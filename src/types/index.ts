export type UserRole = 'user' | 'hr' | 'teamlead' | 'admin'

export type TaskStatus = 'assigned' | 'in_progress' | 'review' | 'done'

export interface Profile {
    id: string
    email: string
    full_name: string | null
    avatar_url: string | null
    bio: string | null
    role: UserRole
    created_at: string
}

export interface Task {
    id: string
    title: string
    description: string | null
    status: TaskStatus
    assignee_id: string | null
    created_by: string | null
    github_url: string | null
    deadline: string | null
    created_at: string
    updated_at: string
    assignee?: Profile
    creator?: Profile
}