'use strict';

const form = document.querySelector('#problem-form');
const list = document.querySelector('#problem-list');
const feedback = document.querySelector('#feedback');
const publishButton = document.querySelector('#submit-btn');
const limitNotice = document.querySelector('#limit-notice');
const statusBadge = document.querySelector('#connection');
let busy = false;
let currentState = null;

async function request(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options.headers }
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Ocurrió un error.');
  return data;
}

function el(tag, className, text) {
  const item = document.createElement(tag);
  if (className) item.className = className;
  if (text !== undefined) item.textContent = text; // previene HTML inyectado
  return item;
}

function render(data) {
  currentState = data;
  document.querySelector('#problem-total').textContent = data.problems.length;
  document.querySelector('#vote-total').textContent = data.problems.reduce((sum, x) => sum + x.votes, 0);
  document.querySelector('#mine-total').textContent = `${data.myProblemCount} / ${data.maximumPerParticipant}`;

  const limitReached = data.myProblemCount >= data.maximumPerParticipant;
  [...form.elements].forEach(element => { element.disabled = limitReached || busy; });
  limitNotice.hidden = !limitReached;
  publishButton.textContent = limitReached ? 'Límite alcanzado' : 'Publicar problema';

  // No sustituir el listado mientras el usuario está interactuando con una votación.
  const fragment = document.createDocumentFragment();
  if (!data.problems.length) {
    const empty = el('div', 'empty', 'Aún no hay problemas registrados. Publica el primero para iniciar la votación.');
    fragment.append(empty);
  }

  data.problems.forEach((problem, position) => {
    const article = el('article', 'problem');
    const number = el('span', 'position', String(position + 1));
    const content = el('div', 'problem-content');
    const heading = el('h3', '', problem.title);
    const category = el('span', 'tag', problem.category);
    content.append(heading, category);
    if (problem.description) content.append(el('p', 'description', problem.description));
    if (problem.createdByMe) content.append(el('span', 'tag', 'Publicado desde este navegador'));

    const voteArea = el('div', 'vote-area');
    const count = el('span', 'count', String(problem.votes));
    const caption = el('span', 'vote-text', problem.votes === 1 ? 'voto' : 'votos');
    const button = el('button', `vote-button ${problem.votedByMe ? 'active' : ''}`, problem.votedByMe ? 'Retirar voto' : 'Votar');
    button.type = 'button';
    button.setAttribute('aria-pressed', String(problem.votedByMe));
    button.setAttribute('aria-label', `${problem.votedByMe ? 'Retirar voto de' : 'Votar por'} ${problem.title}`);
    button.addEventListener('click', async () => {
      if (busy) return;
      busy = true;
      button.disabled = true;
      try {
        const newState = await request(`/api/problems/${encodeURIComponent(problem.id)}/vote`, { method: 'POST' });
        feedback.textContent = '';
        render(newState);
      } catch (error) {
        feedback.textContent = error.message;
        button.disabled = false;
      } finally {
        busy = false;
        if (currentState) render(currentState);
      }
    });
    voteArea.append(count, caption, button);
    article.append(number, content, voteArea);
    fragment.append(article);
  });

  list.replaceChildren(fragment);
  statusBadge.textContent = 'Actualizado';
  statusBadge.classList.remove('offline');
}

async function refresh() {
  if (busy || document.hidden) return;
  try {
    const data = await request('/api/state');
    render(data);
  } catch (error) {
    statusBadge.textContent = 'Sin conexión';
    statusBadge.classList.add('offline');
    feedback.textContent = 'No se pudo actualizar el tablero. Verifica que el servidor esté activo.';
  }
}

form.addEventListener('submit', async event => {
  event.preventDefault();
  if (busy) return;
  busy = true;
  publishButton.disabled = true;
  feedback.textContent = '';
  const body = {
    title: form.elements.title.value,
    category: form.elements.category.value,
    description: form.elements.description.value
  };
  try {
    const data = await request('/api/problems', { method: 'POST', body: JSON.stringify(body) });
    form.reset();
    render(data);
  } catch (error) {
    feedback.textContent = error.message;
  } finally {
    busy = false;
    if (currentState) render(currentState);
  }
});

refresh();
setInterval(refresh, 3000);
