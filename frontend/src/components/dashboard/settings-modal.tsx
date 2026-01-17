"use client"
import { useState } from 'react'
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { X, Lock, Loader2, CheckCircle2 } from "lucide-react"
import api from "@/lib/api"
import axios from "axios"

export function SettingsModal({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
    const [isLoading, setIsLoading] = useState(false)
    const [isSuccess, setIsSuccess] = useState(false)
    const [error, setError] = useState("")

    const handleChangePassword = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setIsLoading(true)
        setError("")

        const formData = new FormData(e.currentTarget)
        const currentPassword = formData.get('current_password')
        const newPassword = formData.get('new_password')
        const confirmPassword = formData.get('confirm_password')

        if (newPassword !== confirmPassword) {
            setError("New passwords do not match")
            setIsLoading(false)
            return
        }

        try {
            await api.post('/user/change-password', {
                old_password: currentPassword,
                new_password: newPassword
            })
            setIsSuccess(true)
            setTimeout(() => {
                setIsSuccess(false)
                onClose()
            }, 2000)
        } catch (err: unknown) {
            if (axios.isAxiosError(err)) {
                setError(err.response?.data?.detail || "Failed to update password")
            }
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="w-full max-w-sm">
                        <Card className="bg-[#0a0a0a] border-[#222222] shadow-2xl relative">
                            <CardHeader className="flex flex-row items-center justify-between">
                                <CardTitle className="text-xs font-bold uppercase tracking-widest text-[#444444]">Security Settings</CardTitle>
                                <Button variant="ghost" size="icon" onClick={onClose} className="h-6 w-6 text-[#444444] hover:text-white"><X size={14} /></Button>
                            </CardHeader>
                            <CardContent>
                                {isSuccess ? (
                                    <div className="py-8 flex flex-col items-center justify-center space-y-3">
                                        <CheckCircle2 className="text-green-500 h-10 w-10" />
                                        <p className="text-sm font-bold text-white">Password Updated!</p>
                                    </div>
                                ) : (
                                    <form onSubmit={handleChangePassword} className="space-y-4">
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold uppercase text-[#444444] ml-1">Current Password</label>
                                            <Input name="current_password" type="password" required className="bg-[#111111] border-[#222222] text-white focus:border-[#444444] h-10 transition-all" />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold uppercase text-[#444444] ml-1">New Password</label>
                                            <Input name="new_password" type="password" required className="bg-[#111111] border-[#222222] text-white focus:border-[#444444] h-10 transition-all" />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold uppercase text-[#444444] ml-1">Confirm New Password</label>
                                            <Input name="confirm_password" type="password" required className="bg-[#111111] border-[#222222] text-white focus:border-[#444444] h-10 transition-all" />
                                        </div>
                                        {error && <p className="text-[10px] text-red-500 font-bold text-center italic">{error}</p>}
                                        <Button disabled={isLoading} className="w-full bg-white text-black font-bold h-10 hover:bg-[#cccccc] transition-all mt-2">
                                            {isLoading ? <Loader2 className="animate-spin h-4 w-4" /> : "Update Password"}
                                        </Button>
                                    </form>
                                )}
                            </CardContent>
                        </Card>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    )
}