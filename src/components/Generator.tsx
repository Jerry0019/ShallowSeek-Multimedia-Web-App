import React, { useState } from 'react';
import styled from 'styled-components';
import { Button } from './common/Button';
import { Input, TextArea } from './common/Input';
import { Loading } from './common/Loading';
import { Wand2 } from 'lucide-react';

const GeneratorWrapper = styled.div`
  background: white;
  border-radius: 1rem;
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
`;

const GeneratorHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1.5rem;

  h2 {
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--text);
  }
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const Result = styled.div`
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid var(--border);
`;

interface GeneratorProps {
  title: string;
  type: 'text' | 'image' | 'audio' | 'video';
  placeholder: string;
  useTextArea?: boolean;
}

export const Generator: React.FC<GeneratorProps> = ({
  title,
  type,
  placeholder,
  useTextArea = false,
}) => {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/${type}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate content');
      }

      const data = await response.json();
      setResult(data.result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <GeneratorWrapper>
      <GeneratorHeader>
        <Wand2 size={20} />
        <h2>{title}</h2>
      </GeneratorHeader>

      <Form onSubmit={handleSubmit}>
        {useTextArea ? (
          <TextArea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={placeholder}
            required
          />
        ) : (
          <Input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={placeholder}
            required
          />
        )}
        <Button type="submit" disabled={loading || !prompt.trim()}>
          Generate
        </Button>
      </Form>

      {loading && <Loading />}
      
      {error && (
        <Result style={{ color: 'var(--error)' }}>
          {error}
        </Result>
      )}

      {result && !loading && (
        <Result>
          {type === 'image' ? (
            <img src={result} alt="Generated content" style={{ maxWidth: '100%' }} />
          ) : type === 'video' ? (
            <video controls src={result} style={{ maxWidth: '100%' }} />
          ) : type === 'audio' ? (
            <audio controls src={result} style={{ width: '100%' }} />
          ) : (
            <p>{result}</p>
          )}
        </Result>
      )}
    </GeneratorWrapper>
  );
};

export default Generator;