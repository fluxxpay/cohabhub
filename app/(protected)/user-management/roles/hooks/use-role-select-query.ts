import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiFetch } from '@/lib/api';

// Custom hook to use roles for selection
export const useRoleSelectQuery = () => {
  // Fetch roles for selection
  const fetchRoleList = async () => {
    const result = await apiFetch('/api/user-management/roles/select');

    if (!result.response?.ok) {
      toast.error(
        'Something went wrong while loading the records. Please try again.',
        {
          position: 'top-center',
        },
      );
      throw new Error('Failed to fetch roles');
    }

    return result.data;
  };

  return useQuery({
    queryKey: ['user-role-select'],
    queryFn: fetchRoleList,
    staleTime: Infinity,
    gcTime: 1000 * 60 * 60, // 60 minutes
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: 1,
  });
};
