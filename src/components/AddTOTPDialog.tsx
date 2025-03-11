import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus, QrCode, KeyRound } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/lib/supabase/client'
import { Modal, ModalHeader, ModalTitle } from '@/components/ui/modal'
import { useAuth } from '@/contexts/AuthContext'
import { validateTOTPSecret, parseOTPAuthURL } from '@/lib/totp'

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
  const { toast } = useToast()
  const { user } = useAuth()

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

  useEffect(() => {
    let scanner: any = null

    if (isOpen && isScanning) {
      import('html5-qrcode').then(({ Html5QrcodeScanner }) => {
        scanner = new Html5QrcodeScanner(
          'qr-reader',
          { 
            fps: 10, 
            qrbox: { width: 250, height: 250 },
            rememberLastUsedCamera: true,
            aspectRatio: 1
          },
          false
        )

        scanner.render(
          (decodedText: string) => {
            try {
              const result = parseOTPAuthURL(decodedText)
              if (result && result.secret) {
                if (validateTOTPSecret(result.secret)) {
                  setSecret(result.secret)
                  setName(result.label || '')
                  setIsScanning(false)
                  scanner?.clear()
                } else {
                  toast({
                    variant: "destructive",
                    title: "Invalid QR Code",
                    description: "The scanned QR code contains an invalid TOTP secret"
                  })
                }
              } else {
                toast({
                  variant: "destructive",
                  title: "Invalid QR Code",
                  description: "The scanned QR code is not a valid TOTP code"
                })
              }
            } catch (error) {
              toast({
                variant: "destructive",
                title: "Invalid QR Code",
                description: "Failed to parse the QR code"
              })
            }
          },
          (error: any) => {
            console.error('QR scan error:', error)
          }
        )
      })
    }

    return () => {
      if (scanner) {
        scanner.clear()
      }
    }
  }, [isOpen, isScanning])

  const handleSubmit = async () => {
    if (!name || !secret || selectedTeams.length === 0) {
      toast({
        variant: "destructive",
        title: "Validation error",
        description: "Please fill in all required fields and select at least one team"
      })
      return
    }

    if (!user) {
      toast({
        variant: "destructive",
        title: "Authentication error",
        description: "You must be logged in to add TOTP codes"
      })
      return
    }

    // Validate the secret
    if (!validateTOTPSecret(secret)) {
      toast({
        variant: "destructive",
        title: "Invalid secret",
        description: "The provided secret is not valid for TOTP generation"
      })
      return
    }

    setIsSubmitting(true)

    try {
      // Create TOTP codes for each selected team
      const totpCodes = selectedTeams.map(teamId => ({
        name,
        secret: secret.replace(/[^A-Z2-7]/gi, '').toUpperCase(), // Clean and normalize the secret
        team_id: teamId,
        created_by: user.id
      }))

      const { error } = await supabase
        .from('totp_codes')
        .insert(totpCodes)

      if (error) throw error

      toast({
        title: "Success",
        description: "TOTP code added successfully. It may take a few moments to appear in the list."
      })
      setIsOpen(false)
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
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

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)}>
        <ModalHeader>
          <ModalTitle>Add New TOTP Code</ModalTitle>
        </ModalHeader>

        <div className="mt-4">
          <div className="flex space-x-2 mb-6">
            <Button
              variant="outline"
              className={`flex-1 ${!isScanning ? 'bg-zinc-700 text-white' : 'bg-transparent text-zinc-400'}`}
              onClick={() => setIsScanning(false)}
            >
              <KeyRound className="h-4 w-4 mr-2" />
              Manual Entry
            </Button>
            <Button
              variant="outline"
              className={`flex-1 ${isScanning ? 'bg-zinc-700 text-white' : 'bg-transparent text-zinc-400'}`}
              onClick={() => setIsScanning(true)}
            >
              <QrCode className="h-4 w-4 mr-2" />
              Scan QR
            </Button>
          </div>

          {isScanning ? (
            <>
              <div 
                id="qr-reader" 
                className="bg-zinc-800 rounded-lg overflow-hidden"
              />
              <p className="text-sm text-zinc-400 mt-2 text-center">
                Point your camera at a TOTP QR code
              </p>
            </>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-zinc-300">Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="bg-zinc-800 border-zinc-700 text-white"
                  placeholder="Enter a name for this code"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="secret" className="text-zinc-300">Secret Key</Label>
                <Input
                  id="secret"
                  value={secret}
                  onChange={(e) => setSecret(e.target.value)}
                  className="bg-zinc-800 border-zinc-700 text-white"
                  placeholder="Enter the secret key"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-zinc-300">Select Teams</Label>
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
                  Select one or more teams that will have access to this TOTP code
                </p>
              </div>

              <Button
                className="w-full mt-6 bg-white text-black hover:bg-zinc-200"
                onClick={handleSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Adding TOTP Code..." : "Add TOTP Code"}
              </Button>
            </div>
          )}
        </div>
      </Modal>
    </>
  )
}