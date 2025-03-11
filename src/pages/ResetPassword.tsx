import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { updatePassword } from '@/lib/auth'

export function ResetPassword() {
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (newPassword !== confirmPassword) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "As senhas não coincidem",
      })
      return
    }

    setLoading(true)

    try {
      const { error } = await updatePassword(newPassword)
      
      if (error) {
        toast({
          variant: "destructive",
          title: "Erro",
          description: error.message,
        })
        return
      }

      toast({
        title: "Senha atualizada",
        description: "Sua senha foi atualizada com sucesso",
      })
      navigate('/')
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: error.message || "Ocorreu um erro inesperado",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8 bg-black">
      <div className="w-full max-w-[380px] space-y-6">
        <div className="text-center">
          <div className="flex justify-center">
            <svg className="w-[120px] h-[16px] sm:w-[140px] sm:h-[20px] md:w-[183px] md:h-[25px]" viewBox="0 0 183 25" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M181.504 14H177V16.8378V19.6757H182.808V15.2739L181.504 14Z" fill="#2943EE"/>
              <path d="M10.1164 14.6409L8.38889 9.91975C8.30382 9.71036 8.21549 9.46171 8.12388 9.17379C8.03227 8.88588 7.94066 8.57506 7.84905 8.24135C7.76399 8.57506 7.67565 8.88915 7.58404 9.18361C7.49243 9.47152 7.40409 9.72345 7.31903 9.93938L5.60136 14.6409H10.1164ZM14.7786 20H12.737C12.508 20 12.3215 19.9444 12.1776 19.8331C12.0336 19.7154 11.9256 19.5714 11.8537 19.4013L10.7936 16.5058H4.9143L3.85425 19.4013C3.8019 19.5518 3.70048 19.6892 3.54998 19.8135C3.39948 19.9378 3.21299 20 2.99051 20H0.92931L6.51418 5.80717H9.20355L14.7786 20Z" fill="white"/>
            </svg>
          </div>
          <p className="text-sm text-zinc-400">
            Redefinir senha
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 sm:p-6 space-y-4 sm:space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-password" className="text-zinc-300">Nova Senha</Label>
              <Input
                id="new-password"
                type="password"
                placeholder="Digite sua nova senha"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 h-11"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password" className="text-zinc-300">Confirmar Senha</Label>
              <Input
                id="confirm-password"
                type="password"
                placeholder="Confirme sua nova senha"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 h-11"
              />
            </div>
          </div>

          <Button 
            type="submit" 
            className="w-full bg-white text-black hover:bg-zinc-200 h-11 text-base font-medium" 
            disabled={loading}
          >
            {loading ? "Atualizando..." : "Atualizar Senha"}
          </Button>
        </form>
      </div>
    </div>
  )
}