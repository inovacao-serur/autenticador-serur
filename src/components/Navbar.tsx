import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Shield } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/hooks/use-toast'

export function Navbar() {
  const { user, signOut } = useAuth()
  const { toast } = useToast()

  const handleSignOut = async () => {
    try {
      await signOut()
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao sair",
        description: "Ocorreu um erro ao tentar fazer logout. Por favor, tente novamente."
      })
    }
  }

  return (
    <nav className="border-b border-zinc-800 bg-black/95 backdrop-blur supports-[backdrop-filter]:bg-black/60">
      <div className="container flex h-16 items-center px-4">
        <Link to={user ? "/dashboard" : "/"} className="flex items-center space-x-2 text-white">
          <Shield className="h-6 w-6" />
          <span className="font-bold">Serur Authenticator</span>
        </Link>
        
        <div className="ml-auto flex items-center space-x-4">
          {user ? (
            <>
              <Link to="/dashboard">
                <Button variant="ghost" className="text-zinc-400 hover:text-white hover:bg-zinc-800">
                  Painel
                </Button>
              </Link>
              <Button 
                variant="outline" 
                onClick={handleSignOut}
                className="border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800 hover:border-zinc-700"
              >
                Sair
              </Button>
            </>
          ) : null}
        </div>
      </div>
    </nav>
  )
}