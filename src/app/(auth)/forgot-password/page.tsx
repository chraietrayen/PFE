"use client"

import { useState } from "react"
import { Input } from "@/components/ui/Input"
import { Button } from "@/components/ui/Button"
import Link from "next/link"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  const handleSubmit = async (e: React. FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    
    // TODO: Implémenter l'envoi d'email
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    setIsSuccess(true)
    setIsLoading(false)
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Violet (60%) */}
      <div className="hidden lg:flex lg: w-[60%] bg-gradient-to-br from-violet-600 to-indigo-700 p-12 flex-col justify-center items-center">
        <div className="text-center">
          <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-white">
            Réinitialisation du mot de passe
          </h2>
          <p className="mt-4 text-violet-200 max-w-md">
            Pas de panique ! Entrez votre email et nous vous enverrons un lien pour réinitialiser votre mot de passe.
          </p>
        </div>
      </div>

      {/* Right Side - Form (40%) */}
      <div className="w-full lg:w-[40%] flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md space-y-8">
          {/* Back link */}
          <Link 
            href="/login" 
            className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-violet-600"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Retour à la connexion
          </Link>

          {! isSuccess ? (
            <>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Mot de passe oublié ?
                </h1>
                <p className="mt-2 text-gray-600">
                  Entrez votre email pour recevoir un lien de réinitialisation
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <Input
                  label="Email"
                  type="email"
                  placeholder="votre@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />

                <Button type="submit" isLoading={isLoading}>
                  Envoyer le lien
                </Button>
              </form>
            </>
          ) : (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900">
                Email envoyé ! 
              </h2>
              <p className="text-gray-600">
                Vérifiez votre boîte de réception à <strong>{email}</strong>
              </p>
              <Button variant="ghost" onClick={() => setIsSuccess(false)}>
                Renvoyer l'email
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}