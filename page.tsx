import Link from "next/link";
import type { Metadata } from "next";
import { SymbolValora } from "@/components/icons/valora";
import { LoginForm } from "@/components/forms/signin-form";

export const metadata: Metadata = {
    title: 'Faça login para continuar - ValoraPay',
    description: 'Simplifique seu processo de venda e acelere seu desempenho conosco!'
}

export default function PageDeLogin() {
    return (
        <div className="w-full min-h-screen flex bg-white">
            <section className="w-full mx-auto flex flex-col items-center justify-center p-4 sm:p-0">
                <header className="absolute top-0 right-0 left-0 p-4 w-full flex items-start">
                    <Link href={"/"} className="flex items-start gap-0.5">
                        <SymbolValora className="fill-black w-[36px] h-[36px]" />
                        <span className="text-3xl sm:text-2xl text-black font-semibold">ValoraPay</span>
                    </Link>
                </header>
                <div className="flex flex-col items-center gap-y-[15px] justify-center w-full max-w-md">
                    <div className="flex items-start flex-col w-full">
                        <div className="flex flex-col py-5">
                            <h1 className="text-[2rem] leading-[2.5rem] text-black font-medium ">Bem-vindo a Valora.</h1>
                            <h1 className="text-[2rem] leading-[2.5rem] text-black font-medium ">Faça login para continuar.</h1>
                        </div>
                        <p className="font-medium text-black/80 text-sm ">Simplifique seu processo de venda e acelere seu desempenho conosco!</p>
                    </div>
                    {/* Formulário */}
                    <LoginForm />
                    <div className="abolsute bottom-0 flex items-start w-full">
                        <p className="text-xs text-center text-black/60">Ao fazer login você concorda com nossos{""} <Link href="/terms/service" className="hover:underline hover:underline-offset-4">Termos de Serviço</Link> {""} e {""} <Link href="/terms/privacy" className="hover:underline hover:underline-offset-4">Políticas de Privacidade</Link>.</p>
                    </div>
                </div>
            </section>
        </div>
    )
};