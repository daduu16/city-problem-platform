import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Category } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const schema = z.object({
  title: z.string().min(3),
  description: z.string().min(5),
  categoryId: z.string().uuid(),
  lat: z.coerce.number(),
  lng: z.coerce.number(),
  address: z.string().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).default('MEDIUM'),
});

type FormData = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function IncidentForm({ open, onOpenChange }: Props) {
  const queryClient = useQueryClient();

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await api.get<Category[]>('/categories');
      return res.data;
    },
    enabled: open,
  });

  const leafCategories = categories.filter(
    (c) => !categories.some((p) => p.parentId === c.id),
  );

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      lat: 40.4093,
      lng: 49.8671,
      priority: 'MEDIUM',
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: FormData) => {
      await api.post('/incidents', data);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['incidents'] });
      void queryClient.invalidateQueries({ queryKey: ['analytics'] });
      reset();
      onOpenChange(false);
    },
  });

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>New incident</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={handleSubmit((d) => createMutation.mutate(d))}
            className="space-y-3"
          >
            <div>
              <Label htmlFor="title">Title</Label>
              <Input id="title" {...register('title')} />
              {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Input id="description" {...register('description')} />
            </div>
            <div>
              <Label htmlFor="categoryId">Category</Label>
              <select
                id="categoryId"
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
                {...register('categoryId')}
              >
                <option value="">Select…</option>
                {leafCategories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label htmlFor="lat">Lat</Label>
                <Input id="lat" type="number" step="any" {...register('lat')} />
              </div>
              <div>
                <Label htmlFor="lng">Lng</Label>
                <Input id="lng" type="number" step="any" {...register('lng')} />
              </div>
            </div>
            <div>
              <Label htmlFor="address">Address</Label>
              <Input id="address" {...register('address')} />
            </div>
            <div className="flex gap-2">
              <Button type="submit" disabled={createMutation.isPending}>
                Create
              </Button>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
