import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { io } from 'socket.io-client';
import { useAuthStore } from '@/stores/authStore';

const WS_URL = import.meta.env.VITE_WS_URL ?? 'http://localhost:3001';

export function useRealtime() {
  const queryClient = useQueryClient();
  const token = useAuthStore((s) => s.token);

  useEffect(() => {
    if (!token) return;

    const socket = io(WS_URL, {
      transports: ['websocket', 'polling'],
      auth: { token },
    });

    const invalidate = () => {
      queryClient.invalidateQueries({ queryKey: ['incidents'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
    };

    socket.on('incident:created', invalidate);
    socket.on('incident:updated', invalidate);
    socket.on('incident:comment', invalidate);

    return () => {
      socket.disconnect();
    };
  }, [queryClient, token]);
}
