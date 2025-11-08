import React from 'react';
import styled from 'styled-components';
import { Botao } from './Botao';

// A CORREÇÃO: Estilos completos, sem '...'
const ItemContainer = styled.div`
  display: flex;
  flex-direction: column; 
  gap: 1rem;
  padding: 1.5rem;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);

  @media (min-width: 768px) {
    flex-direction: row; 
    gap: 1.5rem;
    align-items: center;
  }
`;

const Avatar = styled.img`
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background-color: #e5e7eb; // Placeholder
  flex-shrink: 0; 
`;

const InfoContainer = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.75rem; 
`;

const InfoGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1.5fr 1fr;
  gap: 0.25rem 1rem;
`;

const Label = styled.span`
  font-size: 0.8rem;
  font-weight: bold;
  color: #6b7280; // Cinza
`;

const Data = styled.span`
  font-size: 1rem;
  color: #111827; // Preto
`;

const ContatarButtonWrapper = styled.div`
  max-width: 200px; 

  @media (max-width: 768px) {
    max-width: 100%;
  }
`;

export const ResultadoBusca = ({ item }) => {
  return (
    <ItemContainer>
      <Avatar />
      <InfoContainer>
        <InfoGrid>
          <Label>Nome</Label>
          <Label>Serviço</Label>
          <Label>Valor</Label>
          
          <Data>{item.nome}</Data>
          <Data>{item.servico}</Data>
          <Data>{item.valor}</Data>
        </InfoGrid>
        
        <ContatarButtonWrapper>
          <Botao fullWidth>CONTATAR</Botao>
        </ContatarButtonWrapper>
      </InfoContainer>
    </ItemContainer>
  );
};