import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { createGlobalStyle } from "styled-components";
import { useState, useEffect } from "react"; //

import { PaginaLogin } from "./pages/PaginaLogin";
import { PaginaRegistro } from "./pages/PaginaRegistro";
import { PaginaDashboard } from "./pages/PaginaDashboard";
import { PaginaPerfil } from "./pages/PaginaPerfil";
import { PaginaAdicionarServico } from "./pages/PaginaAdicionarServico";
import { PaginaEditarServico } from "./pages/PaginaEditarServico";
import { PaginaBusca } from "./pages/PaginaBusca";

const GlobalStyle = createGlobalStyle`
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: system-ui, Avenir, Helvetica, Arial, sans-serif;
    line-height: 1.5;
    color: #111827; 
    background-color: #f3f4f6; 
  }
  h1, h2, h3, h4, h5, h6 { font-weight: bold; }
`;

function App() {
  const [isAutenticado, setIsAutenticado] = useState(false);
  const [loading, setLoading] = useState(true);

  // Verifica se o usuário já tem uma sessão ativa no Backend ao abrir o site
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch("http://localhost:8080/api/check-auth", {
          credentials: "include", // Importante: envia o cookie de sessão
        });
        if (response.ok) {
          const data = await response.json();
          setIsAutenticado(data.authenticated);
        } else {
          setIsAutenticado(false);
        }
      } catch (error) {
        console.error("Erro ao verificar autenticação:", error);
        setIsAutenticado(false);
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, []);

  const handleLogin = () => setIsAutenticado(true);

  const handleLogout = async () => {
    try {
      await fetch("http://localhost:8080/api/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch (error) {
      console.error("Erro no logout", error);
    }
    setIsAutenticado(false);
  };

  if (loading) return <div>Carregando...</div>;

  return (
    <>
      <GlobalStyle />
      <BrowserRouter>
        <Routes>
          <Route
            path="/login"
            element={
              !isAutenticado ? (
                <PaginaLogin onLogin={handleLogin} />
              ) : (
                <Navigate to="/busca" />
              )
            }
          />
          <Route
            path="/registro"
            element={
              !isAutenticado ? <PaginaRegistro /> : <Navigate to="/busca" />
            }
          />

          {/* Rotas Protegidas */}
          <Route
            path="/busca"
            element={
              isAutenticado ? (
                <PaginaBusca onLogout={handleLogout} />
              ) : (
                <Navigate to="/login" />
              )
            }
          />
          <Route
            path="/dashboard"
            element={
              isAutenticado ? <PaginaDashboard /> : <Navigate to="/login" />
            }
          />
          <Route
            path="/perfil"
            element={
              isAutenticado ? <PaginaPerfil /> : <Navigate to="/login" />
            }
          />
          <Route
            path="/servico/novo"
            element={
              isAutenticado ? (
                <PaginaAdicionarServico />
              ) : (
                <Navigate to="/login" />
              )
            }
          />
          <Route
            path="/servico/editar/:servicoId"
            element={
              isAutenticado ? <PaginaEditarServico /> : <Navigate to="/login" />
            }
          />

          <Route
            path="*"
            element={<Navigate to={isAutenticado ? "/busca" : "/login"} />}
          />
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;
