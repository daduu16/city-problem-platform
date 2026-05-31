import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Search } from 'lucide-react';
import { api } from '@/lib/api';
import type { AdminUser, Category } from '@/types';
import { az } from '@/i18n/az';
import { buildDbCategoryTree } from '@/lib/adminCategoryTree';
import { formatRole } from '@/lib/format';
import { CategoryTreeView } from '@/components/shared/CategoryTreeView';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';

export function AdminUsersPage() {
  const queryClient = useQueryClient();
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [categoryIds, setCategoryIds] = useState<string[]>([]);
  const [userSearch, setUserSearch] = useState('');

  const usersQuery = useQuery({
    queryKey: ['admin', 'users'],
    queryFn: async () => {
      const res = await api.get<AdminUser[]>('/admin/users');
      return res.data;
    },
  });

  const categoriesQuery = useQuery({
    queryKey: ['admin', 'categories'],
    queryFn: async () => {
      const res = await api.get<Category[]>('/admin/categories');
      return res.data;
    },
  });

  const selectedUser = usersQuery.data?.find((u) => u.id === selectedUserId);

  const categoryTree = useMemo(
    () => buildDbCategoryTree(categoriesQuery.data ?? []),
    [categoriesQuery.data],
  );

  const checkedKeys = useMemo(() => {
    const map: Record<string, boolean> = {};
    for (const id of categoryIds) map[id] = true;
    return map;
  }, [categoryIds]);

  const filteredUsers = useMemo(() => {
    const q = userSearch.trim().toLowerCase();
    const list = usersQuery.data ?? [];
    if (!q) return list;
    return list.filter(
      (u) =>
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.organization?.name?.toLowerCase().includes(q) ?? false),
    );
  }, [usersQuery.data, userSearch]);

  useEffect(() => {
    if (selectedUser) {
      setCategoryIds(selectedUser.categoryAccess.map((a) => a.category.id));
    }
  }, [selectedUser]);

  const saveAccess = useMutation({
    mutationFn: async () => {
      if (!selectedUserId) return;
      await api.put(`/admin/users/${selectedUserId}/access`, { categoryIds });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    },
  });

  if (usersQuery.isLoading) {
    return <Skeleton className="m-6 h-96 w-full" />;
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col p-6">
      <header className="mb-4 shrink-0 border-b pb-4">
        <h2 className="text-2xl font-semibold">{az.admin.title}</h2>
        <p className="text-sm text-muted-foreground">{az.admin.subtitle}</p>
      </header>

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="flex min-h-0 flex-col overflow-hidden">
          <CardHeader className="shrink-0 space-y-3 pb-3">
            <CardTitle className="text-base">{az.admin.title}</CardTitle>
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                placeholder={az.admin.searchUsers}
                className="h-9 pl-9"
              />
            </div>
          </CardHeader>
          <CardContent className="min-h-0 flex-1 space-y-2 overflow-y-auto">
            {filteredUsers.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                {az.admin.noSearchResults}
              </p>
            ) : (
              filteredUsers.map((user) => (
                <button
                  key={user.id}
                  type="button"
                  onClick={() => setSelectedUserId(user.id)}
                  className={`w-full rounded-md border px-3 py-2 text-left text-sm transition-colors ${
                    selectedUserId === user.id
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:bg-muted/50'
                  }`}
                >
                  <p className="font-medium">{user.name}</p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatRole(user.role.key)} · {user.organization?.name ?? '—'}
                  </p>
                </button>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="flex min-h-0 flex-col overflow-hidden">
          <CardHeader className="shrink-0 pb-3">
            <CardTitle className="text-base">
              {selectedUser ? selectedUser.name : az.admin.access}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex min-h-0 flex-1 flex-col">
            {!selectedUser ? (
              <p className="text-sm text-muted-foreground">{az.admin.selectUser}</p>
            ) : (
              <>
                <p className="mb-3 shrink-0 text-sm font-medium">
                  {az.admin.categories}
                </p>
                <div className="min-h-0 flex-1 overflow-y-auto pr-1">
                  {categoriesQuery.isLoading ? (
                    <Skeleton className="h-40 w-full" />
                  ) : categoryTree.length === 0 ? (
                    <p className="text-sm text-muted-foreground">—</p>
                  ) : (
                    <CategoryTreeView
                      mode="checkbox"
                      tree={categoryTree}
                      emptyMessage="—"
                      checkedKeys={checkedKeys}
                      onToggleKey={(id) => {
                        setCategoryIds((prev) =>
                          prev.includes(id)
                            ? prev.filter((x) => x !== id)
                            : [...prev, id],
                        );
                      }}
                      onToggleKeys={(ids, checked) => {
                        setCategoryIds((prev) => {
                          const set = new Set(prev);
                          for (const id of ids) {
                            if (checked) set.add(id);
                            else set.delete(id);
                          }
                          return [...set];
                        });
                      }}
                    />
                  )}
                </div>
                <Button
                  className="mt-4 shrink-0"
                  onClick={() => saveAccess.mutate()}
                  disabled={saveAccess.isPending}
                >
                  {az.admin.save}
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
