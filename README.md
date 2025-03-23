# Gestión Financiera

Una aplicación web para la gestión de finanzas personales con autenticación utilizando Supabase.

## Características

- Autenticación de usuarios con email/contraseña
- Autenticación con enlace mágico
- Registro de transacciones financieras
- Gestión de múltiples monedas
- Transferencias entre billeteras
- Visualización de historial de transacciones
- Categorización de ingresos y gastos
- Persistencia de datos en la nube con Supabase

## Requisitos previos

- Una cuenta en [Supabase](https://supabase.com)
- Un navegador web moderno

## Configuración

### 1. Configurar Supabase

1. Crea una cuenta en [Supabase](https://supabase.com) si aún no tienes una.
2. Crea un nuevo proyecto en Supabase.
3. En la sección "Authentication" > "Providers", habilita "Email" y "Email magic link".
4. En la sección "Table Editor", crea las siguientes tablas:

#### Tabla: wallets
- id (uuid, PK)
- user_id (uuid, FK a auth.users)
- name (text)
- currency (text)
- balance (numeric)
- created_at (timestamp with timezone)

#### Tabla: transactions
- id (uuid, PK)
- user_id (uuid, FK a auth.users)
- wallet_id (uuid, FK a wallets)
- amount (numeric)
- type (text) - 'income' o 'expense'
- category (text)
- description (text)
- date (timestamp with timezone)
- created_at (timestamp with timezone)

#### Tabla: currencies
- id (uuid, PK)
- user_id (uuid, FK a auth.users)
- code (text) - Por ejemplo: 'USD', 'EUR', etc.
- symbol (text) - Por ejemplo: '$', '€', etc.
- created_at (timestamp with timezone)

#### Tabla: categories
- id (uuid, PK)
- user_id (uuid, FK a auth.users)
- name (text)
- type (text) - 'income' o 'expense'
- created_at (timestamp with timezone)

### 2. Configurar RLS (Row Level Security)

Para cada tabla, configura Row Level Security para permitir que los usuarios solo accedan a sus propios datos:

```sql
-- Habilitar RLS
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE currencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Crear políticas para cada tabla
CREATE POLICY "Usuarios pueden ver sus propias billeteras" ON wallets
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Usuarios pueden insertar sus propias billeteras" ON wallets
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuarios pueden actualizar sus propias billeteras" ON wallets
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Usuarios pueden eliminar sus propias billeteras" ON wallets
  FOR DELETE USING (auth.uid() = user_id);

-- Repetir políticas similares para las demás tablas
```

### 3. Configurar la aplicación

1. Clona este repositorio.
2. Abre el archivo `supabase.js` y actualiza las siguientes líneas con tus credenciales de Supabase:

```javascript
const SUPABASE_URL = 'https://tu-url-de-supabase.supabase.co';
const SUPABASE_KEY = 'tu-clave-publica-de-supabase';
```

## Ejecución

Para ejecutar la aplicación localmente, simplemente abre el archivo `auth.html` en tu navegador web.

Para una experiencia óptima, te recomendamos utilizar un servidor local como [Live Server](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer) para Visual Studio Code o cualquier otro servidor HTTP simple.

## Flujo de autenticación

1. Los usuarios nuevos deben registrarse con su email y contraseña en la pantalla de registro.
2. Los usuarios registrados pueden iniciar sesión con su email y contraseña o solicitar un enlace mágico.
3. Una vez autenticados, los usuarios serán redirigidos a la pantalla principal de la aplicación.
4. Los usuarios pueden cerrar sesión en cualquier momento haciendo clic en el botón "Cerrar sesión" en la barra de navegación.

## Estructura del proyecto

- `auth.html` - Página de inicio de sesión y registro
- `index.html` - Página principal de la aplicación
- `styles.css` - Estilos de la aplicación
- `app.js` - Lógica principal de la aplicación
- `supabase.js` - Servicios para interactuar con Supabase

## Licencia

[MIT](LICENSE) 