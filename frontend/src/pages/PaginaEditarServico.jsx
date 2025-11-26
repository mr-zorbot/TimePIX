import { useState, useEffect } from "react";
import { LayoutApp } from "../components/LayoutApp";
import { Input } from "../components/Input";
import { Botao } from "../components/Botao";
import styled from "styled-components";
import { useNavigate, useParams } from "react-router-dom";

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

export const PaginaEditarServico = () => {
  const { servicoId } = useParams();
  const navigate = useNavigate();

  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [valor, setValor] = useState("");

  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");

  // 1. Carrega os dados do serviço ao abrir a página
  useEffect(() => {
    const fetchServico = async () => {
      try {
        const response = await fetch(
          `http://localhost:8080/api/services/${servicoId}`,
          {
            credentials: "include",
          }
        );

        if (response.ok) {
          const data = await response.json();
          // Preenche os inputs com os dados vindos do banco
          setNome(data.title);
          setDescricao(data.description);
          setValor(data.value);
        } else {
          setErro("Serviço não encontrado ou acesso negado.");
        }
      } catch (err) {
        setErro("Erro ao carregar dados do serviço.");
      } finally {
        setLoading(false);
      }
    };

    fetchServico();
  }, [servicoId]);

  // 2. Envia as alterações para a API
  const handleSave = async (e) => {
    e.preventDefault();
    setErro("");
    setLoading(true); // Reaproveitamos o state de loading para o botão salvar

    try {
      const response = await fetch(
        `http://localhost:8080/api/services/${servicoId}`,
        {
          method: "PUT", // Verbo HTTP para atualização
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            nome,
            descricao,
            valor,
          }),
          credentials: "include",
        }
      );

      if (response.ok) {
        alert("Serviço atualizado com sucesso!");
        navigate("/perfil");
      } else {
        const data = await response.json();
        setErro(data.error || "Erro ao atualizar serviço.");
      }
    } catch (err) {
      setErro("Erro de conexão com o servidor.");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = (e) => {
    e.preventDefault();
    navigate("/perfil");
  };

  if (loading && !nome)
    return (
      <LayoutApp>
        <p>Carregando dados...</p>
      </LayoutApp>
    );

  return (
    <LayoutApp>
      <Titulo>Editar Serviço</Titulo>

      {erro && <ErrorMsg>{erro}</ErrorMsg>}

      <Formulario onSubmit={handleSave}>
        <Input
          label="Nome"
          type="text"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          required
        />
        <Input
          label="Descrição"
          type="text"
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
          required
        />
        <Input
          label="Valor (em horas)"
          type="number"
          min="1"
          value={valor}
          onChange={(e) => setValor(e.target.value)}
          required
        />

        <BotoesContainer>
          <Botao type="submit" disabled={loading}>
            {loading ? "Salvando..." : "Salvar Alterações"}
          </Botao>
          <Botao
            type="button"
            onClick={handleCancel}
            style={{ backgroundColor: "#6b7280" }}
          >
            Cancelar
          </Botao>
        </BotoesContainer>
      </Formulario>
    </LayoutApp>
  );
};
