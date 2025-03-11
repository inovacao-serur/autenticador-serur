import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { UserPlus } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/lib/supabase/client'
import { Modal, ModalHeader, ModalTitle } from '@/components/ui/modal'

interface Team {
  id: string
  name: string
}

export function AddUserDialog() {
  const [isOpen, setIsOpen] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isAdmin, setIsAdmin] = useState(false)
  const [teams, setTeams] = useState<Team[]>([])
  const [selectedTeams, setSelectedTeams] = useState<string[]>([])
  const { toast } = useToast()

  useEffect(() => {
    const fetchTeams = async () => {
      const { data, error } = await supabase
        .from('teams')
        .select('id, name')
      
      if (error) {
        toast({
          variant: "destructive",
          title: "Error fetching teams",
          description: error.message
        })
        return
      }

      setTeams(data || [])
    }

    if (isOpen) {
      fetchTeams()
    }
  }, [isOpen])

  useEffect(() => {
    if (isAdmin) {
      setSelectedTeams(teams.map(team => team.id))
    }
  }, [isAdmin, teams])

  const handleSubmit = async () => {
    if (!name || !email || !password || selectedTeams.length === 0) {
      toast({
        variant: "destructive",
        title: "Validation error",
        description: "Please fill in all required fields and select at least one team"
      })
      return
    }

    try {
      const { data: { user }, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            is_admin: isAdmin
          }
        }
      })

      if (signUpError) throw signUpError
      if (!user) throw new Error("User creation failed")

      const teamPromises = selectedTeams.map(teamId => 
        supabase
          .from('user_teams')
          .insert({
            user_id: user.id,
            team_id: teamId
          })
      )

      await Promise.all(teamPromises)

      toast({
        title: "Success",
        description: "User created successfully"
      })
      setIsOpen(false)
      resetForm()
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message
      })
    }
  }

  const resetForm = () => {
    setName('')
    setEmail('')
    setPassword('')
    setIsAdmin(false)
    setSelectedTeams([])
  }

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="rounded-full bg-zinc-800 hover:bg-zinc-700"
        onClick={() => setIsOpen(true)}
      >
        <UserPlus className="h-5 w-5" />
      </Button>

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)}>
        <ModalHeader>
          <ModalTitle>Adicionar Novo Usuário</ModalTitle>
        </ModalHeader>

        <div className="mt-4 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-zinc-300">Nome</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-zinc-800 border-zinc-700 text-white"
              placeholder="Digite o nome do usuário"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="text-zinc-300">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-zinc-800 border-zinc-700 text-white"
              placeholder="Digite o email do usuário"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="password" className="text-zinc-300">Senha</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-zinc-800 border-zinc-700 text-white"
              placeholder="Digite a senha do usuário"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-zinc-300">Nível do Usuário</Label>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                className={`
                  border-zinc-700 
                  ${!isAdmin 
                    ? 'bg-zinc-700 text-white' 
                    : 'bg-transparent text-zinc-400 hover:text-white hover:bg-zinc-800'
                  }
                `}
                onClick={() => setIsAdmin(false)}
              >
                Usuário
              </Button>
              <Button
                variant="outline"
                className={`
                  border-zinc-700 
                  ${isAdmin 
                    ? 'bg-zinc-700 text-white' 
                    : 'bg-transparent text-zinc-400 hover:text-white hover:bg-zinc-800'
                  }
                `}
                onClick={() => setIsAdmin(true)}
              >
                Admin
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-zinc-300">Selecionar Times</Label>
            <div className="grid grid-cols-2 gap-2">
              {teams.map((team) => (
                <Button
                  key={team.id}
                  variant="outline"
                  disabled={isAdmin}
                  className={`
                    border-zinc-700 
                    ${selectedTeams.includes(team.id) 
                      ? 'bg-zinc-700 text-white' 
                      : 'bg-transparent text-zinc-400 hover:text-white hover:bg-zinc-800'
                    }
                    ${isAdmin && 'opacity-50 cursor-not-allowed'}
                  `}
                  onClick={() => {
                    if (!isAdmin) {
                      setSelectedTeams(prev => 
                        prev.includes(team.id)
                          ? prev.filter(id => id !== team.id)
                          : [...prev, team.id]
                      )
                    }
                  }}
                >
                  {team.name}
                </Button>
              ))}
            </div>
            {isAdmin && (
              <p className="text-sm text-zinc-400 mt-2">
                Administradores têm acesso automático a todos os times
              </p>
            )}
          </div>

          <Button
            className="w-full mt-6 bg-white text-black hover:bg-zinc-200"
            onClick={handleSubmit}
          >
            Adicionar Usuário
          </Button>
        </div>
      </Modal>
    </>
  )
}