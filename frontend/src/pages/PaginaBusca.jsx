import React, { useState, useEffect } from "react";
import { LayoutApp } from "../components/LayoutApp";
import { Botao } from "../components/Botao";
import { Input } from "../components/Input";
import { ResultadoBusca } from "../components/ResultadoBusca"; //
import styled from "styled-components";
import { Link } from "react-router-dom";

const BuscaLayout = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 2rem;
  @media (min-width: 1024px) {
    grid-template-columns: 250px 1fr;
  }
`;
const Sidebar = styled.aside`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;
const MainContent = styled.main`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;
const SearchBar = styled.form`
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 1rem;
  align-items: flex-end;
  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
`;
const ResultsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

export const PaginaBusca = ({ onLogout }) => {
  const [termoBusca, setTermoBusca] = useState("");
  const [resultados, setResultados] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchServicos = async (query = "") => {
    setLoading(true);
    try {
      const url = `http://localhost:8080/api/services?q=${query}`;
      const response = await fetch(url, { credentials: "include" });
      if (response.ok) {
        const data = await response.json();
        setResultados(data);
      }
    } catch (error) {
      console.error("Erro na busca", error);
    } finally {
      setLoading(false);
    }
  };

  // Carrega serviços ao montar o componente
  useEffect(() => {
    fetchServicos();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchServicos(termoBusca);
  };

  return (
    <LayoutApp>
      <BuscaLayout>
        <Sidebar>
          <Link to="/perfil" style={{ textDecoration: "none" }}>
            <Botao fullWidth>Visualizar Perfil</Botao>
          </Link>
          <Link to="/dashboard" style={{ textDecoration: "none" }}>
            <Botao fullWidth style={{ backgroundColor: "#10b981" }}>
              Transferir Horas
            </Botao>
          </Link>
          <Botao
            onClick={onLogout}
            fullWidth
            style={{ backgroundColor: "#ef4444" }}
          >
            Sair
          </Botao>
        </Sidebar>

        <MainContent>
          <SearchBar onSubmit={handleSearch}>
            <Input
              placeholder="Busque por serviço ou nome..."
              type="text"
              value={termoBusca}
              onChange={(e) => setTermoBusca(e.target.value)}
            />
            <Botao type="submit">Buscar</Botao>
          </SearchBar>

          <ResultsList>
            {loading ? <p>Buscando...</p> : null}
            {!loading && resultados.length === 0 && (
              <p>Nenhum serviço encontrado.</p>
            )}

            {resultados.map((apiItem) => (
              <ResultadoBusca
                key={apiItem.id}
                item={{
                  nome: apiItem.owner_name,
                  servico: apiItem.title,
                  valor: `${apiItem.value}h`,
                  email: apiItem.owner_email,
                  telefone: apiItem.owner_phone,
                }}
              />
            ))}
          </ResultsList>
        </MainContent>
      </BuscaLayout>
    </LayoutApp>
  );
};
