import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { AdminUser, Category } from '@/types';
import { az } from '@/i18n/az';
import { formatRole } from '@/lib/format';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';

export function AdminUsersPage() {
  const queryClient = useQueryClient();
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [categoryIds, setCategoryIds] = useState<string[]>([]);

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

  const leafCategories =
    categoriesQuery.data?.filter(
      (c) => !categoriesQuery.data?.some((p) => p.parentId === c.id),
    ) ?? [];

  return (
    <div className="mx-auto max-w-[1200px] p-6">
      <header className="mb-6 border-b pb-4">
        <h2 className="text-2xl font-semibold">{az.admin.title}</h2>
        <p className="text-sm text-muted-foreground">{az.admin.subtitle}</p>
      </header>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{az.admin.title}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {usersQuery.data?.map((user) => (
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
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {selectedUser ? selectedUser.name : az.admin.access}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!selectedUser ? (
              <p className="text-sm text-muted-foreground">Select a user</p>
            ) : (
              <div className="space-y-4">
                <p className="text-sm font-medium">{az.admin.categories}</p>
                <div className="max-h-64 space-y-2 overflow-y-auto">
                  {leafCategories.map((cat) => (
                    <div key={cat.id} className="flex items-center gap-2">
                      <Checkbox
                        id={`cat-${cat.id}`}
                        checked={categoryIds.includes(cat.id)}
                        onCheckedChange={(checked) => {
                          setCategoryIds((prev) =>
                            checked
                              ? [...prev, cat.id]
                              : prev.filter((id) => id !== cat.id),
                          );
                        }}
                      />
                      <Label htmlFor={`cat-${cat.id}`} className="text-sm font-normal">
                        {cat.name}
                      </Label>
                    </div>
                  ))}
                </div>
                <Button
                  onClick={() => saveAccess.mutate()}
                  disabled={saveAccess.isPending}
                >
                  {az.admin.save}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
