import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { login, register } from '../api/queries';
import useAuthStore from '../store/authStore';

export function useLogin() {
  const { setTokens, setUser } = useAuthStore();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: login,
    onSuccess: (data) => {
      setTokens(data.access, data.refresh);
      // Decode the JWT payload to get user info
      const payload = JSON.parse(atob(data.access.split('.')[1]));
      setUser({ id: payload.user_id, email: payload.email || '', username: payload.username || '', role: payload.role || 'student' });
      navigate('/dashboard');
    },
  });
}

export function useRegister() {
  const navigate = useNavigate();
  return useMutation({
    mutationFn: register,
    onSuccess: () => navigate('/login'),
  });
}
