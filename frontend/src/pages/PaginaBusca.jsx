import React, { useState } from 'react';
import { LayoutApp } from '../components/LayoutApp';
// AQUI ESTÁ A CORREÇÃO: 'from' em vez de 'in'
import { Botao } from '../components/Botao';
import { Input } from '../components/Input';
import { ResultadoBusca } from '../components/ResultadoBusca';
import styled from 'styled-components';
import { Link } from 'react-router-dom';

const BuscaLayout = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 2rem;

  @media (min-width: 1024px) {
    grid-template-columns: 250px 1fr;
  }
`;

const Sidebar = styled.aside`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const MainContent = styled.main`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const SearchBar = styled.div`
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 1rem;
  align-items: flex-end; 

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
    align-items: stretch;
  }
`;

const ButtonContainer = styled.div`
  display: flex;
  justify-content: flex-end;
  
  @media (min-width: 640px) {
    width: 250px;
    align-self: flex-end;
  }
`;

const ResultsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const mockResultados = [
  { id: 1, nome: 'Teste da Silva', servico: 'Aula de Inglês', valor: '1 hora' },
  { id: 2, nome: 'Jose das Couves', servico: 'Consultoria React', valor: '2 horas' },
  { id: 3, nome: 'Mariazinha', servico: 'Design de Logo', valor: '3 horas' },
];

export const PaginaBusca = ({ onLogout }) => {
  const [termoBusca, setTermoBusca] = useState('');

  return (
    <LayoutApp>
      <BuscaLayout>
        {/* Coluna da Esquerda (Sidebar) */}
        <Sidebar>
          <Link to="/perfil" style={{ textDecoration: 'none' }}>
            <Botao fullWidth>Visualizar Perfil</Botao>
          </Link>
          <Botao onClick={onLogout} fullWidth>Sair</Botao>
        </Sidebar>

        {/* Coluna da Direita (Conteúdo) */}
        <MainContent>
          <SearchBar>
            <Input 
              placeholder="Encontre um serviço ou usuário"
              type="text"
              value={termoBusca}
              onChange={(e) => setTermoBusca(e.target.value)}
            />
            <Botao>Buscar</Botao>
          </SearchBar>

          <ButtonContainer>
            <Link to="/dashboard" style={{ textDecoration: 'none', width: '100%' }}>
              <Botao fullWidth>Transferir Horas</Botao>
            </Link>
          </ButtonContainer>

          <ResultsList>
            {mockResultados.map(item => (
              <ResultadoBusca key={item.id} item={item} />
            ))}
          </ResultsList>
        </MainContent>
      </BuscaLayout>
    </LayoutApp>
  );
};