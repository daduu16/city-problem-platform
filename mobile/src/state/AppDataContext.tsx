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
  lat?: number;
  lng?: number;
  imageUrl?: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'video';
  mediaAsset?: {
    uri: string;
    fileName?: string | null;
    mimeType?: string | null;
  };
};

type AppDataContextValue = {
  currentUser: {
    id: string;
    fullName: string;
    email: string;
    phone: string;
    finCode?: string;
  } | null;
  news: News[];
  notifications: NotificationItem[];
  problems: Problem[];
  loading: boolean;
  unreadNotificationsCount: number;
  addProblem: (input: CreateProblemInput) => Promise<void>;
  setCurrentUser: (user: AppDataContextValue['currentUser']) => void;
  markNotificationAsRead: (notificationId: string) => void;
  toggleProblemUpvote: (problemId: string) => void;
  refresh: () => Promise<void>;
};

const AppDataContext = createContext<AppDataContextValue | null>(null);

export function AppDataProvider({ children }: PropsWithChildren) {
  const [currentUser, setCurrentUser] = useState<AppDataContextValue['currentUser']>(null);
  const [news, setNews] = useState<News[]>(mockNews);
  const [notifications, setNotifications] = useState<NotificationItem[]>(mockNotifications);
  const [problems, setProblems] = useState<Problem[]>(mockProblems);
  const [loading, setLoading] = useState(true);
  const [myCreatedIds, setMyCreatedIds] = useState<string[]>([]);

  const withVoteDefaults = useCallback(
    (problem: Problem): Problem => ({
      ...problem,
      upvotes: problem.upvotes ?? 0,
      hasUpvoted: problem.hasUpvoted ?? false,
    }),
    [],
  );

  const withNotificationDefaults = useCallback(
    (notification: NotificationItem): NotificationItem => ({
      ...notification,
      isRead: notification.isRead ?? false,
    }),
    [],
  );

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      const [newsData, notificationsData, problemsData] = await Promise.all([
        fetchNews(),
        fetchNotifications(),
        fetchProblems(),
      ]);

      setNews(newsData);
      const mergedNotifications = [
        ...mockNotifications.map(withNotificationDefaults),
        ...notificationsData.map(withNotificationDefaults),
      ].filter(
        (item, index, array) => array.findIndex((candidate) => candidate.id === item.id) === index,
      );
      setNotifications(mergedNotifications);
      setProblems(
        problemsData.map((problem) => ({
          ...withVoteDefaults(problem),
          createdByMe: myCreatedIds.includes(problem.id),
        })),
      );
    } catch (error) {
      if (__DEV__) {
        console.warn('[AppData] Backend unreachable, showing mock data:', error);
      }
      setNews(mockNews);
      setNotifications(mockNotifications.map(withNotificationDefaults));
      setProblems(mockProblems.map(withVoteDefaults));
    } finally {
      setLoading(false);
    }
  }, [myCreatedIds, withNotificationDefaults, withVoteDefaults]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const addProblem = useCallback(async (input: CreateProblemInput) => {
    const created = await createProblem(input);
    setMyCreatedIds((current) => [created.id, ...current]);
    setProblems((current) => [{ ...withVoteDefaults(created), createdByMe: true }, ...current]);
  }, [withVoteDefaults]);

  const toggleProblemUpvote = useCallback((problemId: string) => {
    setProblems((current) =>
      current.map((problem) => {
        if (problem.id !== problemId) return problem;
        const hasUpvoted = !(problem.hasUpvoted ?? false);
        const currentVotes = problem.upvotes ?? 0;
        return {
          ...problem,
          hasUpvoted,
          upvotes: hasUpvoted ? currentVotes + 1 : Math.max(0, currentVotes - 1),
        };
      }),
    );
  }, []);

  const markNotificationAsRead = useCallback((notificationId: string) => {
    setNotifications((current) =>
      current.map((notification) =>
        notification.id === notificationId ? { ...notification, isRead: true } : notification,
      ),
    );
  }, []);

  const unreadNotificationsCount = useMemo(
    () => notifications.filter((notification) => !notification.isRead).length,
    [notifications],
  );

  const value = useMemo<AppDataContextValue>(
    () => ({
      currentUser,
      news,
      notifications,
      problems,
      loading,
      unreadNotificationsCount,
      addProblem,
      setCurrentUser,
      markNotificationAsRead,
      toggleProblemUpvote,
      refresh,
    }),
    [
      currentUser,
      news,
      notifications,
      problems,
      loading,
      unreadNotificationsCount,
      addProblem,
      setCurrentUser,
      markNotificationAsRead,
      toggleProblemUpvote,
      refresh,
    ],
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
