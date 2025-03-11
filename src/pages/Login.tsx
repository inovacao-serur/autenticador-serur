import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { signIn, resetPassword } from '@/lib/auth'
import { useAuth } from '@/contexts/AuthContext'
import { Modal, ModalHeader, ModalTitle } from '@/components/ui/modal'

export function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [showResetModal, setShowResetModal] = useState(false)
  const [resetEmail, setResetEmail] = useState('')
  const [resetLoading, setResetLoading] = useState(false)
  const navigate = useNavigate()
  const { toast } = useToast()
  const { user } = useAuth()

  useEffect(() => {
    if (user) {
      navigate('/dashboard')
    }
  }, [user, navigate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { error } = await signIn(email, password)
      
      if (error) {
        toast({
          variant: "destructive",
          title: "Falha na autenticação",
          description: error.message,
        })
        return
      }
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

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setResetLoading(true)

    try {
      const { error } = await resetPassword(resetEmail)
      
      if (error) {
        toast({
          variant: "destructive",
          title: "Erro",
          description: error.message,
        })
        return
      }

      toast({
        title: "Email enviado",
        description: "Verifique sua caixa de entrada para redefinir sua senha",
      })
      setShowResetModal(false)
      setResetEmail('')
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: error.message || "Ocorreu um erro inesperado",
      })
    } finally {
      setResetLoading(false)
    }
  }

  if (user) {
    return null
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8 bg-black">
      <div className="w-full max-w-[380px] space-y-6">
        <div className="text-center">
          <div className="flex justify-center">
            <svg className="w-[120px] h-[16px] sm:w-[140px] sm:h-[20px] md:w-[183px] md:h-[25px]" viewBox="0 0 183 25" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M181.504 14H177V16.8378V19.6757H182.808V15.2739L181.504 14Z" fill="#2943EE"/>
              <path d="M10.1164 14.6409L8.38889 9.91975C8.30382 9.71036 8.21549 9.46171 8.12388 9.17379C8.03227 8.88588 7.94066 8.57506 7.84905 8.24135C7.76399 8.57506 7.67565 8.88915 7.58404 9.18361C7.49243 9.47152 7.40409 9.72345 7.31903 9.93938L5.60136 14.6409H10.1164ZM14.7786 20H12.737C12.508 20 12.3215 19.9444 12.1776 19.8331C12.0336 19.7154 11.9256 19.5714 11.8537 19.4013L10.7936 16.5058H4.9143L3.85425 19.4013C3.8019 19.5518 3.70048 19.6892 3.54998 19.8135C3.39948 19.9378 3.21299 20 2.99051 20H0.92931L6.51418 5.80717H9.20355L14.7786 20ZM23.1855 17.8701C23.6959 17.8701 24.1507 17.785 24.5498 17.6149C24.9555 17.4448 25.2958 17.2059 25.5706 16.8984C25.8454 16.5908 26.0548 16.2179 26.1988 15.7794C26.3493 15.341 26.4245 14.8503 26.4245 14.3072V5.80717H29.0648V14.3072C29.0648 15.1513 28.9274 15.9332 28.6526 16.653C28.3843 17.3662 27.995 17.9846 27.4846 18.5081C26.9807 19.025 26.3657 19.4307 25.6393 19.7252C24.913 20.0131 24.0951 20.157 23.1855 20.157C22.2694 20.157 21.4482 20.0131 20.7219 19.7252C19.9956 19.4307 19.3772 19.025 18.8668 18.5081C18.363 17.9846 17.9736 17.3662 17.6988 16.653C17.4305 15.9332 17.2964 15.1513 17.2964 14.3072V5.80717H19.9367V14.2973C19.9367 14.8405 20.0086 15.3312 20.1526 15.7696C20.3031 16.208 20.5158 16.5843 20.7906 16.8984C21.072 17.2059 21.4122 17.4448 21.8114 17.6149C22.2171 17.785 22.6751 17.8701 23.1855 17.8701ZM43.5264 7.97633H39.2469V20H36.6066V7.97633H32.3272V5.80717H43.5264V7.97633ZM49.6041 7.90763V11.8435H54.5707V13.8753H49.6041V17.8897H55.9055V20H46.954V5.80717H55.9055V7.90763H49.6041ZM71.7806 5.80717V20H70.4261C70.2167 20 70.04 19.9673 69.8961 19.9018C69.7587 19.8299 69.6245 19.7121 69.4937 19.5485L62.0831 10.0866C62.1224 10.5185 62.142 10.9176 62.142 11.2841V20H59.8158V5.80717H61.1998C61.311 5.80717 61.4059 5.81371 61.4844 5.8268C61.5695 5.83334 61.6415 5.85297 61.7004 5.88569C61.7658 5.91186 61.8279 5.9544 61.8868 6.01329C61.9457 6.06563 62.0112 6.13761 62.0831 6.22922L69.5231 15.7304C69.5035 15.5013 69.4871 15.2756 69.474 15.0531C69.4609 14.8306 69.4544 14.6245 69.4544 14.4348V5.80717H71.7806ZM86.4251 7.97633H82.1456V20H79.5053V7.97633H75.2259V5.80717H86.4251V7.97633ZM92.5029 20H89.8528V5.80717H92.5029V20ZM106.998 16.653C107.141 16.653 107.269 16.7086 107.38 16.8199L108.421 17.9486C107.845 18.6619 107.135 19.2082 106.291 19.5878C105.453 19.9673 104.446 20.157 103.268 20.157C102.214 20.157 101.265 19.9771 100.421 19.6172C99.5837 19.2573 98.8672 18.7567 98.2718 18.1155C97.6763 17.4742 97.2183 16.7086 96.8976 15.8187C96.5835 14.9288 96.4265 13.9571 96.4265 12.9036C96.4265 11.837 96.5966 10.862 96.9369 9.97864C97.2772 9.08873 97.7548 8.32314 98.3699 7.68188C98.9916 7.04061 99.731 6.54331 100.588 6.18996C101.445 5.83007 102.394 5.65012 103.435 5.65012C104.468 5.65012 105.385 5.82025 106.183 6.16051C106.988 6.50078 107.671 6.94573 108.234 7.49539L107.351 8.72229C107.299 8.80081 107.23 8.86952 107.145 8.92841C107.066 8.9873 106.955 9.01675 106.811 9.01675C106.713 9.01675 106.611 8.99057 106.507 8.93823C106.402 8.87934 106.288 8.81063 106.163 8.73211C106.039 8.64704 105.895 8.55543 105.731 8.45728C105.568 8.35913 105.378 8.27079 105.162 8.19227C104.946 8.1072 104.694 8.0385 104.406 7.98615C104.125 7.92726 103.798 7.89781 103.425 7.89781C102.79 7.89781 102.208 8.01232 101.678 8.24135C101.154 8.46382 100.703 8.791 100.323 9.22287C99.9436 9.6482 99.6492 10.1717 99.4398 10.7933C99.2304 11.4084 99.1257 12.1118 99.1257 12.9036C99.1257 13.7019 99.2369 14.4119 99.4594 15.0335C99.6884 15.6551 99.996 16.1786 100.382 16.6039C100.768 17.0293 101.223 17.3564 101.746 17.5855C102.27 17.8079 102.833 17.9192 103.435 17.9192C103.794 17.9192 104.118 17.8995 104.406 17.8603C104.701 17.821 104.969 17.7589 105.211 17.6738C105.46 17.5887 105.692 17.4808 105.908 17.3499C106.131 17.2125 106.35 17.0456 106.566 16.8493C106.631 16.7904 106.7 16.7446 106.772 16.7119C106.844 16.6726 106.919 16.653 106.998 16.653ZM119.299 14.6409L117.571 9.91975C117.486 9.71036 117.398 9.46171 117.306 9.17379C117.215 8.88588 117.123 8.57506 117.031 8.24135C116.946 8.57506 116.858 8.88915 116.766 9.18361C116.675 9.47152 116.586 9.72345 116.501 9.93938L114.784 14.6409H119.299ZM123.961 20H121.919C121.69 20 121.504 19.9444 121.36 19.8331C121.216 19.7154 121.108 19.5714 121.036 19.4013L119.976 16.5058H114.097L113.036 19.4013C112.984 19.5518 112.883 19.6892 112.732 19.8135C112.582 19.9378 112.395 20 112.173 20H110.112L115.696 5.80717H118.386L123.961 20ZM139.603 12.9036C139.603 13.944 139.43 14.8993 139.083 15.7696C138.736 16.6399 138.249 17.3891 137.62 18.0173C136.992 18.6455 136.236 19.133 135.353 19.4798C134.47 19.8266 133.488 20 132.409 20H127V5.80717H132.409C133.488 5.80717 134.47 5.98384 135.353 6.33719C136.236 6.68399 136.992 7.17148 137.62 7.79966C138.249 8.42129 138.736 9.16725 139.083 10.0375C139.43 10.9078 139.603 11.8632 139.603 12.9036ZM136.894 12.9036C136.894 12.1249 136.789 11.428 136.58 10.8129C136.377 10.1913 136.079 9.66783 135.687 9.2425C135.301 8.81063 134.83 8.48018 134.273 8.25116C133.724 8.02214 133.102 7.90763 132.409 7.90763H129.65V17.8995H132.409C133.102 17.8995 133.724 17.785 134.273 17.556C134.83 17.327 135.301 16.9998 135.687 16.5745C136.079 16.1426 136.377 15.6191 136.58 15.004C136.789 14.3824 136.894 13.6823 136.894 12.9036ZM157.04 12.9036C157.04 13.944 156.866 14.9092 156.52 15.7991C156.179 16.6824 155.695 17.448 155.067 18.0958C154.439 18.7436 153.683 19.2508 152.8 19.6172C151.916 19.9771 150.935 20.157 149.855 20.157C148.782 20.157 147.804 19.9771 146.92 19.6172C146.037 19.2508 145.278 18.7436 144.643 18.0958C144.015 17.448 143.527 16.6824 143.181 15.7991C142.834 14.9092 142.66 13.944 142.66 12.9036C142.66 11.8632 142.834 10.9013 143.181 10.0179C143.527 9.12799 144.015 8.35913 144.643 7.71132C145.278 7.06352 146.037 6.55967 146.92 6.19978C147.804 5.83334 148.782 5.65012 149.855 5.65012C150.575 5.65012 151.252 5.73519 151.887 5.90532C152.521 6.06891 153.104 6.30447 153.634 6.61202C154.164 6.91302 154.638 7.28272 155.057 7.72114C155.482 8.15301 155.842 8.63723 156.137 9.17379C156.431 9.71036 156.654 10.2927 156.804 10.9209C156.961 11.5491 157.04 12.21 157.04 12.9036ZM154.341 12.9036C154.341 12.1249 154.236 11.428 154.026 10.8129C153.817 10.1913 153.519 9.66456 153.133 9.23268C152.747 8.80081 152.276 8.47037 151.72 8.24135C151.17 8.01232 150.549 7.89781 149.855 7.89781C149.161 7.89781 148.536 8.01232 147.98 8.24135C147.431 8.47037 146.959 8.80081 146.567 9.23268C146.181 9.66456 145.883 10.1913 145.674 10.8129C145.464 11.428 145.36 12.1249 145.36 12.9036C145.36 13.6823 145.464 14.3824 145.674 15.004C145.883 15.6191 146.181 16.1426 146.567 16.5745C146.959 16.9998 147.431 17.327 147.98 17.556C148.536 17.785 149.161 17.8995 149.855 17.8995C150.549 17.8995 151.17 17.785 151.72 17.556C152.276 17.327 152.747 16.9998 153.133 16.5745C153.519 16.1426 153.817 15.6191 154.026 15.004C154.236 14.3824 154.341 13.6823 154.341 12.9036ZM165.218 12.5601C165.715 12.5601 166.147 12.4979 166.514 12.3736C166.887 12.2492 167.191 12.0791 167.427 11.8632C167.669 11.6407 167.849 11.3789 167.966 11.0779C168.084 10.7769 168.143 10.4465 168.143 10.0866C168.143 9.36683 167.904 8.8139 167.427 8.42784C166.955 8.04177 166.232 7.84874 165.257 7.84874H163.569V12.5601H165.218ZM172.01 20H169.625C169.174 20 168.846 19.8233 168.644 19.47L165.66 14.9255C165.549 14.7554 165.424 14.6343 165.287 14.5624C165.156 14.4904 164.96 14.4544 164.698 14.4544H163.569V20H160.929V5.80717H165.257C166.219 5.80717 167.044 5.90859 167.731 6.11144C168.424 6.30774 168.99 6.58584 169.429 6.94573C169.874 7.30563 170.201 7.7375 170.41 8.24135C170.62 8.73865 170.724 9.2883 170.724 9.8903C170.724 10.368 170.652 10.8195 170.509 11.2448C170.371 11.6701 170.168 12.0562 169.9 12.403C169.638 12.7498 169.311 13.0541 168.918 13.3158C168.532 13.5776 168.091 13.7837 167.593 13.9342C167.764 14.0323 167.921 14.1501 168.065 14.2875C168.209 14.4184 168.339 14.5754 168.457 14.7587L172.01 20Z" fill="white"/>
            </svg>
          </div>
          <p className="text-sm text-zinc-400">
            Sistema de autenticação de dois fatores
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 sm:p-6 space-y-4 sm:space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-zinc-300">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Digite seu email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 h-11"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-zinc-300">Senha</Label>
              <Input
                id="password"
                type="password"
                placeholder="Digite sua senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 h-11"
              />
            </div>
          </div>

          <div className="flex flex-col space-y-4">
            <Button 
              type="submit" 
              className="w-full bg-white text-black hover:bg-zinc-200 h-11 text-base font-medium" 
              disabled={loading}
            >
              {loading ? "Entrando..." : "Entrar"}
            </Button>

            <button
              type="button"
              onClick={() => setShowResetModal(true)}
              className="text-sm text-zinc-400 hover:text-white transition-colors"
            >
              Esqueceu sua senha?
            </button>
          </div>
        </form>
      </div>

      <Modal isOpen={showResetModal} onClose={() => setShowResetModal(false)}>
        <ModalHeader>
          <ModalTitle>Recuperar Senha</ModalTitle>
        </ModalHeader>

        <form onSubmit={handleResetPassword} className="mt-4 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="reset-email" className="text-zinc-300">Email</Label>
            <Input
              id="reset-email"
              type="email"
              placeholder="Digite seu email"
              value={resetEmail}
              onChange={(e) => setResetEmail(e.target.value)}
              required
              className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
            />
          </div>

          <p className="text-sm text-zinc-400">
            Enviaremos um link para você redefinir sua senha.
          </p>

          <div className="flex space-x-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1 border-zinc-700 text-zinc-400 hover:text-white"
              onClick={() => setShowResetModal(false)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-white text-black hover:bg-zinc-200"
              disabled={resetLoading}
            >
              {resetLoading ? "Enviando..." : "Enviar Link"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}