# Voz del equipo: tablero de prioridades

Maqueta académica para la Tarea 2 de **Autogestión y Desarrollo Empresarial (03073)**. Se basa en un caso hipotético de un equipo de soporte tecnológico, con énfasis en escucha, comunicación y priorización participativa.

## Funcionalidades

- Cada navegador puede publicar **hasta dos problemas** mientras esté activo el servidor.
- Los participantes votan un problema **una vez** y pueden retirar su voto.
- El ranking se ordena por cantidad de votos, de mayor a menor.
- Las actualizaciones se consultan cada **3 segundos** y las ven todos los dispositivos conectados a **una misma instancia de servidor**.
- No hay base de datos ni almacenamiento persistente; **reiniciar el proceso elimina los datos**.
- No se pide nombre ni correo electrónico; una cookie temporal distingue navegadores.

## Estructura

```text
.
├── .gitignore
├── package.json
├── server.js
├── store.js
├── public/
│   ├── index.html
│   ├── styles.css
│   └── app.js
└── tests/
    └── store.test.js
```

## Ejecutar en un computador

Requiere Node.js 20 o posterior.

```bash
npm install
npm start
```

Abre `http://localhost:3000` en el navegador. Para probarlo desde varios dispositivos deben acceder al **mismo servidor**, no a servidores locales distintos.

Para ejecutar las pruebas:

```bash
npm test
```

## Publicar los archivos en GitHub

Extrae la carpeta del proyecto del ZIP. En el repositorio creado anteriormente, selecciona **Add file > Upload files**, arrastra los archivos y carpetas extraídos (no el ZIP comprimido) y confirma con **Commit changes**. Verifica que aparezcan `server.js`, `package.json`, y la carpeta `public`.

## Publicación posterior en Azure

La siguiente etapa será conectar GitHub con un servicio web compatible con Node.js, como **Azure App Service**, configurar el plan disponible en la suscripción, establecer la versión de Node.js y realizar el despliegue. El servicio debe ejecutar `npm start` y suministrar la variable `PORT` cuando corresponda. **La gratuidad y disponibilidad del plan deben comprobarse en el portal antes de crearlo.**

## Limitaciones de la maqueta

- **No es un sistema de voto verificable.** La cookie se puede borrar o usar otra ventana/navegador para aparentar otro participante y registrar más problemas o votar de nuevo. Se debe presentar esta limitación en la evaluación.
- Los datos viven únicamente en memoria del proceso. Si Azure detiene o reinicia el proceso, se pierden.
- Si se ejecuta en varias instancias simultáneas, cada una tendrá su propio tablero; no hay sincronización entre ellas.
- No se deben publicar información confidencial, acusaciones nominativas ni datos laborales personales.
- No representa encuestas o entrevistas reales. Es una simulación del prototipo propuesto para la actividad académica.
