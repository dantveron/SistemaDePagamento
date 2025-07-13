"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { 
  CreditCard, 
  Smartphone, 
  QrCode, 
  Receipt, 
  Shield, 
  Lock,
  CheckCircle,
  AlertCircle,
  Clock,
  Globe
} from "lucide-react";
import { RiLoader4Fill } from "react-icons/ri";

// Schema de validação para pagamento
const PaymentSchema = z.object({
  amount: z.number().min(0.01, "Valor mínimo é R$ 0,01"),
  currency: z.string().default("BRL"),
  paymentMethod: z.enum(["credit_card", "debit_card", "pix", "boleto"]),
  cardNumber: z.string().optional(),
  cardName: z.string().optional(),
  cardExpiry: z.string().optional(),
  cardCvv: z.string().optional(),
  pixKey: z.string().optional(),
  customerEmail: z.string().email("E-mail inválido"),
  customerName: z.string().min(2, "Nome é obrigatório"),
  customerDocument: z.string().min(11, "Documento inválido"),
});

type PaymentFormData = z.infer<typeof PaymentSchema>;

interface CheckoutInterfaceProps {
  amount: number;
  currency?: string;
  merchantName: string;
  productName: string;
  onPaymentSuccess: (result: any) => void;
  onPaymentError: (error: string) => void;
}

