import styled, { keyframes } from 'styled-components';
import { Loader2 } from 'lucide-react';

const spin = keyframes`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
`;

const LoadingWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
`;

const StyledLoader = styled(Loader2)`
  animation: ${spin} 1s linear infinite;
  color: var(--primary);
`;

export const Loading = () => (
  <LoadingWrapper>
    <StyledLoader size={24} />
  </LoadingWrapper>
);

export default Loading;