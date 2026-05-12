# 🎵 Guía de instalación — Wired Music

Guía paso a paso para que cualquier compañero pueda tener el proyecto funcionando en su PC con Windows y VSCode.

---

## Requisitos previos

Antes de empezar necesitas tener instalados estos programas. Si ya los tienes, puedes saltarte ese paso.

---

## Paso 1 — Instalar Node.js

1. Ve a **https://nodejs.org**
2. Descarga la versión **LTS** (el botón verde de la izquierda)
3. Abre el instalador `.msi` y dale siguiente → siguiente → instalar con todas las opciones por defecto
4. Cuando termine, abre el **Símbolo del sistema** (busca "cmd" en el menú inicio) y verifica:

```
node -v
npm -v
```

Debe mostrarte algo como `v22.x.x` y `10.x.x`. Si aparecen números, Node está instalado correctamente.

---

## Paso 2 — Instalar Git

1. Ve a **https://git-scm.com**
2. Descarga el instalador para Windows
3. Instálalo con todas las opciones por defecto
4. Verifica en el cmd:

```
git --version
```

Debe mostrarte algo como `git version 2.x.x`.

---

## Paso 3 — Instalar VSCode

1. Ve a **https://code.visualstudio.com**
2. Descarga el instalador para Windows
3. Durante la instalación, cuando aparezca la pantalla de "Tareas adicionales", marca estas dos opciones:
   - ✅ Agregar "Abrir con Code" al menú contextual de archivos
   - ✅ Agregar "Abrir con Code" al menú contextual de directorios
4. El resto déjalo por defecto

---

## Paso 4 — Clonar el proyecto

1. Abre el **Símbolo del sistema** (cmd)
2. Navega a donde quieras guardar el proyecto. Por ejemplo:

```
cd C:\
mkdir Projects
cd Projects
```

3. Clona el repositorio:

```
git clone https://github.com/Alex8amz/Mired-Music.git
```

4. Entra a la carpeta del proyecto:

```
cd Mired-Music
```

---

## Paso 5 — Instalar las dependencias

Dentro de la carpeta del proyecto ejecuta:

```
npm install
```

Esto descarga automáticamente todas las librerías necesarias (Electron, Howler, etc.). Tarda un par de minutos la primera vez.

---

## Paso 6 — Abrir en VSCode

Ejecuta este comando para abrir el proyecto directamente en VSCode:

```
code .
```

---

## Paso 7 — Correr la app

En la terminal de VSCode (ábrela con **Ctrl + `**) ejecuta:

```
npm start
```

Si aparece un error de permisos de PowerShell, ejecuta esto primero:

```
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
```

Escribe `S` y presiona Enter. Luego vuelve a correr `npm start`.

---

## ✅ Resultado esperado

Debe abrirse la ventana de **Wired Music** con el reproductor funcionando. Puedes agregar canciones con el botón **+** (archivos individuales) o **▤** (carpeta completa). Soporta MP3, FLAC, WAV, OGG y M4A.

---

## Estructura del proyecto

```
Mired-Music/
├── src/
│   └── renderer/
│       ├── css/
│       │   └── style.css       ← Estilos visuales
│       └── js/
│           ├── app.js          ← Lógica principal
│           └── player.js       ← (reservado para futuras funciones)
│       └── index.html          ← Interfaz HTML
├── main.js                     ← Proceso principal de Electron
├── package.json                ← Configuración del proyecto
└── .gitignore
```

---

## Trabajar en equipo con Git

Cada vez que hagas cambios y quieras compartirlos con el equipo:

```
git add .
git commit -m "descripción de lo que cambiaste"
git push
```

Para descargar los cambios que hicieron tus compañeros:

```
git pull
```

---

## Solución de problemas frecuentes

| Problema | Solución |
|----------|----------|
| `npm start` da error de permisos | Ejecuta `Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned` |
| `node` no se reconoce como comando | Reinstala Node.js y reinicia el cmd |
| `git` no se reconoce como comando | Reinstala Git y reinicia el cmd |
| La app abre pero no suena | Verifica que el archivo de audio exista y no esté corrupto |
| Error al hacer `npm install` | Borra la carpeta `node_modules` y vuelve a correr `npm install` |

---

*Wired Music — Proyecto desarrollado con Electron + Howler.js*
