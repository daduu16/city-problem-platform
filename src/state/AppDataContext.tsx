import { createContext, PropsWithChildren, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { mockNews, mockNotifications, mockProblems } from '@/data/mockData';
import { createProblem, fetchNews, fetchNotifications, fetchProblems } from '@/services/api';
import { News, NotificationItem, Problem, ProblemCategory, ProblemPriority } from '@/types';

type CreateProblemInput = {
  title: string;
  category: ProblemCategory;
  priority: ProblemPriority;
  description: string;
  address: string;
  imageUrl?: string;
};

type AppDataContextValue = {
  news: News[];
  notifications: NotificationItem[];
  problems: Problem[];
  loading: boolean;
  addProblem: (input: CreateProblemInput) => Promise<void>;
  refresh: () => Promise<void>;
};

const AppDataContext = createContext<AppDataContextValue | null>(null);

export function AppDataProvider({ children }: PropsWithChildren) {
  const [news, setNews] = useState<News[]>(mockNews);
  const [notifications, setNotifications] = useState<NotificationItem[]>(mockNotifications);
  const [problems, setProblems] = useState<Problem[]>(mockProblems);
  const [loading, setLoading] = useState(true);
  const [myCreatedIds, setMyCreatedIds] = useState<string[]>([]);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      const [newsData, notificationsData, problemsData] = await Promise.all([
        fetchNews(),
        fetchNotifications(),
        fetchProblems(),
      ]);

      setNews(newsData);
      setNotifications(notificationsData);
      setProblems(
        problemsData.map((problem) => ({
          ...problem,
          createdByMe: myCreatedIds.includes(problem.id),
        })),
      );
    } catch {
      setNews(mockNews);
      setNotifications(mockNotifications);
      setProblems(mockProblems);
    } finally {
      setLoading(false);
    }
  }, [myCreatedIds]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const addProblem = useCallback(async (input: CreateProblemInput) => {
    const created = await createProblem(input);
    setMyCreatedIds((current) => [created.id, ...current]);
    setProblems((current) => [{ ...created, createdByMe: true }, ...current]);
  }, []);

  const value = useMemo<AppDataContextValue>(
    () => ({
      news,
      notifications,
      problems,
      loading,
      addProblem,
      refresh,
    }),
    [news, notifications, problems, loading, addProblem, refresh],
  );

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

export function useAppData() {
  const ctx = useContext(AppDataContext);
  if (!ctx) {
    throw new Error('useAppData must be used within AppDataProvider');
  }
  return ctx;
}

