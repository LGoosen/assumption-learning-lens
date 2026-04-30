import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-stone-400">
        Loading…
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    const target =
      user.role === 'student'
        ? '/student/dashboard'
        : user.role === 'staff'
        ? '/staff/dashboard'
        : '/management/dashboard';
    return <Navigate to={target} replace />;
  }

  return children;
}