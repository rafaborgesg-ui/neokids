import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import App from '../App';

describe('App', () => {
  it('deve renderizar tela de login quando não há sessão', () => {
    render(<App />);
    expect(screen.getByText(/Carregando/i)).toBeInTheDocument();
    // Simula fim do loading
    setTimeout(() => {
      expect(screen.getByText(/Login/i)).toBeInTheDocument();
    }, 1000);
  });

  // Teste de navegação entre módulos (mock de sessão)
  it('deve renderizar dashboard quando logado', () => {
    // Mock de sessão
    const session = {
      access_token: 'fake-token',
      user: {
        id: '1',
        email: 'teste@teste.com',
        user_metadata: { name: 'Teste', role: 'administrador' }
      }
    };
    jest.spyOn(React, 'useState').mockImplementationOnce(() => [session, jest.fn()]);
    render(<App />);
    expect(screen.getByText(/Dashboard/i)).toBeInTheDocument();
  });

  // Teste de logout
  it('deve permitir logout', () => {
    // Mock de sessão
    const session = {
      access_token: 'fake-token',
      user: {
        id: '1',
        email: 'teste@teste.com',
        user_metadata: { name: 'Teste', role: 'administrador' }
      }
    };
    jest.spyOn(React, 'useState').mockImplementationOnce(() => [session, jest.fn()]);
    render(<App />);
    const logoutBtn = screen.getByRole('button', { name: /logout/i });
    fireEvent.click(logoutBtn);
    expect(screen.getByText(/Login/i)).toBeInTheDocument();
  });
});
