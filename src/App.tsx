import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Type, Image as ImageIcon, Video, Music, Loader2 } from 'lucide-react';
import { cn } from './lib/utils';

type GenerationType = 'text' | 'image' | 'video' | 'audio';

const API_KEY = import.meta.env.VITE_MAGIC_HOUR_API_KEY;
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

const LOADING_MESSAGES = [
  "Did you know? The first AI-generated artwork sold at Christie's auction house for $432,500 in 2018.",
  "AI image generators typically analyze millions of images to learn artistic styles.",
  "Some AI models can generate images in the style of famous artists like Van Gogh or Picasso.",
  "The most advanced AI image models can create photorealistic images from text descriptions.",
  "AI-generated images are created using neural networks called GANs or diffusion models.",
  "It takes massive computing power - some AI image models have billions of parameters!",
  "AI can now generate images faster than any human artist could paint them.",
  "Some AI models can edit existing images based on text prompts.",
  "The first AI-generated portrait was created in 2018 by Obvious, a Paris-based collective.",
  "AI art raises interesting questions about copyright and creativity.",
  "Modern AI can generate images in specific art styles like cyberpunk or watercolor.",
  "Some AI models can create 3D renders from 2D images.",
  "AI-generated images are used in movies, games, and advertising.",
  "The quality of AI-generated images improves dramatically each year.",
  "Some artists use AI as a creative tool to enhance their workflow.",
  "AI can generate variations on an image with different styles or compositions.",
  "The largest AI image models can understand and generate images from complex prompts.",
  "AI-generated images sometimes have surreal or unexpected elements.",
  "Some AI models can continue an image beyond its original borders.",
  "The future may bring AI that can generate animated scenes from text."
];

interface ImageDetails {
  downloads: Array<{ url: string }>;
  status: string;
}

class AIService {
  private apiKey: string;
  private baseUrl: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    this.baseUrl = 'https://api.magichour.ai/v1';
  }

  async generateImage(userPrompt: string): Promise<string | undefined> {
    const url = `${this.baseUrl}/ai-image-generator`;
    const options = {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      data: {
        name: 'generated-image',
        image_count: 1,
        orientation: 'square',
        style: {
          prompt: userPrompt,
        },
      },
    };

    try {
      const response = await axios(url, options);
      if (response.data.id) {
        return response.data.id;
      }
      throw new Error('Image ID not returned');
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error('Error in generateImage:', error);
        throw new Error('Error generating image: ' + error.message);
      } else {
        console.error('Unexpected error:', error);
        throw new Error('An unexpected error occurred.');
      }
    }
  }

  async fetchImageDetails(imageId: string): Promise<any | undefined> {
    const url = `${this.baseUrl}/image-projects/${imageId}`;
    const options = {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
      },
    };

    try {
      const response = await axios(url, options);
      return response.data;
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error('Error in fetchImageDetails:', error);
        throw new Error('Error fetching image details: ' + error.message);
      } else {
        console.error('Unexpected error:', error);
        throw new Error('An unexpected error occurred.');
      }
    }
  }
}

