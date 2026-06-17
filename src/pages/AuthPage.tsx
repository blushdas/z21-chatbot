
import { Navigate, useSearchParams } from 'react-router-dom';
import { safeRedirect } from '@/utils/safeRedirect';

const AuthPage = () => {
  const [searchParams] = useSearchParams();
  const redirectTo = safeRedirect(searchParams.get('redirect'));
  const loginPath = redirectTo === '/'
    ? '/login'
    : `/login?redirect=${encodeURIComponent(redirectTo)}`;

  return <Navigate to={loginPath} replace />;
};

export default AuthPage;
