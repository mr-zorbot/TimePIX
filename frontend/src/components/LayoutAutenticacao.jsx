import React from "react";
import styled from "styled-components";

const Container = styled.div`
  display: grid;
  grid-template-columns: 1fr; // Uma coluna em mobile
  min-height: 100vh;

  @media (min-width: 1024px) {
    grid-template-columns: 1fr 1.5fr; // Duas colunas em desktop
  }
`;

const LadoEsquerdo = styled.div`
  background: linear-gradient(160deg, #60a5fa, #3b82f6);
  padding: 2rem;
  color: white;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;

  h1 {
    font-size: 2.5rem;
    font-weight: bold;
    margin-bottom: 1.5rem;
  }

  /* Você pode adicionar a ilustração aqui */
`;

const LadoDireito = styled.div`
  background-color: #f3f4f6;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 2rem;
`;

const FormContainer = styled.div`
  background-color: white;
  padding: 2.5rem;
  border-radius: 12px;
  box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1);
  width: 100%;
  max-width: 450px;
  box-sizing: border-box;
`;

export const LayoutAutenticacao = ({ children }) => {
  return (
    <Container>
      <LadoEsquerdo>
        <h1>Banco de Tempo</h1>
        {/* <img src={ilustracao} alt="Pessoas e tarefas" /> */}
      </LadoEsquerdo>
      <LadoDireito>
        <FormContainer>{children}</FormContainer>
      </LadoDireito>
    </Container>
  );
};
