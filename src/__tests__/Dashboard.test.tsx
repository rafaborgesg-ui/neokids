import { Response } from 'node-fetch';
import React from 'react';

beforeAll(() => {
  global.fetch = jest.fn(() => Promise.resolve({
    json: () => Promise.resolve({}),
  }));
});
import { render, screen } from '@testing-library/react';
import Dashboard from '../components/Dashboard';

describe('Dashboard', () => {
  it('deve renderizar KPIs e painel gerencial', () => {
    render(<Dashboard accessToken="fake-token" userRole="administrador" />);
    expect(screen.getByText(/Dashboard Gerencial/i)).toBeInTheDocument();
    expect(screen.getByText(/Receita Total/i)).toBeInTheDocument();
  });

  // Adicione mais testes para exportação de dados, ações rápidas
});
