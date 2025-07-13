"use client";

import { useState, useEffect, useRef } from "react";
import {
  MessageCircle,
  Send,
  Search,
  Book,
  HelpCircle,
  Phone,
  Mail,
  Clock,
  User,
  Bot,
  ThumbsUp,
  ThumbsDown,
  Copy,
  Download,
  ExternalLink,
  ChevronDown,
  ChevronRight,
  Star,
  AlertCircle,
  CheckCircle,
  Info
} from "lucide-react";

interface Message {
  id: string;
  type: 'user' | 'bot';
  content: string;
  timestamp: string;
  helpful?: boolean;
  actions?: Array<{
    label: string;
    action: string;
    data?: any;
  }>;
}

interface KnowledgeArticle {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  views: number;
  helpful: number;
  lastUpdated: string;
}

interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
  helpful: number;
}

export function IntelligentSupport() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'knowledge' | 'contact'>('chat');
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [knowledgeArticles, setKnowledgeArticles] = useState<KnowledgeArticle[]>([]);
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [expandedFAQ, setExpandedFAQ] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadKnowledgeBase();
    initializeChat();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadKnowledgeBase = () => {
    // Simular carregamento da base de conhecimento
    setKnowledgeArticles([
      {
        id: 'kb_001',
        title: 'Como integrar a API de pagamentos',
        content: 'Guia completo para integração da API Valora Pay...',
        category: 'Integração',
        tags: ['api', 'integração', 'desenvolvimento'],
        views: 1250,
        helpful: 98,
        lastUpdated: '2025-01-10'
      },
      {
        id: 'kb_002',
        title: 'Configuração de webhooks',
        content: 'Como configurar e testar webhooks para receber notificações...',
        category: 'Webhooks',
        tags: ['webhook', 'notificação', 'callback'],
        views: 890,
        helpful: 95,
        lastUpdated: '2025-01-08'
      },
      {
        id: 'kb_003',
        title: 'Segurança e certificações PCI DSS',
        content: 'Informações sobre segurança e conformidade PCI DSS...',
        category: 'Segurança',
        tags: ['segurança', 'pci', 'certificação'],
        views: 567,
        helpful: 100,
        lastUpdated: '2025-01-05'
      }
    ]);

    setFaqs([
      {
        id: 'faq_001',
        question: 'Quais são as taxas de transação?',
        answer: 'As taxas variam conforme o método de pagamento: Cartão de crédito: 3,99% + R$ 0,39, PIX: 0,99%, Boleto: R$ 3,50 fixo.',
        category: 'Taxas',
        helpful: 156
      },
      {
        id: 'faq_002',
        question: 'Como funciona o processo de aprovação?',
        answer: 'O processo de aprovação é automático para a maioria das transações. Transações de alto valor podem passar por análise manual.',
        category: 'Processamento',
        helpful: 134
      },
      {
        id: 'faq_003',
        question: 'Posso fazer estornos parciais?',
        answer: 'Sim, nossa API suporta estornos parciais. Você pode estornar qualquer valor até o limite da transação original.',
        category: 'Estornos',
        helpful: 89
      }
    ]);
  };

  const initializeChat = () => {
    const welcomeMessage: Message = {
      id: 'msg_welcome',
      type: 'bot',
      content: 'Olá! Sou o assistente virtual da Valora Pay. Como posso ajudá-lo hoje?',
      timestamp: new Date().toISOString(),
      actions: [
        { label: 'Integração da API', action: 'quick_help', data: 'integration' },
        { label: 'Problemas de pagamento', action: 'quick_help', data: 'payment_issues' },
        { label: 'Configuração de conta', action: 'quick_help', data: 'account_setup' },
        { label: 'Falar com humano', action: 'human_support', data: null }
      ]
    };
    setMessages([welcomeMessage]);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const sendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage: Message = {
      id: `msg_${Date.now()}`,
      type: 'user',
      content: inputMessage,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsTyping(true);

    // Simular resposta do bot
    setTimeout(() => {
      const botResponse = generateBotResponse(inputMessage);
      setMessages(prev => [...prev, botResponse]);
      setIsTyping(false);
    }, 1500);
  };

  const generateBotResponse = (userInput: string): Message => {
    const input = userInput.toLowerCase();
    
    // Respostas baseadas em palavras-chave
    if (input.includes('api') || input.includes('integra')) {
      return {
        id: `msg_${Date.now()}`,
        type: 'bot',
        content: 'Para integrar nossa API, você precisa:\n\n1. Criar uma conta de desenvolvedor\n2. Obter suas chaves de API\n3. Implementar os endpoints de pagamento\n4. Configurar webhooks\n\nGostaria de ver nossa documentação completa?',
        timestamp: new Date().toISOString(),
        actions: [
          { label: 'Ver documentação', action: 'open_docs', data: 'api_docs' },
          { label: 'Exemplo de código', action: 'show_code', data: 'integration_example' }
        ]
      };
    }
    
    if (input.includes('pix')) {
      return {
        id: `msg_${Date.now()}`,
        type: 'bot',
        content: 'O PIX é nosso método de pagamento mais rápido! Taxa de apenas 0,99% e aprovação instantânea. Posso ajudar com:\n\n• Configuração do PIX\n• Geração de QR Codes\n• Webhooks de confirmação\n• Testes em sandbox',
        timestamp: new Date().toISOString(),
        actions: [
          { label: 'Configurar PIX', action: 'quick_help', data: 'pix_setup' },
          { label: 'Testar PIX', action: 'open_sandbox', data: 'pix_test' }
        ]
      };
    }
    
    if (input.includes('taxa') || input.includes('preço')) {
      return {
        id: `msg_${Date.now()}`,
        type: 'bot',
        content: 'Nossas taxas são competitivas:\n\n💳 Cartão de Crédito: 3,99% + R$ 0,39\n💳 Cartão de Débito: 2,99% + R$ 0,39\n⚡ PIX: 0,99% (sem taxa fixa)\n🧾 Boleto: R$ 3,50 fixo\n\nSem mensalidade ou taxa de adesão!',
        timestamp: new Date().toISOString(),
        actions: [
          { label: 'Calcular custos', action: 'open_calculator', data: null },
          { label: 'Planos empresariais', action: 'contact_sales', data: null }
        ]
      };
    }
    
    if (input.includes('problema') || input.includes('erro')) {
      return {
        id: `msg_${Date.now()}`,
        type: 'bot',
        content: 'Vou ajudar você a resolver o problema. Pode me dar mais detalhes?\n\n• Qual tipo de erro está ocorrendo?\n• Em que momento acontece?\n• Você tem o código do erro?\n\nEnquanto isso, posso conectá-lo com nossa equipe técnica.',
        timestamp: new Date().toISOString(),
        actions: [
          { label: 'Falar com técnico', action: 'human_support', data: 'technical' },
          { label: 'Ver status da API', action: 'check_status', data: null }
        ]
      };
    }
    
    // Resposta padrão
    return {
      id: `msg_${Date.now()}`,
      type: 'bot',
      content: 'Entendi sua pergunta. Deixe-me buscar as melhores opções para ajudá-lo:',
      timestamp: new Date().toISOString(),
      actions: [
        { label: 'Buscar na base de conhecimento', action: 'search_kb', data: userInput },
        { label: 'Falar com especialista', action: 'human_support', data: null },
        { label: 'Ver FAQ', action: 'show_faq', data: null }
      ]
    };
  };

  const handleQuickAction = (action: string, data: any) => {
    switch (action) {
      case 'quick_help':
        handleQuickHelp(data);
        break;
      case 'human_support':
        setActiveTab('contact');
        break;
      case 'search_kb':
        setActiveTab('knowledge');
        setSearchQuery(data);
        break;
      case 'show_faq':
        setActiveTab('knowledge');
        break;
      default:
        console.log('Ação:', action, 'Dados:', data);
    }
  };

  const handleQuickHelp = (topic: string) => {
    const responses = {
      integration: 'Vou te guiar pela integração da API. Primeiro, você já tem uma conta de desenvolvedor?',
      payment_issues: 'Vamos resolver o problema de pagamento. Qual é o status da transação?',
      account_setup: 'Vou ajudar com a configuração da conta. Que tipo de negócio você tem?',
      pix_setup: 'Para configurar o PIX, você precisa adicionar sua chave PIX nas configurações da conta.'
    };

    const response: Message = {
      id: `msg_${Date.now()}`,
      type: 'bot',
      content: responses[topic as keyof typeof responses] || 'Como posso ajudar com isso?',
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, response]);
  };

  const markMessageHelpful = (messageId: string, helpful: boolean) => {
    setMessages(prev => 
      prev.map(msg => 
        msg.id === messageId ? { ...msg, helpful } : msg
      )
    );
  };

  const filteredKnowledgeArticles = knowledgeArticles.filter(article =>
    article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    article.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
    article.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const filteredFAQs = faqs.filter(faq =>
    faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      {/* Botão flutuante */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 transition-all z-50"
      >
        <MessageCircle size={24} />
      </button>

      {/* Modal de suporte */}
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end justify-end p-6 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md h-[600px] flex flex-col">
            {/* Header */}
            <div className="bg-blue-600 text-white p-4 rounded-t-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                    <Bot size={16} />
                  </div>
                  <div>
                    <h3 className="font-semibold">Suporte Valora Pay</h3>
                    <p className="text-xs opacity-90">Sempre online para ajudar</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-white hover:bg-white hover:bg-opacity-20 p-1 rounded"
                >
                  ×
                </button>
              </div>
              
              {/* Tabs */}
              <div className="flex mt-4 bg-white bg-opacity-10 rounded-lg p-1">
                <button
                  onClick={() => setActiveTab('chat')}
                  className={`flex-1 py-2 px-3 rounded text-sm font-medium transition-all ${
                    activeTab === 'chat' 
                      ? 'bg-white text-blue-600' 
                      : 'text-white hover:bg-white hover:bg-opacity-20'
                  }`}
                >
                  Chat
                </button>
                <button
                  onClick={() => setActiveTab('knowledge')}
                  className={`flex-1 py-2 px-3 rounded text-sm font-medium transition-all ${
                    activeTab === 'knowledge' 
                      ? 'bg-white text-blue-600' 
                      : 'text-white hover:bg-white hover:bg-opacity-20'
                  }`}
                >
                  Base de Conhecimento
                </button>
                <button
                  onClick={() => setActiveTab('contact')}
                  className={`flex-1 py-2 px-3 rounded text-sm font-medium transition-all ${
                    activeTab === 'contact' 
                      ? 'bg-white text-blue-600' 
                      : 'text-white hover:bg-white hover:bg-opacity-20'
                  }`}
                >
                  Contato
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-hidden">
              {/* Chat Tab */}
              {activeTab === 'chat' && (
                <div className="h-full flex flex-col">
                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`max-w-[80%] ${message.type === 'user' ? 'order-2' : 'order-1'}`}>
                          <div
                            className={`p-3 rounded-lg ${
                              message.type === 'user'
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-100 text-gray-900'
                            }`}
                          >
                            <p className="text-sm whitespace-pre-line">{message.content}</p>
                          </div>
                          
                          {/* Actions */}
                          {message.actions && (
                            <div className="mt-2 space-y-1">
                              {message.actions.map((action, index) => (
                                <button
                                  key={index}
                                  onClick={() => handleQuickAction(action.action, action.data)}
                                  className="block w-full text-left text-xs bg-blue-50 text-blue-600 px-3 py-2 rounded hover:bg-blue-100"
                                >
                                  {action.label}
                                </button>
                              ))}
                            </div>
                          )}
                          
                          {/* Feedback */}
                          {message.type === 'bot' && message.helpful === undefined && (
                            <div className="flex items-center gap-2 mt-2">
                              <span className="text-xs text-gray-500">Foi útil?</span>
                              <button
                                onClick={() => markMessageHelpful(message.id, true)}
                                className="text-green-600 hover:bg-green-50 p-1 rounded"
                              >
                                <ThumbsUp size={12} />
                              </button>
                              <button
                                onClick={() => markMessageHelpful(message.id, false)}
                                className="text-red-600 hover:bg-red-50 p-1 rounded"
                              >
                                <ThumbsDown size={12} />
                              </button>
                            </div>
                          )}
                        </div>
                        
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          message.type === 'user' ? 'order-1 mr-2 bg-blue-600' : 'order-2 ml-2 bg-gray-300'
                        }`}>
                          {message.type === 'user' ? (
                            <User size={16} className="text-white" />
                          ) : (
                            <Bot size={16} className="text-gray-600" />
                          )}
                        </div>
                      </div>
                    ))}
                    
                    {/* Typing indicator */}
                    {isTyping && (
                      <div className="flex justify-start">
                        <div className="bg-gray-100 p-3 rounded-lg">
                          <div className="flex space-x-1">
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    <div ref={messagesEndRef} />
                  </div>
                  
                  {/* Input */}
                  <div className="p-4 border-t border-gray-200">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={inputMessage}
                        onChange={(e) => setInputMessage(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                        placeholder="Digite sua mensagem..."
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                      <button
                        onClick={sendMessage}
                        disabled={!inputMessage.trim()}
                        className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Send size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Knowledge Base Tab */}
              {activeTab === 'knowledge' && (
                <div className="h-full flex flex-col">
                  {/* Search */}
                  <div className="p-4 border-b border-gray-200">
                    <div className="relative">
                      <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Buscar artigos e FAQs..."
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {/* Articles */}
                    {filteredKnowledgeArticles.length > 0 && (
                      <div>
                        <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                          <Book size={16} />
                          Artigos
                        </h4>
                        <div className="space-y-2">
                          {filteredKnowledgeArticles.map((article) => (
                            <div key={article.id} className="bg-gray-50 p-3 rounded-lg">
                              <h5 className="font-medium text-sm text-gray-900">{article.title}</h5>
                              <p className="text-xs text-gray-600 mt-1">{article.content.substring(0, 100)}...</p>
                              <div className="flex items-center justify-between mt-2">
                                <div className="flex items-center gap-2 text-xs text-gray-500">
                                  <span>{article.views} visualizações</span>
                                  <span>•</span>
                                  <span>{article.helpful}% útil</span>
                                </div>
                                <button className="text-blue-600 hover:text-blue-700">
                                  <ExternalLink size={12} />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* FAQs */}
                    {filteredFAQs.length > 0 && (
                      <div>
                        <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                          <HelpCircle size={16} />
                          Perguntas Frequentes
                        </h4>
                        <div className="space-y-2">
                          {filteredFAQs.map((faq) => (
                            <div key={faq.id} className="border border-gray-200 rounded-lg">
                              <button
                                onClick={() => setExpandedFAQ(expandedFAQ === faq.id ? null : faq.id)}
                                className="w-full p-3 text-left flex items-center justify-between hover:bg-gray-50"
                              >
                                <span className="text-sm font-medium text-gray-900">{faq.question}</span>
                                {expandedFAQ === faq.id ? (
                                  <ChevronDown size={16} className="text-gray-400" />
                                ) : (
                                  <ChevronRight size={16} className="text-gray-400" />
                                )}
                              </button>
                              {expandedFAQ === faq.id && (
                                <div className="px-3 pb-3">
                                  <p className="text-sm text-gray-600">{faq.answer}</p>
                                  <div className="flex items-center gap-2 mt-2">
                                    <span className="text-xs text-gray-500">{faq.helpful} pessoas acharam útil</span>
                                    <button className="text-green-600 hover:bg-green-50 p-1 rounded">
                                      <ThumbsUp size={12} />
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* No results */}
                    {searchQuery && filteredKnowledgeArticles.length === 0 && filteredFAQs.length === 0 && (
                      <div className="text-center py-8">
                        <AlertCircle size={48} className="text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600">Nenhum resultado encontrado</p>
                        <p className="text-sm text-gray-500 mt-1">Tente usar palavras-chave diferentes</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Contact Tab */}
              {activeTab === 'contact' && (
                <div className="h-full overflow-y-auto p-4 space-y-6">
                  {/* Status */}
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center gap-2">
                      <CheckCircle size={16} className="text-green-600" />
                      <span className="text-sm font-medium text-green-800">Todos os sistemas operacionais</span>
                    </div>
                    <p className="text-xs text-green-600 mt-1">Última verificação: há 2 minutos</p>
                  </div>
                  
                  {/* Contact Options */}
                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-900">Fale Conosco</h4>
                    
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <MessageCircle size={20} className="text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <h5 className="font-medium text-sm">Chat ao Vivo</h5>
                          <p className="text-xs text-gray-600">Resposta imediata</p>
                        </div>
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      </div>
                      
                      <div className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                          <Phone size={20} className="text-green-600" />
                        </div>
                        <div className="flex-1">
                          <h5 className="font-medium text-sm">Telefone</h5>
                          <p className="text-xs text-gray-600">(11) 3000-0000</p>
                        </div>
                        <span className="text-xs text-gray-500">24/7</span>
                      </div>
                      
                      <div className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                        <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                          <Mail size={20} className="text-purple-600" />
                        </div>
                        <div className="flex-1">
                          <h5 className="font-medium text-sm">E-mail</h5>
                          <p className="text-xs text-gray-600">suporte@valorapay.com</p>
                        </div>
                        <span className="text-xs text-gray-500">2h</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Business Hours */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                      <Clock size={16} />
                      Horário de Atendimento
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Segunda a Sexta</span>
                        <span className="font-medium">8h às 18h</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Sábado</span>
                        <span className="font-medium">9h às 14h</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Domingo</span>
                        <span className="text-gray-500">Fechado</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Emergency */}
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertCircle size={16} className="text-red-600" />
                      <span className="text-sm font-medium text-red-800">Emergência</span>
                    </div>
                    <p className="text-xs text-red-600">
                      Para problemas críticos de segurança ou fraude, ligue imediatamente para (11) 9999-9999
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

