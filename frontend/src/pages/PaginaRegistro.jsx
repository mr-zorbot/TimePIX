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
`;
const Subtitulo = styled.p`
  color: #6b7280;
  margin-bottom: 2rem;
`;
const Formulario = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;
const LinkAlternativo = styled.p`
  margin-top: 1.5rem;
  text-align: center;
  a {
    color: #4f46e5;
    text-decoration: none;
  }
`;
const InputRow = styled.div`
  display: flex;
  gap: 1rem;
  flex-direction: column;
  @media (min-width: 640px) {
    flex-direction: row;
  }
`;
const ErrorMsg = styled.div`
  color: red;
  font-size: 0.9rem;
`;

export const PaginaRegistro = () => {
  const [form, setForm] = useState({
    nome: "",
    sobrenome: "",
    email: "",
    telefone: "",
    senha: "",
  });
  const [erro, setErro] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { id, value } = e.target;
    // O componente Input usa o label para gerar ID se não passado,
    // aqui vamos simplificar controlando direto pelo nome ou ordem, mas o ideal é passar 'name'
    // Como o componente Input original não propaga 'name', vamos usar o state direto:
    // Nota: O componente Input do seu projeto não tem prop 'name', então ajustei a lógica abaixo.
  };

  // Função auxiliar para atualizar state específico
  const update = (field, val) => setForm((prev) => ({ ...prev, [field]: val }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErro("");

    try {
      const response = await fetch("http://localhost:8080/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await response.json();

      if (response.ok) {
        alert("Registro realizado! Faça login.");
        navigate("/login");
      } else {
        setErro(data.error || "Erro ao registrar.");
      }
    } catch (err) {
      setErro("Erro de conexão.");
    }
  };

  return (
    <LayoutAutenticacao>
      <Titulo>Crie sua conta</Titulo>
      <Subtitulo>Junte-se ao banco de tempo</Subtitulo>

      {erro && <ErrorMsg>{erro}</ErrorMsg>}

      <Formulario onSubmit={handleSubmit}>
        <InputRow>
          <Input
            label="Nome"
            type="text"
            value={form.nome}
            onChange={(e) => update("nome", e.target.value)}
            required
          />
          <Input
            label="Sobrenome"
            type="text"
            value={form.sobrenome}
            onChange={(e) => update("sobrenome", e.target.value)}
            required
          />
        </InputRow>

        <Input
          label="Telefone"
          type="text"
          placeholder="(XX) X XXXX-XXXX"
          value={form.telefone}
          onChange={(e) => update("telefone", e.target.value)}
          required
        />
        <Input
          label="E-mail"
          type="email"
          value={form.email}
          onChange={(e) => update("email", e.target.value)}
          required
        />
        <Input
          label="Senha"
          type="password"
          value={form.senha}
          onChange={(e) => update("senha", e.target.value)}
          required
        />

        <Botao type="submit" fullWidth>
          Registrar-se
        </Botao>
      </Formulario>

      <LinkAlternativo>
        Já possui uma conta? <Link to="/login">Entrar</Link>
      </LinkAlternativo>
    </LayoutAutenticacao>
  );
};
