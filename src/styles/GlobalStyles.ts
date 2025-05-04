import { createGlobalStyle } from 'styled-components';

export const GlobalStyles = createGlobalStyle`
  :root {
    --primary: #2563eb;
    --primary-light: #3b82f6;
    --background: #f8fafc;
    --text: #1e293b;
    --border: #e2e8f0;
    --error: #ef4444;
    --success: #22c55e;
  }

  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  body {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
    background-color: var(--background);
    color: var(--text);
    line-height: 1.5;
  }

  button {
    cursor: pointer;
    font-family: inherit;
  }

  input, textarea {
    font-family: inherit;
  }
`;

export default GlobalStyles;