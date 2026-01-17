"use client"

import {useEffect, useState} from 'react'
import { motion } from "framer-motion"
import { RegisterForm } from "@/components/auth/register-form"
import { useRouter } from "next/navigation"
import api from "@/lib/api"
import axios from "axios"

export default function RegisterPage() {
    const [isLoading, setIsLoading] = useState(false)
    const router = useRouter()

    useEffect(() => {
        const token = localStorage.getItem('token')
        if (token) {
            router.replace('/')
        }
    }, [router])

    const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);

        const formData = new FormData(e.currentTarget);
        const payload = Object.fromEntries(formData.entries());

        try {
            await api.post('/register', payload);
            alert("Account created! Please sign in.");
            router.push('/login');
        } catch (error: unknown) {
            if (axios.isAxiosError(error)) {
                const errorMessage = error.response?.data?.detail || "Registration failed";
                alert(errorMessage);
            } else {
                alert("An unexpected error occurred");
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <main className="min-h-screen bg-[#050505] flex items-center justify-center p-4 selection:bg-white/10">
            <motion.div
                initial={{ opacity: 0, scale: 0.99 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, ease: [0.19, 1, 0.22, 1] }}
                className="w-full max-w-[320px]"
            >
                <RegisterForm onSubmit={handleRegister} isLoading={isLoading} />
            </motion.div>
        </main>
    )
}