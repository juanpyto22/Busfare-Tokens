// Migration script: localStorage → Supabase
// Run this in browser console BEFORE deploying to extract your data

function exportLocalStorageData() {
    console.log('🔄 Exportando datos de localStorage...');
    
    const data = {
        users: [],
        matches: [],
        session: null,
        exportDate: new Date().toISOString()
    };

    try {
        // Export users
        const usersData = localStorage.getItem('fortnite_platform_users');
        if (usersData) {
            data.users = JSON.parse(usersData);
            console.log(`✅ Usuarios exportados: ${data.users.length}`);
        }

        // Export matches
        const matchesData = localStorage.getItem('fortnite_platform_matches');
        if (matchesData) {
            data.matches = JSON.parse(matchesData);
            console.log(`✅ Matches exportados: ${data.matches.length}`);
        }

        // Export current session
        const sessionData = localStorage.getItem('fortnite_platform_session');
        if (sessionData) {
            data.session = JSON.parse(sessionData);
            console.log(`✅ Sesión exportada`);
        }

        // Create downloadable JSON file
        const dataStr = JSON.stringify(data, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `backup-${Date.now()}.json`;
        link.click();

        console.log('✅ Datos exportados exitosamente!');
        console.log('📁 Archivo descargado como backup-*.json');
        
        return data;

    } catch (error) {
        console.error('❌ Error exportando datos:', error);
        return null;
    }
}

// Run export
exportLocalStorageData();
