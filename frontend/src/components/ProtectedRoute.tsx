import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { isAuthenticated, hasRole } from '../utils/auth';

interface ProtectedRouteProps {
  children: ReactNode;
  requireAuth?: boolean;    // Czy trzeba być zalogowanym?
  requiredRole?: string;    // Jaka rola jest wymagana? (np. 'Admin')
  redirectTo?: string;      // Gdzie przekierować jeśli brak dostępu?
}

const ProtectedRoute = ({ 
  children, 
  requireAuth = true, 
  requiredRole, 
  redirectTo = '/auth/login' 
}: ProtectedRouteProps) => {
  
  // Sprawdzam czy potrzeba być zalogowanym i czy faktycznie jest
  if (requireAuth && !isAuthenticated()) {
    return <Navigate to={redirectTo} replace />;
  }

  // Sprawdzam czy potrzeba konkretnej roli i czy ją ma
  if (requiredRole && !hasRole(requiredRole)) {
    return <Navigate to="/" replace />;  // Przekierowuję na główną jeśli nie ma uprawnień
  }

  // Wszystko OK - pokazuję komponent
  return <>{children}</>;
};

export default ProtectedRoute;
