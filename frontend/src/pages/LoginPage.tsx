import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { isApiUnreachable } from '@/lib/apiError';
import { useAuthStore } from '@/stores/authStore';
import { az } from '@/i18n/az';
import type { LoginResponse } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const schema = z.object({
  email: z.string().email('Düzgün e-poçt daxil edin'),
  password: z.string().min(6, 'Şifrə ən azı 6 simvol olmalıdır'),
});

type FormData = z.infer<typeof schema>;

export function LoginPage() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { email: 'user@municipal.local', password: '123456' },
  });

  const login = useMutation({
    mutationFn: async (data: FormData) => {
      const res = await api.post<LoginResponse>('/auth/login', data);
      return res.data;
    },
    onSuccess: (data) => {
      setAuth(data.accessToken, data.user, data.access);
      navigate('/');
    },
  });

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md border-border/60 shadow-sm">
        <CardHeader>
          <CardTitle className="text-2xl">{az.login.title}</CardTitle>
          <CardDescription>{az.login.subtitle}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit((d) => login.mutate(d))} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">{az.login.email}</Label>
              <Input id="email" type="email" {...register('email')} />
              {errors.email && (
                <p className="text-xs text-destructive">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">{az.login.password}</Label>
              <Input id="password" type="password" {...register('password')} />
              {errors.password && (
                <p className="text-xs text-destructive">{errors.password.message}</p>
              )}
            </div>

            {login.isError && (
              <p className="text-sm text-destructive">
                {isApiUnreachable(login.error)
                  ? az.errors.loginNetwork
                  : az.login.invalidCredentials}
              </p>
            )}

            <Button type="submit" className="w-full" disabled={login.isPending}>
              {login.isPending ? az.login.submitting : az.login.submit}
            </Button>

            <p className="text-center text-xs text-muted-foreground">{az.login.demoHint}</p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
