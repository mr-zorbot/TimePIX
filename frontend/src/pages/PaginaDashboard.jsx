import { useState, useEffect } from "react";
import { LayoutApp } from "../components/LayoutApp";
import { Input } from "../components/Input";
import { Botao } from "../components/Botao";
import styled from "styled-components";
import { useNavigate } from "react-router-dom";

const DashboardGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 2rem;

  @media (min-width: 1024px) {
    grid-template-columns: 1fr 1fr;
  }
`;

const Secao = styled.section`
  background: white;
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  display: flex;
  flex-direction: column;
`;

const TituloSecao = styled.h2`
  margin-bottom: 1rem;
  color: #111827;
  font-size: 1.25rem;
`;

const SecaoSaldo = styled(Secao)`
  background: linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%);
  color: white;
  text-align: center;

  h2 {
    color: white;
    opacity: 0.9;
    font-size: 1rem;
    margin-bottom: 0.5rem;
  }
  p {
    font-size: 3rem;
    font-weight: bold;
    margin: 0;
  }
`;

const FormularioTransferencia = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const TabelaHistorico = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 1.5rem; /* Espaço para o botão */
`;

const ItemHistorico = styled.div`
  display: flex;
  justify-content: space-between;
  padding: 0.75rem;
  border-bottom: 1px solid #e5e7eb;
  font-size: 0.9rem;

  &:last-child {
    border-bottom: none;
  }

  .meta {
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
  }
  .user {
    font-weight: bold;
    color: #374151;
  }
  .date {
    font-size: 0.8rem;
    color: #9ca3af;
  }

  .valor {
    font-weight: bold;
    font-size: 1rem;
  }
  .valor.entrada {
    color: #10b981;
  }
  .valor.saida {
    color: #ef4444;
  }
  .valor.pendente {
    color: #f59e0b;
  }
`;

export const PaginaDashboard = () => {
  const [emailDestino, setEmailDestino] = useState("");
  const [valor, setValor] = useState("");
  const [currentUser, setCurrentUser] = useState(null);
  const [historico, setHistorico] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchDados();
  }, []);

  const fetchDados = async () => {
    try {
      const resUser = await fetch("http://localhost:8080/api/users/me", {
        credentials: "include",
      });
      if (resUser.ok) {
        const data = await resUser.json();
        setCurrentUser(data);
      }

      const resTrans = await fetch("http://localhost:8080/api/transactions", {
        credentials: "include",
      });
      if (resTrans.ok) {
        const data = await resTrans.json();
        setHistorico(data);
      }
    } catch (err) {
      console.error("Erro ao carregar dashboard", err);
    }
  };

  const handleSubmitTransferencia = async (event) => {
    event.preventDefault();
    setLoading(true);
    try {
      const response = await fetch("http://localhost:8080/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email_destino: emailDestino, valor: valor }),
        credentials: "include",
      });
      const data = await response.json();
      if (response.ok) {
        alert("Transferência enviada com sucesso!");
        setEmailDestino("");
        setValor("");
        fetchDados();
      } else {
        alert(data.error || "Erro na transferência.");
      }
    } catch (error) {
      alert("Erro de conexão.");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Função para exportar CSV (Funcionalidade extra para o vídeo!)
  const handleExportar = () => {
    if (historico.length === 0) {
      alert("Não há dados para exportar.");
      return;
    }

    // Cria o conteúdo do CSV
    const cabecalho = "Data,Remetente,Destinatario,Valor,Status\n";
    const linhas = historico
      .map(
        (item) =>
          `${item.data},${item.remetente},${item.destinatario},${item.valor},${item.status}`
      )
      .join("\n");

    const csvContent = "data:text/csv;charset=utf-8," + cabecalho + linhas;

    // Cria um link temporário e clica nele para baixar
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "historico_timepix.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <LayoutApp>
      <DashboardGrid>
        <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
          <SecaoSaldo>
            <TituloSecao>Saldo Disponível</TituloSecao>
            <p>{currentUser ? currentUser.balance : "..."}h</p>
          </SecaoSaldo>

          <Secao>
            <TituloSecao>Nova Transferência</TituloSecao>
            <FormularioTransferencia onSubmit={handleSubmitTransferencia}>
              <Input
                label="E-mail do Destinatário"
                type="email"
                placeholder="ex: amigo@ufla.br"
                value={emailDestino}
                onChange={(e) => setEmailDestino(e.target.value)}
                required
              />
              <Input
                label="Valor (horas)"
                type="number"
                min="1"
                placeholder="1"
                value={valor}
                onChange={(e) => setValor(e.target.value)}
                required
              />
              <Botao type="submit" disabled={loading}>
                {loading ? "Enviando..." : "Transferir"}
              </Botao>
            </FormularioTransferencia>
          </Secao>
        </div>

        <Secao>
          <TituloSecao>Histórico Recente</TituloSecao>
          <TabelaHistorico>
            {historico.length === 0 ? <p>Nenhuma transação ainda.</p> : null}

            {historico.map((item) => {
              const isSaida =
                currentUser && item.remetente === currentUser.email;
              const isPendente = item.status === "PENDING";

              return (
                <ItemHistorico key={item.id}>
                  <div className="meta">
                    <span className="user">
                      {isSaida
                        ? `Para: ${item.destinatario}`
                        : `De: ${item.remetente}`}
                    </span>
                    <span className="date">
                      {item.data} •{" "}
                      {isPendente ? "Processando..." : item.status}
                    </span>
                  </div>
                  <span
                    className={`valor ${isSaida ? "saida" : "entrada"} ${
                      isPendente ? "pendente" : ""
                    }`}
                  >
                    {isSaida ? "-" : "+"}
                    {item.valor}h
                  </span>
                </ItemHistorico>
              );
            })}
          </TabelaHistorico>

          {/* ✅ Botão Restaurado e Funcional */}
          <Botao
            style={{ marginTop: "auto", backgroundColor: "#4b5563" }}
            onClick={handleExportar}
            fullWidth
          >
            Exportar histórico completo
          </Botao>
        </Secao>
      </DashboardGrid>
    </LayoutApp>
  );
};
