import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { LogIn, Shield } from 'lucide-react';

export default function Login() {
  const { login, loginAdmin, isLoading } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isAdminMode, setIsAdminMode] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const err = isAdminMode
      ? await loginAdmin(username, password)
      : await login(username, password);
    if (err) setError(err);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-2">
          <img src="/logo.svg" alt="Logo" className="mx-auto h-16" />
          {isAdminMode && (
            <div className="flex items-center justify-center gap-2 text-primary">
              <Shield className="h-4 w-4" />
              <span className="text-sm font-semibold uppercase tracking-wider">Administrador</span>
            </div>
          )}
          <p className="text-muted-foreground text-sm">Faça login para continuar</p>
        </div>

        <div className="space-y-4">
          <Input
            placeholder="Usuário"
            value={username}
            onChange={e => setUsername(e.target.value)}
            autoFocus
            autoComplete="username"
          />
          <Input
            type="password"
            placeholder="Senha"
            value={password}
            onChange={e => setPassword(e.target.value)}
            autoComplete="current-password"
          />
        </div>

        {error && (
          <p className="text-destructive text-sm text-center">{error}</p>
        )}

        <Button type="submit" className="w-full" disabled={isLoading || !username || !password}>
          <LogIn className="mr-2 h-4 w-4" />
          {isLoading ? 'Entrando...' : 'Entrar'}
        </Button>

        <button
          type="button"
          onClick={() => { setIsAdminMode(!isAdminMode); setError(''); }}
          className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors text-center"
        >
          {isAdminMode ? 'Voltar ao login normal' : 'Acesso administrativo'}
        </button>
      </form>
    </div>
  );
}
