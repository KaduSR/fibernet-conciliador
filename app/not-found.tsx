'use client';

import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4 py-12 dark:bg-gray-900">
      <div className="w-full max-w-md text-center">
        {/* Ícone 404 */}
        <div className="mx-auto mb-8 flex h-24 w-24 items-center justify-center rounded-full bg-brand-100 dark:bg-brand-900/20">
          <span className="text-4xl font-bold text-brand-600 dark:text-brand-400">404</span>
        </div>

        {/* Título */}
        <h1 className="mb-3 text-3xl font-bold text-gray-900 dark:text-white sm:text-4xl">
          Página não encontrada
        </h1>

        {/* Descrição */}
        <p className="mb-8 text-base text-gray-600 dark:text-gray-400">
          A página que você está procurando não existe, foi movida ou está temporariamente indisponível.
        </p>

        {/* Botões de ação */}
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-600 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 10.5 12 3l9 7.5M5 9.75V21h14V9.75" />
            </svg>
            Voltar para Home
          </Link>

          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-6 py-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12l7.5-7.5M3 12h18" />
            </svg>
            Voltar
          </button>
        </div>

        {/* Informação adicional */}
        <div className="mt-12 rounded-lg bg-gray-100 p-4 dark:bg-gray-800">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Se você acredita que isso é um erro, entre em contato com o suporte ou tente novamente mais tarde.
          </p>
        </div>
      </div>
    </div>
  );
}