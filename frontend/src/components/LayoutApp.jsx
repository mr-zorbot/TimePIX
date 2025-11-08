import React from 'react';
import styled from 'styled-components';

const AppBackground = styled.div`
  background: linear-gradient(160deg, #60a5fa, #3b82f6);
  min-height: 100vh;
  padding: 2rem 1rem;
  box-sizing: border-box;

  @media (min-width: 768px) {
    padding: 3rem;
  }
`;

const AppHeader = styled.header`
  font-size: 2.25rem;
  color: white;
  font-weight: bold;
  text-align: center;
  margin-bottom: 1.5rem;
`;

const ContentCard = styled.main`
  background-color: #f3f4f6;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1);
  max-width: 1200px;
  margin: 0 auto;

  @media (min-width: 768px) {
    padding: 2.5rem;
  }
`;

export const LayoutApp = ({ children }) => {
  return (
    <AppBackground>
      <AppHeader>Banco de Tempo</AppHeader>
      <ContentCard>
        {children}
      </ContentCard>
    </AppBackground>
  );
};