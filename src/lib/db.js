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
    console.log('=== INICIANDO CREACIÓN DE MATCH ===');
    console.log('Datos recibidos:', matchData);
    
    try {
      // Verificar sesión de Supabase Auth primero
      const { data: authData } = await supabase.auth.getSession()
      const supabaseSession = authData?.session
      
      // También obtener sesión local
      const localSession = db.getSession()
      
      console.log('Sesión Supabase Auth:', supabaseSession?.user?.id);
      console.log('Sesión Local:', localSession?.id);
      
      // Usar el ID de Supabase Auth si está disponible, sino el local
      const userId = supabaseSession?.user?.id || localSession?.id
      const username = localSession?.username || supabaseSession?.user?.email?.split('@')[0]
      
      if (!userId) {
        console.error('No hay sesión activa');
        throw new Error('Debes iniciar sesión para crear un match')
      }

      console.log('Usando userId:', userId);
      console.log('Usando username:', username);

      // Verificar que el usuario existe en la tabla users
      const { data: userExists, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('id', userId)
        .single()
      
      if (userError || !userExists) {
        console.error('Usuario no encontrado en tabla users:', userError);
        throw new Error('Tu cuenta no está sincronizada. Por favor, cierra sesión y vuelve a iniciar sesión.')
      }

      console.log('Usuario verificado en DB:', userExists.id);
      console.log('Creando match en Supabase...');
      
      // Datos para insertar en Supabase
      const supabaseData = {
        game_mode: matchData.mode || 'REALISTIC',
        bet_amount: Math.floor((matchData.entryFee || 0.5) * 100),
        region: matchData.region || 'EU',
        match_type: matchData.type || '1v1',
        player1_id: userId,
        status: 'pending',
        team1_id: matchData.teamId || null,
        metadata: {
          rounds: matchData.rounds || 5,
          platform: matchData.platform || 'ANY',
          shotgun: matchData.shotgun || 'META LOOT',
          mapCode: matchData.mapCode || '0000-0000-0000'
        }
      }
      
      console.log('Datos para Supabase:', supabaseData);

      const { data, error } = await supabase
        .from('matches')
        .insert(supabaseData)
        .select(`
          *,
          player1:player1_id(id, username)
        `)
        .single()

      if (error) {
        console.error('❌ ERROR DE SUPABASE:', error);
        throw new Error(`Error al crear match: ${error.message}`)
      }

      console.log('✅ Match creado en Supabase con ID:', data.id);

      // Formato para la UI
      const result = {
        id: data.id,
        createdAt: new Date(data.created_at).getTime(),
        type: data.match_type || matchData.type || '1v1',
        mode: data.game_mode,
        region: data.region,
        platform: data.metadata?.platform || 'ANY',
        shotgun: data.metadata?.shotgun || 'META LOOT',
        rounds: data.metadata?.rounds || 5,
        firstTo: data.metadata?.rounds || 5,
        entryFee: data.bet_amount / 100,
        prize: (data.bet_amount / 100) * 1.9,
        status: data.status,
        hostId: userId,
        hostName: username || data.player1?.username,
        players: [{
          id: userId,
          name: username || data.player1?.username
        }],
        maxPlayers: (data.match_type || '1v1') === '1v1' ? 2 : (data.match_type || '1v1') === '2v2' ? 4 : 8,
        chat: [],
        playersReady: {},
        tags: ['CUSTOM'],
        mapCode: data.metadata?.mapCode || '0000-0000-0000',
        teamId: data.team1_id
      }
      
      console.log('=== MATCH CREADO EXITOSAMENTE ===');
      return result;
      
    } catch (error) {
      console.error('=== ERROR AL CREAR MATCH ===', error);
      throw new Error(error.message || 'Error al crear el match')
    }
  },

  getMatches: async (filters = {}) => {
    try {
      console.log('=== OBTENIENDO MATCHES DE SUPABASE ===');
      
      // Query Supabase for matches
      let query = supabase.from('matches').select(`
        *,
        player1:player1_id(id, username),
        player2:player2_id(id, username),
        winner:winner_id(id, username),
        moderator:moderator_id(id, username)
      `)
      
      // Apply filters if provided
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
        console.error('❌ ERROR OBTENIENDO MATCHES DE SUPABASE:', error)
        console.error('Código:', error.code);
        console.error('Detalles:', error.details);
        console.error('Hint:', error.hint);
        throw new Error(`Error al obtener matches: ${error.message}`)
      }

      console.log(`✅ Matches obtenidos de Supabase: ${data ? data.length : 0}`);
      if (data && data.length > 0) {
        console.log('Primer match raw:', data[0]);
        console.log('¿Tiene metadata?:', data[0]?.metadata);
      }
      
      if (!data || data.length === 0) {
        console.log('No hay matches en Supabase');
        return []
      }
      
      // Transform Supabase data to expected format
      const transformedMatches = data.map(match => {
        // Parse metadata if exists
        const metadata = match.metadata || {}
        
        // Build players array
        const players = []
        if (match.player1) {
          players.push({
            id: match.player1.id,
            name: match.player1.username
          })
        }
        if (match.player2) {
          players.push({
            id: match.player2.id,
            name: match.player2.username
          })
        }
        
        // Determine type from match_type column or metadata
        const type = match.match_type || metadata.type || '1v1'
        const maxPlayers = type === '1v1' ? 2 : type === '2v2' ? 4 : type === '3v3' ? 6 : 8
        
        return {
          id: match.id,
          createdAt: new Date(match.created_at).getTime(),
          type: type,
          mode: match.game_mode,
          region: match.region || 'EU',
          platform: metadata.platform || 'ANY',
          shotgun: metadata.shotgun || 'META LOOT',
          rounds: metadata.rounds || 5,
          firstTo: metadata.rounds || 5,
          entryFee: match.bet_amount / 100,
          prize: (match.bet_amount / 100) * 1.9,
          status: match.status,
          hostId: match.player1_id,
          hostName: match.player1?.username || 'Unknown',
          players: players,
          maxPlayers: maxPlayers,
          chat: [],
          playersReady: {
            [match.player1_id]: match.player1_ready || false,
            [match.player2_id]: match.player2_ready || false
          },
          tags: ['CUSTOM'],
          mapCode: metadata.mapCode || '0000-0000-0000',
          teamId: match.team1_id || metadata.teamId,
          team2Id: match.team2_id,
          winnerId: match.winner_id,
          winnerName: match.winner?.username
        }
      })

      console.log('Matches transformados:', transformedMatches.length);
      return transformedMatches
      
    } catch (error) {
      console.error('Error fetching matches:', error)
      // En producción, NO hacer fallback a localStorage
      // Retornar array vacío y mostrar error al usuario
      return []
    }
  },

  getMatchById: async (matchId) => {
    try {
      console.log('=== OBTENIENDO MATCH POR ID ===', matchId);
      
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
      
      if (error) {
        console.error('Error obteniendo match:', error);
        throw error
      }
      
      const metadata = data.metadata || {}
      const type = data.match_type || metadata.type || '1v1'
      const maxPlayers = type === '1v1' ? 2 : type === '2v2' ? 4 : type === '3v3' ? 6 : 8
      
      // Build players array
      const players = []
      if (data.player1) {
        players.push({ id: data.player1.id, name: data.player1.username })
      }
      if (data.player2) {
        players.push({ id: data.player2.id, name: data.player2.username })
      }
      
      return {
        id: data.id,
        type: type,
        mode: data.game_mode,
        entryFee: data.bet_amount / 100,
        region: data.region || 'EU',
        platform: metadata.platform || 'ANY',
        shotgun: metadata.shotgun || 'META LOOT',
        rounds: metadata.rounds || 5,
        mapCode: metadata.mapCode || '0000-0000-0000',
        status: data.status,
        players: players,
        createdAt: new Date(data.created_at).getTime(),
        prize: (data.bet_amount / 100) * 1.9,
        maxPlayers: maxPlayers,
        chat: [],
        playersReady: {
          [data.player1_id]: data.player1_ready || false,
          [data.player2_id]: data.player2_ready || false
        },
        hostId: data.player1_id,
        hostName: data.player1?.username || 'Unknown',
        teamId: data.team1_id,
        team2Id: data.team2_id,
        winnerId: data.winner_id,
        winnerName: data.winner?.username
      }
    } catch (error) {
      console.error('Error en getMatchById:', error);
      return null
    }
  },

  // Alias for compatibility
  getMatch: async (matchId) => {
    return db.getMatchById(matchId)
  },

  joinMatch: async (matchId) => {
    try {
      console.log('=== UNIRSE AL MATCH ===', matchId);
      
      const session = db.getSession()
      if (!session) {
        console.error('No hay sesión activa');
        return { error: 'Debes iniciar sesión para unirte' }
      }
      
      console.log('Usuario intentando unirse:', session.id, session.username);
      
      // Get match from Supabase
      const { data: match, error: matchError } = await supabase
        .from('matches')
        .select(`
          *,
          player1:player1_id(id, username),
          player2:player2_id(id, username)
        `)
        .eq('id', matchId)
        .single()
      
      if (matchError || !match) {
        console.error('Match no encontrado:', matchError);
        return { error: 'Match no encontrado' }
      }
      
      console.log('Match encontrado:', match);
      
      // Check if match is full
      if (match.player2_id) {
        console.log('Match lleno');
        return { error: 'Match lleno' }
      }
      
      // Check if user is already in match
      if (match.player1_id === session.id) {
        console.log('Usuario ya está en el match');
        return { error: 'Ya estás en este match' }
      }
      
      // Join match by setting player2_id
      const { data: updatedMatch, error: updateError } = await supabase
        .from('matches')
        .update({ 
          player2_id: session.id
        })
        .eq('id', matchId)
        .select(`
          *,
          player1:player1_id(id, username),
          player2:player2_id(id, username)
        `)
        .single()
      
      if (updateError) {
        console.error('Error al unirse:', updateError);
        return { error: 'Error al unirse al match' }
      }
      
      console.log('Unión exitosa:', updatedMatch);
      
      // Transform to expected format
      const metadata = updatedMatch.metadata || {}
      const type = metadata.type || '1v1'
      const maxPlayers = type === '1v1' ? 2 : type === '2v2' ? 4 : 8
      
      const players = []
      if (updatedMatch.player1) {
        players.push({ id: updatedMatch.player1.id, name: updatedMatch.player1.username })
      }
      if (updatedMatch.player2) {
        players.push({ id: updatedMatch.player2.id, name: updatedMatch.player2.username })
      }
      
      const transformedMatch = {
        id: updatedMatch.id,
        createdAt: new Date(updatedMatch.created_at).getTime(),
        type: metadata.type || '1v1',
        mode: updatedMatch.game_mode,
        region: updatedMatch.region,
        platform: metadata.platform || 'ANY',
        entryFee: updatedMatch.bet_amount / 100,
        prize: (updatedMatch.bet_amount / 100) * 1.9,
        status: updatedMatch.status,
        hostId: updatedMatch.player1_id,
        hostName: updatedMatch.player1?.username,
        players: players,
        maxPlayers: maxPlayers,
        playersReady: {},
        rounds: metadata.rounds || 5,
        firstTo: metadata.rounds || 5
      }
      
      return { match: transformedMatch, error: null }
      
    } catch (error) {
      console.error('Error joining match:', error)
      return { error: error.message || 'Error al unirse al match' }
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

  updatePlayerReady: async (matchId, playerId, isReady) => {
    console.log('=== updatePlayerReady ===');
    console.log('matchId:', matchId, 'playerId:', playerId, 'isReady:', isReady);
    
    try {
      // Get current match
      const { data: match, error: matchError } = await supabase
        .from('matches')
        .select('*, player1:player1_id(id, username), player2:player2_id(id, username)')
        .eq('id', matchId)
        .single()
      
      if (matchError || !match) {
        console.error('Match no encontrado:', matchError);
        return null
      }
      
      console.log('Match encontrado:', match);
      
      // Determine which player column to update
      let updateData = {}
      if (match.player1_id === playerId) {
        updateData.player1_ready = isReady
        if (isReady) {
          updateData.player1_ready_at = new Date().toISOString()
        } else {
          updateData.player1_ready_at = null
        }
      } else if (match.player2_id === playerId) {
        updateData.player2_ready = isReady
        if (isReady) {
          updateData.player2_ready_at = new Date().toISOString()
        } else {
          updateData.player2_ready_at = null
        }
      } else {
        console.error('Player not in match');
        return null
      }
      
      console.log('Actualizando con:', updateData);
      
      // Update match
      const { data: updatedMatch, error: updateError } = await supabase
        .from('matches')
        .update(updateData)
        .eq('id', matchId)
        .select('*, player1:player1_id(id, username), player2:player2_id(id, username)')
        .single()
      
      if (updateError) {
        console.error('Error actualizando ready status:', updateError);
        return null
      }
      
      console.log('Match actualizado:', updatedMatch);
      console.log('Player1 ready:', updatedMatch.player1_ready);
      console.log('Player2 ready:', updatedMatch.player2_ready);
      console.log('Status:', updatedMatch.status);
      
      // Handle tokens (descuento al marcar listo, devolución al desmarcar)
      const entryFee = match.bet_amount / 100
      if (isReady && !match[match.player1_id === playerId ? 'player1_ready' : 'player2_ready']) {
        // Descontar tokens cuando marca "listo" por primera vez
        const { data: user, error: userError } = await supabase
          .from('users')
          .select('tokens')
          .eq('id', playerId)
          .single()
        
        if (user && user.tokens >= entryFee) {
          const newBalance = user.tokens - entryFee
          await supabase
            .from('users')
            .update({ tokens: newBalance })
            .eq('id', playerId)
          
          // Registrar transacción
          await supabase.from('token_transactions').insert({
            from_user_id: playerId,
            amount: entryFee,
            type: 'match_bet',
            description: `Entrada a match ${match.game_mode}`,
            match_id: matchId,
            status: 'completed'
          }).catch(e => console.log('Transaction insert error:', e))
          
          // Actualizar sesión local
          const session = JSON.parse(localStorage.getItem('fortnite_platform_session') || 'null')
          if (session && session.id === playerId) {
            session.tokens = newBalance
            localStorage.setItem('fortnite_platform_session', JSON.stringify(session))
          }
          
          console.log('Tokens descontados:', entryFee)
        } else {
          console.error('Tokens insuficientes')
          // Revertir el ready status
          await supabase
            .from('matches')
            .update({ 
              [match.player1_id === playerId ? 'player1_ready' : 'player2_ready']: false
            })
            .eq('id', matchId)
          return null
        }
      } else if (!isReady && match[match.player1_id === playerId ? 'player1_ready' : 'player2_ready']) {
        // Devolver tokens cuando desmarca "listo"
        const { data: user, error: userError } = await supabase
          .from('users')
          .select('tokens')
          .eq('id', playerId)
          .single()
        
        if (user) {
          const newBalance = user.tokens + entryFee
          await supabase
            .from('users')
            .update({ tokens: newBalance })
            .eq('id', playerId)
          
          // Registrar devolución
          await supabase.from('token_transactions').insert({
            to_user_id: playerId,
            amount: entryFee,
            type: 'match_bet',
            description: `Devolución - Ready cancelado`,
            match_id: matchId,
            status: 'completed'
          }).catch(e => console.log('Transaction insert error:', e))
          
          // Actualizar sesión local
          const session = JSON.parse(localStorage.getItem('fortnite_platform_session') || 'null')
          if (session && session.id === playerId) {
            session.tokens = newBalance
            localStorage.setItem('fortnite_platform_session', JSON.stringify(session))
          }
          
          console.log('Tokens devueltos:', entryFee)
        }
      }
      
      // Transform to expected format
      const metadata = updatedMatch.metadata || {}
      const type = metadata.type || '1v1'
      
      const players = []
      if (updatedMatch.player1) {
        players.push({ id: updatedMatch.player1.id, name: updatedMatch.player1.username })
      }
      if (updatedMatch.player2) {
        players.push({ id: updatedMatch.player2.id, name: updatedMatch.player2.username })
      }
      
      const transformedMatch = {
        id: updatedMatch.id,
        createdAt: new Date(updatedMatch.created_at).getTime(),
        type: metadata.type || '1v1',
        mode: updatedMatch.game_mode,
        region: updatedMatch.region,
        entryFee: updatedMatch.bet_amount / 100,
        prize: (updatedMatch.bet_amount / 100) * 1.9,
        status: updatedMatch.status,
        hostId: updatedMatch.player1_id,
        hostName: updatedMatch.player1?.username,
        players: players,
        maxPlayers: type === '1v1' ? 2 : type === '2v2' ? 4 : 8,
        playersReady: {
          [updatedMatch.player1_id]: updatedMatch.player1_ready || false,
          ...(updatedMatch.player2_id && { [updatedMatch.player2_id]: updatedMatch.player2_ready || false })
        },
        rounds: metadata.rounds || 5
      }
      
      console.log('Match transformado:', transformedMatch);
      return transformedMatch
      
    } catch (error) {
      console.error('Error en updatePlayerReady:', error);
      return null
    }
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

  // Obtener rankings del usuario basados en datos reales
  getUserRankings: async (userId) => {
    try {
      // Obtener todos los usuarios ordenados por diferentes métricas
      const { data: allUsers, error } = await supabase
        .from('users')
        .select('id, total_earned, wins, losses, total_played')
        .order('total_earned', { ascending: false })

      if (error || !allUsers || allUsers.length === 0) {
        console.log('No users found for rankings, returning defaults')
        return {
          overall: 1,
          earnings: 1,
          winRate: 1,
          gamesPlayed: 1,
          totalUsers: 1
        }
      }

      const totalUsers = allUsers.length

      // Calcular win rate para cada usuario
      const usersWithWinRate = allUsers.map(u => ({
        ...u,
        winRate: u.wins + u.losses > 0 ? (u.wins / (u.wins + u.losses)) * 100 : 0
      }))

      // Ordenar por earnings (total_earned) para el ranking de earnings
      const sortedByEarnings = [...allUsers].sort((a, b) => (b.total_earned || 0) - (a.total_earned || 0))
      const earningsRank = sortedByEarnings.findIndex(u => u.id === userId) + 1 || totalUsers

      // Ordenar por win rate para el ranking de rendimiento
      const sortedByWinRate = [...usersWithWinRate].sort((a, b) => b.winRate - a.winRate)
      const winRateRank = sortedByWinRate.findIndex(u => u.id === userId) + 1 || totalUsers

      // Ordenar por partidas jugadas para el ranking de actividad
      const sortedByGames = [...allUsers].sort((a, b) => (b.total_played || 0) - (a.total_played || 0))
      const gamesPlayedRank = sortedByGames.findIndex(u => u.id === userId) + 1 || totalUsers

      // Calcular overall rank como promedio de los tres rankings
      const overallRank = Math.round((earningsRank + winRateRank + gamesPlayedRank) / 3)

      console.log('Rankings calculados:', { 
        userId, 
        totalUsers, 
        earningsRank, 
        winRateRank, 
        gamesPlayedRank, 
        overallRank 
      })

      return {
        overall: overallRank,
        earnings: earningsRank,
        winRate: winRateRank,
        gamesPlayed: gamesPlayedRank,
        totalUsers: totalUsers
      }
    } catch (error) {
      console.error('Error obteniendo rankings:', error)
      return {
        overall: 1,
        earnings: 1,
        winRate: 1,
        gamesPlayed: 1,
        totalUsers: 1
      }
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
  },

  // ==================== NOTIFICACIONES ====================

  // Obtener notificaciones del usuario
  getNotifications: async (userId) => {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) {
        console.log('Supabase notifications error, using localStorage:', error)
        const localNotifs = JSON.parse(localStorage.getItem(`notifications_${userId}`) || '[]')
        return localNotifs
      }

      return data || []
    } catch (error) {
      console.error('Error getting notifications:', error)
      const localNotifs = JSON.parse(localStorage.getItem(`notifications_${userId}`) || '[]')
      return localNotifs
    }
  },

  // Crear una notificación
  createNotification: async (notification) => {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .insert({
          user_id: notification.userId,
          type: notification.type,
          title: notification.title,
          message: notification.message,
          team_id: notification.teamId,
          team_name: notification.teamName,
          match_id: notification.matchId,
          from_user_id: notification.fromUserId,
          from_username: notification.fromUsername,
          amount: notification.amount,
          read: false
        })
        .select()
        .single()

      if (error) {
        console.log('Supabase notification insert error, using localStorage:', error)
        // Fallback a localStorage
        const userNotifications = JSON.parse(localStorage.getItem(`notifications_${notification.userId}`) || '[]')
        const newNotif = {
          id: Date.now(),
          type: notification.type,
          title: notification.title,
          message: notification.message,
          teamId: notification.teamId,
          teamName: notification.teamName,
          matchId: notification.matchId,
          fromUserId: notification.fromUserId,
          fromUsername: notification.fromUsername,
          invitedBy: notification.fromUsername,
          amount: notification.amount,
          timestamp: new Date().toISOString(),
          read: false
        }
        userNotifications.unshift(newNotif)
        localStorage.setItem(`notifications_${notification.userId}`, JSON.stringify(userNotifications))
        return { success: true, notification: newNotif }
      }

      return { success: true, notification: data }
    } catch (error) {
      console.error('Error creating notification:', error)
      return { success: false, error: error.message }
    }
  },

  // Marcar notificación como leída
  markNotificationAsRead: async (notificationId, userId) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true, read_at: new Date().toISOString() })
        .eq('id', notificationId)
        .eq('user_id', userId)

      if (error) {
        console.log('Supabase mark read error, using localStorage')
        const userNotifications = JSON.parse(localStorage.getItem(`notifications_${userId}`) || '[]')
        const updatedNotifs = userNotifications.filter(n => n.id !== notificationId)
        localStorage.setItem(`notifications_${userId}`, JSON.stringify(updatedNotifs))
      }

      return { success: true }
    } catch (error) {
      console.error('Error marking notification as read:', error)
      return { success: false, error: error.message }
    }
  },

  // Borrar todas las notificaciones
  clearAllNotifications: async (userId) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('user_id', userId)

      if (error) {
        console.log('Supabase clear error, using localStorage')
      }

      // También limpiar localStorage
      localStorage.setItem(`notifications_${userId}`, JSON.stringify([]))
      return { success: true }
    } catch (error) {
      console.error('Error clearing notifications:', error)
      return { success: false, error: error.message }
    }
  },

  // Aceptar invitación con actualización de notificación
  acceptInvitation: async (notificationId, userId) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ accepted: true, read: true, read_at: new Date().toISOString() })
        .eq('id', notificationId)
        .eq('user_id', userId)

      if (error) {
        console.log('Error updating invitation status')
      }

      return { success: true }
    } catch (error) {
      console.error('Error accepting invitation:', error)
      return { success: false, error: error.message }
    }
  },

  // Rechazar invitación con actualización de notificación
  rejectInvitation: async (notificationId, userId) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ accepted: false, read: true, read_at: new Date().toISOString() })
        .eq('id', notificationId)
        .eq('user_id', userId)

      if (error) {
        console.log('Error updating invitation status')
      }

      return { success: true }
    } catch (error) {
      console.error('Error rejecting invitation:', error)
      return { success: false, error: error.message }
    }
  },

  // ==================== TRANSFERENCIA DE TOKENS ====================

  // Transferir tokens de un usuario a otro
  transferTokens: async (fromUserId, toUsername, amount) => {
    try {
      // Validar monto
      if (!amount || amount <= 0) {
        return { error: 'Cantidad inválida' }
      }

      // Obtener usuario emisor
      const { data: sender, error: senderError } = await supabase
        .from('users')
        .select('id, username, tokens')
        .eq('id', fromUserId)
        .single()

      if (senderError || !sender) {
        return { error: 'Usuario emisor no encontrado' }
      }

      // Verificar tokens suficientes
      if (sender.tokens < amount) {
        return { error: 'No tienes suficientes tokens' }
      }

      // Buscar receptor por username
      const { data: recipient, error: recipientError } = await supabase
        .from('users')
        .select('id, username, tokens')
        .ilike('username', toUsername)
        .single()

      if (recipientError || !recipient) {
        return { error: 'Usuario receptor no encontrado' }
      }

      // No enviar a sí mismo
      if (sender.id === recipient.id) {
        return { error: 'No puedes enviarte tokens a ti mismo' }
      }

      // Realizar transferencia (restar al emisor)
      const { error: deductError } = await supabase
        .from('users')
        .update({ tokens: sender.tokens - amount })
        .eq('id', sender.id)

      if (deductError) {
        console.error('Error deducting tokens:', deductError)
        return { error: 'Error al deducir tokens' }
      }

      // Agregar tokens al receptor
      const { error: addError } = await supabase
        .from('users')
        .update({ tokens: recipient.tokens + amount })
        .eq('id', recipient.id)

      if (addError) {
        // Revertir la deducción
        await supabase
          .from('users')
          .update({ tokens: sender.tokens })
          .eq('id', sender.id)
        return { error: 'Error al agregar tokens al receptor' }
      }

      // Registrar transacción
      await supabase.from('token_transactions').insert({
        from_user_id: sender.id,
        to_user_id: recipient.id,
        amount: amount,
        type: 'tip',
        description: `Tip de ${sender.username} a ${recipient.username}`,
        status: 'completed'
      })

      // Crear notificación para el receptor
      await db.createNotification({
        userId: recipient.id,
        type: 'tip_received',
        title: '💰 Tip Recibido',
        message: `${sender.username} te ha enviado ${amount} tokens`,
        fromUserId: sender.id,
        fromUsername: sender.username,
        amount: amount
      })

      // Actualizar sesión local si el emisor es el usuario actual
      const session = JSON.parse(localStorage.getItem('fortnite_platform_session') || 'null')
      if (session && session.id === fromUserId) {
        session.tokens = sender.tokens - amount
        localStorage.setItem('fortnite_platform_session', JSON.stringify(session))
      }

      // Obtener datos actualizados
      const { data: updatedSender } = await supabase
        .from('users')
        .select('*')
        .eq('id', sender.id)
        .single()

      const { data: updatedRecipient } = await supabase
        .from('users')
        .select('*')
        .eq('id', recipient.id)
        .single()

      return {
        sender: updatedSender,
        recipient: updatedRecipient,
        error: null
      }
    } catch (error) {
      console.error('Error transferring tokens:', error)
      return { error: error.message || 'Error al transferir tokens' }
    }
  },

  // ==================== TOKENS EN MATCHES ====================

  // Deducir tokens cuando comienza un match
  deductMatchBet: async (userId, amount, matchId) => {
    try {
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('id, tokens')
        .eq('id', userId)
        .single()

      if (userError || !user) {
        return { success: false, error: 'Usuario no encontrado' }
      }

      if (user.tokens < amount) {
        return { success: false, error: 'Tokens insuficientes' }
      }

      // Deducir tokens
      const { error: updateError } = await supabase
        .from('users')
        .update({ tokens: user.tokens - amount })
        .eq('id', userId)

      if (updateError) {
        return { success: false, error: 'Error al deducir tokens' }
      }

      // Registrar transacción
      await supabase.from('token_transactions').insert({
        from_user_id: userId,
        to_user_id: null,
        amount: amount,
        type: 'match_bet',
        description: `Apuesta en match`,
        match_id: matchId,
        status: 'completed'
      })

      // Actualizar sesión local
      const session = JSON.parse(localStorage.getItem('fortnite_platform_session') || 'null')
      if (session && session.id === userId) {
        session.tokens = user.tokens - amount
        localStorage.setItem('fortnite_platform_session', JSON.stringify(session))
      }

      return { success: true, newBalance: user.tokens - amount }
    } catch (error) {
      console.error('Error deducting match bet:', error)
      return { success: false, error: error.message }
    }
  },

  // Pagar ganancias del match
  payMatchWinnings: async (winnerId, amount, matchId) => {
    try {
      const { data: winner, error: winnerError } = await supabase
        .from('users')
        .select('id, tokens, wins, total_earned')
        .eq('id', winnerId)
        .single()

      if (winnerError || !winner) {
        return { success: false, error: 'Ganador no encontrado' }
      }

      // Agregar tokens y actualizar stats
      const { error: updateError } = await supabase
        .from('users')
        .update({ 
          tokens: winner.tokens + amount,
          wins: (winner.wins || 0) + 1,
          total_earned: (winner.total_earned || 0) + amount
        })
        .eq('id', winnerId)

      if (updateError) {
        return { success: false, error: 'Error al pagar ganancias' }
      }

      // Registrar transacción
      await supabase.from('token_transactions').insert({
        from_user_id: null,
        to_user_id: winnerId,
        amount: amount,
        type: 'match_win',
        description: `Ganancia de match`,
        match_id: matchId,
        status: 'completed'
      })

      // Actualizar sesión local si es el usuario actual
      const session = JSON.parse(localStorage.getItem('fortnite_platform_session') || 'null')
      if (session && session.id === winnerId) {
        session.tokens = winner.tokens + amount
        session.wins = (winner.wins || 0) + 1
        session.total_earned = (winner.total_earned || 0) + amount
        localStorage.setItem('fortnite_platform_session', JSON.stringify(session))
      }

      return { success: true, newBalance: winner.tokens + amount }
    } catch (error) {
      console.error('Error paying match winnings:', error)
      return { success: false, error: error.message }
    }
  },

  // ==================== AVATAR PERSONALIZADO ====================

  // Guardar configuración de avatar
  saveAvatarConfig: async (userId, avatarConfig) => {
    try {
      const { error } = await supabase
        .from('users')
        .update({ avatar_config: avatarConfig })
        .eq('id', userId)

      if (error) {
        console.log('Error saving avatar config to Supabase, using localStorage')
        localStorage.setItem(`avatar_config_${userId}`, JSON.stringify(avatarConfig))
        return { success: true }
      }

      // También actualizar localStorage para acceso rápido
      localStorage.setItem(`avatar_config_${userId}`, JSON.stringify(avatarConfig))
      
      // Actualizar sesión
      const session = JSON.parse(localStorage.getItem('fortnite_platform_session') || 'null')
      if (session && session.id === userId) {
        session.avatar_config = avatarConfig
        localStorage.setItem('fortnite_platform_session', JSON.stringify(session))
      }

      return { success: true }
    } catch (error) {
      console.error('Error saving avatar config:', error)
      localStorage.setItem(`avatar_config_${userId}`, JSON.stringify(avatarConfig))
      return { success: true }
    }
  },

  // Obtener configuración de avatar
  getAvatarConfig: async (userId) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('avatar_config')
        .eq('id', userId)
        .single()

      if (error || !data?.avatar_config) {
        const localConfig = JSON.parse(localStorage.getItem(`avatar_config_${userId}`) || 'null')
        return localConfig || db.getDefaultAvatarConfig()
      }

      return data.avatar_config
    } catch (error) {
      console.error('Error getting avatar config:', error)
      const localConfig = JSON.parse(localStorage.getItem(`avatar_config_${userId}`) || 'null')
      return localConfig || db.getDefaultAvatarConfig()
    }
  },

  // Configuración de avatar por defecto
  getDefaultAvatarConfig: () => {
    return {
      skinColor: 'light',
      hairStyle: 'shortRound',
      hairColor: 'brown',
      facialHair: 'none',
      facialHairColor: 'brown',
      eyes: 'default',
      eyebrows: 'default',
      mouth: 'smile',
      accessories: 'none',
      accessoriesColor: 'black',
      clothing: 'hoodie',
      clothingColor: 'blue01',
      clothingGraphic: 'none',
      hat: 'none',
      hatColor: 'black'
    }
  }
}

export default db
