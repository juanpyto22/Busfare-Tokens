// This is a simulation of a Backend + Database using LocalStorage
// In production, this would be replaced by actual Supabase Client logic

const DB_KEY = 'fortnite_platform_users';
const SESSION_KEY = 'fortnite_platform_session';
const MATCHES_KEY = 'fortnite_platform_matches';

const getDB = () => JSON.parse(localStorage.getItem(DB_KEY) || '[]');
const setDB = (data) => localStorage.setItem(DB_KEY, JSON.stringify(data));

// Inicializar usuarios admin y moderador si no existen
const initializeAdminUsers = () => {
    const users = getDB();
    
    // Crear usuario Admin
    if (!users.find(u => u.username === 'admin')) {
        users.push({
            id: 'admin-001',
            email: 'admin@busfare.com',
            password: 'Cendrero221104@Perrunillas12@',
            username: 'admin',
            role: 'admin', // admin, moderator, user
            tokens: 99999,
            snipes: 999,
            wins: 0,
            losses: 0,
            earnings: 0,
            totalEarned: 0,
            totalPlayed: 0,
            streaks: { current: 0, best: 0 },
            transactions: [],
            joinedAt: new Date().toISOString(),
            emailVerified: true,
            verificationCode: '',
            level: 99,
            experience: 99000,
            reputation: 100,
            trustScore: 100,
            reportedCount: 0,
            bannedUntil: null,
            twoFactorEnabled: false,
            lastLogin: new Date().toISOString(),
            matchHistory: [],
            achievements: ['admin'],
            withdrawals: []
        });
    }
    
    // Crear usuario Árbitro/Moderador
    if (!users.find(u => u.username === 'arbitro')) {
        users.push({
            id: 'mod-001',
            email: 'arbitro@busfare.com',
            password: 'arbitro123',
            username: 'arbitro',
            role: 'moderator',
            tokens: 5000,
            snipes: 100,
            wins: 0,
            losses: 0,
            earnings: 0,
            totalEarned: 0,
            totalPlayed: 0,
            streaks: { current: 0, best: 0 },
            transactions: [],
            joinedAt: new Date().toISOString(),
            emailVerified: true,
            verificationCode: '',
            level: 50,
            experience: 50000,
            reputation: 100,
            trustScore: 100,
            reportedCount: 0,
            bannedUntil: null,
            twoFactorEnabled: false,
            lastLogin: new Date().toISOString(),
            matchHistory: [],
            achievements: ['moderator'],
            withdrawals: []
        });
    }
    
    setDB(users);
};

// Ejecutar inicialización
initializeAdminUsers();

const getMatchesDB = () => JSON.parse(localStorage.getItem(MATCHES_KEY) || '[]');
const setMatchesDB = (data) => localStorage.setItem(MATCHES_KEY, JSON.stringify(data));

// No crear matches ni usuarios de ejemplo - sistema limpio