export function CheckoutInterface({
  amount,
  currency = "BRL",
  merchantName,
  productName,
  onPaymentSuccess,
  onPaymentError
}: CheckoutInterfaceProps) {
  const [selectedMethod, setSelectedMethod] = useState<string>("credit_card");
  const [isProcessing, setIsProcessing] = useState(false);
  const [pixQrCode, setPixQrCode] = useState<string | null>(null);
  const [boletoUrl, setBoletoUrl] = useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<"idle" | "processing" | "success" | "error">("idle");
  const [securityFeatures, setSecurityFeatures] = useState({
    ssl: true,
    pciCompliant: true,
    tokenization: true,
    fraud_detection: true
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue
  } = useForm<PaymentFormData>({
    resolver: zodResolver(PaymentSchema),
    defaultValues: {
      amount,
      currency,
      paymentMethod: "credit_card"
    }
  });

  const watchedMethod = watch("paymentMethod");

  useEffect(() => {
    setSelectedMethod(watchedMethod);
  }, [watchedMethod]);

  // Formatação de valores
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: currency
    }).format(value);
  };

  // Formatação de cartão
  const formatCardNumber = (value: string) => {
    return value.replace(/\s/g, '').replace(/(.{4})/g, '$1 ').trim();
  };

  // Validação de cartão em tempo real
  const validateCard = (number: string) => {
    const cleaned = number.replace(/\s/g, '');
    const cardType = getCardType(cleaned);
    return { isValid: luhnCheck(cleaned), type: cardType };
  };

  const getCardType = (number: string) => {
    const patterns = {
      visa: /^4/,
      mastercard: /^5[1-5]/,
      amex: /^3[47]/,
      elo: /^(4011|4312|4389|4514|4573|6277|6362|6363|6504|6505|6516)/
    };

    for (const [type, pattern] of Object.entries(patterns)) {
      if (pattern.test(number)) return type;
    }
    return 'unknown';
  };

  const luhnCheck = (number: string) => {
    let sum = 0;
    let isEven = false;
    
    for (let i = number.length - 1; i >= 0; i--) {
      let digit = parseInt(number[i]);
      
      if (isEven) {
        digit *= 2;
        if (digit > 9) digit -= 9;
      }
      
      sum += digit;
      isEven = !isEven;
    }
    
    return sum % 10 === 0;
  };

  const onSubmit = async (data: PaymentFormData) => {
    setIsProcessing(true);
    setPaymentStatus("processing");

    try {
      // Simular processamento de pagamento
      await new Promise(resolve => setTimeout(resolve, 2000));

      if (data.paymentMethod === "pix") {
        // Gerar QR Code PIX
        const qrCode = await generatePixQrCode(data);
        setPixQrCode(qrCode);
        setPaymentStatus("success");
      } else if (data.paymentMethod === "boleto") {
        // Gerar boleto
        const boletoData = await generateBoleto(data);
        setBoletoUrl(boletoData.url);
        setPaymentStatus("success");
      } else {
        // Processar cartão
        const result = await processCardPayment(data);
        setPaymentStatus("success");
        onPaymentSuccess(result);
      }
    } catch (error) {
      setPaymentStatus("error");
      onPaymentError("Erro ao processar pagamento. Tente novamente.");
    } finally {
      setIsProcessing(false);
    }
  };

  const generatePixQrCode = async (data: PaymentFormData) => {
    // Implementar geração de QR Code PIX
    return "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==";
  };

  const generateBoleto = async (data: PaymentFormData) => {
    // Implementar geração de boleto
    return { url: "/boleto/123456789" };
  };

  const processCardPayment = async (data: PaymentFormData) => {
    // Implementar processamento de cartão
    return { transactionId: "tx_" + Date.now(), status: "approved" };
  };

  const paymentMethods = [
    {
      id: "credit_card",
      name: "Cartão de Crédito",
      icon: CreditCard,
      description: "Visa, Mastercard, Elo",
      processingTime: "Imediato"
    },
    {
      id: "debit_card", 
      name: "Cartão de Débito",
      icon: CreditCard,
      description: "Débito online",
      processingTime: "Imediato"
    },
    {
      id: "pix",
      name: "PIX",
      icon: QrCode,
      description: "Pagamento instantâneo",
      processingTime: "Imediato"
    },
    {
      id: "boleto",
      name: "Boleto Bancário",
      icon: Receipt,
      description: "Vencimento em 3 dias",
      processingTime: "1-2 dias úteis"
    }
  ];

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-gray-900">Finalizar Pagamento</h1>
          <div className="flex items-center gap-2 text-green-600">
            <Shield size={20} />
            <span className="text-sm font-medium">Pagamento Seguro</span>
          </div>
        </div>
        
        {/* Resumo do pedido */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-medium text-gray-900">{productName}</h3>
              <p className="text-sm text-gray-600">{merchantName}</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(amount)}</p>
              <p className="text-sm text-gray-600">Total a pagar</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Métodos de pagamento */}
        <div className="lg:col-span-2">
          <h2 className="text-lg font-semibold mb-4">Escolha a forma de pagamento</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {paymentMethods.map((method) => {
              const Icon = method.icon;
              return (
                <button
                  key={method.id}
                  type="button"
                  onClick={() => setValue("paymentMethod", method.id as any)}
                  className={`p-4 border-2 rounded-lg text-left transition-all ${
                    selectedMethod === method.id
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <Icon size={24} className={selectedMethod === method.id ? "text-blue-600" : "text-gray-600"} />
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{method.name}</h3>
                      <p className="text-sm text-gray-600">{method.description}</p>
                      <div className="flex items-center gap-1 mt-1">
                        <Clock size={12} className="text-gray-400" />
                        <span className="text-xs text-gray-500">{method.processingTime}</span>
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Formulário de pagamento */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Dados do cliente */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-medium mb-4">Dados do pagador</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nome completo
                  </label>
                  <input
                    type="text"
                    {...register("customerName")}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="João Silva"
                  />
                  {errors.customerName && (
                    <p className="text-sm text-red-600 mt-1">{errors.customerName.message}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    E-mail
                  </label>
                  <input
                    type="email"
                    {...register("customerEmail")}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="joao@exemplo.com"
                  />
                  {errors.customerEmail && (
                    <p className="text-sm text-red-600 mt-1">{errors.customerEmail.message}</p>
                  )}
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    CPF/CNPJ
                  </label>
                  <input
                    type="text"
                    {...register("customerDocument")}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="000.000.000-00"
                  />
                  {errors.customerDocument && (
                    <p className="text-sm text-red-600 mt-1">{errors.customerDocument.message}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Dados do cartão */}
            {(selectedMethod === "credit_card" || selectedMethod === "debit_card") && (
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-medium mb-4">Dados do cartão</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Número do cartão
                    </label>
                    <input
                      type="text"
                      {...register("cardNumber")}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="0000 0000 0000 0000"
                      maxLength={19}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nome no cartão
                    </label>
                    <input
                      type="text"
                      {...register("cardName")}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="JOÃO SILVA"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Validade
                      </label>
                      <input
                        type="text"
                        {...register("cardExpiry")}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="MM/AA"
                        maxLength={5}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        CVV
                      </label>
                      <input
                        type="text"
                        {...register("cardCvv")}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="000"
                        maxLength={4}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* PIX QR Code */}
            {selectedMethod === "pix" && pixQrCode && (
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <h3 className="font-medium mb-4">QR Code PIX</h3>
                <img src={pixQrCode} alt="QR Code PIX" className="mx-auto mb-4" />
                <p className="text-sm text-gray-600">
                  Escaneie o QR Code com o app do seu banco ou copie o código PIX
                </p>
              </div>
            )}

            {/* Boleto */}
            {selectedMethod === "boleto" && boletoUrl && (
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <h3 className="font-medium mb-4">Boleto Bancário</h3>
                <a
                  href={boletoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                >
                  <Receipt size={20} />
                  Visualizar Boleto
                </a>
                <p className="text-sm text-gray-600 mt-2">
                  Vencimento em 3 dias úteis
                </p>
              </div>
            )}

            {/* Botão de pagamento */}
            <button
              type="submit"
              disabled={isProcessing}
              className={`w-full py-4 px-6 rounded-lg font-medium text-white transition-all ${
                isProcessing
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-green-600 hover:bg-green-700"
              }`}
            >
              {isProcessing ? (
                <span className="flex items-center justify-center gap-2">
                  <RiLoader4Fill className="animate-spin" size={20} />
                  Processando...
                </span>
              ) : (
                `Pagar ${formatCurrency(amount)}`
              )}
            </button>
          </form>
        </div>

        {/* Sidebar de segurança */}
        <div className="space-y-6">
          {/* Recursos de segurança */}
          <div className="bg-green-50 rounded-lg p-4">
            <h3 className="font-medium text-green-800 mb-3 flex items-center gap-2">
              <Shield size={20} />
              Segurança Garantida
            </h3>
            <div className="space-y-2">
              {Object.entries(securityFeatures).map(([key, enabled]) => (
                <div key={key} className="flex items-center gap-2">
                  <CheckCircle size={16} className="text-green-600" />
                  <span className="text-sm text-green-700">
                    {key === 'ssl' && 'Conexão SSL/TLS'}
                    {key === 'pciCompliant' && 'Certificação PCI DSS'}
                    {key === 'tokenization' && 'Tokenização de dados'}
                    {key === 'fraud_detection' && 'Detecção de fraude'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Suporte */}
          <div className="bg-blue-50 rounded-lg p-4">
            <h3 className="font-medium text-blue-800 mb-3">Precisa de ajuda?</h3>
            <div className="space-y-2">
              <button className="w-full text-left text-sm text-blue-700 hover:text-blue-800">
                💬 Chat ao vivo
              </button>
              <button className="w-full text-left text-sm text-blue-700 hover:text-blue-800">
                📞 (11) 3000-0000
              </button>
              <button className="w-full text-left text-sm text-blue-700 hover:text-blue-800">
                📧 suporte@valorapay.com
              </button>
            </div>
          </div>

          {/* Bandeiras aceitas */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-medium text-gray-800 mb-3">Formas de pagamento</h3>
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-white p-2 rounded border text-center text-xs">Visa</div>
              <div className="bg-white p-2 rounded border text-center text-xs">Master</div>
              <div className="bg-white p-2 rounded border text-center text-xs">Elo</div>
              <div className="bg-white p-2 rounded border text-center text-xs">PIX</div>
              <div className="bg-white p-2 rounded border text-center text-xs">Boleto</div>
              <div className="bg-white p-2 rounded border text-center text-xs">+</div>
            </div>
          </div>
        </div>
      </div>

      {/* Status do pagamento */}
      {paymentStatus === "success" && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="text-center">
              <CheckCircle size={48} className="text-green-600 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Pagamento Realizado!
              </h3>
              <p className="text-gray-600 mb-4">
                Seu pagamento foi processado com sucesso.
              </p>
              <button
                onClick={() => setPaymentStatus("idle")}
                className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700"
              >
                Continuar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