function App() {
  const [activeType, setActiveType] = useState<GenerationType>('text');
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<{ sender: 'user' | 'model'; text: string; imageUrl?: string }[]>([]);
  const [showVideoLimitModal, setShowVideoLimitModal] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [messageInterval, setMessageInterval] = useState<NodeJS.Timeout>();
  const [factVisible, setFactVisible] = useState(false);

  const aiService = new AIService(API_KEY);
  const scrollRef = useRef<HTMLDivElement>(null);

  const getPlaceholderText = () => {
    switch (activeType) {
      case 'text': return 'Ask anything...';
      case 'image': return 'Generate any image...';
      case 'video': return 'Generate any video...';
      case 'audio': return 'Generate any audio...';
      default: return 'Enter your prompt...';
    }
  };

  useEffect(() => {
    if (loading && activeType === 'image') {
      const interval = setInterval(() => {
        const randomIndex = Math.floor(Math.random() * LOADING_MESSAGES.length);
        setLoadingMessage(LOADING_MESSAGES[randomIndex]);
        setFactVisible(true); // Show the "Fun Fact" label and message
      }, 5000);
      setMessageInterval(interval);

      const randomIndex = Math.floor(Math.random() * LOADING_MESSAGES.length);
      setLoadingMessage(LOADING_MESSAGES[randomIndex]);

      return () => clearInterval(interval);
    }
  }, [loading, activeType]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleGenerate = async () => {
    if (!prompt) return;
    
    if (activeType === 'video') {
      setShowVideoLimitModal(true);
      return;
    }
    
    setMessages((prevMessages) => [...prevMessages, { sender: 'user', text: prompt }]);
    setLoading(true);
    setPrompt('');
    setFactVisible(false); // Hide the fact before generating new one

    try {
      if (activeType === 'image') {
        const imageId = await aiService.generateImage(prompt);
        if (!imageId) throw new Error('Image generation failed: No image ID returned.');
        let imageDetails: ImageDetails | undefined;
        let attempts = 0;
        const maxAttempts = 10;
        const interval = 5000;

        while (attempts < maxAttempts) {
          imageDetails = await aiService.fetchImageDetails(imageId);
          if (imageDetails && imageDetails.status === 'complete' && imageDetails.downloads?.length > 0) {
            setMessages((prevMessages) => [
              ...prevMessages,
              { sender: 'model', text: '', imageUrl: imageDetails.downloads[0].url },
            ]);
            break;
          } else {
            attempts++;
            await new Promise((resolve) => setTimeout(resolve, interval));
          }
        }
        if (attempts >= maxAttempts) throw new Error('Image generation took too long or failed.');
      } else if (activeType === 'text') {
        const response = await axios.post(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
          { contents: [{ parts: [{ text: prompt }] }] },
          { headers: { 'Content-Type': 'application/json' } }
        );
        const responseData = response.data;
        if (responseData && responseData.candidates && responseData.candidates.length > 0) {
          let candidateText = responseData.candidates[0].content.parts[0].text.replace(/\*/g, '');
          setMessages((prevMessages) => [...prevMessages, { sender: 'model', text: candidateText }]);
        } else {
          setMessages((prevMessages) => [
            ...prevMessages,
            { sender: 'model', text: 'No candidates found in the response.' },
          ]);
        }
      } else if (activeType === 'audio') {
        const utterance = new SpeechSynthesisUtterance(prompt);
        speechSynthesis.speak(utterance);
        setMessages((prevMessages) => [
          ...prevMessages,
          { sender: 'model', text: 'Audio generated and playing!' },
        ]);
      }
    } catch (error) {
      console.error('Error generating content:', error);
      setMessages((prevMessages) => [
        ...prevMessages,
        { sender: 'model', text: 'Error generating content. Please try again.' },
      ]);
    } finally {
      setLoading(false);
      if (messageInterval) clearInterval(messageInterval);
    }
  };

  const handleTypeChange = (type: GenerationType) => {
    setActiveType(type);
    setPrompt('');
    setMessages([]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex flex-col">
      <div className="container mx-auto px-4 py-8 flex-1 flex flex-col">
        <div className="flex items-center justify-center mb-8 flex-col">
          <div className="text-6xl mb-2 animate-float">🐳</div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            ShallowSeek
          </h1>
        </div>

        <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-sm border border-gray-100 p-6 relative flex-1 flex flex-col">
          <div className="flex flex-wrap justify-center gap-3 mb-6">
            {[{ type: 'text', icon: Type, label: 'Text' },
              { type: 'image', icon: ImageIcon, label: 'Image' },
              { type: 'video', icon: Video, label: 'Video' },
              { type: 'audio', icon: Music, label: 'Audio' }]
              .map(({ type, icon: Icon, label }) => (
                <button
                  key={type}
                  onClick={() => handleTypeChange(type as GenerationType)}
                  className={cn(
                    'flex items-center px-4 py-2 rounded-lg transition-all duration-200',
                    activeType === type
                      ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-md'
                      : 'bg-gray-50 hover:bg-gray-100 text-gray-700 hover:shadow-sm'
                  )}
                >
                  <Icon className="h-4 w-4 mr-2" />
                  {label}
                </button>
              ))}
          </div>

          <div className="flex-1 overflow-y-auto mb-4" ref={scrollRef}>
            <div className="p-4 rounded-lg bg-gray-50/50 space-y-4">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'} space-x-2`}
                >
                  <div
                    className={`p-4 rounded-xl max-w-[90%] transition-all duration-200 ${
                      message.sender === 'user'
                        ? 'bg-blue-500 text-white shadow-sm'
                        : 'bg-white border border-gray-200 text-gray-800 shadow-xs'
                    }`}
                  >
                    <p className="whitespace-pre-wrap break-words">{message.text}</p>
                    {message.imageUrl && (
                      <img
                        src={message.imageUrl}
                        alt="Generated"
                        className="w-full h-auto max-h-96 object-contain mt-4 rounded-lg shadow-xs"
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>

            {loading && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm">
                <div className="text-center space-y-4 max-w-md px-4">
                  <div className="relative inline-block">
                    <div className="text-6xl text-blue-500 animate-pulse">🐳</div>
                    <div className="absolute inset-0 rounded-full bg-blue-100/50 animate-ping opacity-75"></div>
                  </div>
                  <p className="text-gray-600 font-medium">Generating your {activeType}...</p>
                  {activeType === 'image' && loadingMessage && (
                    <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-sm text-blue-800 animate-fade-in">
                      <div className="text-center font-bold">Fun Fact</div>
                      <div>{loadingMessage}</div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="sticky bottom-0 bg-white pt-4 pb-2 border-t border-gray-100">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={getPlaceholderText()}
              className="w-full min-h-[48px] max-h-[200px] p-3 rounded-xl border border-gray-200 focus:border-blue-300 focus:ring-2 focus:ring-blue-100 resize-none transition-all duration-200"
              style={{
                height: 'auto',
                minHeight: '48px',
              }}
              onInput={(e) => {
                e.currentTarget.style.height = 'auto';
                e.currentTarget.style.height = `${e.currentTarget.scrollHeight}px`;
              }}
            />
            <button
              onClick={handleGenerate}
              disabled={loading || !prompt}
              className="w-full bg-gradient-to-r from-blue-500 to-indigo-500 text-white py-3 rounded-xl font-medium hover:shadow-md disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center mt-3 transition-all duration-200"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin h-5 w-5 mr-2" />
                  Generating...
                </>
              ) : (
                'Generate'
              )}
            </button>
          </div>
        </div>
      </div>

      {showVideoLimitModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 border border-gray-200 animate-scale-in">
            <div className="p-6">
              <h2 className="text-xl font-bold mb-3 text-gray-800">Video Generation Limit</h2>
              <p className="text-gray-600 mb-5">
                Due to limited API keys for video generation, only one video can be created at this time.
              </p>
              <button
                onClick={() => setShowVideoLimitModal(false)}
                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 py-2 rounded-lg font-medium transition-colors duration-200"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
