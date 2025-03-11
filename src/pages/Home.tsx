import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Shield, Key, Lock, UserPlus } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

export function Home() {
  const { user } = useAuth()

  return (
    <div className="flex flex-col items-center justify-center py-20 text-center text-white">
      <Shield className="h-16 w-16 mb-8" />
      <h1 className="text-4xl font-bold tracking-tighter mb-4">
        Autenticação Segura de Dois Fatores
      </h1>
      <p className="text-xl text-zinc-400 mb-8 max-w-[600px]">
        Melhore a segurança da sua conta com Senhas Únicas Baseadas em Tempo (TOTP)
      </p>
      
      <div className="grid gap-8 md:grid-cols-3 max-w-5xl mx-auto mt-12">
        <div className="flex flex-col items-center p-6 bg-zinc-900 rounded-lg border border-zinc-800">
          <Key className="h-12 w-12 mb-4" />
          <h3 className="text-xl font-semibold mb-2">Configuração Fácil</h3>
          <p className="text-zinc-400 text-center">
            Integração rápida e simples com seus aplicativos de autenticação favoritos
          </p>
        </div>
        
        <div className="flex flex-col items-center p-6 bg-zinc-900 rounded-lg border border-zinc-800">
          <Lock className="h-12 w-12 mb-4" />
          <h3 className="text-xl font-semibold mb-2">Segurança Reforçada</h3>
          <p className="text-zinc-400 text-center">
            Adicione uma camada extra de proteção à sua conta
          </p>
        </div>
        
        <div className="flex flex-col items-center p-6 bg-zinc-900 rounded-lg border border-zinc-800">
          <UserPlus className="h-12 w-12 mb-4" />
          <h3 className="text-xl font-semibold mb-2">Fácil de Usar</h3>
          <p className="text-zinc-400 text-center">
            Interface intuitiva para gerenciar suas configurações de 2FA
          </p>
        </div>
      </div>
      
      <div className="flex gap-4 mt-12">
        {user ? (
          <Link to="/dashboard">
            <Button size="lg" className="bg-white text-black hover:bg-zinc-200">
              Ir para o Painel
            </Button>
          </Link>
        ) : (
          <Link to="/login">
            <Button size="lg" className="bg-white text-black hover:bg-zinc-200">
              Entrar
            </Button>
          </Link>
        )}
      </div>
    </div>
  )
}