import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Pencil } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/lib/supabase/client'
import { Modal, ModalHeader, ModalTitle } from '@/components/ui/modal'
import type { TOTPCode } from '@/lib/supabase/client'

interface Team {
  id: string
  name: string
}

interface EditTOTPDialogProps {
  code: TOTPCode
  onUpdate: () => void
}

export function EditTOTPDialog({ code, onUpdate }: EditTOTPDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [teams, setTeams] = useState<Team[]>([])
  const [selectedTeams, setSelectedTeams] = useState<string[]>([])
  const [deleteConfirmation, setDeleteConfirmation] = useState('')
  const [showDelete, setShowDelete] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (isOpen) {
      const fetchData = async () => {
        try {
          // Fetch all teams
          const { data: allTeams, error: teamsError } = await supabase
            .from('teams')
            .select('id, name')
            .order('name')
          
          if (teamsError) throw teamsError
          setTeams(allTeams || [])

          // Fetch current TOTP code teams
          const { data: totpTeams, error: totpTeamsError } = await supabase
            .from('totp_codes')
            .select('team_id')
            .eq('name', code.name)
            .eq('secret', code.secret)

          if (totpTeamsError) throw totpTeamsError

          // Set initial selected teams
          const teamIds = totpTeams?.map(t => t.team_id) || []
          setSelectedTeams(teamIds)
        } catch (error: any) {
          toast({
            variant: "destructive",
            title: "Error fetching teams",
            description: error.message
          })
        }
      }

      fetchData()
    }
  }, [isOpen, code.name, code.secret])

  const handleSubmit = async () => {
    if (selectedTeams.length === 0) {
      toast({
        variant: "destructive",
        title: "Validation error",
        description: "Please select at least one team"
      })
      return
    }

    try {
      // Get current team assignments
      const { data: currentTeams, error: currentTeamsError } = await supabase
        .from('totp_codes')
        .select('team_id')
        .eq('name', code.name)
        .eq('secret', code.secret)

      if (currentTeamsError) throw currentTeamsError

      const currentTeamIds = new Set(currentTeams?.map(t => t.team_id) || [])
      const newTeamIds = new Set(selectedTeams)

      // Teams to add (in newTeamIds but not in currentTeamIds)
      const teamsToAdd = selectedTeams.filter(id => !currentTeamIds.has(id))

      // Teams to remove (in currentTeamIds but not in newTeamIds)
      const teamsToRemove = Array.from(currentTeamIds).filter(id => !newTeamIds.has(id))

      // Remove teams that should no longer have access
      if (teamsToRemove.length > 0) {
        const { error: removeError } = await supabase
          .from('totp_codes')
          .delete()
          .eq('name', code.name)
          .eq('secret', code.secret)
          .in('team_id', teamsToRemove)

        if (removeError) throw removeError
      }

      // Add new team assignments
      if (teamsToAdd.length > 0) {
        const { error: addError } = await supabase
          .from('totp_codes')
          .insert(
            teamsToAdd.map(teamId => ({
              name: code.name,
              secret: code.secret,
              team_id: teamId,
              created_by: code.created_by
            }))
          )

        if (addError) throw addError
      }

      toast({
        title: "Success",
        description: "TOTP code updated successfully"
      })
      setIsOpen(false)
      onUpdate()
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error updating TOTP code",
        description: error.message
      })
    }
  }

  const handleDelete = async () => {
    if (deleteConfirmation !== 'Deletar') {
      toast({
        variant: "destructive",
        title: "Invalid confirmation",
        description: "Please type 'Deletar' to confirm deletion"
      })
      return
    }

    try {
      // Only delete the specific TOTP code instance
      const { error } = await supabase
        .from('totp_codes')
        .delete()
        .eq('id', code.id)

      if (error) throw error

      toast({
        title: "Success",
        description: "TOTP code deleted successfully"
      })
      setIsOpen(false)
      onUpdate()
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error deleting TOTP code",
        description: error.message
      })
    }
  }

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 hover:bg-zinc-700"
        onClick={() => setIsOpen(true)}
      >
        <Pencil className="h-4 w-4" />
      </Button>

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)}>
        <ModalHeader>
          <ModalTitle>Editar Código TOTP</ModalTitle>
        </ModalHeader>

        <div className="mt-4 space-y-4">
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

          <div className="pt-4 border-t border-zinc-800">
            {showDelete ? (
              <div className="space-y-4">
                <p className="text-sm text-red-400">
                  Para excluir este código TOTP, digite 'Deletar' abaixo:
                </p>
                <Input
                  value={deleteConfirmation}
                  onChange={(e) => setDeleteConfirmation(e.target.value)}
                  className="bg-zinc-800 border-zinc-700 text-white"
                  placeholder="Digite 'Deletar' para confirmar"
                />
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    className="flex-1 border-zinc-700 text-zinc-400 hover:text-white"
                    onClick={() => {
                      setShowDelete(false)
                      setDeleteConfirmation('')
                    }}
                  >
                    Cancelar
                  </Button>
                  <Button
                    className="flex-1 bg-red-500 hover:bg-red-600 text-white"
                    onClick={handleDelete}
                  >
                    Excluir Código TOTP
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex space-x-2">
                <Button
                  className="flex-1 bg-white text-black hover:bg-zinc-200"
                  onClick={handleSubmit}
                >
                  Atualizar Times
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 border-red-500 text-red-500 hover:bg-red-500/10"
                  onClick={() => setShowDelete(true)}
                >
                  Excluir
                </Button>
              </div>
            )}
          </div>
        </div>
      </Modal>
    </>
  )
}