import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { createGlobalStyle } from 'styled-components';
import { useState } from 'react';

// Importe suas páginas
import { PaginaLogin } from './pages/PaginaLogin';
import { PaginaRegistro } from './pages/PaginaRegistro';
import { PaginaDashboard } from './pages/PaginaDashboard';
import { PaginaPerfil } from './pages/PaginaPerfil';
import { PaginaAdicionarServico } from './pages/PaginaAdicionarServico';
import { PaginaEditarServico } from './pages/PaginaEditarServico';
import { PaginaBusca } from './pages/PaginaBusca';

// Estilos Globais... (sem alteração)
const GlobalStyle = createGlobalStyle`
  /* Reset */
  *, *::before, *::after {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }
  body {
    font-family: system-ui, Avenir, Helvetica, Arial, sans-serif;
    line-height: 1.5;
    font-weight: 400;
    color: #111827; 
    background-color: #f3f4f6; 
  }
  h1, h2, h3, h4, h5, h6 {
    font-weight: bold;
  }
`;

function App() {
  const [isAutenticado, setIsAutenticado] = useState(false);

  // Função de Logout que será passada
  const handleLogout = () => {
    setIsAutenticado(false);
    // Não precisamos de 'navigate' aqui, o Navigate do React Router cuida disso
  };

  return (
    <>
      <GlobalStyle />
      <BrowserRouter>
        <Routes>
          {/* Rotas Públicas */}
          <Route
            path="/login"
            element={<PaginaLogin onLogin={() => setIsAutenticado(true)} />}
          />
          <Route path="/registro" element={<PaginaRegistro />} />

          {/* Rotas Privadas */}
          <Route
            path="/busca"
            // Passamos a função de logout para a PaginaBusca
            element={isAutenticado ? <PaginaBusca onLogout={handleLogout} /> : <Navigate to="/login" />}
          />
          <Route
            path="/dashboard"
            element={isAutenticado ? <PaginaDashboard /> : <Navigate to="/login" />}
          />
          <Route
            path="/perfil"
            element={isAutenticado ? <PaginaPerfil /> : <Navigate to="/login" />}
          />
          <Route
            path="/servico/novo"
            element={isAutenticado ? <PaginaAdicionarServico /> : <Navigate to="/login" />}
          />
          <Route
            path="/servico/editar/:servicoId"
            element={isAutenticado ? <PaginaEditarServico /> : <Navigate to="/login" />}
          />

          {/* Rota Padrão */}
          <Route
            path="*"
            element={<Navigate to={isAutenticado ? '/busca' : '/login'} />}
          />
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;