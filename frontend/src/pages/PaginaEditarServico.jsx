import { useState, useEffect } from 'react';
import { LayoutApp } from '../components/LayoutApp';
import { Input } from '../components/Input';
import { Botao } from '../components/Botao';
import styled from 'styled-components';
import { useNavigate, useParams } from 'react-router-dom';

const Titulo = styled.h1`...`;
const Formulario = styled.form`...`;
const BotoesContainer = styled.div`...`;

export const PaginaEditarServico = () => {
  const { servicoId } = useParams();
  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [valor, setValor] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    console.log("Carregando dados para o serviço ID:", servicoId);
    setNome('Aula de Inglês (Carregado)');
    setDescricao('Descrição carregada do serviço');
    setValor('1 hora (Carregado)');
  }, [servicoId]);

  const handleSave = (e) => {
    e.preventDefault();
    console.log("Salvando dados para o serviço ID:", servicoId, { nome, descricao, valor });
    navigate('/perfil');
  };

  const handleCancel = (e) => {
    e.preventDefault();
    navigate('/perfil');
  };

  return (
    <LayoutApp>
      <Titulo>Editar Serviço</Titulo>
      
      <Formulario onSubmit={handleSave}>
        <Input 
          label="Nome" 
          type="text"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
        />
        <Input 
          label="Descrição" 
          type="text"
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
        />
        <Input 
          label="Valor" 
          type="text"
          value={valor}
          onChange={(e) => setValor(e.target.value)}
        />
        
        <BotoesContainer>
          <Botao type="submit">Salvar Alterações</Botao>
          <Botao type="button" onClick={handleCancel}>
            Cancelar
          </Botao>
        </BotoesContainer>
      </Formulario>
    </LayoutApp>
  );
};