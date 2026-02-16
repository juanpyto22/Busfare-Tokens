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
        .single()
      
      if (userError) throw userError
      
      // Actualizar último login
      await supabase.from('users').update({ 
        last_login: new Date().toISOString() 
      }).eq('id', data.user.id)
      
      // Guardar sesión en localStorage para compatibilidad
      localStorage.setItem('fortnite_platform_session', JSON.stringify(userData))
      
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
        .single()
      
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
          experience: 0,
          reputation: 100,
          trust_score: 100,
          reported_count: 0,
          email_verified: false,
          two_factor_enabled: false
        })
        .select()
        .single()
      
      if (userError) throw userError
      
      // Guardar sesión en localStorage para compatibilidad
      localStorage.setItem('fortnite_platform_session', JSON.stringify(userData))
      
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
    const { data, error } = await supabase
      .from('matches')
      .insert(matchData)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  getMatches: async (filters = {}) => {
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
    
    if (error) throw error
    return data
  },

  getMatchById: async (matchId) => {
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
    return data
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

  deleteMatch: async (matchId) => {
    const { error } = await supabase
      .from('matches')
      .delete()
      .eq('id', matchId)
    
    if (error) throw error
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
    // Por ahora usamos localStorage hasta que implementemos teams en Supabase
    const teams = JSON.parse(localStorage.getItem('fortnite_teams') || '[]')
    if (userId) {
      return teams.filter(team => 
        team.members.some(member => member.id === userId)
      )
    }
    return teams
  },

  createTeam: (name) => {
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
  },

  deleteTeam: (teamId) => {
    const teams = JSON.parse(localStorage.getItem('fortnite_teams') || '[]')
    const filteredTeams = teams.filter(t => t.id !== teamId)
    localStorage.setItem('fortnite_teams', JSON.stringify(filteredTeams))
  },

  sendTeamInvitation: (teamId, username, invitedBy) => {
    const users = JSON.parse(localStorage.getItem('fortnite_platform_users') || '[]')
    const targetUser = users.find(u => u.username.toLowerCase() === username.toLowerCase())
    
    if (!targetUser) {
      return { success: false, error: 'Usuario no encontrado' }
    }

    const teams = JSON.parse(localStorage.getItem('fortnite_teams') || '[]')
    const team = teams.find(t => t.id === teamId)
    
    if (!team) {
      return { success: false, error: 'Equipo no encontrado' }
    }

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
  },

  removeTeamMember: (teamId, memberName) => {
    const teams = JSON.parse(localStorage.getItem('fortnite_teams') || '[]')
    const team = teams.find(t => t.id === teamId)
    if (team) {
      team.members = team.members.filter(m => m.name !== memberName)
      localStorage.setItem('fortnite_teams', JSON.stringify(teams))
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
  }
}

export default db
