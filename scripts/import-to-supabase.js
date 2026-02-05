// Migration script: Import data to Supabase
// Run: node scripts/import-to-supabase.js

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Configuración de Supabase
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://tu-proyecto.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || 'tu-service-role-key';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function importData() {
    console.log('🚀 Iniciando importación a Supabase...\n');

    try {
        // Leer archivo de backup
        const backupFile = process.argv[2];
        if (!backupFile) {
            console.error('❌ Uso: node import-to-supabase.js <archivo-backup.json>');
            process.exit(1);
        }

        const data = JSON.parse(fs.readFileSync(backupFile, 'utf8'));
        console.log(`📁 Archivo leído: ${backupFile}`);
        console.log(`👥 Usuarios: ${data.users.length}`);
        console.log(`🎮 Matches: ${data.matches.length}\n`);

        // 1. Importar usuarios
        console.log('📤 Importando usuarios...');
        for (const user of data.users) {
            try {
                // Crear usuario en Supabase Auth
                const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
                    email: user.email,
                    password: user.password || 'ChangeMe123!', // Temporal
                    email_confirm: user.emailVerified
                });

                if (authError) {
                    console.error(`  ❌ Error creando auth para ${user.email}:`, authError.message);
                    continue;
                }

                // Insertar datos del usuario
                const { error: userError } = await supabase.from('users').insert({
                    id: authUser.user.id,
                    email: user.email,
                    username: user.username,
                    role: user.role,
                    tokens: user.tokens,
                    snipes: user.snipes,
                    wins: user.wins,
                    losses: user.losses,
                    earnings: user.earnings,
                    total_earned: user.totalEarned,
                    total_played: user.totalPlayed,
                    current_streak: user.streaks?.current || 0,
                    best_streak: user.streaks?.best || 0,
                    level: user.level,
                    experience: user.experience,
                    reputation: user.reputation,
                    trust_score: user.trustScore,
                    reported_count: user.reportedCount,
                    email_verified: user.emailVerified,
                    two_factor_enabled: user.twoFactorEnabled,
                    last_login: user.lastLogin
                });

                if (userError) {
                    console.error(`  ❌ Error insertando datos de ${user.email}:`, userError.message);
                } else {
                    console.log(`  ✅ ${user.username} (${user.email})`);
                }

                // Insertar achievements
                if (user.achievements && user.achievements.length > 0) {
                    for (const achievement of user.achievements) {
                        await supabase.from('user_achievements').insert({
                            user_id: authUser.user.id,
                            achievement_name: achievement
                        });
                    }
                }

                // Insertar transactions
                if (user.transactions && user.transactions.length > 0) {
                    for (const tx of user.transactions) {
                        await supabase.from('transactions').insert({
                            user_id: authUser.user.id,
                            type: tx.type,
                            amount: tx.amount,
                            description: tx.description,
                            created_at: tx.date
                        });
                    }
                }

                // Insertar withdrawals
                if (user.withdrawals && user.withdrawals.length > 0) {
                    for (const withdrawal of user.withdrawals) {
                        await supabase.from('withdrawals').insert({
                            user_id: authUser.user.id,
                            amount: withdrawal.amount,
                            method: withdrawal.method,
                            details: withdrawal.email || withdrawal.details,
                            status: withdrawal.status,
                            created_at: withdrawal.requestedAt
                        });
                    }
                }

            } catch (error) {
                console.error(`  ❌ Error con usuario ${user.email}:`, error);
            }
        }

        // 2. Importar matches
        console.log('\n📤 Importando matches...');
        for (const match of data.matches) {
            try {
                // Buscar IDs de usuarios en Supabase
                const { data: player1 } = await supabase
                    .from('users')
                    .select('id')
                    .eq('username', match.player1?.username)
                    .single();

                const { data: player2 } = await supabase
                    .from('users')
                    .select('id')
                    .eq('username', match.player2?.username)
                    .single();

                let winnerId = null;
                if (match.winner) {
                    const { data: winner } = await supabase
                        .from('users')
                        .select('id')
                        .eq('username', match.winner.username)
                        .single();
                    winnerId = winner?.id;
                }

                const { error: matchError } = await supabase.from('matches').insert({
                    game_mode: match.gameMode,
                    bet_amount: match.betAmount,
                    region: match.region,
                    player1_id: player1?.id,
                    player2_id: player2?.id,
                    winner_id: winnerId,
                    status: match.status,
                    created_at: match.createdAt,
                    started_at: match.startedAt,
                    completed_at: match.completedAt
                });

                if (matchError) {
                    console.error(`  ❌ Error importando match ${match.id}:`, matchError.message);
                } else {
                    console.log(`  ✅ Match ${match.id} (${match.gameMode})`);
                }

            } catch (error) {
                console.error(`  ❌ Error con match ${match.id}:`, error);
            }
        }

        console.log('\n✅ Importación completada!');
        console.log('\n⚠️  IMPORTANTE: Los usuarios deben cambiar sus contraseñas');
        console.log('   Se asignó contraseña temporal: ChangeMe123!');

    } catch (error) {
        console.error('❌ Error general:', error);
        process.exit(1);
    }
}

importData();
