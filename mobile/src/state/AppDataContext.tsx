import {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import {
  mockGamificationSummary,
  mockMonthlyLeaderboard,
  mockNews,
  mockNotifications,
  mockPointActivities,
  mockProblems,
  mockWeeklyLeaderboard,
} from '@/data/mockData';
import { createProblem, fetchNews, fetchNotifications, fetchProblems } from '@/services/api';
import { fetchAssigneeCalendar } from '@/services/executorService';
import {
  addDaysToDateKey,
  flattenCalendarTasks,
  todayDateKey,
} from '@/lib/executorSchedule';
import {
  MobileScheduleTask,
  News,
  NotificationItem,
  Problem,
  ProblemCategory,
  ProblemPriority,
} from '@/types';

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

export type AppUser = {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  finCode?: string;
  role: 'citizen' | 'executor';
  token?: string;
  assigneeId?: string;
  assigneeName?: string;
};

type AppDataContextValue = {
  currentUser: AppUser | null;
  news: News[];
  notifications: NotificationItem[];
  problems: Problem[];
  executorTasks: MobileScheduleTask[];
  executorLoading: boolean;
  executorError: string | null;
  gamification: {
    points: number;
    createdProblems: number;
    resolvedProblems: number;
    basePoints: number;
    resolvedBonusPoints: number;
    level: number;
    nextLevelAt: number;
    progressPct: number;
    recentActivities: Array<{
      id: string;
      title: string;
      points: number;
      createdAt: string;
    }>;
    leaderboard: {
      weekly: Array<{
        id: string;
        fullName: string;
        points: number;
        createdProblems: number;
        resolvedProblems: number;
      }>;
      monthly: Array<{
        id: string;
        fullName: string;
        points: number;
        createdProblems: number;
        resolvedProblems: number;
      }>;
    };
  };
  loading: boolean;
  unreadNotificationsCount: number;
  addProblem: (input: CreateProblemInput) => Promise<void>;
  resolveProblemAsExecutor: (problemId: string, photoUrl: string) => void;
  setCurrentUser: (user: AppUser | null) => void;
  markNotificationAsRead: (notificationId: string) => void;
  toggleProblemUpvote: (problemId: string) => void;
  refresh: () => Promise<void>;
  refreshExecutorTasks: () => Promise<void>;
};

const AppDataContext = createContext<AppDataContextValue | null>(null);

function normalizeStatus(value: string) {
  return value
    .toLocaleLowerCase('az')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function isResolvedStatus(status: string) {
  return normalizeStatus(status).includes('hell edildi');
}

export function AppDataProvider({ children }: PropsWithChildren) {
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const [news, setNews] = useState<News[]>(mockNews);
  const [notifications, setNotifications] = useState<NotificationItem[]>(mockNotifications);
  const [problems, setProblems] = useState<Problem[]>(mockProblems);
  const [executorTasks, setExecutorTasks] = useState<MobileScheduleTask[]>([]);
  const [executorLoading, setExecutorLoading] = useState(false);
  const [executorError, setExecutorError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [myCreatedIds, setMyCreatedIds] = useState<string[]>([]);
  const loadedFromApiRef = useRef(false);

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
      loadedFromApiRef.current = true;
    } catch (error) {
      if (__DEV__) {
        console.warn('[AppData] Backend unreachable:', error);
      }
      if (!loadedFromApiRef.current) {
        setNews(mockNews);
        setNotifications(mockNotifications.map(withNotificationDefaults));
        setProblems(mockProblems.map(withVoteDefaults));
      }
    } finally {
      setLoading(false);
    }
  }, [myCreatedIds, withNotificationDefaults, withVoteDefaults]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const refreshExecutorTasks = useCallback(async () => {
    if (
      currentUser?.role !== 'executor' ||
      !currentUser.token ||
      !currentUser.assigneeId
    ) {
      return;
    }

    setExecutorLoading(true);
    setExecutorError(null);
    try {
      const from = todayDateKey();
      const to = addDaysToDateKey(from, 13);
      const calendar = await fetchAssigneeCalendar(
        currentUser.token,
        currentUser.assigneeId,
        from,
        to,
      );
      setExecutorTasks(flattenCalendarTasks(calendar.days));
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Tapşırıqlar yüklənmədi';
      setExecutorError(message);
      if (__DEV__) {
        console.warn('[AppData] Executor tasks load failed:', error);
      }
    } finally {
      setExecutorLoading(false);
    }
  }, [currentUser?.assigneeId, currentUser?.role, currentUser?.token]);

  useEffect(() => {
    if (
      currentUser?.role === 'executor' &&
      currentUser.token &&
      currentUser.assigneeId
    ) {
      void refreshExecutorTasks();
    } else {
      setExecutorTasks([]);
      setExecutorError(null);
    }
  }, [
    currentUser?.assigneeId,
    currentUser?.role,
    currentUser?.token,
    refreshExecutorTasks,
  ]);

  const addProblem = useCallback(async (input: CreateProblemInput) => {
    const created = await createProblem(input);
    setMyCreatedIds((current) => [created.id, ...current]);
    setProblems((current) => [{ ...withVoteDefaults(created), createdByMe: true }, ...current]);
  }, [withVoteDefaults]);

  const resolveProblemAsExecutor = useCallback((problemId: string, photoUrl: string) => {
    setProblems((current) =>
      current.map((problem) => {
        if (problem.id !== problemId) return problem;
        return {
          ...problem,
          status: 'Həll edildi',
          resolvedPhotoUrl: photoUrl,
          mediaUrl: photoUrl,
          mediaType: 'image',
        };
      }),
    );
  }, []);

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
    () => {
      const role = currentUser?.role ?? 'citizen';
      return notifications.filter((notification) => {
        if (notification.isRead) return false;
        if (!notification.targetRole || notification.targetRole === 'all') return true;
        return notification.targetRole === role;
      }).length;
    },
    [currentUser?.role, notifications],
  );

  const gamification = useMemo(() => {
    const myProblems = problems.filter((problem) => problem.createdByMe);
    const hasRealPersonalData = myProblems.length > 0;
    const createdProblems = hasRealPersonalData
      ? myProblems.length
      : mockGamificationSummary.createdProblems;
    const resolvedProblems = hasRealPersonalData
      ? myProblems.filter((problem) => isResolvedStatus(problem.status)).length
      : mockGamificationSummary.resolvedProblems;

    const basePoints = createdProblems * 5;
    const resolvedBonusPoints = resolvedProblems * 10;
    const points = hasRealPersonalData
      ? basePoints + resolvedBonusPoints
      : mockGamificationSummary.points;

    const level = Math.floor(points / 100) + 1;
    const levelStart = (level - 1) * 100;
    const nextLevelAt = level * 100;
    const levelDelta = nextLevelAt - levelStart;
    const progressPct = levelDelta > 0 ? Math.min(100, ((points - levelStart) / levelDelta) * 100) : 0;

    const realActivities = myProblems
      .map((problem) => {
        const resolved = isResolvedStatus(problem.status);
        return {
          id: `activity_${problem.id}`,
          title: resolved
            ? `Problem həll edildi: ${problem.title}`
            : `Problem yaradıldı: ${problem.title}`,
          points: resolved ? 15 : 5,
          createdAt: problem.createdAt,
        };
      })
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

    const recentActivities =
      realActivities.length > 0
        ? realActivities.slice(0, 5)
        : mockPointActivities.slice(0, 5);

    return {
      points,
      createdProblems,
      resolvedProblems,
      basePoints,
      resolvedBonusPoints,
      level,
      nextLevelAt,
      progressPct,
      recentActivities,
      leaderboard: {
        weekly: mockWeeklyLeaderboard,
        monthly: mockMonthlyLeaderboard,
      },
    };
  }, [problems]);

  const value = useMemo<AppDataContextValue>(
    () => ({
      currentUser,
      news,
      notifications: notifications.filter((notification) => {
        const role = currentUser?.role ?? 'citizen';
        if (!notification.targetRole || notification.targetRole === 'all') return true;
        return notification.targetRole === role;
      }),
      problems,
      executorTasks,
      executorLoading,
      executorError,
      gamification,
      loading,
      unreadNotificationsCount,
      addProblem,
      resolveProblemAsExecutor,
      setCurrentUser,
      markNotificationAsRead,
      toggleProblemUpvote,
      refresh,
      refreshExecutorTasks,
    }),
    [
      currentUser,
      news,
      notifications,
      problems,
      executorTasks,
      executorLoading,
      executorError,
      gamification,
      loading,
      unreadNotificationsCount,
      addProblem,
      resolveProblemAsExecutor,
      setCurrentUser,
      markNotificationAsRead,
      toggleProblemUpvote,
      refresh,
      refreshExecutorTasks,
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
