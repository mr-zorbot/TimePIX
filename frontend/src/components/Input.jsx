import React from 'react';
import styled from 'styled-components';

const InputWrapper = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 0.5rem; 
`;

const Label = styled.label`
  font-size: 0.875rem; 
  color: #4b5563; 
  font-weight: 500;
`;

const InputEstilizado = styled.input`
  width: 100%;
  padding: 1rem 1rem; 
  border: 1px solid #d1d5db; 
  border-radius: 6px; 
  font-size: 1rem;
  box-sizing: border-box; 
  transition: border-color 0.2s, box-shadow 0.2s;

  &:focus {
    outline: none;
    border-color: #4f46e5; 
    box-shadow: 0 0 0 2px #c7d2fe;
  }
`;

export const Input = ({ label, id, ...props }) => {
  // AQUI ESTÁ A CORREÇÃO:
  // Verificamos se 'label' existe ANTES de tentar usá-lo.
  const inputId = id || (label ? label.toLowerCase().replace(' ', '-') : undefined);

  return (
    <InputWrapper>
      {/* O 'label' só é renderizado se existir (isso já estava correto) */}
      {label && <Label htmlFor={inputId}>{label}</Label>}
      <InputEstilizado id={inputId} {...props} />
    </InputWrapper>
  );
};