"use client"

import { useState, useEffect } from 'react'
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { LoginForm } from "@/components/auth/login-form"
import { ForgotPasswordModal } from "@/components/auth/forgot-password-modal"
import api from "@/lib/api"
import axios from "axios"

export default function LoginPage() {

    const [isForgotOpen, setIsForgotOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const router = useRouter()

    useEffect(() => {
        const token = localStorage.getItem('token')
        if (token) {
            router.replace('/')
        }
    }, [router])

    const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setIsLoading(true)

        const formData = new FormData(e.currentTarget)
        const body = new URLSearchParams()
        body.append('username', formData.get('username') as string)
        body.append('password', formData.get('password') as string)

        try {
            const res = await api.post('/token', body)

            localStorage.setItem('token', res.data.access_token)

            router.push('/')
            router.refresh()
        } catch (error: unknown) {
            if (axios.isAxiosError(error)) {
                const errorMessage = error.response?.data?.detail || "Invalid login or password"
                alert(errorMessage)
            } else {
                alert("An unexpected error occurred")
            }
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <main className="min-h-screen bg-[#050505] flex items-center justify-center p-4 selection:bg-white/10">
            <motion.div
                initial={{ opacity: 0, scale: 0.99 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, ease: [0.19, 1, 0.22, 1] }}
                className="w-full max-w-[320px]"
            >
                <LoginForm
                    onSubmit={handleLogin}
                    onForgotClick={() => setIsForgotOpen(true)}
                    isLoading={isLoading}
                />
            </motion.div>

            <ForgotPasswordModal
                isOpen={isForgotOpen}
                onClose={() => setIsForgotOpen(false)}
            />
        </main>
    )
}