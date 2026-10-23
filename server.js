'use strict';

const path = require('node:path');
const { randomUUID } = require('node:crypto');
const express = require('express');
const { BoardStore } = require('./store');

const app = express();
const board = new BoardStore();
const PORT = Number(process.env.PORT) || 3000;
const COOKIE_NAME = 'tablero_participante';

app.disable('x-powered-by');
app.set('trust proxy', 1);
app.use(express.json({ limit: '15kb' }));

// La cookie únicamente distingue navegadores durante la demostración.
// No se solicita nombre, correo electrónico ni información de desempeño.
app.use((req, res, next) => {
  const cookieHeader = req.headers.cookie || '';
  const match = cookieHeader.match(/(?:^|;\s*)tablero_participante=([0-9a-f-]{36})(?:;|$)/i);
  let id = match?.[1];
  if (!id) {
    id = randomUUID();
    res.cookie(COOKIE_NAME, id, {
      httpOnly: true,
      sameSite: 'lax',
      secure: req.secure,
      path: '/',
      maxAge: 1000 * 60 * 60 * 24 // un día; el servidor no guarda nada en disco
    });
  }
  req.visitorId = id;
  next();
});

app.get('/api/health', (_req, res) => res.json({ ok: true, temporary: true }));
app.get('/api/state', (req, res) => res.json(board.state(req.visitorId)));

app.post('/api/problems', (req, res) => {
  try {
    board.createProblem(req.visitorId, req.body || {});
    res.status(201).json(board.state(req.visitorId));
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message });
  }
});

app.post('/api/problems/:id/vote', (req, res) => {
  try {
    board.toggleVote(req.visitorId, req.params.id);
    res.json(board.state(req.visitorId));
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message });
  }
});

app.use(express.static(path.join(__dirname, 'public')));

app.use((_req, res) => res.status(404).json({ error: 'Ruta no encontrada.' }));

app.use((err, _req, res, _next) => {
  if (err.type === 'entity.too.large' || err instanceof SyntaxError) {
    return res.status(400).json({ error: 'Solicitud inválida o demasiado grande.' });
  }
  console.error('Error de la aplicación:', err);
  res.status(500).json({ error: 'No fue posible procesar la solicitud.' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Tablero disponible en http://localhost:${PORT}`);
});
