// supabase.js - Configuración de Supabase

// Servicio para manejar la conexión con Supabase y funciones de autenticación
const SupabaseService = (function() {
    // Configuración de Supabase
    const SUPABASE_URL = 'https://vqlwfanhlwnozpfbwhyd.supabase.co';
    const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZxbHdmYW5obHdub3pwZmJ3aHlkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI3NTYxNTcsImV4cCI6MjA1ODMzMjE1N30.HPl5_rLtj-reZkLzEEY9t77r4CIDBodHBijuVd8RXlA';
    
    // Inicializar el cliente de Supabase
    const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    
    // Servicio de autenticación
    const auth = {
        /**
         * Iniciar sesión con correo y contraseña
         * @param {string} email - Correo electrónico del usuario
         * @param {string} password - Contraseña del usuario
         * @returns {Promise} - Promesa con resultado de autenticación
         */
        signIn: async function(email, password) {
            try {
                return await supabase.auth.signInWithPassword({
                    email,
                    password
                });
            } catch (error) {
                console.error('Error en signIn:', error);
                return { error };
            }
        },
        
        /**
         * Registrar un nuevo usuario
         * @param {string} email - Correo electrónico del usuario
         * @param {string} password - Contraseña del usuario
         * @returns {Promise} - Promesa con resultado de registro
         */
        signUp: async function(email, password) {
            try {
                return await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        emailRedirectTo: window.location.origin + '/index.html',
                        data: {
                            redirectUrl: window.location.origin + '/index.html'
                        }
                    }
                });
            } catch (error) {
                console.error('Error en signUp:', error);
                return { error };
            }
        },
        
        /**
         * Iniciar sesión con enlace mágico
         * @param {string} email - Correo electrónico del usuario
         * @returns {Promise} - Promesa con resultado de envío del enlace
         */
        signInWithMagicLink: async function(email) {
            try {
                return await supabase.auth.signInWithOtp({
                    email,
                    options: {
                        emailRedirectTo: window.location.origin + '/index.html',
                        // Aumentar el tiempo de expiración (en segundos)
                        // Por defecto es 1 hora (3600 segundos)
                        // Establecerlo a 24 horas
                        expiresIn: 86400
                    }
                });
            } catch (error) {
                console.error('Error en signInWithMagicLink:', error);
                return { error };
            }
        },
        
        /**
         * Cerrar sesión
         * @returns {Promise} - Promesa con resultado de cierre de sesión
         */
        signOut: async function() {
            try {
                return await supabase.auth.signOut();
            } catch (error) {
                console.error('Error en signOut:', error);
                return { error };
            }
        },
        
        /**
         * Obtener la sesión actual
         * @returns {Promise} - Promesa con la sesión actual
         */
        getSession: async function() {
            try {
                return await supabase.auth.getSession();
            } catch (error) {
                console.error('Error en getSession:', error);
                return { error };
            }
        },
        
        /**
         * Procesar redirección de enlace mágico
         * @returns {Promise} - Promesa con resultado del procesamiento
         */
        handleMagicLinkRedirect: async function() {
            try {
                // Verificar si hay un hash en la URL
                const hash = window.location.hash;
                if (!hash || !hash.includes('access_token')) {
                    return { error: { message: 'No hay hash de autenticación en la URL' } };
                }
                
                // Supabase maneja automáticamente la sesión al detectar el hash
                const { data, error } = await supabase.auth.getSession();
                
                if (error) {
                    console.error('Error al procesar enlace mágico:', error);
                    return { error };
                }
                
                // Limpiar la URL para eliminar el hash
                if (window.history && window.history.replaceState) {
                    window.history.replaceState({}, document.title, window.location.pathname);
                }
                
                return { data };
            } catch (error) {
                console.error('Error en handleMagicLinkRedirect:', error);
                return { error };
            }
        },
        
        /**
         * Obtener el usuario actual
         * @returns {object|null} - Usuario actual o null si no hay sesión
         */
        getCurrentUser: async function() {
            try {
                const { data, error } = await this.getSession();
                return data?.session?.user || null;
            } catch (error) {
                console.error('Error en getCurrentUser:', error);
                return null;
            }
        },
        
        /**
         * Verificar si el usuario está autenticado
         * @returns {boolean} - True si el usuario está autenticado
         */
        isAuthenticated: async function() {
            try {
                const user = await this.getCurrentUser();
                return !!user;
            } catch (error) {
                console.error('Error en isAuthenticated:', error);
                return false;
            }
        },
        
        /**
         * Suscribirse a cambios en la autenticación
         * @param {function} callback - Función a ejecutar cuando cambia la autenticación
         * @returns {function} - Función para cancelar la suscripción
         */
        onAuthStateChange: function(callback) {
            try {
                return supabase.auth.onAuthStateChange((event, session) => {
                    callback(event, session);
                });
            } catch (error) {
                console.error('Error en onAuthStateChange:', error);
                return null;
            }
        }
    };
    
    // Servicio de base de datos
    const db = {
        /**
         * Obtener datos de una tabla
         * @param {string} table - Nombre de la tabla
         * @param {object} options - Opciones de consulta (select, filter, etc)
         * @returns {Promise} - Promesa con resultado de consulta
         */
        get: async function(table, options = {}) {
            try {
                let query = supabase.from(table).select(options.select || '*');
                
                // Aplicar filtros si existen
                if (options.filter) {
                    for (const key in options.filter) {
                        query = query.eq(key, options.filter[key]);
                    }
                }
                
                // Aplicar orden si existe
                if (options.order) {
                    query = query.order(options.order.column, {
                        ascending: options.order.ascending
                    });
                }
                
                // Aplicar límite si existe
                if (options.limit) {
                    query = query.limit(options.limit);
                }
                
                return await query;
            } catch (error) {
                console.error(`Error en get de ${table}:`, error);
                return { error };
            }
        },
        
        /**
         * Insertar datos en una tabla
         * @param {string} table - Nombre de la tabla
         * @param {object|array} data - Datos a insertar
         * @returns {Promise} - Promesa con resultado de inserción
         */
        insert: async function(table, data) {
            try {
                return await supabase.from(table).insert(data);
            } catch (error) {
                console.error(`Error en insert de ${table}:`, error);
                return { error };
            }
        },
        
        /**
         * Actualizar datos en una tabla
         * @param {string} table - Nombre de la tabla
         * @param {object} data - Datos a actualizar
         * @param {object} match - Condición para actualizar
         * @returns {Promise} - Promesa con resultado de actualización
         */
        update: async function(table, data, match) {
            try {
                let query = supabase.from(table).update(data);
                
                for (const key in match) {
                    query = query.eq(key, match[key]);
                }
                
                return await query;
            } catch (error) {
                console.error(`Error en update de ${table}:`, error);
                return { error };
            }
        },
        
        /**
         * Eliminar datos de una tabla
         * @param {string} table - Nombre de la tabla
         * @param {object} match - Condición para eliminar
         * @returns {Promise} - Promesa con resultado de eliminación
         */
        delete: async function(table, match) {
            try {
                let query = supabase.from(table).delete();
                
                for (const key in match) {
                    query = query.eq(key, match[key]);
                }
                
                return await query;
            } catch (error) {
                console.error(`Error en delete de ${table}:`, error);
                return { error };
            }
        }
    };
    
    // Exponer la API pública
    return {
        auth,
        db,
        supabase // Por si se necesita acceso directo al cliente
    };
})();

// Exportar el servicio para su uso en otros archivos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SupabaseService;
} 