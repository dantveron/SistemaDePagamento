"use client";

import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useTransition } from "react";
import { RiLoader4Fill } from "react-icons/ri";
import { BiError } from "react-icons/bi";
import { AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai";

import { signin } from "@/actions/auth/login";
import { LoginSchema } from "@/schemas/zod";
import { LoginFormData } from "@/types/auth";

export function LoginForm() {
    const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [mostrarSenha, setMostrarSenha] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(LoginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = handleSubmit((data) => {
    startTransition(async () => {
      try {
        const result = await signin(data);
        if (result.error) {
          setError(result.error);
        } else {
          window.location.href = "/dashboard";
        }
      } catch (err: unknown) {
        console.error("Erro ao fazer login:", err);
        setError("Ocorreu um erro inesperado");
      }
    });
  });

  return (
    <form onSubmit={onSubmit} className="flex items-start flex-col w-full gap-y-[10px]">
      <div className="flex flex-col items-start w-full">
        <label className="text-base text-black font-medium mb-2">Seu e-mail</label>
        <input
          type="text"
          placeholder="name@exemplo.com"
          className="bg-black/10 rounded-lg text-black px-6 py-[10px] w-full placeholder:text-black/30"
          {...register("email")}
        />
        {errors.email && (
          <div className="flex items-start mt-1">
            <BiError size={18} className="text-red-500 mr-1" />
            <p className="text-sm text-red-500">{errors.email.message}</p>
          </div>
        )}
      </div>

      <div className="flex flex-col items-start w-full relative">
        <label className="text-base text-black font-medium mb-2">Sua senha</label>
        <input
          type={mostrarSenha ? "text" : "password"}
          placeholder="******"
          className="bg-black/10 rounded-lg text-black px-6 py-[10px] w-full placeholder:text-black/30 pr-12"
          {...register("password")}
        />
        <button
          type="button"
          onClick={() => setMostrarSenha(!mostrarSenha)}
          className="absolute right-4 top-[42px] text-black/60"
        >
          {mostrarSenha ? <AiOutlineEyeInvisible size={20} /> : <AiOutlineEye size={20} />}
        </button>
        {errors.password && (
          <div className="flex items-start mt-1">
            <BiError size={18} className="text-red-500 mr-1" />
            <p className="text-sm text-red-500">{errors.password.message}</p>
          </div>
        )}
      </div>

      {error && (
          <div className="flex items-start mt-1">
            <BiError size={18} className="text-red-500 mr-1" />
            <p className="text-sm text-red-500">{error}</p>
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
        disabled={isPending}
        className={isPending ? "w-full py-[12px] cursor-pointer rounded-lg bg-black/50 flex items-center justify-center" : "w-full py-[12px] cursor-pointer rounded-lg bg-black flex items-center justify-center"}
      >
        {isPending ? (
          <span className="flex gap-1">
            <RiLoader4Fill size={20} className="text-white/70 animate-spin" />
            <span className="font-medium text-white">Aguarde...</span>
          </span>
        ) : (
          <span className="font-medium text-white">Continuar</span>
        )}
      </button>
    </form>
  )
}