export const db = {
  // Auth Simulation
  login: async (email, password) => {
    await new Promise(r => setTimeout(r, 600)); 
    const users = getDB();
    const user = users.find(u => u.email === email && u.password === password);
    if (user) {
      localStorage.setItem(SESSION_KEY, JSON.stringify(user));
      return { user, error: null };
    }
    return { user: null, error: 'Credenciales inválidas' };
  },

  register: async (email, password, username) => {
    await new Promise(r => setTimeout(r, 600));
    const users = getDB();
    if (users.find(u => u.email === email)) {
      return { user: null, error: 'Este correo ya está registrado' };
    }
    if (users.find(u => u.username.toLowerCase() === username.toLowerCase())) {
      return { user: null, error: 'Este nombre de usuario ya está en uso' };
    }
    const newUser = {
      id: crypto.randomUUID(),
      email,
      password,
      username,
      role: 'user', // admin, moderator, user
      tokens: 0,
      snipes: 2,
      wins: 0,
      losses: 0,
      earnings: 0,
      totalEarned: 0,
      totalPlayed: 0,
      streaks: { current: 0, best: 0 },
      transactions: [],
      joinedAt: new Date().toISOString(),
      // Nuevos campos de seguridad y progresión
      emailVerified: false,
      verificationCode: Math.floor(100000 + Math.random() * 900000).toString(),
      level: 1,
      experience: 0,
      reputation: 100, // 0-100 rating
      trustScore: 100, // Basado en comportamiento
      reportedCount: 0,
      bannedUntil: null,
      twoFactorEnabled: false,
      lastLogin: new Date().toISOString(),
      matchHistory: [],
      achievements: [],
      withdrawals: []
    };
    users.push(newUser);
    setDB(users);
    return { user: newUser, error: null };
  },

  logout: () => {
    localStorage.removeItem(SESSION_KEY);
  },

  getSession: () => {
    const session = JSON.parse(localStorage.getItem(SESSION_KEY) || 'null');
    if (session) {
       // Refresh data from DB to ensure latest stats
       const users = getDB();
       const freshUser = users.find(u => u.id === session.id);
       return freshUser || session;
    }
    return null;
  },

  // Token & Snipes Logic
  addTokens: async (amount, cost) => {
    await new Promise(r => setTimeout(r, 600));
    const session = JSON.parse(localStorage.getItem(SESSION_KEY));
    if (!session) return { error: 'No autorizado' };

    const users = getDB();
    const userIndex = users.findIndex(u => u.id === session.id);
    if (userIndex === -1) return { error: 'Usuario no encontrado' };

    const transaction = {
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
      amount,
      cost,
      type: 'purchase',
      status: 'completed'
    };

    users[userIndex].tokens += amount;
    users[userIndex].transactions.unshift(transaction);
    setDB(users);
    
    return { user: users[userIndex], error: null };
  },

  // Match Logic
  getMatches: () => {
    return getMatchesDB();
  },

  getMatch: (id) => {
    const matches = getMatchesDB();
    return matches.find(m => m.id == id);
  },

  createMatch: async (matchData) => {
    await new Promise(r => setTimeout(r, 400));
    const session = db.getSession();
    if (!session) return { error: 'No autorizado' };

    const matches = getMatchesDB();
    const entryFee = parseFloat(matchData.entryFee);
    const newMatch = {
        id: Date.now(),
        createdAt: Date.now(),
        ...matchData,
        hostId: session.id,
        hostName: session.username,
        status: 'waiting',
        players: [{ id: session.id, name: session.username }],
        maxPlayers: matchData.type === '1v1' ? 2 : matchData.type === '2v2' ? 4 : 8,
        chat: [],
        entryFee: entryFee,
        prize: entryFee * 1.9, // Simulated prize calc
        firstTo: matchData.rounds || 5,
        expiresIn: '59:00',
        tags: ['CUSTOM']
    };
    matches.unshift(newMatch);
    setMatchesDB(matches);
    return { match: newMatch, error: null };
  },

  joinMatch: async (matchId) => {
    await new Promise(r => setTimeout(r, 600));
    const session = db.getSession();
    if (!session) return { error: 'No autorizado' };
    
    const matches = getMatchesDB();
    const matchIndex = matches.findIndex(m => m.id == matchId);
    if (matchIndex === -1) return { error: 'Match no encontrado' };

    const match = matches[matchIndex];
    if (match.players.length >= match.maxPlayers) return { error: 'Match lleno' };
    if (match.players.find(p => p.id === session.id)) return { error: 'Ya estás en este match' };

    // Deduct tokens (simplified logic)
    const users = getDB();
    const userIndex = users.findIndex(u => u.id === session.id);
    if (users[userIndex].tokens < match.entryFee) return { error: 'Tokens insuficientes' };

    users[userIndex].tokens -= match.entryFee;
    users[userIndex].totalPlayed += 1;
    setDB(users);

    match.players.push({ id: session.id, name: session.username });
    if (match.players.length === match.maxPlayers) {
        match.status = 'ready'; // Auto ready when full
    }
    matches[matchIndex] = match;
    setMatchesDB(matches);

    return { match, error: null };
  },

  leaveMatch: (matchId, playerId) => {
    const matches = getMatchesDB();
    const matchIndex = matches.findIndex(m => m.id == matchId);
    if (matchIndex !== -1) {
      const match = matches[matchIndex];
      match.players = match.players.filter(p => p.id !== playerId);
      
      // If match becomes empty, delete it
      if (match.players.length === 0) {
        matches.splice(matchIndex, 1);
      } else {
        // Refund tokens to remaining players if they're not the host
        const session = db.getSession();
        if (session && match.players.find(p => p.id === session.id)) {
          const users = getDB();
          const userIndex = users.findIndex(u => u.id === session.id);
          if (userIndex !== -1) {
            users[userIndex].tokens += match.entryFee;
            setDB(users);
          }
        }
      }
      setMatchesDB(matches);
    }
  },

  sendMessage: (matchId, text) => {
    const session = db.getSession();
    if (!session) return;
    const matches = getMatchesDB();
    const index = matches.findIndex(m => m.id == matchId);
    if (index !== -1) {
        matches[index].chat.push({
            id: Date.now(),
            user: session.username,
            text,
            time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
        });
        setMatchesDB(matches);
        return matches[index];
    }
  },

  updatePlayerReady: (matchId, playerId, readyStatus) => {
    const matches = getMatchesDB();
    const index = matches.findIndex(m => m.id == matchId);
    if (index !== -1) {
        const match = matches[index];
        if (!match.playersReady) {
            match.playersReady = {};
        }
        match.playersReady[playerId] = readyStatus;
        
        // Check if all players are ready
        const allReady = match.players.every(p => match.playersReady[p.id] === true);
        if (allReady && match.players.length === match.maxPlayers) {
            match.status = 'started';
        } else if (match.status === 'started' && !allReady) {
            match.status = 'ready';
        }
        
        matches[index] = match;
        setMatchesDB(matches);
        return matches[index];
    }
    return null;
  },

  // Leaderboard & Profile
  getLeaderboard: () => {
    const users = getDB();
    // Filtrar admin y moderadores, ordenar por ganancias
    return users
      .filter(u => u.role !== 'admin' && u.role !== 'moderator')
      .sort((a, b) => b.earnings - a.earnings)
      .slice(0, 50);
  },

  getUserStats: (userId) => {
     const users = getDB();
     return users.find(u => u.id === userId);
  },
  
  // Teams Simulation
  getTeams: (userId = null) => {
      const teams = JSON.parse(localStorage.getItem('fortnite_teams') || '[]');
      // Si se proporciona userId, filtrar solo equipos donde el usuario es miembro
      if (userId) {
          return teams.filter(team => 
              team.members.some(member => member.id === userId)
          );
      }
      return teams;
  },

  createTeam: (name) => {
      const session = db.getSession();
      const teams = JSON.parse(localStorage.getItem('fortnite_teams') || '[]');
      const newTeam = {
          id: Date.now(),
          name,
          members: [
              { id: session.id, name: session.username, role: 'Leader', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + session.username }
          ],
          wins: 0
      };
      teams.push(newTeam);
      localStorage.setItem('fortnite_teams', JSON.stringify(teams));
      return newTeam;
  },

  deleteTeam: (teamId) => {
      const teams = JSON.parse(localStorage.getItem('fortnite_teams') || '[]');
      const filteredTeams = teams.filter(t => t.id !== teamId);
      localStorage.setItem('fortnite_teams', JSON.stringify(filteredTeams));
  },

  sendTeamInvitation: (teamId, username, invitedBy) => {
      const users = getDB();
      const targetUser = users.find(u => u.username.toLowerCase() === username.toLowerCase());
      
      if (!targetUser) {
          return { success: false, error: 'Usuario no encontrado' };
      }

      const teams = JSON.parse(localStorage.getItem('fortnite_teams') || '[]');
      const team = teams.find(t => t.id === teamId);
      
      if (!team) {
          return { success: false, error: 'Equipo no encontrado' };
      }

      // Crear notificación de invitación
      const userNotifications = JSON.parse(localStorage.getItem(`notifications_${targetUser.id}`) || '[]');
      const newNotification = {
          id: Date.now(),
          type: 'team_invitation',
          teamId: teamId,
          teamName: team.name,
          invitedBy: invitedBy,
          timestamp: new Date().toISOString(),
          read: false
      };
      userNotifications.unshift(newNotification);
      localStorage.setItem(`notifications_${targetUser.id}`, JSON.stringify(userNotifications));
      
      return { success: true, user: targetUser };
  },

  acceptTeamInvitation: (teamId, userId) => {
      const users = getDB();
      const user = users.find(u => u.id === userId);
      
      if (!user) return { success: false, error: 'Usuario no encontrado' };

      const teams = JSON.parse(localStorage.getItem('fortnite_teams') || '[]');
      const teamIndex = teams.findIndex(t => t.id === teamId);
      
      if (teamIndex === -1) return { success: false, error: 'Equipo no encontrado' };

      // Verificar si ya es miembro
      const alreadyMember = teams[teamIndex].members.some(m => m.id === userId);
      if (alreadyMember) {
          return { success: false, error: 'Ya eres miembro de este equipo' };
      }

      // Agregar al equipo
      const newMember = {
          id: userId,
          name: user.username,
          role: 'Member',
          avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + user.username
      };
      teams[teamIndex].members.push(newMember);
      localStorage.setItem('fortnite_teams', JSON.stringify(teams));

      // Eliminar notificación de invitación
      const userNotifications = JSON.parse(localStorage.getItem(`notifications_${userId}`) || '[]');
      const updatedNotifications = userNotifications.filter(n => !(n.type === 'team_invitation' && n.teamId === teamId));
      localStorage.setItem(`notifications_${userId}`, JSON.stringify(updatedNotifications));

      return { success: true, team: teams[teamIndex] };
  },

  rejectTeamInvitation: (teamId, userId) => {
      // Eliminar notificación de invitación
      const userNotifications = JSON.parse(localStorage.getItem(`notifications_${userId}`) || '[]');
      const updatedNotifications = userNotifications.filter(n => !(n.type === 'team_invitation' && n.teamId === teamId));
      localStorage.setItem(`notifications_${userId}`, JSON.stringify(updatedNotifications));
      return { success: true };
  },

  addTeamMember: (teamId, username) => {
      const teams = JSON.parse(localStorage.getItem('fortnite_teams') || '[]');
      const teamIndex = teams.findIndex(t => t.id === teamId);
      if (teamIndex !== -1) {
          const newMember = {
              id: crypto.randomUUID(),
              name: username,
              role: 'Member',
              avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + username
          };
          teams[teamIndex].members.push(newMember);
          localStorage.setItem('fortnite_teams', JSON.stringify(teams));
      }
  },

  removeTeamMember: (teamId, memberName) => {
      const teams = JSON.parse(localStorage.getItem('fortnite_teams') || '[]');
      const teamIndex = teams.findIndex(t => t.id === teamId);
      if (teamIndex !== -1) {
          teams[teamIndex].members = teams[teamIndex].members.filter(m => m.name !== memberName);
          localStorage.setItem('fortnite_teams', JSON.stringify(teams));
      }
  },

  getUserMatchHistory: (userId) => {
      // Returns only matches the user actually played
      const userMatchHistory = JSON.parse(localStorage.getItem(`match_history_${userId}`) || '[]');
      return userMatchHistory;
  },

  addMatchToHistory: (userId, matchData) => {
      // Add a completed match to user's history
      const history = JSON.parse(localStorage.getItem(`match_history_${userId}`) || '[]');
      history.unshift(matchData); // Add to beginning
      localStorage.setItem(`match_history_${userId}`, JSON.stringify(history));
  },

  // Get all registered users (for tip functionality)
  getAllUsers: () => {
      return getDB();
  },

  // Transfer tokens from one user to another
  transferTokens: async (fromUserId, toUsername, amount) => {
      await new Promise(r => setTimeout(r, 600));
      const users = getDB();
      
      // Find sender
      const senderIndex = users.findIndex(u => u.id === fromUserId);
      if (senderIndex === -1) return { error: 'Usuario emisor no encontrado' };
      
      // Find recipient by username
      const recipientIndex = users.findIndex(u => u.username.toLowerCase() === toUsername.toLowerCase());
      if (recipientIndex === -1) return { error: 'Usuario receptor no encontrado' };
      
      // Check if trying to send to self
      if (users[senderIndex].id === users[recipientIndex].id) {
          return { error: 'No puedes enviarte tokens a ti mismo' };
      }
      
      // Check if sender has enough tokens
      if (users[senderIndex].tokens < amount) {
          return { error: 'No tienes suficientes tokens' };
      }
      
      // Perform transfer
      users[senderIndex].tokens -= amount;
      users[recipientIndex].tokens += amount;
      
      // Add transaction records
      const transaction = {
          id: crypto.randomUUID(),
          date: new Date().toISOString(),
          amount: amount,
          type: 'tip',
          status: 'completed'
      };
      
      const senderTransaction = {
          ...transaction,
          description: `Tip sent to ${users[recipientIndex].username}`,
          direction: 'sent'
      };
      
      const recipientTransaction = {
          ...transaction,
          description: `Tip received from ${users[senderIndex].username}`,
          direction: 'received'
      };
      
      users[senderIndex].transactions.unshift(senderTransaction);
      users[recipientIndex].transactions.unshift(recipientTransaction);
      
      setDB(users);
      
      // Update session if sender is current user
      const session = JSON.parse(localStorage.getItem(SESSION_KEY) || 'null');
      if (session && session.id === fromUserId) {
          localStorage.setItem(SESSION_KEY, JSON.stringify(users[senderIndex]));
      }
      
      return { 
          sender: users[senderIndex], 
          recipient: users[recipientIndex], 
          error: null 
      };
  },

  // ===== SISTEMA DE VERIFICACIÓN DE MATCHES =====
  submitMatchResult: (matchId, userId, winnerId, screenshot = null) => {
      const matches = getMatchesDB();
      const matchIndex = matches.findIndex(m => m.id == matchId);
      if (matchIndex === -1) return { error: 'Match no encontrado' };

      const match = matches[matchIndex];
      if (!match.results) match.results = {};
      
      match.results[userId] = {
          winnerId,
          screenshot,
          submittedAt: new Date().toISOString()
      };

      // Verificar si ambos jugadores han enviado resultados
      const allSubmitted = match.players.every(p => match.results[p.id]);
      
      if (allSubmitted) {
          const results = Object.values(match.results);
          const allAgree = results.every(r => r.winnerId === results[0].winnerId);
          
          if (allAgree) {
              // Resultados coinciden - distribuir premios
              match.status = 'completed';
              match.winner = results[0].winnerId;
              db.distributeMatchPrize(matchId, results[0].winnerId);
          } else {
              // Resultados no coinciden - marcar para revisión
              match.status = 'disputed';
              match.disputedAt = new Date().toISOString();
          }
      }

      matches[matchIndex] = match;
      setMatchesDB(matches);
      return { success: true, match: matches[matchIndex] };
  },

  distributeMatchPrize: (matchId, winnerId) => {
      const matches = getMatchesDB();
      const match = matches.find(m => m.id == matchId);
      if (!match) return;

      const users = getDB();
      const winnerIndex = users.findIndex(u => u.id === winnerId);
      const loserIndex = users.findIndex(u => match.players.some(p => p.id === u.id && u.id !== winnerId));
      
      if (winnerIndex === -1) return;

      const prize = match.entryFee * 2 * 0.95; // 5% commission
      users[winnerIndex].tokens += prize;
      users[winnerIndex].wins += 1;
      users[winnerIndex].earnings += prize;
      users[winnerIndex].totalEarned += prize;
      users[winnerIndex].experience += 100; // 100 XP por victoria
      
      // Actualizar nivel si es necesario
      const newLevel = Math.floor(users[winnerIndex].experience / 1000) + 1;
      if (newLevel > users[winnerIndex].level) {
          users[winnerIndex].level = newLevel;
      }

      if (loserIndex !== -1) {
          users[loserIndex].losses += 1;
          users[loserIndex].experience += 25; // 25 XP por participación
      }

      // Agregar al historial
      const matchRecord = {
          id: matchId,
          type: match.type,
          mode: match.mode,
          result: winnerId === users[winnerIndex].id ? 'win' : 'loss',
          opponent: loserIndex !== -1 ? users[loserIndex].username : 'Unknown',
          tokens: match.entryFee,
          prize: winnerId === users[winnerIndex].id ? prize : 0,
          date: new Date().toISOString()
      };
      
      users[winnerIndex].matchHistory = users[winnerIndex].matchHistory || [];
      users[winnerIndex].matchHistory.unshift(matchRecord);
      
      if (loserIndex !== -1) {
          const loserRecord = { ...matchRecord, result: 'loss', prize: 0 };
          users[loserIndex].matchHistory = users[loserIndex].matchHistory || [];
          users[loserIndex].matchHistory.unshift(loserRecord);
      }

      setDB(users);
  },

  // ===== SISTEMA DE REPORTES =====
  reportPlayer: (reporterId, reportedId, reason, matchId = null) => {
      const reports = JSON.parse(localStorage.getItem('player_reports') || '[]');
      const users = getDB();
      
      const reported = users.find(u => u.id === reportedId);
      if (!reported) return { error: 'Usuario no encontrado' };

      const newReport = {
          id: Date.now(),
          reporterId,
          reportedId,
          reason,
          matchId,
          timestamp: new Date().toISOString(),
          status: 'pending',
          reviewed: false
      };

      reports.push(newReport);
      localStorage.setItem('player_reports', JSON.stringify(reports));

      // Actualizar contador de reportes del usuario
      const reportedIndex = users.findIndex(u => u.id === reportedId);
      if (reportedIndex !== -1) {
          users[reportedIndex].reportedCount = (users[reportedIndex].reportedCount || 0) + 1;
          users[reportedIndex].reputation = Math.max(0, (users[reportedIndex].reputation || 100) - 5);
          setDB(users);
      }

      return { success: true, report: newReport };
  },

  // ===== SISTEMA DE RETIROS =====
  requestWithdrawal: (userId, amount, method = 'paypal', accountInfo = '') => {
      const users = getDB();
      const userIndex = users.findIndex(u => u.id === userId);
      
      if (userIndex === -1) return { error: 'Usuario no encontrado' };
      if (users[userIndex].tokens < amount) return { error: 'Tokens insuficientes' };
      if (amount < 10) return { error: 'Mínimo de retiro: 10 tokens' };

      const withdrawal = {
          id: Date.now(),
          userId,
          amount,
          method,
          accountInfo,
          status: 'pending',
          requestedAt: new Date().toISOString(),
          processedAt: null
      };

      users[userIndex].tokens -= amount;
      users[userIndex].withdrawals = users[userIndex].withdrawals || [];
      users[userIndex].withdrawals.unshift(withdrawal);

      const transaction = {
          id: crypto.randomUUID(),
          date: new Date().toISOString(),
          amount: -amount,
          type: 'withdrawal',
          status: 'pending',
          description: `Retiro pendiente vía ${method}`
      };
      users[userIndex].transactions.unshift(transaction);

      setDB(users);

      // Update session
      const session = JSON.parse(localStorage.getItem(SESSION_KEY) || 'null');
      if (session && session.id === userId) {
          localStorage.setItem(SESSION_KEY, JSON.stringify(users[userIndex]));
      }

      return { success: true, withdrawal };
  },

  // ===== SISTEMA DE VERIFICACIÓN DE EMAIL =====
  verifyEmail: (userId, code) => {
      const users = getDB();
      const userIndex = users.findIndex(u => u.id === userId);
      
      if (userIndex === -1) return { error: 'Usuario no encontrado' };
      if (users[userIndex].verificationCode !== code) {
          return { error: 'Código de verificación incorrecto' };
      }

      users[userIndex].emailVerified = true;
      users[userIndex].verificationCode = null;
      users[userIndex].tokens += 10; // Bonus por verificar email
      
      setDB(users);
      
      return { success: true, user: users[userIndex] };
  },

  // ===== OBTENER ESTADÍSTICAS AVANZADAS =====
  getUserStatistics: (userId) => {
      const users = getDB();
      const user = users.find(u => u.id === userId);
      if (!user) return null;

      const matchHistory = user.matchHistory || [];
      const winRate = user.totalPlayed > 0 ? (user.wins / user.totalPlayed * 100).toFixed(1) : 0;
      
      const last10Matches = matchHistory.slice(0, 10);
      const recentWinRate = last10Matches.length > 0 
          ? (last10Matches.filter(m => m.result === 'win').length / last10Matches.length * 100).toFixed(1)
          : 0;

      return {
          ...user,
          statistics: {
              winRate,
              recentWinRate,
              averageEarnings: user.totalPlayed > 0 ? (user.totalEarned / user.totalPlayed).toFixed(2) : 0,
              totalMatches: user.totalPlayed,
              currentLevel: user.level || 1,
              nextLevelXP: ((user.level || 1) * 1000) - (user.experience || 0),
              reputation: user.reputation || 100,
              trustScore: user.trustScore || 100
          }
      };
  },

  // ===== FUNCIONES DE ADMINISTRACIÓN =====
  // Obtener todos los usuarios (solo admin)
  getAllUsers: () => {
      return getDB();
  },

  // Actualizar cualquier usuario (solo admin)
  updateUser: (userId, updates) => {
      const users = getDB();
      const userIndex = users.findIndex(u => u.id === userId);
      if (userIndex === -1) return { error: 'Usuario no encontrado' };

      users[userIndex] = { ...users[userIndex], ...updates };
      setDB(users);
      return { success: true, user: users[userIndex] };
  },

  // Banear usuario (admin/moderator)
  banUser: (userId, duration = 7, reason = '') => {
      const users = getDB();
      const userIndex = users.findIndex(u => u.id === userId);
      if (userIndex === -1) return { error: 'Usuario no encontrado' };

      const bannedUntil = new Date();
      bannedUntil.setDate(bannedUntil.getDate() + duration);

      users[userIndex].bannedUntil = bannedUntil.toISOString();
      users[userIndex].banReason = reason;
      setDB(users);

      return { success: true, user: users[userIndex] };
  },

  // Desbanear usuario
  unbanUser: (userId) => {
      const users = getDB();
      const userIndex = users.findIndex(u => u.id === userId);
      if (userIndex === -1) return { error: 'Usuario no encontrado' };

      users[userIndex].bannedUntil = null;
      users[userIndex].banReason = null;
      setDB(users);

      return { success: true, user: users[userIndex] };
  },

  // Eliminar usuario (solo admin)
  deleteUser: (userId) => {
      const users = getDB();
      const filteredUsers = users.filter(u => u.id !== userId);
      setDB(filteredUsers);
      return { success: true };
  },

  // Obtener todos los matches disputados (moderator/admin)
  getDisputedMatches: () => {
      const matches = getMatchesDB();
      return matches.filter(m => m.status === 'disputed');
  },

  // Resolver disputa de match (moderator/admin)
  resolveDispute: (matchId, winnerId, moderatorId, notes = '') => {
      const matches = getMatchesDB();
      const matchIndex = matches.findIndex(m => m.id === matchId);
      if (matchIndex === -1) return { error: 'Match no encontrado' };

      const match = matches[matchIndex];
      if (match.status !== 'disputed') return { error: 'Match no está en disputa' };

      // Actualizar match
      matches[matchIndex].status = 'completed';
      matches[matchIndex].winnerId = winnerId;
      matches[matchIndex].resolvedBy = moderatorId;
      matches[matchIndex].resolutionNotes = notes;
      matches[matchIndex].resolvedAt = new Date().toISOString();
      setMatchesDB(matches);

      // Distribuir premio
      db.distributeMatchPrize(matchId, winnerId);

      return { success: true, match: matches[matchIndex] };
  },

  // Obtener todos los reportes (moderator/admin)
  getAllReports: () => {
      return JSON.parse(localStorage.getItem('player_reports') || '[]');
  },

  // Revisar reporte (moderator/admin)
  reviewReport: (reportId, action, moderatorId, notes = '') => {
      const reports = JSON.parse(localStorage.getItem('player_reports') || '[]');
      const reportIndex = reports.findIndex(r => r.id === reportId);
      if (reportIndex === -1) return { error: 'Reporte no encontrado' };

      reports[reportIndex].status = action; // 'approved', 'rejected'
      reports[reportIndex].reviewed = true;
      reports[reportIndex].reviewedBy = moderatorId;
      reports[reportIndex].reviewNotes = notes;
      reports[reportIndex].reviewedAt = new Date().toISOString();

      localStorage.setItem('player_reports', JSON.stringify(reports));

      return { success: true, report: reports[reportIndex] };
  },

  // Obtener todos los retiros pendientes (admin)
  getPendingWithdrawals: () => {
      const users = getDB();
      const allWithdrawals = [];
      
      users.forEach(user => {
          if (user.withdrawals && user.withdrawals.length > 0) {
              user.withdrawals.forEach(w => {
                  if (w.status === 'pending') {
                      allWithdrawals.push({
                          ...w,
                          userName: user.username,
                          userEmail: user.email
                      });
                  }
              });
          }
      });

      return allWithdrawals;
  },

  // Aprobar/Rechazar retiro (admin)
  processWithdrawal: (userId, withdrawalId, action) => {
      const users = getDB();
      const userIndex = users.findIndex(u => u.id === userId);
      if (userIndex === -1) return { error: 'Usuario no encontrado' };

      const withdrawalIndex = users[userIndex].withdrawals.findIndex(w => w.id === withdrawalId);
      if (withdrawalIndex === -1) return { error: 'Retiro no encontrado' };

      users[userIndex].withdrawals[withdrawalIndex].status = action; // 'completed' o 'failed'
      users[userIndex].withdrawals[withdrawalIndex].processedAt = new Date().toISOString();

      // Si fue rechazado, devolver tokens
      if (action === 'failed') {
          users[userIndex].tokens += users[userIndex].withdrawals[withdrawalIndex].amount;
      }

      setDB(users);
      return { success: true };
  }
};

