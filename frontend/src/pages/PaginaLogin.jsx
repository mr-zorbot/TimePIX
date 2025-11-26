import { useState } from "react";
import { useNavigate, Link } from "react-router-dom"; //
import { LayoutAutenticacao } from "../components/LayoutAutenticacao";
import { Botao } from "../components/Botao";
import { Input } from "../components/Input";
import styled from "styled-components";

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
const ErrorMsg = styled.div`
  color: #dc2626;
  background-color: #fee2e2;
  padding: 0.75rem;
  border-radius: 6px;
  font-size: 0.9rem;
`;

export const PaginaLogin = ({ onLogin }) => {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErro("");

    try {
      const response = await fetch("http://localhost:8080/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, senha }),
        credentials: "include", // Crucial para receber o cookie da sessão
      });

      const data = await response.json();

      if (response.ok) {
        onLogin(); // Atualiza estado no App.jsx
        navigate("/busca");
      } else {
        setErro(data.error || "Falha ao realizar login.");
      }
    } catch (err) {
      setErro("Erro de conexão com o servidor.");
    }
  };

  return (
    <LayoutAutenticacao>
      <Titulo>Boas-vindas!</Titulo>
      <Subtitulo>Entre para começar a aproveitar seu tempo</Subtitulo>

      {erro && <ErrorMsg>{erro}</ErrorMsg>}

      <Formulario onSubmit={handleSubmit}>
        <Input
          label="E-mail"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <Input
          label="Senha"
          type="password"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          required
        />
        <Botao type="submit" fullWidth>
          Entrar
        </Botao>
      </Formulario>

      <LinkAlternativo>
        Não possui uma conta? <Link to="/registro">Registrar-se</Link>
      </LinkAlternativo>
    </LayoutAutenticacao>
  );
};
