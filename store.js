'use strict';

const { randomUUID } = require('node:crypto');

const VALID_CATEGORIES = Object.freeze([
  'Comunicación',
  'Capacitación',
  'Clima laboral',
  'Evaluación del desempeño',
  'Otros'
]);

const MAX_PROBLEMS_PER_VISITOR = 2;

/**
 * Almacenamiento deliberadamente temporal: se vacía cuando reinicia Node.js.
 * Adecuado para una maqueta de una sola instancia, no para producción.
 */
class BoardStore {
  constructor() {
    this.problems = new Map();
    this.byVisitor = new Map();
  }

  countMine(visitorId) {
    return this.byVisitor.get(visitorId)?.size ?? 0;
  }

  state(visitorId) {
    return {
      maximumPerParticipant: MAX_PROBLEMS_PER_VISITOR,
      myProblemCount: this.countMine(visitorId),
      problems: [...this.problems.values()]
        .map(problem => ({
          id: problem.id,
          title: problem.title,
          description: problem.description,
          category: problem.category,
          createdAt: problem.createdAt,
          votes: problem.voters.size,
          votedByMe: problem.voters.has(visitorId),
          createdByMe: problem.authorId === visitorId
        }))
        .sort((a, b) => b.votes - a.votes || a.createdAt.localeCompare(b.createdAt))
    };
  }

  createProblem(visitorId, { title, description = '', category }) {
    if (this.countMine(visitorId) >= MAX_PROBLEMS_PER_VISITOR) {
      const error = new Error('Has alcanzado el máximo de dos problemas registrados.');
      error.status = 409;
      throw error;
    }

    if (typeof title !== 'string' || title.trim().length < 5 || title.trim().length > 110) {
      const error = new Error('El título debe tener entre 5 y 110 caracteres.');
      error.status = 400;
      throw error;
    }
    if (typeof description !== 'string' || description.trim().length > 500) {
      const error = new Error('La descripción no puede superar 500 caracteres.');
      error.status = 400;
      throw error;
    }
    if (!VALID_CATEGORIES.includes(category)) {
      const error = new Error('Selecciona una categoría válida.');
      error.status = 400;
      throw error;
    }

    const problem = {
      id: randomUUID(),
      title: title.trim(),
      description: description.trim(),
      category,
      authorId: visitorId,
      createdAt: new Date().toISOString(),
      voters: new Set()
    };
    this.problems.set(problem.id, problem);
    if (!this.byVisitor.has(visitorId)) this.byVisitor.set(visitorId, new Set());
    this.byVisitor.get(visitorId).add(problem.id);
    return problem.id;
  }

  toggleVote(visitorId, id) {
    const problem = this.problems.get(id);
    if (!problem) {
      const error = new Error('No se encontró el problema seleccionado.');
      error.status = 404;
      throw error;
    }
    if (problem.voters.has(visitorId)) problem.voters.delete(visitorId);
    else problem.voters.add(visitorId);
    return problem.voters.has(visitorId);
  }
}

module.exports = { BoardStore, VALID_CATEGORIES, MAX_PROBLEMS_PER_VISITOR };
