import React from 'react';
import styled from 'styled-components';
import { Botao } from './Botao';
import { Link } from 'react-router-dom'; 

const CardContainer = styled.div`
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

const CardHeader = styled.div`
  background-color: #4f46e5;
  color: white;
  padding: 0.75rem 1.25rem;
  font-weight: bold;
`;

const CardContent = styled.div`
  padding: 1.25rem;
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 0.75rem 1.5rem;

  & > span:nth-child(odd) {
    font-weight: 500;
    color: #374151;
  }
`;

const CardFooter = styled.div`
  padding: 0 1.25rem 1.25rem;
  display: flex;
  gap: 0.75rem;

  /* Aplica flex: 1 para os filhos diretos (o Link e o Botao) */
  & > * {
    flex: 1;
  }
`;

export const CartaoServico = ({ tipo = 'Serviço', item }) => {
  return (
    <CardContainer>
      <CardHeader>{tipo}</CardHeader>
      <CardContent>
        <span>Nome</span>
        <span>{item.nome}</span>

        <span>Descrição</span>
        <span>{item.descricao}</span>

        <span>Valor</span>
        <span>{item.valor}</span>
      </CardContent>
      <CardFooter>
        <Link to={`/servico/editar/${item.id}`} style={{ textDecoration: 'none' }}>
          <Botao>Editar</Botao>
        </Link>
        <Botao>Remover</Botao>
      </CardFooter>
    </CardContainer>
  );
};