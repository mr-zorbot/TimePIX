import styled from 'styled-components';

const BotaoEstilizado = styled.button`
  background-color: #4f46e5; 
  color: white;
  font-weight: bold;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 1rem;
  transition: background-color 0.2s;
  
  /* A MUDANÇA: A largura agora é 'auto' por padrão */
  width: ${({ fullWidth }) => (fullWidth ? '100%' : 'auto')};

  &:hover {
    background-color: #4338ca;
  }
`;

// Aceitamos 'fullWidth' e passamos todas as outras props (como 'style')
export const Botao = ({ children, onClick, fullWidth = false, ...props }) => {
  return (
    <BotaoEstilizado onClick={onClick} fullWidth={fullWidth} {...props}>
      {children}
    </BotaoEstilizado>
  );
};