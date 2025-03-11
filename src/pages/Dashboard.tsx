import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase/client'
import { Search, Copy } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { AddTOTPDialog } from '@/components/AddTOTPDialog'
import { EditTOTPDialog } from '@/components/EditTOTPDialog'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { AddUserDialog } from '@/components/AddUserDialog'
import { EditUserDialog } from '@/components/EditUserDialog'
import { generateTOTP, getTimeRemaining } from '@/lib/totp'
import type { TOTPCode } from '@/lib/supabase/client'

interface User {
  id: string
  email: string
  metadata: {
    name: string
    is_admin: boolean
  }
}

interface UserTeam {
  team_id: string
  team: {
    name: string
  }
}

interface TeamInfo {
  id: string
  name: string
}

interface TeamResponse {
  teams: {
    id: string
    name: string
  } | null
}

export function Dashboard() {
  const { user } = useAuth()
  const [codes, setCodes] = useState<(TOTPCode & { teamsList: TeamInfo[] })[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [userTeams, setUserTeams] = useState<Record<string, UserTeam[]>>({})
  const [searchQuery, setSearchQuery] = useState('')
  const [isAdmin, setIsAdmin] = useState(false)
  const { toast } = useToast()

  const fetchUsers = useCallback(async () => {
    if (!isAdmin || !user) return

    try {
      // Get all profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('email')

      if (profilesError) throw profilesError
      setUsers(profiles || [])

      // Get teams for all users
      const { data: teamUsers, error: teamsError } = await supabase
        .from('user_teams')
        .select(`
          user_id,
          team_id,
          teams (
            id,
            name
          )
        `)

      if (teamsError) throw teamsError

      // Build teams map
      const teamsMap: Record<string, UserTeam[]> = {}
      teamUsers?.forEach(ut => {
        const teamResponse = ut as unknown as TeamResponse
        if (!teamsMap[ut.user_id]) {
          teamsMap[ut.user_id] = []
        }
        if (teamResponse.teams) {
          teamsMap[ut.user_id].push({
            team_id: teamResponse.teams.id,
            team: { name: teamResponse.teams.name }
          })
        }
      })

      setUserTeams(teamsMap)
    } catch (error: any) {
      console.error('Error fetching users:', error)
      toast({
        variant: "destructive",
        title: "Error fetching users",
        description: error.message
      })
    }
  }, [isAdmin, user, toast])

  const fetchCodes = useCallback(async () => {
    if (!user) return

    try {
      let query = supabase
        .from('totp_codes')
        .select(`
          id,
          name,
          secret,
          team_id,
          created_at,
          created_by,
          teams (
            id,
            name
          )
        `)
        .order('name')

      if (!isAdmin) {
        // For non-admin users, only fetch codes for their teams
        const { data: userTeams } = await supabase
          .from('user_teams')
          .select('team_id')
          .eq('user_id', user.id)

        const teamIds = userTeams?.map(ut => ut.team_id) || []
        if (teamIds.length === 0) {
          setCodes([])
          return
        }
        query = query.in('team_id', teamIds)
      }

      const { data, error } = await query

      if (error) throw error

      // Group codes by name and secret, collecting all teams
      const codesMap = new Map<string, TOTPCode & { teamsList: TeamInfo[] }>()
      
      data?.forEach(code => {
        const key = `${code.name}-${code.secret}`
        const codeResponse = code as unknown as TeamResponse
        if (!codesMap.has(key)) {
          codesMap.set(key, {
            ...code,
            teamsList: codeResponse.teams ? [{ id: codeResponse.teams.id, name: codeResponse.teams.name }] : []
          })
        } else {
          const existingCode = codesMap.get(key)!
          if (codeResponse.teams && !existingCode.teamsList.some(t => t.id === codeResponse.teams.id)) {
            existingCode.teamsList.push({ id: codeResponse.teams.id, name: codeResponse.teams.name })
          }
        }
      })

      setCodes(Array.from(codesMap.values()))
    } catch (error: any) {
      console.error('Error fetching codes:', error)
      toast({
        variant: "destructive",
        title: "Error fetching codes",
        description: error.message
      })
    }
  }, [user, isAdmin, toast])

  useEffect(() => {
    if (!user) return

    // Check if user is admin
    const checkAdmin = async () => {
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('metadata')
          .eq('id', user.id)
          .single()

        setIsAdmin(profile?.metadata?.is_admin || false)
      } catch (error: any) {
        console.error('Error checking admin status:', error)
        toast({
          variant: "destructive",
          title: "Error checking admin status",
          description: error.message
        })
      }
    }

    let subscription: ReturnType<typeof supabase.channel> | null = null

    const setupSubscription = () => {
      // Subscribe to changes
      subscription = supabase
        .channel('schema_db_changes')
        .on('postgres_changes', { 
          event: '*', 
          schema: 'public',
          table: 'totp_codes'
        }, () => {
          console.log('TOTP codes changed, refreshing...')
          fetchCodes()
        })
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'profiles'
        }, () => {
          console.log('Profiles changed, refreshing...')
          fetchUsers()
        })
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'user_teams'
        }, () => {
          console.log('User teams changed, refreshing...')
          fetchUsers()
          fetchCodes() // Also refresh codes as team access might have changed
        })
        .subscribe()
    }

    // Initial data fetch
    checkAdmin().then(() => {
      fetchCodes()
      fetchUsers()
      setupSubscription()
    })

    // Cleanup subscription on unmount
    return () => {
      if (subscription) {
        console.log('Cleaning up subscription...')
        subscription.unsubscribe()
      }
    }
  }, [user, fetchCodes, fetchUsers, toast])

  const filteredCodes = codes.filter(code => 
    code.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const filteredUsers = users.filter(user =>
    user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.metadata?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-black text-white p-4">
      <Tabs defaultValue="codes" className="space-y-6">
        <div className="flex items-center justify-between">
          <TabsList className="bg-zinc-800 text-zinc-400">
            <TabsTrigger 
              value="codes"
              className="data-[state=active]:bg-zinc-700 data-[state=active]:text-white"
            >
              Códigos TOTP
            </TabsTrigger>
            {isAdmin && (
              <TabsTrigger 
                value="users"
                className="data-[state=active]:bg-zinc-700 data-[state=active]:text-white"
              >
                Usuários
              </TabsTrigger>
            )}
          </TabsList>
          {isAdmin && <AddTOTPDialog />}
        </div>

        <TabsContent value="codes" className="space-y-6">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-zinc-400" />
            <Input
              type="text"
              placeholder="Buscar códigos"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-zinc-800 border-none pl-10 text-white placeholder:text-zinc-400"
            />
          </div>

          {/* TOTP Codes List */}
          <div className="space-y-4">
            {filteredCodes.map((code) => (
              <div
                key={code.id}
                className="bg-zinc-800 rounded-lg p-4 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm text-zinc-400">{code.name}</span>
                  <div className="flex items-center space-x-2">
                    {isAdmin && (
                      <EditTOTPDialog 
                        code={code} 
                        onUpdate={fetchCodes}
                      />
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 hover:bg-zinc-700"
                      onClick={() => {
                        const totp = generateTOTP(code.secret)
                        navigator.clipboard.writeText(totp)
                        toast({
                          title: "Código copiado",
                          description: "O código foi copiado para a área de transferência"
                        })
                      }}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-3xl font-mono tracking-wider">
                    {generateTOTP(code.secret)}
                  </span>
                  <div className="h-1 w-1 rounded-full bg-blue-400 animate-pulse" />
                </div>
                <div className="w-full bg-zinc-700 rounded-full h-1">
                  <div
                    className="bg-blue-400 h-1 rounded-full transition-all duration-1000 ease-linear"
                    style={{
                      width: `${(getTimeRemaining() / 30) * 100}%`
                    }}
                  />
                </div>
                {code.teamsList && code.teamsList.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    <span className="text-sm text-zinc-400">Times:</span>
                    {code.teamsList.map((team) => (
                      <span
                        key={team.id}
                        className="text-sm text-zinc-300"
                      >
                        {team.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </TabsContent>

        {isAdmin && (
          <TabsContent value="users" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Gerenciamento de Usuários</h2>
              <AddUserDialog />
            </div>

            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-zinc-400" />
              <Input
                type="text"
                placeholder="Buscar usuários"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-zinc-800 border-none pl-10 text-white placeholder:text-zinc-400"
              />
            </div>

            {/* Users List */}
            <div className="space-y-4">
              {filteredUsers.map((u) => (
                <div
                  key={u.id}
                  className="bg-zinc-800 rounded-lg p-4 space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-medium">{u.metadata?.name || 'Usuário sem nome'}</h3>
                      <p className="text-sm text-zinc-400">{u.email}</p>
                    </div>
                    <EditUserDialog user={u} onUpdate={fetchUsers} />
                  </div>
                  {userTeams[u.id] && userTeams[u.id].length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {userTeams[u.id].map((team) => (
                        <span
                          key={team.team_id}
                          className="px-2 py-1 text-xs rounded-full bg-zinc-700 text-zinc-300"
                        >
                          {team.team.name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}
