import { useState } from 'react';
import { LayoutApp } from '../components/LayoutApp';
import { Input } from '../components/Input';
import { Botao } from '../components/Botao';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom'; // <-- 1. IMPORTAR

const DashboardGrid = styled.div`...`;
const Secao = styled.section`...`;
const TituloSecao = styled.h2`...`;
const SecaoSaldo = styled(Secao)`...`;
const FormularioTransferencia = styled.form`...`;
const TabelaHistorico = styled.div`...`;
const TabelaHeader = styled.div`...`;
const TabelaRow = styled.div`...`;

export const PaginaDashboard = () => {
  const [chave, setChave] = useState('');
  const [valor, setValor] = useState('');
  const navigate = useNavigate(); // <-- 2. OBTER A FUNÇÃO DE NAVEGAÇÃO
  
  const historico = [
    { nome: 'Teste da Silva', data: '28/09/2025 19:23', valor: '1 hora' },
    { nome: 'Jose das Couves', data: '23/09/2025 10:42', valor: '2 horas' },
    { nome: 'Mariazinha', data: '10/08/2025 08:52', valor: '3 horas' },
  ];

  // 3. CRIAR A FUNÇÃO DE SUBMISSÃO
  const handleSubmitTransferencia = (event) => {
    event.preventDefault(); // Impede o recarregamento da página
    console.log("Transferindo:", { chave, valor });

    // 4. NAVEGAR DE VOLTA PARA A PÁGINA INICIAL (BUSCA)
    navigate('/busca');
  };
  
  return (
    <LayoutApp>
      <DashboardGrid>
        
        <SecaoSaldo>
          <TituloSecao>Saldo Disponível</TituloSecao>
          <p>42h</p>
        </SecaoSaldo>

        <Secao>
          <TituloSecao>Nova Transferência</TituloSecao>
          {/* 5. CONECTAR O FORMULÁRIO AO onSubmit */}
          <FormularioTransferencia onSubmit={handleSubmitTransferencia}>
            <Input 
              label="Chave" 
              type="text" 
              value={chave}
              onChange={(e) => setChave(e.target.value)} 
            />
            <Input 
              label="Valor" 
              type="text"
              value={valor}
              onChange={(e) => setValor(e.target.value)} 
            />
            <Botao type="submit">Enviar</Botao>
          </FormularioTransferencia>
        </Secao>

        <Secao>
          <TituloSecao>Histórico</TituloSecao>
          <TabelaHistorico>
            <TabelaHeader>
              <span>Nome</span>
              <span>Data</span>
              <span>Valor</span>
            </TabelaHeader>
            {historico.map((item, index) => (
              <TabelaRow key={index}>
                <span>{item.nome}</span>
                <span>{item.data}</span>
                <span>{item.valor}</span>
              </TabelaRow>
            ))}
          </TabelaHistorico>
          <Botao style={{marginTop: 'auto', paddingTop: '1rem'}}>
            Exportar histórico completo
          </Botao>
        </Secao>

      </DashboardGrid>
    </LayoutApp>
  );
};