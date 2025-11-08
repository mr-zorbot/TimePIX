import { useState } from 'react';
import { LayoutAutenticacao } from '../components/LayoutAutenticacao';
import { Botao } from '../components/Botao';
import { Input } from '../components/Input';
import styled from 'styled-components';
import { Link } from 'react-router-dom';

const Titulo = styled.h2`...`;
const Subtitulo = styled.p`...`;
const Formulario = styled.form`...`;
const LinkAlternativo = styled.p`...`;
const InputRow = styled.div`...`;

export const PaginaRegistro = () => {
  const [nome, setNome] = useState('');
  const [sobrenome, setSobrenome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');

  const handleSubmit = (event) => {
    event.preventDefault();
    console.log("Registrar com:", { nome, sobrenome, email, senha });
  };

  return (
    <LayoutAutenticacao>
      <Titulo>Boas-vindas!</Titulo>
      <Subtitulo>Registre-se para começar a aproveitar seu tempo</Subtitulo>
      
      <Formulario onSubmit={handleSubmit}>
        <InputRow>
          <Input 
            label="Nome" 
            type="text" 
            value={nome}
            onChange={(e) => setNome(e.target.value)} 
          />
          <Input 
            label="Sobrenome" 
            type="text" 
            value={sobrenome}
            onChange={(e) => setSobrenome(e.target.value)} 
          />
        </InputRow>
        
        <Input 
          label="E-mail" 
          type="email" 
          value={email}
          onChange={(e) => setEmail(e.target.value)} 
        />
        <Input 
          label="Senha" 
          type="password" 
          value={senha}
          onChange={(e) => setSenha(e.target.value)} 
        />
        
        <Botao type="submit">Registrar - se</Botao>
      </Formulario>

      <LinkAlternativo>
        Já possui uma conta? <Link to="/login">Entrar</Link>
      </LinkAlternativo>
    </LayoutAutenticacao>
  );
};