import { Response } from 'node-fetch';
import React from 'react';

beforeAll(() => {
  global.fetch = jest.fn(() => Promise.resolve({
    json: () => Promise.resolve({}),
  }));
});
import { render, screen } from '@testing-library/react';
import KanbanBoard from '../components/KanbanBoard';

describe('KanbanBoard', () => {
  const props = { accessToken: 'fake-token', userRole: 'tecnico' };

  it('deve renderizar painel laboratorial', () => {
    render(<KanbanBoard {...props} />);
    expect(screen.getByText(/Painel Laboratorial/i)).toBeInTheDocument();
    expect(screen.getByText(/Buscar por paciente/i)).toBeInTheDocument();
  });

  // Adicione mais testes para mudança de status, busca, visualização de amostras
});
