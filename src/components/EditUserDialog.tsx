import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Pencil } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/lib/supabase/client'
import { Modal, ModalHeader, ModalTitle } from '@/components/ui/modal'

interface Team {
  id: string
  name: string
}

interface User {
  id: string
  email: string
  metadata: {
    name: string
    is_admin: boolean
  }
}

interface EditUserDialogProps {
  user: User
  onUpdate: () => void
}

export function EditUserDialog({ user, onUpdate }: EditUserDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [name, setName] = useState('')
  const [isAdmin, setIsAdmin] = useState(false)
  const [teams, setTeams] = useState<Team[]>([])
  const [selectedTeams, setSelectedTeams] = useState<string[]>([])
  const { toast } = useToast()

  // Reset form state when dialog opens
  useEffect(() => {
    if (isOpen) {
      console.log('Opening edit dialog for user:', user)
      setName(user.metadata?.name || '')
      setIsAdmin(user.metadata?.is_admin || false)
      
      const fetchData = async () => {
        try {
          // Fetch all teams
          const { data: allTeams, error: teamsError } = await supabase
            .from('teams')
            .select('id, name')
            .order('name')
          
          if (teamsError) throw teamsError
          console.log('All available teams:', allTeams)
          setTeams(allTeams || [])

          // Fetch user's current teams
          const { data: userTeams, error: userTeamsError } = await supabase
            .from('user_teams')
            .select('team_id')
            .eq('user_id', user.id)

          if (userTeamsError) throw userTeamsError
          console.log('User teams:', userTeams)

          const teamIds = userTeams?.map(ut => ut.team_id) || []
          console.log('Setting selected teams:', teamIds)
          setSelectedTeams(teamIds)

        } catch (error: any) {
          console.error('Error fetching data:', error)
          toast({
            variant: "destructive",
            title: "Error fetching data",
            description: error.message
          })
        }
      }

      fetchData()
    }
  }, [isOpen, user.id, user.metadata])

  // When isAdmin changes, update selected teams
  useEffect(() => {
    if (isAdmin) {
      console.log('User is admin, selecting all teams:', teams.map(t => t.name))
      // Select all teams for admin users
      setSelectedTeams(teams.map(team => team.id))
    }
  }, [isAdmin, teams])

  const handleSubmit = async () => {
    try {
      console.log('Updating user with data:', {
        name,
        isAdmin,
        selectedTeams: selectedTeams.map(id => teams.find(t => t.id === id)?.name)
      })

      // Update user metadata in profiles table
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          metadata: {
            name,
            is_admin: isAdmin
          }
        })
        .eq('id', user.id)

      if (updateError) {
        console.error('Error updating profile:', updateError)
        throw updateError
      }

      // Get current team assignments
      const { data: currentTeams, error: currentTeamsError } = await supabase
        .from('user_teams')
        .select('team_id')
        .eq('user_id', user.id)

      if (currentTeamsError) {
        console.error('Error fetching current teams:', currentTeamsError)
        throw currentTeamsError
      }

      const currentTeamIds = new Set(currentTeams?.map(t => t.team_id) || [])
      const newTeamIds = new Set(selectedTeams)

      // Teams to add (in newTeamIds but not in currentTeamIds)
      const teamsToAdd = selectedTeams.filter(id => !currentTeamIds.has(id))

      // Teams to remove (in currentTeamIds but not in newTeamIds)
      const teamsToRemove = Array.from(currentTeamIds).filter(id => !newTeamIds.has(id))

      console.log('Teams changes:', {
        teamsToAdd: teamsToAdd.map(id => teams.find(t => t.id === id)?.name),
        teamsToRemove: teamsToRemove.map(id => teams.find(t => t.id === id)?.name)
      })

      // Add new team assignments
      if (teamsToAdd.length > 0) {
        const { error: addError } = await supabase
          .from('user_teams')
          .insert(
            teamsToAdd.map(teamId => ({
              user_id: user.id,
              team_id: teamId
            }))
          )

        if (addError) {
          console.error('Error adding teams:', addError)
          throw addError
        }
      }

      // Remove old team assignments
      if (teamsToRemove.length > 0) {
        const { error: removeError } = await supabase
          .from('user_teams')
          .delete()
          .eq('user_id', user.id)
          .in('team_id', teamsToRemove)

        if (removeError) {
          console.error('Error removing teams:', removeError)
          throw removeError
        }
      }

      toast({
        title: "Success",
        description: "User updated successfully"
      })
      setIsOpen(false)
      onUpdate()
    } catch (error: any) {
      console.error('Error updating user:', error)
      toast({
        variant: "destructive",
        title: "Error updating user",
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
          <ModalTitle>Edit User</ModalTitle>
        </ModalHeader>

        <div className="mt-4 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-zinc-300">Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-zinc-800 border-zinc-700 text-white"
              placeholder="Enter user's name"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-zinc-300">User Level</Label>
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
                User
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
            <Label className="text-zinc-300">Select Teams</Label>
            <div className="grid grid-cols-2 gap-2">
              {teams.map((team) => (
                <Button
                  key={team.id}
                  variant="outline"
                  disabled={isAdmin} // Disable team selection for admins
                  className={`
                    border-zinc-700 
                    ${selectedTeams.includes(team.id) 
                      ? 'bg-zinc-700 text-white' 
                      : 'bg-transparent text-zinc-400 hover:text-white hover:bg-zinc-800'
                    }
                    max-[390px]:whitespace-normal
                    max-[390px]:text-xs
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
                Admins automatically have access to all teams
              </p>
            )}
          </div>

          <Button
            className="w-full mt-6 bg-white text-black hover:bg-zinc-200"
            onClick={handleSubmit}
          >
            Update User
          </Button>
        </div>
      </Modal>
    </>
  )
}