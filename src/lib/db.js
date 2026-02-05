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

      // Crear usuario en Auth (el trigger se encarga del resto)
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { username }
        }
      })
      
      if (authError) throw authError
      
      // Esperar y reintentar hasta 5 veces para obtener el usuario creado por el trigger
      let userData = null
      let attempts = 0
      const maxAttempts = 5
      
      while (attempts < maxAttempts && !userData) {
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', authData.user.id)
          .single()
        
        if (!error && data) {
          userData = data
          break
        }
        
        attempts++
      }
      
      if (!userData) {
        throw new Error('Usuario creado pero no se pudo obtener el perfil. Intenta iniciar sesión.')
      }
      
      // Actualizar el username si es diferente
      if (userData.username !== username) {
        const { data: updatedUser, error: updateError } = await supabase
          .from('users')
          .update({ username })
          .eq('id', authData.user.id)
          .select()
          .single()
        
        if (updateError) throw updateError
        
        // Guardar sesión en localStorage para compatibilidad
        localStorage.setItem('fortnite_platform_session', JSON.stringify(updatedUser))
        return updatedUser
      }
      
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
  },

  // ==================== FUNCIONES ADICIONALES ====================
  
  // Alias para compatibilidad
  getMatch: async (matchId) => db.getMatchById(matchId),
  
  addTokens: async (amount, cost) => {
    const session = db.getSession()
    if (!session) throw new Error('No hay sesión activa')
    
    const { data, error } = await supabase
      .from('users')
      .update({ 
        tokens: supabase.raw(`tokens + ${amount}`)
      })
      .eq('id', session.id)
      .select()
      .single()
    
    if (error) throw error
    
    // Crear transacción
    await db.createTransaction({
      user_id: session.id,
      type: 'purchase',
      amount: amount,
      description: `Compra de ${amount} tokens por $${cost}`
    })
    
    // Actualizar sesión
    localStorage.setItem('fortnite_platform_session', JSON.stringify(data))
    
    return data
  },
  
  getUserStatistics: async (userId) => {
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()
    
    if (error) throw error
    
    return {
      wins: user.wins || 0,
      losses: user.losses || 0,
      totalEarned: user.total_earned || 0,
      totalPlayed: user.total_played || 0,
      winRate: user.total_played > 0 ? ((user.wins / user.total_played) * 100).toFixed(1) : 0,
      currentStreak: user.current_streak || 0,
      bestStreak: user.best_streak || 0
    }
  },
  
  getUserMatchHistory: async (userId) => {
    const { data, error } = await supabase
      .from('matches')
      .select('*')
      .or(`player1_id.eq.${userId},player2_id.eq.${userId}`)
      .order('created_at', { ascending: false })
      .limit(20)
    
    if (error) throw error
    return data || []
  },
  
  addMatchToHistory: async (userId, matchData) => {
    // Con Supabase esto no es necesario, los matches ya están vinculados por player_id
    return { success: true }
  },
  
  updatePlayerReady: async (matchId, playerId, readyStatus) => {
    const { data: match } = await supabase
      .from('matches')
      .select('*')
      .eq('id', matchId)
      .single()
    
    if (!match) throw new Error('Match no encontrado')
    
    const updates = {}
    if (match.player1_id === playerId) {
      updates.player1_ready = readyStatus
    } else if (match.player2_id === playerId) {
      updates.player2_ready = readyStatus
    }
    
    const { data, error } = await supabase
      .from('matches')
      .update(updates)
      .eq('id', matchId)
      .select()
      .single()
    
    if (error) throw error
    return data
  },
  
  addTeamMember: (teamId, username) => {
    const session = db.getSession()
    if (!session) return { error: 'No hay sesión' }
    
    const users = JSON.parse(localStorage.getItem('fortnite_platform_users') || '[]')
    const user = users.find(u => u.username === username)
    if (!user) return { error: 'Usuario no encontrado' }
    
    const teams = JSON.parse(localStorage.getItem('fortnite_platform_teams') || '[]')
    const teamIndex = teams.findIndex(t => t.id === teamId)
    if (teamIndex === -1) return { error: 'Equipo no encontrado' }
    
    if (teams[teamIndex].members.length >= 4) {
      return { error: 'El equipo está lleno (máximo 4 miembros)' }
    }
    
    teams[teamIndex].members.push(username)
    localStorage.setItem('fortnite_platform_teams', JSON.stringify(teams))
    
    return { success: true, team: teams[teamIndex] }
  },
  
  getDisputedMatches: async () => {
    const { data, error } = await supabase
      .from('matches')
      .select('*')
      .eq('status', 'disputed')
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data || []
  },
  
  getAllReports: async () => {
    const { data, error } = await supabase
      .from('reports')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data || []
  },
  
  getPendingWithdrawals: async () => {
    const { data, error } = await supabase
      .from('withdrawals')
      .select(`
        *,
        users!withdrawals_user_id_fkey(username, email)
      `)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
    
    if (error) throw error
    
    return (data || []).map(w => ({
      ...w,
      userName: w.users?.username,
      userEmail: w.users?.email
    }))
  },
  
  banUser: async (userId, days, reason) => {
    const bannedUntil = new Date()
    bannedUntil.setDate(bannedUntil.getDate() + days)
    
    const { data, error } = await supabase
      .from('users')
      .update({ 
        banned_until: bannedUntil.toISOString()
      })
      .eq('id', userId)
      .select()
      .single()
    
    if (error) throw error
    return { success: true, user: data }
  },
  
  unbanUser: async (userId) => {
    const { data, error } = await supabase
      .from('users')
      .update({ 
        banned_until: null
      })
      .eq('id', userId)
      .select()
      .single()
    
    if (error) throw error
    return { success: true, user: data }
  },
  
  deleteUser: async (userId) => {
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', userId)
    
    if (error) throw error
    return { success: true }
  },
  
  getUserStats: async (userId) => {
    return db.getUserStatistics(userId)
  },

  // ==================== FUNCIONES DE MODERACIÓN AVANZADA ====================
  
  // Resolver disputa de match (moderador)
  resolveDispute: async (matchId, winnerId, moderatorId, notes = '') => {
    const { data, error } = await supabase
      .from('matches')
      .update({
        status: 'completed',
        winner_id: winnerId,
        moderator_id: moderatorId,
        dispute_resolved: true,
        dispute_resolution: notes,
        completed_at: new Date().toISOString()
      })
      .eq('id', matchId)
      .select()
      .single()
    
    if (error) throw error
    
    // Actualizar estadísticas de los jugadores
    const match = data
    const loserId = match.player1_id === winnerId ? match.player2_id : match.player1_id
    
    // Winner gana tokens
    await supabase.rpc('increment_user_stats', {
      p_user_id: winnerId,
      p_tokens: match.bet_amount,
      p_wins: 1,
      p_total_played: 1,
      p_earnings: match.bet_amount
    })
    
    // Loser pierde
    await supabase.rpc('increment_user_stats', {
      p_user_id: loserId,
      p_tokens: 0,
      p_wins: 0,
      p_losses: 1,
      p_total_played: 1,
      p_earnings: 0
    })
    
    return { success: true, match: data }
  },
  
  // Cancelar match (moderador/admin)
  cancelMatch: async (matchId, reason, moderatorId) => {
    const { data: match } = await supabase
      .from('matches')
      .select('*')
      .eq('id', matchId)
      .single()
    
    if (!match) throw new Error('Match no encontrado')
    
    // Devolver tokens a ambos jugadores si es necesario
    if (match.status !== 'pending') {
      if (match.player1_id) {
        await supabase.rpc('increment_user_stats', {
          p_user_id: match.player1_id,
          p_tokens: match.bet_amount,
          p_wins: 0,
          p_losses: 0,
          p_total_played: 0,
          p_earnings: 0
        })
      }
      
      if (match.player2_id) {
        await supabase.rpc('increment_user_stats', {
          p_user_id: match.player2_id,
          p_tokens: match.bet_amount,
          p_wins: 0,
          p_losses: 0,
          p_total_played: 0,
          p_earnings: 0
        })
      }
    }
    
    const { data, error } = await supabase
      .from('matches')
      .update({
        status: 'cancelled',
        moderator_id: moderatorId,
        dispute_reason: reason,
        completed_at: new Date().toISOString()
      })
      .eq('id', matchId)
      .select()
      .single()
    
    if (error) throw error
    return { success: true, match: data }
  },
  
  // Forzar resultado de match (admin)
  forceMatchResult: async (matchId, winnerId, adminId, reason) => {
    return db.resolveDispute(matchId, winnerId, adminId, `[ADMIN] ${reason}`)
  },
  
  // Revisar reporte (moderador/admin)
  reviewReport: async (reportId, action, reviewerId, resolution) => {
    const { data, error } = await supabase
      .from('reports')
      .update({
        status: action, // 'resolved', 'dismissed'
        reviewed_by: reviewerId,
        resolution: resolution,
        reviewed_at: new Date().toISOString()
      })
      .eq('id', reportId)
      .select()
      .single()
    
    if (error) throw error
    
    // Si el reporte es aprobado, tomar acción contra el usuario reportado
    if (action === 'resolved') {
      const report = data
      // Incrementar contador de reportes del usuario
      await supabase
        .from('users')
        .update({
          reported_count: supabase.raw('reported_count + 1')
        })
        .eq('id', report.reported_user_id)
    }
    
    return { success: true, report: data }
  },
  
  // Aprobar retiro (admin)
  approveWithdrawal: async (withdrawalId, adminId, notes = '') => {
    const { data, error } = await supabase
      .from('withdrawals')
      .update({
        status: 'approved',
        reviewed_by: adminId,
        admin_notes: notes,
        reviewed_at: new Date().toISOString()
      })
      .eq('id', withdrawalId)
      .select()
      .single()
    
    if (error) throw error
    return { success: true, withdrawal: data }
  },
  
  // Rechazar retiro (admin)
  rejectWithdrawal: async (withdrawalId, adminId, reason) => {
    const { data: withdrawal } = await supabase
      .from('withdrawals')
      .select('*')
      .eq('id', withdrawalId)
      .single()
    
    if (!withdrawal) throw new Error('Retiro no encontrado')
    
    // Devolver tokens al usuario
    await supabase.rpc('increment_user_stats', {
      p_user_id: withdrawal.user_id,
      p_tokens: withdrawal.amount,
      p_wins: 0,
      p_losses: 0,
      p_total_played: 0,
      p_earnings: 0
    })
    
    const { data, error } = await supabase
      .from('withdrawals')
      .update({
        status: 'rejected',
        reviewed_by: adminId,
        admin_notes: reason,
        reviewed_at: new Date().toISOString()
      })
      .eq('id', withdrawalId)
      .select()
      .single()
    
    if (error) throw error
    return { success: true, withdrawal: data }
  },
  
  // Marcar retiro como completado (admin)
  completeWithdrawal: async (withdrawalId, adminId, notes = '') => {
    const { data, error } = await supabase
      .from('withdrawals')
      .update({
        status: 'completed',
        reviewed_by: adminId,
        admin_notes: notes,
        completed_at: new Date().toISOString()
      })
      .eq('id', withdrawalId)
      .select()
      .single()
    
    if (error) throw error
    return { success: true, withdrawal: data }
  },
  
  // Procesar retiro (alias para compatibilidad)
  processWithdrawal: async (userId, withdrawalId, action) => {
    const session = db.getSession()
    if (!session) throw new Error('No hay sesión activa')
    
    if (action === 'completed') {
      return db.completeWithdrawal(withdrawalId, session.id, 'Procesado')
    } else if (action === 'failed' || action === 'rejected') {
      return db.rejectWithdrawal(withdrawalId, session.id, 'Rechazado')
    }
  },
  
  // ==================== FUNCIONES DE ADMINISTRACIÓN ====================
  
  // Cambiar rol de usuario (admin)
  changeUserRole: async (userId, newRole, adminId) => {
    if (!['user', 'moderator', 'admin'].includes(newRole)) {
      throw new Error('Rol inválido')
    }
    
    const { data, error } = await supabase
      .from('users')
      .update({ role: newRole })
      .eq('id', userId)
      .select()
      .single()
    
    if (error) throw error
    return { success: true, user: data }
  },
  
  // Ajustar tokens de usuario (admin)
  adjustUserTokens: async (userId, amount, reason, adminId) => {
    const { data: user } = await supabase
      .from('users')
      .select('tokens')
      .eq('id', userId)
      .single()
    
    const newAmount = (user?.tokens || 0) + amount
    
    const { data, error } = await supabase
      .from('users')
      .update({ tokens: newAmount })
      .eq('id', userId)
      .select()
      .single()
    
    if (error) throw error
    
    // Crear transacción de ajuste
    await db.createTransaction({
      user_id: userId,
      type: 'admin_adjustment',
      amount: amount,
      description: `Ajuste de admin: ${reason}`,
      metadata: { admin_id: adminId }
    })
    
    return { success: true, user: data }
  },
  
  // Resetear estadísticas de usuario (admin)
  resetUserStats: async (userId, adminId, reason) => {
    const { data, error } = await supabase
      .from('users')
      .update({
        wins: 0,
        losses: 0,
        total_played: 0,
        earnings: 0,
        total_earned: 0,
        current_streak: 0,
        best_streak: 0,
        reported_count: 0
      })
      .eq('id', userId)
      .select()
      .single()
    
    if (error) throw error
    return { success: true, user: data }
  },
  
  // Cambiar email de usuario (admin)
  changeUserEmail: async (userId, newEmail, adminId) => {
    // Actualizar en auth
    const { error: authError } = await supabase.auth.admin.updateUserById(
      userId,
      { email: newEmail }
    )
    
    if (authError) throw authError
    
    const { data, error } = await supabase
      .from('users')
      .update({ email: newEmail })
      .eq('id', userId)
      .select()
      .single()
    
    if (error) throw error
    return { success: true, user: data }
  },
  
  // Cambiar username (admin)
  changeUserUsername: async (userId, newUsername, adminId) => {
    // Verificar que no exista
    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .eq('username', newUsername)
      .single()
    
    if (existing && existing.id !== userId) {
      throw new Error('Username ya existe')
    }
    
    const { data, error } = await supabase
      .from('users')
      .update({ username: newUsername })
      .eq('id', userId)
      .select()
      .single()
    
    if (error) throw error
    return { success: true, user: data }
  },
  
  // Resetear contraseña de usuario (admin)
  resetUserPassword: async (userId, newPassword, adminId) => {
    const { error } = await supabase.auth.admin.updateUserById(
      userId,
      { password: newPassword }
    )
    
    if (error) throw error
    return { success: true }
  },
  
  // Eliminar mensaje de chat (moderador)
  deleteMessage: async (messageId, moderatorId, reason) => {
    return db.deleteChatMessage(messageId, moderatorId, reason)
  },
  
  // Obtener todos los matches (moderador)
  getAllMatches: async (filters = {}) => {
    let query = supabase
      .from('matches')
      .select(`
        *,
        player1:users!matches_player1_id_fkey(id, username, email),
        player2:users!matches_player2_id_fkey(id, username, email),
        winner:users!matches_winner_id_fkey(id, username),
        moderator:users!matches_moderator_id_fkey(id, username)
      `)
      .order('created_at', { ascending: false })
    
    if (filters.status) {
      query = query.eq('status', filters.status)
    }
    
    if (filters.limit) {
      query = query.limit(filters.limit)
    }
    
    const { data, error } = await query
    
    if (error) throw error
    return data || []
  },
  
  // Estadísticas globales usando RPC (admin)
  getGlobalStatsAdmin: async () => {
    try {
      const { data, error } = await supabase.rpc('get_global_stats')
      if (error) throw error
      return data || {}
    } catch (error) {
      console.error('Error getting global stats:', error)
      // Fallback
      const stats = await db.getStats()
      return stats
    }
  },
  
  // Obtener usuarios por rol (admin)
  getUsersByRole: async (role) => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('role', role)
      .order('username')
    
    if (error) throw error
    return data || []
  },
  
  // Obtener usuarios suspendidos (admin)
  getBannedUsers: async () => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .not('banned_until', 'is', null)
      .gte('banned_until', new Date().toISOString())
      .order('banned_until', { ascending: false })
    
    if (error) throw error
    return data || []
  },
  
  // Obtener actividad reciente (admin)
  getRecentActivity: async (limit = 50) => {
    const { data, error } = await supabase
      .from('transactions')
      .select(`
        *,
        user:users!transactions_user_id_fkey(username, email)
      `)
      .order('created_at', { ascending: false })
      .limit(limit)
    
    if (error) throw error
    return data || []
  },
  
  // Obtener reportes pendientes (moderador)
  getPendingReports: async () => {
    const { data, error } = await supabase
      .from('reports')
      .select(`
        *,
        reporter:users!reports_reporter_id_fkey(id, username),
        reported:users!reports_reported_user_id_fkey(id, username),
        match:matches(id, game_mode, status)
      `)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data || []
  },
  
  // Buscar usuarios (admin)
  searchUsers: async (searchTerm) => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .or(`username.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`)
      .order('username')
      .limit(20)
    
    if (error) throw error
    return data || []
  },
  
  // Obtener historial completo de usuario (admin)
  getUserHistory: async (userId) => {
    const [user, matches, transactions, withdrawals, reports] = await Promise.all([
      db.getUserById(userId),
      db.getUserMatchHistory(userId),
      db.getTransactions(userId),
      db.getWithdrawals(userId),
      supabase.from('reports').select('*').eq('reported_user_id', userId)
    ])
    
    return {
      user,
      matches: matches || [],
      transactions: transactions || [],
      withdrawals: withdrawals || [],
      reports: reports.data || []
    }
  },
  
  // Distribuir premio de match
  distributeMatchPrize: async (matchId, winnerId) => {
    const { data: match } = await supabase
      .from('matches')
      .select('bet_amount')
      .eq('id', matchId)
      .single()
    
    if (!match) throw new Error('Match no encontrado')
    
    const prize = match.bet_amount * 2 // El ganador recibe el doble de la apuesta
    
    await supabase.rpc('increment_user_stats', {
      p_user_id: winnerId,
      p_tokens: prize,
      p_wins: 0,
      p_losses: 0,
      p_total_played: 0,
      p_earnings: match.bet_amount
    })
    
    return { success: true, prize }
  },

  // ==================== FUNCIONES ONLINE ====================
  
  // Actualizar usuario como online
  updateOnlineStatus: async () => {
    try {
      const { error } = await supabase.rpc('update_online_users')
      if (error) throw error
      return { success: true }
    } catch (error) {
      console.error('Error updating online status:', error)
      return { success: false, error: error.message }
    }
  },

  // Obtener usuarios online
  getOnlineUsers: async () => {
    try {
      const { data, error } = await supabase.rpc('get_online_users')
      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error getting online users:', error)
      return []
    }
  },

  // Obtener estadísticas globales
  getGlobalStats: async () => {
    try {
      const { data, error } = await supabase.rpc('get_global_stats')
      if (error) throw error
      return data || {}
    } catch (error) {
      console.error('Error getting global stats:', error)
      return {}
    }
  }
}

export default db
