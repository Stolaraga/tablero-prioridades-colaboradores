'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { BoardStore } = require('../store');

const demo = () => ({ title: 'Falta de documentación', description: 'Es difícil encontrar procedimientos.', category: 'Capacitación' });

test('máximo dos problemas por navegador', () => {
  const store = new BoardStore();
  store.createProblem('usuario-a', demo());
  store.createProblem('usuario-a', demo());
  assert.equal(store.state('usuario-a').myProblemCount, 2);
  assert.throws(() => store.createProblem('usuario-a', demo()), /máximo de dos/);
  assert.equal(store.state('usuario-b').myProblemCount, 0);
});

test('un voto por participante y por problema, reversible', () => {
  const store = new BoardStore();
  const id = store.createProblem('autor', demo());
  store.toggleVote('usuario-a', id);
  assert.equal(store.state('usuario-a').problems[0].votes, 1);
  assert.equal(store.state('usuario-a').problems[0].votedByMe, true);
  store.toggleVote('usuario-a', id);
  assert.equal(store.state('usuario-a').problems[0].votes, 0);
});

test('los problemas se ordenan por más votos', () => {
  const store = new BoardStore();
  const a = store.createProblem('autor', { ...demo(), title: 'Primer problema' });
  const b = store.createProblem('autor', { ...demo(), title: 'Segundo problema' });
  store.toggleVote('votante1', b);
  store.toggleVote('votante2', b);
  store.toggleVote('votante1', a);
  assert.deepEqual(store.state('autor').problems.map(p => p.id), [b, a]);
});

test('rechaza datos no válidos', () => {
  const store = new BoardStore();
  assert.throws(() => store.createProblem('usuario-a', { ...demo(), title: 'x' }), /título/);
  assert.throws(() => store.createProblem('usuario-a', { ...demo(), category: 'Inexistente' }), /categoría/);
});
