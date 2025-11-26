import React, { useState, useEffect } from "react";
import { LayoutApp } from "../components/LayoutApp";
import { CartaoServico } from "../components/CartaoServico";
import { Botao } from "../components/Botao";
import styled from "styled-components";
import { Link } from "react-router-dom";

const PerfilHeader = styled.div`
  display: flex;
  flex-direction: column-reverse;
  gap: 1.5rem;
  align-items: center;
  margin-bottom: 2.5rem;
  @media (min-width: 768px) {
    flex-direction: row;
    justify-content: space-between;
    align-items: flex-start;
  }
`;
const InfoUsuario = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;
const InfoExtra = styled.div`
  display: flex;
  gap: 1.5rem;
  margin-top: 0.5rem;
  color: #4b5563;
  font-weight: 500;
`;
const AvatarContainer = styled.div`
  width: 100px;
  height: 100px;
  background-color: #e0e7ff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2.5rem;
  color: #4f46e5;
  font-weight: bold;
`;
const ServicosContainer = styled.section`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;
const ServicosHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  h2 {
    font-size: 1.5rem;
    color: #111827;
  }
`;
const GridServicos = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem;
  @media (min-width: 768px) {
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  }
`;

export const PaginaPerfil = () => {
  const [perfil, setPerfil] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    carregarPerfil();
  }, []);

  const carregarPerfil = async () => {
    try {
      const response = await fetch("http://localhost:8080/api/users/me", {
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        setPerfil(data);
      }
    } catch (error) {
      console.error("Erro ao carregar perfil", error);
    } finally {
      setLoading(false);
    }
  };

  // Função para remover o serviço
  const handleRemoverServico = async (idServico) => {
    if (!confirm("Tem certeza que deseja remover este serviço?")) return;

    try {
      const response = await fetch(
        `http://localhost:8080/api/services/${idServico}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );

      if (response.ok) {
        // Atualiza a lista localmente removendo o item deletado
        setPerfil((prev) => ({
          ...prev,
          services: prev.services.filter((s) => s.id !== idServico),
        }));
      } else {
        alert("Erro ao remover serviço. Tente novamente.");
      }
    } catch (error) {
      console.error("Erro ao deletar:", error);
      alert("Erro de conexão.");
    }
  };

  if (loading) return <LayoutApp>Carregando...</LayoutApp>;
  if (!perfil) return <LayoutApp>Erro ao carregar perfil.</LayoutApp>;

  return (
    <LayoutApp>
      <PerfilHeader>
        <InfoUsuario>
          <h1>
            {perfil.first_name} {perfil.last_name}
          </h1>
          <p>{perfil.email}</p>
          <InfoExtra>
            <span>Saldo: {perfil.balance}h</span>
            <span>Tel: {perfil.phone}</span>
          </InfoExtra>
          <Botao style={{ marginTop: "1rem", width: "fit-content" }}>
            Editar Perfil
          </Botao>
        </InfoUsuario>
        <AvatarContainer>
          {perfil.first_name ? perfil.first_name.charAt(0).toUpperCase() : "?"}
        </AvatarContainer>
      </PerfilHeader>

      <ServicosContainer>
        <ServicosHeader>
          <h2>Meus Serviços</h2>
          <Link to="/servico/novo">
            <Botao>Adicionar Novo</Botao>
          </Link>
        </ServicosHeader>

        <GridServicos>
          {perfil.services && perfil.services.length > 0 ? (
            perfil.services.map((s) => (
              <CartaoServico
                key={s.id}
                tipo="Serviço"
                item={{
                  id: s.id,
                  nome: s.title,
                  descricao: s.description,
                  valor: `${s.value}h`,
                }}
                onRemove={handleRemoverServico} // ✅ Passamos a função aqui
              />
            ))
          ) : (
            <p>Você ainda não cadastrou nenhum serviço.</p>
          )}
        </GridServicos>
      </ServicosContainer>
    </LayoutApp>
  );
};
