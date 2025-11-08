import React from 'react';
import { LayoutApp } from '../components/LayoutApp';
import { CartaoServico } from '../components/CartaoServico';
import { Botao } from '../components/Botao';
import styled from 'styled-components';
import { Link } from 'react-router-dom';

const PerfilHeader = styled.div`...`;
const InfoUsuario = styled.div`...`;
const AvatarContainer = styled.div`...`;
const ServicosContainer = styled.section`...`;
const ServicosHeader = styled.div`...`;
const GridServicos = styled.div`...`;

export const PaginaPerfil = () => {
  const servicos = [
    { id: 1, nome: 'Aula de Inglês', descricao: 'Desenvolveremos sua conversação', valor: '1 hora' },
    { id: 2, nome: 'Aula de Inglês', descricao: 'Preparação para prova', valor: '1 hora' },
  ];
  const habilidades = [
    { id: 3, nome: 'Professor de Inglês', descricao: 'Posso ensinar gramática e pronúncia', valor: 'N/A' },
  ];

  return (
    <LayoutApp>
      <PerfilHeader>
        <InfoUsuario>
          <h1>Perfil do Usuário</h1>
          <p>Usuário de teste 1</p>
          <p>teste1@testemail.com</p>
          <Botao style={{ marginTop: '1rem', width: 'auto', padding: '0.75rem 1.5rem' }}>
            Editar Perfil
          </Botao>
        </InfoUsuario>
        <AvatarContainer>
          <img alt="Avatar do usuário" />
        </AvatarContainer>
      </PerfilHeader>

      <ServicosContainer>
        <ServicosHeader>
          <h2>Serviços e habilidades</h2>
          <Link to="/servico/novo">
            <Botao style={{width: 'auto', padding: '0.75rem 1.5rem'}}>
              Adicionar Novo Serviço
            </Botao>
          </Link>
        </ServicosHeader>
        
        <GridServicos>
          {servicos.map((item) => (
            <CartaoServico key={item.id} tipo="Serviço" item={item} />
          ))}
          {habilidades.map((item) => (
            <CartaoServico key={item.id} tipo="Habilidade" item={item} />
          ))}
        </GridServicos>
      </ServicosContainer>
    </LayoutApp>
  );
};