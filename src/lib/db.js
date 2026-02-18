// Database layer with Supabase
// Reemplaza el db.js original que usaba localStorage

import { supabase, getCurrentSession, signOut } from './supabase'

export const db = {
  // ==================== AUTH ====================
  
  login: async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })
      
      if (error) throw error
      
      // Obtener datos completos del usuario
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', data.user.id)
        .maybeSingle()

      if (userError) throw userError
      if (!userData) {
        throw new Error('Usuario no encontrado o datos incompletos')
      }

      // Actualizar último login
      await supabase.from('users').update({ 
        last_login: new Date().toISOString() 
      }).eq('id', data.user.id)

      // Guardar usuario en localStorage para la barra y la app
      localStorage.setItem('fortnite_platform_session', JSON.stringify(userData));

      return userData
    } catch (error) {
      throw new Error(error.message || 'Error al iniciar sesión')
    }
  },

  register: async (email, password, username) => {
    try {
      // Verificar si el username ya existe
      const { data: existingUser } = await supabase
        .from('users')
        .select('username')
        .eq('username', username)
        .maybeSingle()
      
      if (existingUser) {
        throw new Error('El nombre de usuario ya existe')
      }

      // Crear usuario en Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { username }
        }
      })
      
      if (authError) throw authError
      
      // Crear perfil en tabla users
      const { data: userData, error: userError } = await supabase
        .from('users')
        .insert({
          id: authData.user.id,
          email,
          username,
          role: 'user',
          tokens: 0,
          snipes: 0,
          wins: 0,
          losses: 0,
          earnings: 0,
          total_earned: 0,
          total_played: 0,
          current_streak: 0,
          best_streak: 0,
          level: 1,
          reputation: 100,
          trust_score: 100,
          reported_count: 0,
          email_verified: false,
          two_factor_enabled: false
        })
        .select()
        .maybeSingle()
      
      if (userError) throw userError
      
      // If Supabase created an active session during signUp, sign out to avoid auto-login.
      try {
        const { data: sessionData } = await supabase.auth.getSession()
        if (sessionData?.session) {
          await supabase.auth.signOut()
        }
      } catch (e) {
        // ignore signOut errors
      }

      return userData
    } catch (error) {
      throw new Error(error.message || 'Error al registrarse')
    }
  },

  logout: async () => {
    // Limpiar localStorage
    localStorage.removeItem('fortnite_platform_session')
    await signOut()
  },

  getSession: () => {
    // Función síncrona para compatibilidad con código antiguo
    // Retorna el usuario guardado en localStorage si existe
    const sessionData = localStorage.getItem('fortnite_platform_session');
    return sessionData ? JSON.parse(sessionData) : null;
  },

  getCurrentUser: async () => {
    try {
      const session = await getCurrentSession()
      if (!session) return null
      
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', session.user.id)
        .single()
      
      if (error) return null
      return data
    } catch (error) {
      return null
    }
  },

  // ==================== USERS ====================

  getUserById: async (userId) => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()
    
    if (error) throw error
    return data
  },

  getUserByUsername: async (username) => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('username', username)
      .single()
    
    if (error) return null
    return data
  },

  getAllUsers: async () => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data
  },

  updateUser: async (userId, updates) => {
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', userId)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  // ==================== MATCHES ====================

  createMatch: async (matchData) => {
    try {
      // Intentar crear en Supabase primero
      const session = db.getSession()
      if (!session) throw new Error('No session found')

      // Transform data to match Supabase schema
      const supabaseMatchData = {
        game_mode: matchData.mode,
        bet_amount: Math.floor(matchData.entryFee * 100), // Convert to cents
        region: matchData.region,
        player1_id: session.id,
        status: 'pending'
      }

      const { data, error } = await supabase
        .from('matches')
        .insert(supabaseMatchData)
        .select()
        .single()

      if (error) {
        console.log('Supabase match creation failed, using localStorage fallback')
        throw error
      }

      // Transform back to expected format
      return {
        id: data.id,
        ...matchData,
        hostId: session.id,
        hostName: session.username,
        status: 'pending',
        players: [{ id: session.id, name: session.username }],
        maxPlayers: matchData.type === '1v1' ? 2 : matchData.type === '2v2' ? 4 : 8,
        chat: [],
        createdAt: Date.now(),
        prize: matchData.entryFee * 1.9,
        expiresIn: '59:00'
      }
    } catch (error) {
      console.log('Using localStorage fallback for match creation')
      // Fallback to localStorage (existing logic)
      const session = db.getSession()
      if (!session) throw new Error('No autorizado')

      const matches = JSON.parse(localStorage.getItem('fortnite_matches') || '[]')
      const entryFee = parseFloat(matchData.entryFee)
      
      // NO RESTAR TOKENS AL CREAR - solo al unirse o marcar listo
      const newMatch = {
        id: Date.now(),
        createdAt: Date.now(),
        ...matchData,
        hostId: session.id,
        hostName: session.username,
        status: 'pending',
        players: [{ id: session.id, name: session.username }],
        maxPlayers: matchData.type === '1v1' ? 2 : matchData.type === '2v2' ? 4 : 8,
        chat: [],
        entryFee: entryFee,
        prize: entryFee * 1.9,
        firstTo: matchData.rounds || 5,
        expiresIn: '59:00',
        tags: ['CUSTOM'],
        playersReady: {} // Initialize ready status
      }
      
      matches.unshift(newMatch)
      localStorage.setItem('fortnite_matches', JSON.stringify(matches))
      return newMatch
    }
  },

  getMatches: async (filters = {}) => {
    try {
      // Try Supabase first
      let query = supabase.from('matches').select(`
        *,
        player1:player1_id(*),
        player2:player2_id(*),
        winner:winner_id(*),
        moderator:moderator_id(*)
      `)
      
      if (filters.status) {
        query = query.eq('status', filters.status)
      }
      
      if (filters.userId) {
        query = query.or(`player1_id.eq.${filters.userId},player2_id.eq.${filters.userId}`)
      }
      
      if (filters.moderatorId) {
        query = query.eq('moderator_id', filters.moderatorId)
      }
      
      const { data, error } = await query.order('created_at', { ascending: false })
      
      if (error) {
        // Fallback to localStorage
        console.log('Using localStorage fallback for matches')
        const matches = JSON.parse(localStorage.getItem('fortnite_matches') || '[]')
        return matches
      }

      // Transform Supabase data to expected format
      const transformedMatches = data.map(match => ({
        id: match.id,
        type: match.game_mode === 'REALISTIC' ? '1v1' : '1v1', // Default mapping
        mode: match.game_mode,
        entryFee: match.bet_amount / 100, // Convert from cents
        region: match.region,
        status: match.status, // Mantener status 'pending' para matches disponibles
        players: [
          match.player1 ? { id: match.player1.id, name: match.player1.username } : null,
          match.player2 ? { id: match.player2.id, name: match.player2.username } : null
        ].filter(Boolean),
        createdAt: new Date(match.created_at).getTime(),
        prize: (match.bet_amount / 100) * 1.9,
        maxPlayers: 2
      }))

      return transformedMatches
    } catch (error) {
      console.error('Error fetching matches, using localStorage fallback:', error)
      // Final fallback to localStorage
      const matches = JSON.parse(localStorage.getItem('fortnite_matches') || '[]')
      return matches
    }
  },

  getMatchById: async (matchId) => {
    try {
      // Try Supabase first
      const { data, error } = await supabase
        .from('matches')
        .select(`
          *,
          player1:player1_id(*),
          player2:player2_id(*),
          winner:winner_id(*),
          moderator:moderator_id(*)
        `)
        .eq('id', matchId)
        .single()
      
      if (error) throw error
      
      // Transform to expected format
      return {
        id: data.id,
        type: '1v1', // Default
        mode: data.game_mode,
        entryFee: data.bet_amount / 100,
        region: data.region,
        status: data.status === 'pending' ? 'waiting' : data.status,
        players: [
          data.player1 ? { id: data.player1.id, name: data.player1.username } : null,
          data.player2 ? { id: data.player2.id, name: data.player2.username } : null
        ].filter(Boolean),
        createdAt: new Date(data.created_at).getTime(),
        prize: (data.bet_amount / 100) * 1.9,
        maxPlayers: 2,
        chat: [],
        playersReady: {}
      }
    } catch (error) {
      console.log('Using localStorage fallback for getMatchById')
      // Fallback to localStorage
      const matches = JSON.parse(localStorage.getItem('fortnite_matches') || '[]')
      return matches.find(m => m.id == matchId)
    }
  },

  // Add getMatch alias for compatibility
  getMatch: (matchId) => {
    // Use synchronous localStorage access for compatibility
    const matches = JSON.parse(localStorage.getItem('fortnite_matches') || '[]')
    return matches.find(m => m.id == matchId)
  },

  joinMatch: async (matchId) => {
    try {
      const session = db.getSession()
      if (!session) return { error: 'No autorizado' }
      
      // Try localStorage first since it's more complete
      const matches = JSON.parse(localStorage.getItem('fortnite_matches') || '[]')
      const matchIndex = matches.findIndex(m => m.id == matchId)
      
      if (matchIndex === -1) return { error: 'Match no encontrado' }
      
      const match = matches[matchIndex]
      
      if (match.players.length >= match.maxPlayers) return { error: 'Match lleno' }
      if (match.players.find(p => p.id === session.id)) return { error: 'Ya estás en este match' }
      
      // NO VERIFICAR TOKENS AQUÍ - solo verificar al marcar "listo"
      // Simplemente agregar el jugador al match
      match.players.push({ id: session.id, name: session.username })
      
      // Auto ready when full
      if (match.players.length === match.maxPlayers) {
        match.status = 'ready'
      }
      
      matches[matchIndex] = match
      localStorage.setItem('fortnite_matches', JSON.stringify(matches))
      
      return { match, error: null }
    } catch (error) {
      console.error('Error joining match:', error)
      return { error: 'Error al unirse al match' }
    }
  },

  updateMatch: async (matchId, updates) => {
    const { data, error } = await supabase
      .from('matches')
      .update(updates)
      .eq('id', matchId)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  leaveMatch: (matchId, playerId) => {
    const matches = JSON.parse(localStorage.getItem('fortnite_matches') || '[]')
    const matchIndex = matches.findIndex(m => m.id == matchId)
    
    if (matchIndex !== -1) {
      const match = matches[matchIndex]
      
      // Si el jugador había marcado "listo", devolver los tokens
      if (match.playersReady && match.playersReady[playerId]) {
        const users = JSON.parse(localStorage.getItem('fortnite_platform_users') || '[]')
        const userIndex = users.findIndex(u => u.id === playerId)
        
        if (userIndex !== -1) {
          users[userIndex].tokens += match.entryFee
          users[userIndex].totalPlayed = Math.max(0, (users[userIndex].totalPlayed || 0) - 1)
          localStorage.setItem('fortnite_platform_users', JSON.stringify(users))
        }
      }
      
      match.players = match.players.filter(p => p.id !== playerId)
      
      // Remove from ready status
      if (match.playersReady && match.playersReady[playerId]) {
        delete match.playersReady[playerId]
      }
      
      // If match becomes empty, delete it
      if (match.players.length === 0) {
        matches.splice(matchIndex, 1)
      } else {
        matches[matchIndex] = match
      }
      
      localStorage.setItem('fortnite_matches', JSON.stringify(matches))
    }
  },

  sendMessage: (matchId, message) => {
    const matches = JSON.parse(localStorage.getItem('fortnite_matches') || '[]')
    const matchIndex = matches.findIndex(m => m.id == matchId)
    const session = db.getSession()
    
    if (matchIndex !== -1 && session) {
      const match = matches[matchIndex]
      if (!match.chat) match.chat = []
      
      match.chat.push({
        id: Date.now(),
        userId: session.id,
        username: session.username,
        text: message,
        timestamp: new Date().toISOString()
      })
      
      matches[matchIndex] = match
      localStorage.setItem('fortnite_matches', JSON.stringify(matches))
    }
  },

  updatePlayerReady: (matchId, playerId, isReady) => {
    const matches = JSON.parse(localStorage.getItem('fortnite_matches') || '[]')
    const matchIndex = matches.findIndex(m => m.id == matchId)
    
    if (matchIndex !== -1) {
      const match = matches[matchIndex]
      if (!match.playersReady) match.playersReady = {}
      
      // Si el jugador marca como "listo", descontar tokens
      if (isReady && !match.playersReady[playerId]) {
        const users = JSON.parse(localStorage.getItem('fortnite_platform_users') || '[]')
        const userIndex = users.findIndex(u => u.id === playerId)
        
        if (userIndex !== -1) {
          // Verificar si tiene suficientes tokens
          if (users[userIndex].tokens < match.entryFee) {
            return null // No suficientes tokens
          }
          
          // Descontar tokens solo cuando marca "listo"
          users[userIndex].tokens -= match.entryFee
          users[userIndex].totalPlayed = (users[userIndex].totalPlayed || 0) + 1
          localStorage.setItem('fortnite_platform_users', JSON.stringify(users))
        }
      }
      
      // Si desmarca "listo", devolver tokens
      if (!isReady && match.playersReady[playerId]) {
        const users = JSON.parse(localStorage.getItem('fortnite_platform_users') || '[]')
        const userIndex = users.findIndex(u => u.id === playerId)
        
        if (userIndex !== -1) {
          users[userIndex].tokens += match.entryFee
          users[userIndex].totalPlayed = Math.max(0, (users[userIndex].totalPlayed || 0) - 1)
          localStorage.setItem('fortnite_platform_users', JSON.stringify(users))
        }
      }
      
      match.playersReady[playerId] = isReady
      matches[matchIndex] = match
      localStorage.setItem('fortnite_matches', JSON.stringify(matches))
      
      return match
    }
    
    return null
  },

  // ==================== TRANSACTIONS ====================

  createTransaction: async (txData) => {
    const { data, error } = await supabase
      .from('transactions')
      .insert(txData)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  getTransactions: async (userId) => {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data
  },

  getAllTransactions: async () => {
    const { data, error } = await supabase
      .from('transactions')
      .select(`
        *,
        user:user_id(username, email)
      `)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data
  },

  // ==================== WITHDRAWALS ====================

  createWithdrawal: async (withdrawalData) => {
    const { data, error } = await supabase
      .from('withdrawals')
      .insert(withdrawalData)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  getWithdrawals: async (userId) => {
    const { data, error } = await supabase
      .from('withdrawals')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data
  },

  getAllWithdrawals: async () => {
    const { data, error } = await supabase
      .from('withdrawals')
      .select(`
        *,
        user:user_id(username, email),
        reviewer:reviewed_by(username)
      `)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data
  },

  updateWithdrawal: async (withdrawalId, updates) => {
    const { data, error } = await supabase
      .from('withdrawals')
      .update(updates)
      .eq('id', withdrawalId)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  // ==================== CHAT ====================

  getChatMessages: async (limit = 50) => {
    const { data, error } = await supabase
      .from('chat_messages')
      .select(`
        *,
        user:user_id(id, username, role, level)
      `)
      .eq('is_deleted', false)
      .order('created_at', { ascending: false })
      .limit(limit)
    
    if (error) throw error
    return data.reverse() // Más antiguos primero
  },

  sendChatMessage: async (userId, message) => {
    const { data, error } = await supabase
      .from('chat_messages')
      .insert({
        user_id: userId,
        message
      })
      .select(`
        *,
        user:user_id(id, username, role, level)
      `)
      .single()
    
    if (error) throw error
    return data
  },

  deleteChatMessage: async (messageId, deletedBy, reason) => {
    const { data, error } = await supabase
      .from('chat_messages')
      .update({
        is_deleted: true,
        deleted_by: deletedBy,
        deleted_reason: reason
      })
      .eq('id', messageId)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  // Suscribirse a nuevos mensajes de chat (real-time)
  subscribeToChatMessages: (callback) => {
    const channel = supabase
      .channel('chat_messages')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages'
      }, async (payload) => {
        // Obtener datos completos del usuario
        const { data } = await supabase
          .from('chat_messages')
          .select(`
            *,
            user:user_id(id, username, role, level)
          `)
          .eq('id', payload.new.id)
          .single()
        
        if (data) callback(data)
      })
      .subscribe()
    
    return channel
  },

  // ==================== REPORTS ====================

  createReport: async (reportData) => {
    const { data, error } = await supabase
      .from('reports')
      .insert(reportData)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  getReports: async (status = null) => {
    let query = supabase
      .from('reports')
      .select(`
        *,
        reporter:reporter_id(username),
        reported_user:reported_user_id(username),
        reviewer:reviewed_by(username),
        match:match_id(*)
      `)
    
    if (status) {
      query = query.eq('status', status)
    }
    
    const { data, error } = await query.order('created_at', { ascending: false })
    
    if (error) throw error
    return data
  },

  updateReport: async (reportId, updates) => {
    const { data, error } = await supabase
      .from('reports')
      .update(updates)
      .eq('id', reportId)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  // ==================== ACHIEVEMENTS ====================

  getUserAchievements: async (userId) => {
    const { data, error } = await supabase
      .from('user_achievements')
      .select('*')
      .eq('user_id', userId)
    
    if (error) throw error
    return data.map(a => a.achievement_name)
  },

  addAchievement: async (userId, achievementName) => {
    const { data, error } = await supabase
      .from('user_achievements')
      .insert({
        user_id: userId,
        achievement_name: achievementName
      })
      .select()
      .single()
    
    if (error) {
      // Ignorar si ya existe
      if (error.code === '23505') return null
      throw error
    }
    return data
  },

  // ==================== LEADERBOARD ====================

  getLeaderboard: async (metric = 'wins', limit = 10) => {
    const { data, error } = await supabase
      .from('users')
      .select('id, username, level, wins, losses, earnings, total_earned, reputation')
      .order(metric, { ascending: false })
      .limit(limit)
    
    if (error) throw error
    return data
  },

  // ==================== TEAMS ====================

  getTeams: async (userId) => {
    try {
      // Primero intentar con Supabase
      let query = supabase
        .from('teams')
        .select(`
          *,
          creator:creator_id(id, username),
          team_members(
            id,
            role,
            joined_at,
            user:user_id(id, username)
          )
        `)

      if (userId) {
        query = query.eq('team_members.user_id', userId)
      }

      const { data, error } = await query.order('created_at', { ascending: false })
      
      if (error) {
        // Si hay error (probablemente tabla no existe), usar localStorage
        console.log('Teams table not found, using localStorage fallback')
        const teams = JSON.parse(localStorage.getItem('fortnite_teams') || '[]')
        if (userId) {
          return teams.filter(team => 
            team.members.some(member => member.id === userId)
          )
        }
        return teams
      }
      
      // Transform data to match the expected format
      return data.map(team => ({
        id: team.id,
        name: team.name,
        wins: team.wins,
        losses: team.losses,
        members: team.team_members.map(member => ({
          id: member.user.id,
          name: member.user.username,
          role: member.role === 'leader' ? 'Leader' : 'Member',
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${member.user.username}`
        }))
      }))
    } catch (error) {
      console.error('Error fetching teams, using localStorage fallback:', error)
      // Fallback a localStorage
      const teams = JSON.parse(localStorage.getItem('fortnite_teams') || '[]')
      if (userId) {
        return teams.filter(team => 
          team.members.some(member => member.id === userId)
        )
      }
      return teams
    }
  },

  createTeam: async (name) => {
    try {
      const session = db.getSession()
      if (!session) throw new Error('No session found')

      // Intentar crear con Supabase primero
      const { data: newTeam, error: teamError } = await supabase
        .from('teams')
        .insert({
          name: name,
          creator_id: session.id
        })
        .select()
        .single()

      if (teamError) {
        // Si hay error, usar localStorage
        console.log('Creating team with localStorage fallback')
        const teams = JSON.parse(localStorage.getItem('fortnite_teams') || '[]')
        const newTeam = {
          id: Date.now(),
          name,
          members: [
            { id: session.id, name: session.username, role: 'Leader', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + session.username }
          ],
          wins: 0
        }
        teams.push(newTeam)
        localStorage.setItem('fortnite_teams', JSON.stringify(teams))
        return newTeam
      }

      // Add creator as leader
      const { error: memberError } = await supabase
        .from('team_members')
        .insert({
          team_id: newTeam.id,
          user_id: session.id,
          role: 'leader'
        })

      if (memberError) throw memberError

      // Return team in expected format
      return {
        id: newTeam.id,
        name: newTeam.name,
        wins: newTeam.wins,
        members: [{
          id: session.id,
          name: session.username,
          role: 'Leader',
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${session.username}`
        }]
      }
    } catch (error) {
      console.error('Error creating team with Supabase, using localStorage:', error)
      // Fallback a localStorage
      const session = db.getSession()
      const teams = JSON.parse(localStorage.getItem('fortnite_teams') || '[]')
      const newTeam = {
        id: Date.now(),
        name,
        members: [
          { id: session.id, name: session.username, role: 'Leader', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + session.username }
        ],
        wins: 0
      }
      teams.push(newTeam)
      localStorage.setItem('fortnite_teams', JSON.stringify(teams))
      return newTeam
    }
  },

  deleteTeam: async (teamId) => {
    try {
      // Intentar con Supabase primero
      const { error } = await supabase
        .from('teams')
        .delete()
        .eq('id', teamId)

      if (error) {
        // Fallback a localStorage
        console.log('Deleting team with localStorage fallback')
        const teams = JSON.parse(localStorage.getItem('fortnite_teams') || '[]')
        const filteredTeams = teams.filter(t => t.id !== teamId)
        localStorage.setItem('fortnite_teams', JSON.stringify(filteredTeams))
        return
      }
    } catch (error) {
      console.error('Error deleting team with Supabase, using localStorage:', error)
      // Fallback a localStorage
      const teams = JSON.parse(localStorage.getItem('fortnite_teams') || '[]')
      const filteredTeams = teams.filter(t => t.id !== teamId)
      localStorage.setItem('fortnite_teams', JSON.stringify(filteredTeams))
    }
  },

  sendTeamInvitation: async (teamId, username, invitedBy) => {
    try {
      // Intentar con Supabase primero
      const { data: targetUser, error: userError } = await supabase
        .from('users')
        .select('id, username')
        .eq('username', username)
        .single()

      if (userError) {
        // Fallback: buscar en localStorage
        const users = JSON.parse(localStorage.getItem('fortnite_platform_users') || '[]')
        const localUser = users.find(u => u.username.toLowerCase() === username.toLowerCase())
        if (!localUser) {
          return { success: false, error: 'Usuario no encontrado' }
        }
        
        // Usar localStorage para equipos
        const teams = JSON.parse(localStorage.getItem('fortnite_teams') || '[]')
        const team = teams.find(t => t.id === teamId)
        if (!team) {
          return { success: false, error: 'Equipo no encontrado' }
        }
        
        // Create notification
        const userNotifications = JSON.parse(localStorage.getItem(`notifications_${localUser.id}`) || '[]')
        const newNotification = {
          id: Date.now(),
          type: 'team_invitation',
          teamId: teamId,
          teamName: team.name,
          invitedBy: invitedBy,
          timestamp: new Date().toISOString(),
          read: false
        }
        userNotifications.push(newNotification)
        localStorage.setItem(`notifications_${localUser.id}`, JSON.stringify(userNotifications))
        
        return { success: true, user: localUser }
      }

      // Check if team exists
      const { data: team, error: teamError } = await supabase
        .from('teams')
        .select('id, name')
        .eq('id', teamId)
        .single()

      if (teamError) {
        // Fallback a localStorage
        const teams = JSON.parse(localStorage.getItem('fortnite_teams') || '[]')
        const localTeam = teams.find(t => t.id === teamId)
        if (!localTeam) {
          return { success: false, error: 'Equipo no encontrado' }
        }
        
        // Create notification
        const userNotifications = JSON.parse(localStorage.getItem(`notifications_${targetUser.id}`) || '[]')
        const newNotification = {
          id: Date.now(),
          type: 'team_invitation',
          teamId: teamId,
          teamName: localTeam.name,
          invitedBy: invitedBy,
          timestamp: new Date().toISOString(),
          read: false
        }
        userNotifications.push(newNotification)
        localStorage.setItem(`notifications_${targetUser.id}`, JSON.stringify(userNotifications))
        
        return { success: true, user: targetUser }
      }

      // Check if user is already a member
      const { data: existingMember } = await supabase
        .from('team_members')
        .select('id')
        .eq('team_id', teamId)
        .eq('user_id', targetUser.id)
        .single()

      if (existingMember) {
        return { success: false, error: 'El usuario ya es miembro del equipo' }
      }

      // Create notification (still using localStorage for notifications)
      const userNotifications = JSON.parse(localStorage.getItem(`notifications_${targetUser.id}`) || '[]')
      const newNotification = {
        id: Date.now(),
        type: 'team_invitation',
        teamId: teamId,
        teamName: team.name,
        invitedBy: invitedBy,
        timestamp: new Date().toISOString(),
        read: false
      }
      userNotifications.push(newNotification)
      localStorage.setItem(`notifications_${targetUser.id}`, JSON.stringify(userNotifications))
      
      return { success: true, user: targetUser }
    } catch (error) {
      console.error('Error sending team invitation:', error)
      return { success: false, error: 'Error al enviar invitación' }
    }
  },

  removeTeamMember: async (teamId, memberName) => {
    try {
      // Intentar con Supabase primero
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('username', memberName)
        .single()

      if (userError) {
        // Fallback a localStorage
        console.log('Removing team member with localStorage fallback')
        const teams = JSON.parse(localStorage.getItem('fortnite_teams') || '[]')
        const team = teams.find(t => t.id === teamId)
        if (team) {
          team.members = team.members.filter(m => m.name !== memberName)
          localStorage.setItem('fortnite_teams', JSON.stringify(teams))
        }
        return
      }

      // Remove from team_members
      const { error } = await supabase
        .from('team_members')
        .delete()
        .eq('team_id', teamId)
        .eq('user_id', user.id)

      if (error) {
        // Fallback a localStorage
        console.log('Removing team member with localStorage fallback')
        const teams = JSON.parse(localStorage.getItem('fortnite_teams') || '[]')
        const team = teams.find(t => t.id === teamId)
        if (team) {
          team.members = team.members.filter(m => m.name !== memberName)
          localStorage.setItem('fortnite_teams', JSON.stringify(teams))
        }
      }
    } catch (error) {
      console.error('Error removing team member:', error)
      // Fallback a localStorage
      const teams = JSON.parse(localStorage.getItem('fortnite_teams') || '[]')
      const team = teams.find(t => t.id === teamId)
      if (team) {
        team.members = team.members.filter(m => m.name !== memberName)
        localStorage.setItem('fortnite_teams', JSON.stringify(teams))
      }
    }
  },

  // ==================== STATS ====================

  getStats: async () => {
    // Total usuarios
    const { count: totalUsers } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
    
    // Total matches
    const { count: totalMatches } = await supabase
      .from('matches')
      .select('*', { count: 'exact', head: true })
    
    // Matches activos
    const { count: activeMatches } = await supabase
      .from('matches')
      .select('*', { count: 'exact', head: true })
      .in('status', ['pending', 'in_progress'])
    
    // Total transacciones
    const { data: transactions } = await supabase
      .from('transactions')
      .select('amount')
    
    const totalVolume = transactions?.reduce((sum, tx) => sum + tx.amount, 0) || 0
    
    return {
      totalUsers: totalUsers || 0,
      totalMatches: totalMatches || 0,
      activeMatches: activeMatches || 0,
      totalVolume
    }
  },

  // ==================== MATCH COMPLETION ====================

  // Subir screenshot de evidencia
  uploadScreenshot: async (matchId, playerId, screenshotUrl) => {
    try {
      const { data: match } = await supabase
        .from('matches')
        .select('*')
        .eq('id', matchId)
        .single()

      if (!match) throw new Error('Match no encontrado')

      // Determinar qué campo actualizar según el jugador
      const updateField = match.player1_id === playerId ? 'player1_screenshot' : 'player2_screenshot'

      const { error } = await supabase
        .from('matches')
        .update({ 
          [updateField]: screenshotUrl,
          status: 'reviewing'
        })
        .eq('id', matchId)

      if (error) throw error

      return { success: true }
    } catch (error) {
      console.error('Error uploading screenshot:', error)
      return { success: false, error: error.message }
    }
  },

  // Declarar ganador y distribuir tokens
  declareWinner: async (matchId, winnerId, moderatorId = null) => {
    try {
      const { data: match, error: matchError } = await supabase
        .from('matches')
        .select('*')
        .eq('id', matchId)
        .single()

      if (matchError || !match) throw new Error('Match no encontrado')

      // Verificar que el match esté en estado válido
      if (!['in_progress', 'reviewing', 'disputed'].includes(match.status)) {
        throw new Error('El match no puede completarse en su estado actual')
      }

      // Determinar perdedor
      const loserId = match.player1_id === winnerId ? match.player2_id : match.player1_id
      const prize = match.bet_amount * 2 // Duplicar apuesta

      // Actualizar match
      const { error: updateMatchError } = await supabase
        .from('matches')
        .update({
          winner_id: winnerId,
          status: 'completed',
          completed_at: new Date().toISOString(),
          moderator_id: moderatorId
        })
        .eq('id', matchId)

      if (updateMatchError) throw updateMatchError

      // Actualizar estadísticas del ganador
      const { data: winner } = await supabase
        .from('users')
        .select('*')
        .eq('id', winnerId)
        .single()

      if (winner) {
        await supabase
          .from('users')
          .update({
            tokens: winner.tokens + prize,
            wins: winner.wins + 1,
            current_streak: winner.current_streak + 1,
            best_streak: Math.max(winner.best_streak || 0, winner.current_streak + 1),
            total_earned: winner.total_earned + prize,
            experience: winner.experience + 50 // XP por victoria
          })
          .eq('id', winnerId)

        // Crear transacción de ganancia
        await supabase
          .from('transactions')
          .insert({
            user_id: winnerId,
            type: 'bet_win',
            amount: prize,
            description: `Victoria en match (${match.game_mode})`,
            match_id: matchId
          })
      }

      // Actualizar estadísticas del perdedor
      const { data: loser } = await supabase
        .from('users')
        .select('*')
        .eq('id', loserId)
        .single()

      if (loser) {
        await supabase
          .from('users')
          .update({
            losses: loser.losses + 1,
            current_streak: 0,
            experience: loser.experience + 10 // XP por participación
          })
          .eq('id', loserId)

        // Crear transacción de pérdida
        await supabase
          .from('transactions')
          .insert({
            user_id: loserId,
            type: 'bet_loss',
            amount: match.bet_amount,
            description: `Derrota en match (${match.game_mode})`,
            match_id: matchId
          })
      }

      return { success: true, winnerId, prize }
    } catch (error) {
      console.error('Error declaring winner:', error)
      return { success: false, error: error.message }
    }
  },

  // Iniciar match (cuando ambos jugadores están listos)
  startMatch: async (matchId) => {
    try {
      const { error } = await supabase
        .from('matches')
        .update({
          status: 'in_progress',
          started_at: new Date().toISOString()
        })
        .eq('id', matchId)

      if (error) throw error
      return { success: true }
    } catch (error) {
      console.error('Error starting match:', error)
      return { success: false, error: error.message }
    }
  },

  // ==================== DISPUTES ====================

  // Crear disputa
  createDispute: async (matchId, reporterId, reason, evidence = null) => {
    try {
      // Actualizar estado del match
      const { error: matchError } = await supabase
        .from('matches')
        .update({
          status: 'disputed',
          dispute_reason: reason
        })
        .eq('id', matchId)

      if (matchError) throw matchError

      // Crear reporte
      const { data: report, error: reportError } = await supabase
        .from('reports')
        .insert({
          match_id: matchId,
          reporter_id: reporterId,
          reason: reason,
          evidence: evidence,
          status: 'pending'
        })
        .select()
        .single()

      if (reportError) throw reportError

      return { success: true, report }
    } catch (error) {
      console.error('Error creating dispute:', error)
      return { success: false, error: error.message }
    }
  },

  // Obtener disputas pendientes (para moderadores)
  getPendingDisputes: async () => {
    try {
      const { data, error } = await supabase
        .from('reports')
        .select(`
          *,
          match:matches(*),
          reporter:users!reports_reporter_id_fkey(username, email)
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error getting disputes:', error)
      return []
    }
  },

  // Obtener todos los reportes (moderadores)
  getAllReports: async () => {
    try {
      const { data, error } = await supabase
        .from('reports')
        .select(`
          *,
          match:matches(*),
          reporter:users!reports_reporter_id_fkey(id, username, email),
          reported_user:users!reports_reported_user_id_fkey(id, username, email)
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error getting reports:', error)
      return []
    }
  },

  // Resolver disputa (moderador)
  resolveDispute: async (reportId, resolution, moderatorId, winnerId = null) => {
    try {
      // Actualizar reporte
      const { data: report, error: reportError } = await supabase
        .from('reports')
        .update({
          status: 'resolved',
          resolution: resolution,
          resolved_by: moderatorId,
          resolved_at: new Date().toISOString()
        })
        .eq('id', reportId)
        .select()
        .single()

      if (reportError) throw reportError

      // Si se proporcionó un ganador, declararlo
      if (winnerId && report.match_id) {
        await db.declareWinner(report.match_id, winnerId, moderatorId)
      } else if (report.match_id) {
        // Si no hay ganador, cancelar el match y devolver tokens
        const { data: match } = await supabase
          .from('matches')
          .select('*')
          .eq('id', report.match_id)
          .single()

        if (match) {
          // Devolver tokens a ambos jugadores
          await supabase
            .from('users')
            .update({
              tokens: supabase.rpc('increment', { x: match.bet_amount })
            })
            .in('id', [match.player1_id, match.player2_id])

          // Actualizar match a cancelado
          await supabase
            .from('matches')
            .update({
              status: 'cancelled',
              dispute_resolved: true
            })
            .eq('id', report.match_id)
        }
      }

      return { success: true, report }
    } catch (error) {
      console.error('Error resolving dispute:', error)
      return { success: false, error: error.message }
    }
  },

  // ==================== WITHDRAWALS ====================

  // Solicitar retiro
  requestWithdrawal: async (userId, amount, method, accountInfo) => {
    try {
      // Verificar saldo del usuario
      const { data: user } = await supabase
        .from('users')
        .select('tokens')
        .eq('id', userId)
        .single()

      if (!user || user.tokens < amount) {
        throw new Error('Saldo insuficiente')
      }

      // Mínimo de retiro: 10 tokens
      if (amount < 10) {
        throw new Error('El retiro mínimo es de 10 tokens')
      }

      // Crear solicitud de retiro
      const { data: withdrawal, error } = await supabase
        .from('withdrawals')
        .insert({
          user_id: userId,
          amount: amount,
          method: method,
          account_info: accountInfo,
          status: 'pending'
        })
        .select()
        .single()

      if (error) throw error

      // Congelar tokens (restarlos temporalmente)
      await supabase
        .from('users')
        .update({
          tokens: user.tokens - amount
        })
        .eq('id', userId)

      return { success: true, withdrawal }
    } catch (error) {
      console.error('Error requesting withdrawal:', error)
      return { success: false, error: error.message }
    }
  },

  // Obtener retiros pendientes (admin)
  getPendingWithdrawals: async () => {
    try {
      const { data, error } = await supabase
        .from('withdrawals')
        .select(`
          *,
          user:users(id, username, email)
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error getting withdrawals:', error)
      return []
    }
  },

  // Obtener retiros de un usuario
  getUserWithdrawals: async (userId) => {
    try {
      const { data, error } = await supabase
        .from('withdrawals')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error getting user withdrawals:', error)
      return []
    }
  },

  // Aprobar retiro (admin)
  approveWithdrawal: async (withdrawalId, adminId) => {
    try {
      const { data: withdrawal, error } = await supabase
        .from('withdrawals')
        .update({
          status: 'completed',
          processed_by: adminId,
          processed_at: new Date().toISOString()
        })
        .eq('id', withdrawalId)
        .select()
        .single()

      if (error) throw error

      // Crear transacción
      await supabase
        .from('transactions')
        .insert({
          user_id: withdrawal.user_id,
          type: 'withdrawal',
          amount: withdrawal.amount,
          description: `Retiro procesado (${withdrawal.method})`
        })

      return { success: true, withdrawal }
    } catch (error) {
      console.error('Error approving withdrawal:', error)
      return { success: false, error: error.message }
    }
  },

  // Rechazar retiro (admin)
  rejectWithdrawal: async (withdrawalId, adminId, reason) => {
    try {
      const { data: withdrawal, error } = await supabase
        .from('withdrawals')
        .update({
          status: 'rejected',
          rejection_reason: reason,
          processed_by: adminId,
          processed_at: new Date().toISOString()
        })
        .eq('id', withdrawalId)
        .select()
        .single()

      if (error) throw error

      // Devolver tokens al usuario
      const { data: user } = await supabase
        .from('users')
        .select('tokens')
        .eq('id', withdrawal.user_id)
        .single()

      if (user) {
        await supabase
          .from('users')
          .update({
            tokens: user.tokens + withdrawal.amount
          })
          .eq('id', withdrawal.user_id)
      }

      return { success: true, withdrawal }
    } catch (error) {
      console.error('Error rejecting withdrawal:', error)
      return { success: false, error: error.message }
    }
  },

  // ==================== ADMIN PANEL ====================

  // Obtener todos los usuarios (admin)
  getAllUsers: async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error getting users:', error)
      return []
    }
  },

  // Banear/desbanear usuario (admin)
  banUser: async (userId, bannedUntil, reason) => {
    try {
      const { error } = await supabase
        .from('users')
        .update({
          banned_until: bannedUntil,
          ban_reason: reason
        })
        .eq('id', userId)

      if (error) throw error
      return { success: true }
    } catch (error) {
      console.error('Error banning user:', error)
      return { success: false, error: error.message }
    }
  },

  // Ajustar tokens manualmente (admin)
  adjustTokens: async (userId, amount, reason, adminId) => {
    try {
      const { data: user } = await supabase
        .from('users')
        .select('tokens')
        .eq('id', userId)
        .single()

      if (!user) throw new Error('Usuario no encontrado')

      const newBalance = Math.max(0, user.tokens + amount)

      await supabase
        .from('users')
        .update({ tokens: newBalance })
        .eq('id', userId)

      // Crear transacción
      await supabase
        .from('transactions')
        .insert({
          user_id: userId,
          type: 'admin_adjustment',
          amount: amount,
          description: reason
        })

      return { success: true, newBalance }
    } catch (error) {
      console.error('Error adjusting tokens:', error)
      return { success: false, error: error.message }
    }
  },

  // Obtener historial de matches de un usuario
  getUserMatchHistory: async (userId) => {
    try {
      const { data, error } = await supabase
        .from('matches')
        .select(`
          *,
          player1:player1_id(id, username),
          player2:player2_id(id, username),
          winner:winner_id(id, username)
        `)
        .or(`player1_id.eq.${userId},player2_id.eq.${userId}`)
        .order('created_at', { ascending: false })
        .limit(20)

      if (error) {
        console.log('Using localStorage fallback for match history')
        // Fallback to localStorage
        const matches = JSON.parse(localStorage.getItem('fortnite_matches') || '[]')
        return matches.filter(m => 
          m.players && m.players.some(p => p.id === userId)
        ).slice(0, 20)
      }

      return data || []
    } catch (error) {
      console.error('Error getting match history:', error)
      // Fallback to localStorage
      const matches = JSON.parse(localStorage.getItem('fortnite_matches') || '[]')
      return matches.filter(m => 
        m.players && m.players.some(p => p.id === userId)
      ).slice(0, 20)
    }
  },

  // Actualizar cuentas conectadas de redes sociales
  updateSocialAccounts: async (userId, socialData) => {
    try {
      const { error } = await supabase
        .from('users')
        .update({
          epic_games_name: socialData.epicGames || null,
          discord_username: socialData.discord || null,
          twitter_handle: socialData.twitter || null,
          twitch_username: socialData.twitch || null,
          tiktok_handle: socialData.tiktok || null
        })
        .eq('id', userId)

      if (error) {
        console.log('Using localStorage fallback for social accounts')
        // Fallback to localStorage
        localStorage.setItem(`social_links_${userId}`, JSON.stringify(socialData))
        return { success: true }
      }

      // También guardar en localStorage para compatibilidad
      localStorage.setItem(`social_links_${userId}`, JSON.stringify(socialData))

      // Actualizar sesión
      const session = JSON.parse(localStorage.getItem('fortnite_platform_session') || '{}')
      if (session.id === userId) {
        session.epic_games_name = socialData.epicGames
        session.discord_username = socialData.discord
        session.twitter_handle = socialData.twitter
        session.twitch_username = socialData.twitch
        session.tiktok_handle = socialData.tiktok
        localStorage.setItem('fortnite_platform_session', JSON.stringify(session))
      }

      return { success: true }
    } catch (error) {
      console.error('Error updating social accounts:', error)
      // Fallback to localStorage
      localStorage.setItem(`social_links_${userId}`, JSON.stringify(socialData))
      return { success: true }
    }
  },

  // Obtener cuentas conectadas de un usuario
  getSocialAccounts: async (userId) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('epic_games_name, discord_username, twitter_handle, twitch_username, tiktok_handle')
        .eq('id', userId)
        .single()

      if (error) {
        // Fallback to localStorage
        const savedLinks = JSON.parse(localStorage.getItem(`social_links_${userId}`) || '{}')
        return savedLinks
      }

      return {
        epicGames: data.epic_games_name || '',
        discord: data.discord_username || '',
        twitter: data.twitter_handle || '',
        twitch: data.twitch_username || '',
        tiktok: data.tiktok_handle || ''
      }
    } catch (error) {
      console.error('Error getting social accounts:', error)
      const savedLinks = JSON.parse(localStorage.getItem(`social_links_${userId}`) || '{}')
      return savedLinks
    }
  }
}

export default db
