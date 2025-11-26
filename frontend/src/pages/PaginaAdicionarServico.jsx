import { useState } from "react";
import { LayoutApp } from "../components/LayoutApp";
import { Input } from "../components/Input";
import { Botao } from "../components/Botao";
import styled from "styled-components";
import { useNavigate } from "react-router-dom";

const Titulo = styled.h1`
  font-size: 1.8rem;
  font-weight: bold;
  margin-bottom: 1.5rem;
  color: #111827;
`;

const Formulario = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  max-width: 600px;
`;

const BotoesContainer = styled.div`
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
`;

const ErrorMsg = styled.div`
  color: #dc2626;
  background-color: #fee2e2;
  padding: 0.75rem;
  border-radius: 6px;
  margin-bottom: 1rem;
`;

export const PaginaAdicionarServico = () => {
  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [valor, setValor] = useState("");
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSave = async (e) => {
    e.preventDefault();
    setErro("");
    setLoading(true);

    try {
      // Faz a requisição POST para a API
      const response = await fetch("http://localhost:8080/api/services", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nome,
          descricao,
          valor,
        }),
        credentials: "include", // Envia o cookie de sessão para saber quem é o dono
      });

      if (response.ok) {
        // Sucesso: volta para o perfil
        navigate("/perfil");
      } else {
        const data = await response.json();
        setErro(data.error || "Erro ao criar serviço.");
      }
    } catch (err) {
      console.error(err);
      setErro("Erro de conexão com o servidor.");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = (e) => {
    e.preventDefault();
    navigate("/perfil");
  };

  return (
    <LayoutApp>
      <Titulo>Adicionar Serviço</Titulo>

      {erro && <ErrorMsg>{erro}</ErrorMsg>}

      <Formulario onSubmit={handleSave}>
        <Input
          label="Nome"
          type="text"
          placeholder="Ex: Aula de Matemática"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          required
        />
        <Input
          label="Descrição"
          type="text"
          placeholder="Descreva os detalhes..."
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
          required
        />
        <Input
          label="Valor (em horas)"
          type="number"
          min="1"
          placeholder="1"
          value={valor}
          onChange={(e) => setValor(e.target.value)}
          required
        />

        <BotoesContainer>
          <Botao type="submit" disabled={loading}>
            {loading ? "Salvando..." : "Salvar"}
          </Botao>
          <Botao
            type="button"
            onClick={handleCancel}
            style={{ backgroundColor: "#6b7280" }} // Botão cinza para cancelar
          >
            Cancelar
          </Botao>
        </BotoesContainer>
      </Formulario>
    </LayoutApp>
  );
};
