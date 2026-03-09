import { useSelector } from 'react-redux'
import { Navigate, Outlet } from 'react-router-dom'
import type {RootState} from "../app/store.ts";


export default function PrivateRoute() {
    const { user } = useSelector((state: RootState) => state.auth)
    return user ? <Outlet /> : <Navigate to="/login" />
}