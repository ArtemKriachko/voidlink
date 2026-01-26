"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from "framer-motion" // Додали для красивих анімацій
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { LinkDetailsModal } from "@/components/dashboard/link-details-modal"
import { SettingsModalGlobal } from "@/components/dashboard/settings-global-modal"
import { BarChart2, Copy, Trash2, Loader2, LogOut, Lock, Plus, Link2 } from "lucide-react"
import api from "@/lib/api"
import axios from "axios"
import { Telegram_Button } from "@/components/ui/TelegramButton"

interface Link {
    id: number;
    short_key: string;
    original_url: string;
    clicks: number;
}

export default function Dashboard() {
    const [links, setLinks] = useState<Link[]>([])
    const [longUrl, setLongUrl] = useState("")
    const [loading, setLoading] = useState(true)
    const [actionLoading, setActionLoading] = useState(false)
    const router = useRouter()
    const [selectedLink, setSelectedLink] = useState<Link | null>(null)
    const [isDetailsOpen, setIsDetailsOpen] = useState(false)
    const [isSettingsGlobalOpen, setIsSettingsGlobalOpen] = useState(false)

    const openDetails = (link: Link) => {
        setSelectedLink(link)
        setIsDetailsOpen(true)
    }

    useEffect(() => {
        const fetchLinks = async () => {
            const token = localStorage.getItem('token')
            if (!token) {
                router.push('/login')
                return
            }

            try {
                const res = await api.get('/my-urls')
                setLinks(res.data)
            } catch (error) {
                if (axios.isAxiosError(error) && error.response?.status === 401) {
                    localStorage.removeItem('token')
                    router.push('/login')
                }
            } finally {
                setLoading(false)
            }
        }

        fetchLinks().then(() => {})
    }, [router])

    const handleShorten = async () => {
        if (!longUrl) return
        setActionLoading(true)
        try {
            const res = await api.post('/shorten', { target_url: longUrl })
            setLinks([res.data, ...links])
            setLongUrl("")
        } catch {
            alert("Failed to shorten link")
        } finally {
            setActionLoading(false)
        }
    }

    const handleDelete = async (key: string) => {
        try {
            await api.delete(`/my-urls/${key}`)
            setLinks(links.filter(l => l.short_key !== key))
        } catch (error) {
            if (axios.isAxiosError(error)) {
                alert(error.response?.data?.detail || "Could not delete")
            }
        }
    }

    const handleLogout = () => {
        localStorage.removeItem('token')
        router.push('/login')
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-[#050505] flex items-center justify-center">
                <div className="relative">
                    <div className="h-12 w-12 rounded-full border-t-2 border-white/20 animate-spin" />
                    <Loader2 className="h-4 w-4 animate-spin text-white absolute top-4 left-4" />
                </div>
            </div>
        )
    }

    return (
        <main className="min-h-screen bg-[#050505] text-[#f5f5f7] p-6 md:p-12 selection:bg-white/10 relative overflow-hidden">
            {/* Фоновий ефект - легке сяйво зверху */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-64 bg-white/2 blur-[120px] pointer-events-none" />

            <div className="max-w-5xl mx-auto space-y-12 relative z-10">

                {/* Header */}
                <header className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                            <Link2 size={18} className="text-black" />
                        </div>
                        <span className="text-lg font-bold tracking-tighter uppercase">VoidLink</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <Telegram_Button>
                        </Telegram_Button>
                        <Button
                            variant="ghost"
                            onClick={() => setIsSettingsGlobalOpen(true)}
                            className="text-[11px] text-[#666] hover:text-white hover:bg-white/5 gap-2 rounded-full px-4"
                        >
                            <Lock size={12} /> Settings
                        </Button>
                        <Button
                            variant="ghost"
                            onClick={handleLogout}
                            className="text-[11px] text-[#666] hover:text-red-400 hover:bg-red-500/5 gap-2 rounded-full px-4"
                        >
                            <LogOut size={12} /> Logout
                        </Button>
                    </div>
                </header>

                {/* Input Section */}
                <div className="max-w-2xl mx-auto space-y-6 text-center py-10">
                    <motion.h1
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-4xl font-black tracking-tight bg-linear-to-b from-white to-[#555] bg-clip-text text-transparent"
                    >
                        Shorten. Track. Control.
                    </motion.h1>

                    <div className="flex gap-2 p-1.5 bg-[#0a0a0a] rounded-2xl border border-[#1a1a1a] shadow-2xl focus-within:border-[#333] transition-all duration-500 group">
                        <Input
                            placeholder="Drop your long URL here..."
                            value={longUrl}
                            onChange={(e) => setLongUrl(e.target.value)}
                            className="bg-transparent border-none h-11 text-sm focus-visible:ring-0 shadow-none placeholder:text-[#333]"
                        />
                        <Button
                            onClick={handleShorten}
                            disabled={actionLoading}
                            className="bg-white text-black font-bold px-8 h-11 rounded-xl hover:scale-[1.02] active:scale-95 transition-all"
                        >
                            {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus size={18} />}
                        </Button>
                    </div>
                </div>

                {/* Grid Section */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    <AnimatePresence mode="popLayout">
                        {links.length === 0 ? (
                            <motion.p
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="col-span-full text-center text-[#333] text-sm font-medium py-20 border border-dashed border-[#111] rounded-3xl"
                            >
                                No links active. The void is empty.
                            </motion.p>
                        ) : (
                            links.map((link, index) => (
                                <motion.div
                                    key={link.id}
                                    layout
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    transition={{ delay: index * 0.05 }}
                                >
                                    <Card className="bg-[#0c0c0c] border-[#1a1a1a] p-6 hover:border-[#333] hover:bg-[#111] transition-all duration-300 group flex flex-col justify-between min-h-45 rounded-3xl relative overflow-hidden">
                                        {/* Ефект наведення - легкий градієнт */}
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/1 rounded-full -mr-10 -mt-10 group-hover:bg-white/3 transition-all" />

                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between">
                                                <div className="px-3 py-1 bg-[#161616] border border-[#222] rounded-lg group-hover:border-[#444] transition-all">
                                                    <span className="font-mono font-bold text-sm text-white tracking-wider">
                                                        /{link.short_key}
                                                    </span>
                                                </div>
                                                <button
                                                    onClick={() => navigator.clipboard.writeText(`http://localhost:8000/${link.short_key}`)}
                                                    className="p-2.5 hover:bg-white text-[#444] hover:text-black rounded-xl transition-all active:scale-90"
                                                >
                                                    <Copy size={14} />
                                                </button>
                                            </div>

                                            <p className="text-[11px] text-[#444] group-hover:text-[#777] line-clamp-2 leading-relaxed break-all font-medium transition-colors italic">
                                                {link.original_url}
                                            </p>
                                        </div>

                                        <div className="mt-8 pt-5 border-t border-white/3 flex items-center justify-between">
                                            <div className="space-y-0.5">
                                                <div className="flex items-baseline gap-1">
                                                    <span className="text-xl font-black text-white">{link.clicks}</span>
                                                    <div className="w-1.5 h-1.5 rounded-full bg-green-500/50 animate-pulse" />
                                                </div>
                                                <span className="text-[9px] text-[#333] uppercase font-black tracking-[0.2em]">Live Clicks</span>
                                            </div>

                                            <div className="flex gap-2">
                                                <Button
                                                    onClick={() => openDetails(link)}
                                                    className="h-9 w-9 p-0 bg-transparent border border-[#1a1a1a] hover:bg-white hover:text-black rounded-xl transition-all"
                                                >
                                                    <BarChart2 className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    onClick={() => handleDelete(link.short_key)}
                                                    className="h-9 w-9 p-0 bg-transparent border border-[#1a1a1a] hover:bg-red-500/10 hover:border-red-500/50 hover:text-red-500 text-[#333] rounded-xl transition-all"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    </Card>
                                </motion.div>
                            ))
                        )}
                    </AnimatePresence>
                </div>
            </div>

            <SettingsModalGlobal
                isOpen={isSettingsGlobalOpen}
                onClose={() => setIsSettingsGlobalOpen(false)}
            />
            <LinkDetailsModal
                link={selectedLink}
                isOpen={isDetailsOpen}
                onClose={() => setIsDetailsOpen(false)}
            />
        </main>
    )
}