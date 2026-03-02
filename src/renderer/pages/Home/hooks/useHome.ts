import { useNavigate } from 'react-router-dom';
import { Routes } from '@/renderer/config/routes';

export const useHome = () => {
  const navigate = useNavigate();

  const handleNavigate = (route: Routes, action?: string) => {
    navigate(route, { state: { action } });
  };

  return {
    handleNavigate
  };
};
