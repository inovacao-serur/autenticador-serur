import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Modal, ModalHeader, ModalTitle } from '@/components/ui/modal'
import { useState, useEffect } from 'react'
import { useToast } from '@/hooks/use-toast'
import { supabase, supabaseSignUp } from '@/lib/supabase/client'
import { Link } from 'react-router-dom'


interface Team {
  id: string
  name: string
}

interface ModalContentProps {
  isOpen?: boolean;
  onClose?: () => void;
  isRegisterPage?: boolean;
}

export function ModalContent({
  isOpen = true,
  onClose = () => { },
  isRegisterPage = false
}: ModalContentProps) {

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isAdmin, setIsAdmin] = useState(false)
  const [teams, setTeams] = useState<Team[]>([])
  const [selectedTeams, setSelectedTeams] = useState<string[]>([])
  const [token, setToken] = useState('')
  const { toast } = useToast()

  const supabaseCurrentClient = isRegisterPage ? supabase : supabaseSignUp

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

    if (isOpen || isRegisterPage) {
      fetchTeams()
    }
  }, [isOpen, isRegisterPage])

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

    if (isRegisterPage && token !== import.meta.env.VITE_REGISTRATION_TOKEN) {
      toast({
        variant: "destructive",
        title: "Token inválido",
        description: "O token fornecido é inválido"
      })
      return
    }

    try {
      const { data: { user }, error: signUpError } = await supabaseCurrentClient.auth.signUp({
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

      await supabase
        .from('user_teams')
        .insert(selectedTeams.map(teamId => ({
          user_id: user.id,
          team_id: teamId
        })))

      toast({
        title: "Success",
        description: "User created successfully"
      })
      onClose()
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
    <Modal isOpen={isOpen} onClose={onClose} className='px-4 py-2'>
      {
        isRegisterPage ? (
          <ModalHeader>
            <ModalTitle className='pt-3 flex justify-center text-center text-xl'>Faça Seu Cadastro</ModalTitle> 
          </ModalHeader>

        ) : (
          <ModalHeader>
            <ModalTitle className='pt-3'>Adicionar Novo Usuário</ModalTitle>
          </ModalHeader>
        )
      }


      <div className="mt-1 space-y-4 max-[480px]:space-y-3">
        <div className="space-y-2 max-[480px]:space-y-0">
          <Label htmlFor="name" className="text-zinc-300">Nome</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="bg-zinc-800 border-zinc-700 text-white"
            placeholder={isRegisterPage ? 'Digite seu nome' : 'Digite o nome do usuário'}
          />
        </div>

        <div className="space-y-2 max-[480px]:space-y-0">
          <Label htmlFor="email" className="text-zinc-300">Email</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="bg-zinc-800 border-zinc-700 text-white"
            placeholder={isRegisterPage ? 'Digite seu email' : 'Digite o email do usuário'}
          />
        </div>

        <div className="space-y-2 max-[480px]:space-y-0">
          <Label htmlFor="password" className="text-zinc-300">Senha</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="bg-zinc-800 border-zinc-700 text-white"
            placeholder={isRegisterPage ? 'Digite sua senha' : 'Digite a senha do usuário'}
          />
        </div>

        {isRegisterPage && (
          <div className="space-y-2 max-[480px]:space-y-0">
            <Label htmlFor="token" className="text-zinc-300">Token</Label>
            <Input
              id="token"
              type="text"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              className="bg-zinc-800 border-zinc-700 text-white"
              placeholder="Digite o token para registro"
            />
          </div>
        )}

        {!isRegisterPage && (
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
        )}

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
                  max-[480px]:whitespace-normal
                  max-[480px]:text-xs
                `}
                onClick={() => {
                  if (!isAdmin) {
                    setSelectedTeams((prev: string[]) =>
                      prev.includes(team.id)
                        ? prev.filter((id: string) => id !== team.id)
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
          className="w-full mt-6 bg-white text-black hover:bg-zinc-200 mb-2"
          onClick={handleSubmit}
        >
          {isRegisterPage ? 'Cadastrar' : 'Adicionar Usuário'}
        </Button>
      </div>
      {
        isRegisterPage ? (
         <div className='flex justify-center  text-zinc-400 '>
           <p>Já tem conta ? <Link to = "/" className='hover:text-white hover:bg-zinc-800 cursor-pointer'>Login</Link></p>
         </div>

        ):(
         <></>
        )
       

      }

    </Modal>
  )
}
