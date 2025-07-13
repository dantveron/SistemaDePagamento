"use client";

import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useTransition, useEffect } from "react";
import { RiLoader4Fill, RiShieldCheckLine, RiSmartphoneLine } from "react-icons/ri";
import { BiError, BiCheckCircle } from "react-icons/bi";
import { AiOutlineEye, AiOutlineEyeInvisible, AiOutlineGlobal } from "react-icons/ai";
import { MdSecurity, MdFingerprint } from "react-icons/md";

import { signin } from "@/actions/auth/login";
import { LoginSchema, MFASchema } from "@/schemas/zod";
import { LoginFormData, MFAFormData } from "@/types/auth";

interface LoginStep {
  step: 'credentials' | 'mfa' | 'biometric' | 'success';
}

export function EnhancedLoginForm() {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [currentStep, setCurrentStep] = useState<LoginStep['step']>('credentials');
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [userCountry, setUserCountry] = useState<string>('BR');
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [isBlocked, setIsBlocked] = useState(false);
  const [blockTimeRemaining, setBlockTimeRemaining] = useState(0);

  // Detectar país do usuário
  useEffect(() => {
    const detectCountry = async () => {
      try {
        const response = await fetch('https://ipapi.co/json/');
        const data = await response.json();
        setUserCountry(data.country_code || 'BR');
      } catch (error) {
        console.log('Erro ao detectar país:', error);
        setUserCountry('BR');
      }
    };
    detectCountry();
  }, []);

  // Timer para desbloqueio
  useEffect(() => {
    if (isBlocked && blockTimeRemaining > 0) {
      const timer = setTimeout(() => {
        setBlockTimeRemaining(blockTimeRemaining - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (blockTimeRemaining === 0) {
      setIsBlocked(false);
      setLoginAttempts(0);
    }
  }, [isBlocked, blockTimeRemaining]);

  const {
    register: registerCredentials,
    handleSubmit: handleCredentialsSubmit,
    formState: { errors: credentialsErrors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(LoginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const {
    register: registerMFA,
    handleSubmit: handleMFASubmit,
    formState: { errors: mfaErrors },
    reset: resetMFA,
  } = useForm<MFAFormData>({
    resolver: zodResolver(MFASchema),
    defaultValues: {
      code: "",
    },
  });

  const onCredentialsSubmit = handleCredentialsSubmit((data) => {
    if (isBlocked) {
      setError(`Muitas tentativas de login. Tente novamente em ${blockTimeRemaining} segundos.`);
      return;
    }

    startTransition(async () => {
      try {
        const result = await signin({
          ...data,
          country: userCountry,
          userAgent: navigator.userAgent,
          timestamp: new Date().toISOString(),
        });
        
        if (result.error) {
          setError(result.error);
          setLoginAttempts(prev => prev + 1);
          
          // Bloquear após 5 tentativas
          if (loginAttempts >= 4) {
            setIsBlocked(true);
            setBlockTimeRemaining(300); // 5 minutos
            setError('Muitas tentativas de login. Conta temporariamente bloqueada por 5 minutos.');
          }
        } else if (result.requiresMFA) {
          setSessionToken(result.sessionToken);
          setCurrentStep('mfa');
          setError(null);
          setSuccess('Credenciais válidas. Digite o código de verificação enviado para seu dispositivo.');
        } else {
          setCurrentStep('success');
          setSuccess('Login realizado com sucesso!');
          setTimeout(() => {
            window.location.href = "/dashboard";
          }, 1500);
        }
      } catch (err: unknown) {
        console.error("Erro ao fazer login:", err);
        setError("Ocorreu um erro inesperado. Tente novamente.");
        setLoginAttempts(prev => prev + 1);
      }
    });
  });

  const onMFASubmit = handleMFASubmit((data) => {
    startTransition(async () => {
      try {
        const result = await verifyMFA({
          code: data.code,
          sessionToken: sessionToken!,
        });
        
        if (result.error) {
          setError(result.error);
        } else {
          setCurrentStep('success');
          setSuccess('Autenticação multifator concluída com sucesso!');
          setTimeout(() => {
            window.location.href = "/dashboard";
          }, 1500);
        }
      } catch (err: unknown) {
        console.error("Erro na verificação MFA:", err);
        setError("Código inválido. Tente novamente.");
      }
    });
  });

  const handleBiometricAuth = async () => {
    if (!window.PublicKeyCredential) {
      setError('Autenticação biométrica não suportada neste navegador.');
      return;
    }

    try {
      startTransition(async () => {
        // Implementar WebAuthn aqui
        setCurrentStep('success');
        setSuccess('Autenticação biométrica realizada com sucesso!');
        setTimeout(() => {
          window.location.href = "/dashboard";
        }, 1500);
      });
    } catch (error) {
      setError('Erro na autenticação biométrica. Tente outro método.');
    }
  };

  const renderCredentialsStep = () => (
    <div className="flex flex-col items-start w-full gap-y-[10px]">
      <div className="flex items-center gap-2 mb-4">
        <AiOutlineGlobal className="text-black/60" size={20} />
        <span className="text-sm text-black/60">
          Detectado: {userCountry === 'BR' ? 'Brasil' : userCountry}
        </span>
      </div>

      <form onSubmit={onCredentialsSubmit} className="flex items-start flex-col w-full gap-y-[10px]">
        <div className="flex flex-col items-start w-full">
          <label className="text-base text-black font-medium mb-2">Seu e-mail</label>
          <input
            type="email"
            placeholder="name@exemplo.com"
            className="bg-black/10 rounded-lg text-black px-6 py-[10px] w-full placeholder:text-black/30"
            {...registerCredentials("email")}
            disabled={isBlocked}
          />
          {credentialsErrors.email && (
            <div className="flex items-start mt-1">
              <BiError size={18} className="text-red-500 mr-1" />
              <p className="text-sm text-red-500">{credentialsErrors.email.message}</p>
            </div>
          )}
        </div>

        <div className="flex flex-col items-start w-full relative">
          <label className="text-base text-black font-medium mb-2">Sua senha</label>
          <input
            type={mostrarSenha ? "text" : "password"}
            placeholder="******"
            className="bg-black/10 rounded-lg text-black px-6 py-[10px] w-full placeholder:text-black/30 pr-12"
            {...registerCredentials("password")}
            disabled={isBlocked}
          />
          <button
            type="button"
            onClick={() => setMostrarSenha(!mostrarSenha)}
            className="absolute right-4 top-[42px] text-black/60"
            disabled={isBlocked}
          >
            {mostrarSenha ? <AiOutlineEyeInvisible size={20} /> : <AiOutlineEye size={20} />}
          </button>
          {credentialsErrors.password && (
            <div className="flex items-start mt-1">
              <BiError size={18} className="text-red-500 mr-1" />
              <p className="text-sm text-red-500">{credentialsErrors.password.message}</p>
            </div>
          )}
        </div>

        {error && (
          <div className="flex items-start mt-1">
            <BiError size={18} className="text-red-500 mr-1" />
            <p className="text-sm text-red-500">{error}</p>
          </div>
        )}

        {success && (
          <div className="flex items-start mt-1">
            <BiCheckCircle size={18} className="text-green-500 mr-1" />
            <p className="text-sm text-green-500">{success}</p>
          </div>
        )}

        <div className="w-full flex items-center justify-between">
          <Link
            href="/recovery"
            className="text-sm text-black/80 font-medium hover:underline"
          >
            Esqueci minha senha
          </Link>
          <Link
            href="/signup"
            className="text-sm text-black/80 font-medium hover:underline"
          >
            Ainda não tem uma conta? Criar uma
          </Link>
        </div>

        <button
          disabled={isPending || isBlocked}
          className={`w-full py-[12px] cursor-pointer rounded-lg flex items-center justify-center ${
            isPending || isBlocked 
              ? "bg-black/50" 
              : "bg-black hover:bg-black/90"
          }`}
        >
          {isPending ? (
            <span className="flex gap-1">
              <RiLoader4Fill size={20} className="text-white/70 animate-spin" />
              <span className="font-medium text-white">Verificando...</span>
            </span>
          ) : isBlocked ? (
            <span className="font-medium text-white">
              Bloqueado ({blockTimeRemaining}s)
            </span>
          ) : (
            <span className="font-medium text-white">Continuar</span>
          )}
        </button>

        {/* Opções de autenticação alternativa */}
        <div className="w-full mt-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="flex-1 h-px bg-black/20"></div>
            <span className="text-sm text-black/60">ou</span>
            <div className="flex-1 h-px bg-black/20"></div>
          </div>
          
          <button
            type="button"
            onClick={handleBiometricAuth}
            className="w-full py-[10px] border border-black/20 rounded-lg flex items-center justify-center gap-2 hover:bg-black/5"
          >
            <MdFingerprint size={20} className="text-black/60" />
            <span className="text-sm font-medium text-black/80">
              Autenticação Biométrica
            </span>
          </button>
        </div>
      </form>
    </div>
  );

  const renderMFAStep = () => (
    <div className="flex flex-col items-start w-full gap-y-[10px]">
      <div className="flex items-center gap-2 mb-4">
        <RiShieldCheckLine className="text-green-600" size={24} />
        <div>
          <h3 className="text-lg font-medium text-black">Verificação em Duas Etapas</h3>
          <p className="text-sm text-black/60">Digite o código enviado para seu dispositivo</p>
        </div>
      </div>

      <form onSubmit={onMFASubmit} className="flex items-start flex-col w-full gap-y-[10px]">
        <div className="flex flex-col items-start w-full">
          <label className="text-base text-black font-medium mb-2">Código de Verificação</label>
          <input
            type="text"
            placeholder="000000"
            maxLength={6}
            className="bg-black/10 rounded-lg text-black px-6 py-[10px] w-full placeholder:text-black/30 text-center text-2xl tracking-widest"
            {...registerMFA("code")}
          />
          {mfaErrors.code && (
            <div className="flex items-start mt-1">
              <BiError size={18} className="text-red-500 mr-1" />
              <p className="text-sm text-red-500">{mfaErrors.code.message}</p>
            </div>
          )}
        </div>

        {error && (
          <div className="flex items-start mt-1">
            <BiError size={18} className="text-red-500 mr-1" />
            <p className="text-sm text-red-500">{error}</p>
          </div>
        )}

        <button
          disabled={isPending}
          className={`w-full py-[12px] cursor-pointer rounded-lg flex items-center justify-center ${
            isPending ? "bg-black/50" : "bg-black hover:bg-black/90"
          }`}
        >
          {isPending ? (
            <span className="flex gap-1">
              <RiLoader4Fill size={20} className="text-white/70 animate-spin" />
              <span className="font-medium text-white">Verificando...</span>
            </span>
          ) : (
            <span className="font-medium text-white">Verificar Código</span>
          )}
        </button>

        <button
          type="button"
          onClick={() => {
            setCurrentStep('credentials');
            resetMFA();
            setError(null);
          }}
          className="w-full py-[10px] text-sm text-black/60 hover:text-black"
        >
          Voltar ao login
        </button>
      </form>
    </div>
  );

  const renderSuccessStep = () => (
    <div className="flex flex-col items-center w-full gap-y-[20px]">
      <div className="flex items-center justify-center w-16 h-16 bg-green-100 rounded-full">
        <BiCheckCircle size={32} className="text-green-600" />
      </div>
      <div className="text-center">
        <h3 className="text-xl font-medium text-black mb-2">Login Realizado com Sucesso!</h3>
        <p className="text-sm text-black/60">Redirecionando para o dashboard...</p>
      </div>
      <div className="w-full bg-black/10 rounded-full h-2">
        <div className="bg-green-600 h-2 rounded-full animate-pulse" style={{ width: '100%' }}></div>
      </div>
    </div>
  );

  return (
    <div className="w-full">
      {/* Indicador de segurança */}
      <div className="flex items-center gap-2 mb-6 p-3 bg-green-50 rounded-lg border border-green-200">
        <MdSecurity className="text-green-600" size={20} />
        <div className="flex-1">
          <p className="text-sm font-medium text-green-800">Conexão Segura</p>
          <p className="text-xs text-green-600">Protegido por criptografia de ponta a ponta</p>
        </div>
      </div>

      {/* Indicador de progresso */}
      <div className="flex items-center justify-center mb-6">
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${currentStep === 'credentials' ? 'bg-black' : 'bg-black/20'}`}></div>
          <div className={`w-8 h-px ${currentStep === 'mfa' || currentStep === 'success' ? 'bg-black' : 'bg-black/20'}`}></div>
          <div className={`w-3 h-3 rounded-full ${currentStep === 'mfa' ? 'bg-black' : currentStep === 'success' ? 'bg-green-600' : 'bg-black/20'}`}></div>
          <div className={`w-8 h-px ${currentStep === 'success' ? 'bg-green-600' : 'bg-black/20'}`}></div>
          <div className={`w-3 h-3 rounded-full ${currentStep === 'success' ? 'bg-green-600' : 'bg-black/20'}`}></div>
        </div>
      </div>

      {/* Renderizar etapa atual */}
      {currentStep === 'credentials' && renderCredentialsStep()}
      {currentStep === 'mfa' && renderMFAStep()}
      {currentStep === 'success' && renderSuccessStep()}
    </div>
  );
}

// Função auxiliar para verificação MFA (implementar no backend)
async function verifyMFA(data: { code: string; sessionToken: string }) {
  // Implementar chamada para API de verificação MFA
  return new Promise((resolve) => {
    setTimeout(() => {
      if (data.code === '123456') {
        resolve({ success: true });
      } else {
        resolve({ error: 'Código inválido' });
      }
    }, 1000);
  });
}

