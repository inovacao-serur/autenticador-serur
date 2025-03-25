import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus, QrCode, KeyRound } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/lib/supabase/client'
import { Modal, ModalHeader, ModalTitle } from '@/components/ui/modal'
import { useAuth } from '@/contexts/AuthContext'
import { validateTOTPSecret, parseOTPAuthURL } from '@/lib/totp'
import { BrowserQRCodeReader } from '@zxing/browser'

interface Team {
  id: string
  name: string
}

export function AddTOTPDialog() {
  const [isOpen, setIsOpen] = useState(false)
  const [teams, setTeams] = useState<Team[]>([])
  const [name, setName] = useState('')
  const [secret, setSecret] = useState('')
  const [selectedTeams, setSelectedTeams] = useState<string[]>([])
  const [isScanning, setIsScanning] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const codeReader = useRef<BrowserQRCodeReader | null>(null)
  const { toast } = useToast()
  const { user } = useAuth()

  // Stop camera and cleanup
  const stopCamera = async () => {
    try {
      // First stop the video stream
      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream
        stream.getTracks().forEach(track => {
          track.stop()
        })
        videoRef.current.srcObject = null
      }

      // Then cleanup the code reader
      if (codeReader.current) {
        try {
          await codeReader.current.reset()
        } catch (error) {
          console.warn('Error resetting code reader:', error)
        }
        codeReader.current = null
      }
    } catch (error) {
      console.warn('Error during camera cleanup:', error)
    }
  }

  // Handle dialog close
  const handleClose = async () => {
    await stopCamera()
    setIsOpen(false)
  }

  // Handle scanning mode toggle
  const toggleScanning = async (scan: boolean) => {
    if (!scan) {
      await stopCamera()
    }
    setIsScanning(scan)
  }

  useEffect(() => {
    const fetchTeams = async () => {
      const { data, error } = await supabase
        .from('teams')
        .select('id, name')
        .order('name')
      
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
    } else {
      // Reset form when dialog closes
      setName('')
      setSecret('')
      setSelectedTeams([])
      setIsScanning(false)
      setIsSubmitting(false)
    }
  }, [isOpen])

  // Handle camera initialization and cleanup
  useEffect(() => {
    let mounted = true

    const initializeScanner = async () => {
      if (!isScanning || !videoRef.current || !mounted) {
        await stopCamera()
        return
      }

      try {
        // Clean up any existing scanner
        await stopCamera()

        // Initialize new scanner
        codeReader.current = new BrowserQRCodeReader()
        const videoInputDevices = await BrowserQRCodeReader.listVideoInputDevices()
        
        // Prefer rear camera on mobile devices
        const rearCamera = videoInputDevices.find(device => 
          device.label.toLowerCase().includes('back') || 
          device.label.toLowerCase().includes('rear')
        )
        
        const deviceId = rearCamera ? rearCamera.deviceId : videoInputDevices[0]?.deviceId

        if (!deviceId) {
          throw new Error('No camera found')
        }

        await codeReader.current.decodeFromVideoDevice(
          deviceId,
          videoRef.current,
          (result, error) => {
            if (!mounted) return

            if (result) {
              try {
                const parsed = parseOTPAuthURL(result.getText())
                if (parsed && parsed.secret) {
                  if (validateTOTPSecret(parsed.secret)) {
                    setSecret(parsed.secret)
                    setName(parsed.label || '')
                    toggleScanning(false)
                  }
                }
              } catch (err) {
                // Ignore parsing errors as they're expected when scanning invalid codes
                console.debug('Invalid QR code format:', err)
              }
            }
            // Only log unexpected errors
            if (error && error.name !== 'NotFoundException') {
              console.debug('QR scan error:', error)
            }
          }
        )
      } catch (error) {
        if (!mounted) return
        
        console.error('Error initializing scanner:', error)
        toast({
          variant: "destructive",
          title: "Erro na câmera",
          description: "Não foi possível inicializar a câmera. Verifique as permissões."
        })
        setIsScanning(false)
      }
    }

    initializeScanner()

    return () => {
      mounted = false
      stopCamera()
    }
  }, [isScanning])

  const handleSubmit = async () => {
    if (!name || !secret || selectedTeams.length === 0) {
      toast({
        variant: "destructive",
        title: "Erro de validação",
        description: "Por favor, preencha todos os campos obrigatórios e selecione pelo menos um time"
      })
      return
    }

    if (!user) {
      toast({
        variant: "destructive",
        title: "Erro de autenticação",
        description: "Você precisa estar logado para adicionar códigos TOTP"
      })
      return
    }

    if (!validateTOTPSecret(secret)) {
      toast({
        variant: "destructive",
        title: "Segredo inválido",
        description: "O segredo fornecido não é válido para geração TOTP"
      })
      return
    }

    setIsSubmitting(true)

    try {
      const totpCodes = selectedTeams.map(teamId => ({
        name,
        secret: secret.replace(/[^A-Z2-7]/gi, '').toUpperCase(),
        team_id: teamId,
        created_by: user.id
      }))

      const { error } = await supabase
        .from('totp_codes')
        .insert(totpCodes)

      if (error) throw error

      toast({
        title: "Sucesso",
        description: "Código TOTP adicionado com sucesso. Pode levar alguns momentos para aparecer na lista."
      })
      handleClose()
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: error.message
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="rounded-full bg-zinc-800 hover:bg-zinc-700"
        onClick={() => setIsOpen(true)}
      >
        <Plus className="h-5 w-5" />
      </Button>

      <Modal isOpen={isOpen} onClose={handleClose}>
        <ModalHeader>
          <ModalTitle>Adicionar Novo Código TOTP</ModalTitle>
        </ModalHeader>

        <div className="mt-4">
          <div className="flex space-x-2 mb-6">
            <Button
              variant="outline"
              className={`flex-1 ${!isScanning ? 'bg-zinc-700 text-white' : 'bg-transparent text-zinc-400'}`}
              onClick={() => toggleScanning(false)}
            >
              <KeyRound className="h-4 w-4 mr-2" />
              Entrada Manual
            </Button>
            <Button
              variant="outline"
              className={`flex-1 ${isScanning ? 'bg-zinc-700 text-white' : 'bg-transparent text-zinc-400'}`}
              onClick={() => toggleScanning(true)}
            >
              <QrCode className="h-4 w-4 mr-2" />
              Escanear QR
            </Button>
          </div>

          {isScanning ? (
            <>
              <div className="bg-zinc-800 rounded-lg overflow-hidden aspect-video">
                <video 
                  ref={videoRef}
                  className="w-full h-full object-cover"
                />
              </div>
              <p className="text-sm text-zinc-400 mt-2 text-center">
                Aponte sua câmera para um código QR TOTP
              </p>
            </>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-zinc-300">Nome</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="bg-zinc-800 border-zinc-700 text-white"
                  placeholder="Digite um nome para este código"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="secret" className="text-zinc-300">Chave Secreta</Label>
                <Input
                  id="secret"
                  value={secret}
                  onChange={(e) => setSecret(e.target.value)}
                  className="bg-zinc-800 border-zinc-700 text-white"
                  placeholder="Digite a chave secreta"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-zinc-300">Selecionar Times</Label>
                <div className="grid grid-cols-2 gap-2">
                  {teams.map((team) => (
                    <Button
                      key={team.id}
                      variant="outline"
                      className={`
                        border-zinc-700 
                        ${selectedTeams.includes(team.id) 
                          ? 'bg-zinc-700 text-white' 
                          : 'bg-transparent text-zinc-400 hover:text-white hover:bg-zinc-800'
                        }
                        max-[390px]:whitespace-normal
                        max-[390px]:text-xs
                      `}
                      onClick={() => {
                        setSelectedTeams(prev => 
                          prev.includes(team.id)
                            ? prev.filter(id => id !== team.id)
                            : [...prev, team.id]
                        )
                      }}
                    >
                      {team.name}
                    </Button>
                  ))}
                </div>
                <p className="text-sm text-zinc-400 mt-2">
                  Selecione um ou mais times que terão acesso a este código TOTP
                </p>
              </div>

              <Button
                className="w-full mt-6 bg-white text-black hover:bg-zinc-200"
                onClick={handleSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Adicionando Código TOTP..." : "Adicionar Código TOTP"}
              </Button>
            </div>
          )}
        </div>
      </Modal>
    </>
  )
}
