import { useState } from 'react';
import { useNavigate } from 'react-router-dom'; // <-- 1. IMPORTAR useNavigate
import { LayoutAutenticacao } from '../components/LayoutAutenticacao';
import { Botao } from '../components/Botao';
import { Input } from '../components/Input';
import styled from 'styled-components';
import { Link } from 'react-router-dom';

const Titulo = styled.h2`
  font-size: 1.8rem;
  font-weight: bold;
  margin-bottom: 0.5rem;
  color: #111827;
`;

const Subtitulo = styled.p`
  color: #6b7280;
  margin-bottom: 2rem;
`;

const Formulario = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
`;

const LinkAlternativo = styled.p`
  margin-top: 1.5rem;
  text-align: center;
  color: #6b7280;
  
  a {
    color: #4f46e5;
    font-weight: 500;
    text-decoration: none;
    
    &:hover {
      text-decoration: underline;
    }
  }
`;

// 2. ACEITAR A PROP 'onLogin'
export const PaginaLogin = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const navigate = useNavigate(); // <-- 3. OBTER A FUNÇÃO DE NAVEGAÇÃO

  const handleSubmit = (event) => {
    event.preventDefault();
    console.log("Login com:", { email, senha });

    // 4. CHAMAR A FUNÇÃO onLogin (para atualizar o App.jsx)
    // (No futuro, você só chamaria isso se o login na API fosse bem-sucedido)
    onLogin();

    // 5. NAVEGAR para a página de busca
    navigate('/busca');
  };

  return (
    <LayoutAutenticacao>
      <Titulo>Boas-vindas!</Titulo>
      <Subtitulo>Entre para começar a aproveitar seu tempo</Subtitulo>

      <Formulario onSubmit={handleSubmit}>
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
        <Botao type="submit">Entrar</Botao>
      </Formulario>

      <LinkAlternativo>
        Não possui uma conta? <Link to="/registro">Registrar - se</Link>
      </LinkAlternativo>
    </LayoutAutenticacao>
  );
};