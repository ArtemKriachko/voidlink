"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { LinkDetailsModal } from "@/components/dashboard/link-details-modal"
import { SettingsModal } from "@/components/dashboard/settings-modal"
import { BarChart2, Copy, Trash2, Loader2, LogOut, Lock } from "lucide-react"
import api from "@/lib/api"
import axios from "axios"

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
    const [isSettingsOpen, setIsSettingsOpen] = useState(false)

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

        fetchLinks()
    }, [router])

    const handleShorten = async () => {
        if (!longUrl) return
        setActionLoading(true)
        try {
            const res = await api.post('/shorten', { target_url: longUrl })
            setLinks([res.data, ...links])
            setLongUrl("")
        } catch (error) {
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
            } else {
                alert("An unexpected error occurred")
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
                <Loader2 className="h-6 w-6 animate-spin text-[#555555]" />
            </div>
        )
    }

    return (
        <main className="min-h-screen bg-[#050505] text-[#f5f5f7] p-8 selection:bg-white/10">
            <div className="max-w-3xl mx-auto space-y-8">

                {/* Header з кнопкою виходу */}
                <div className="flex justify-end">
                    <Button
                        variant="ghost"
                        onClick={() => setIsSettingsOpen(true)}
                        className="text-[11px] text-[#555555] hover:text-white gap-2"
                    >
                        <Lock size={12} /> Settings
                    </Button>
                    <Button
                        variant="ghost"
                        onClick={handleLogout}
                        className="text-[11px] text-[#555555] hover:text-white gap-2"
                    >
                        <LogOut size={14} /> Logout
                    </Button>
                </div>

                {/* Input Section */}
                <div className="space-y-4 text-center">
                    <h1 className="text-2xl font-bold tracking-tight">My Links</h1>
                    <div className="flex gap-2 max-w-lg mx-auto bg-[#111111] p-1.5 rounded-xl border border-[#222222] focus-within:border-[#444444] transition-all">
                        <Input
                            placeholder="Paste your long link..."
                            value={longUrl}
                            onChange={(e) => setLongUrl(e.target.value)}
                            className="bg-transparent border-none h-9 text-sm focus-visible:ring-0 shadow-none"
                        />
                        <Button
                            onClick={handleShorten}
                            disabled={actionLoading}
                            className="bg-white text-black font-bold px-6 h-9 rounded-lg hover:bg-slate-200 transition-all"
                        >
                            {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Shorten"}
                        </Button>
                    </div>
                </div>

                {/* Links List */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {links.length === 0 ? (
                        <p className="col-span-full text-center text-[#444444] text-sm py-10">
                            No links yet. Create your first one!
                        </p>
                    ) : (
                        links.map((link) => (
                            <Card
                                key={link.id}
                                className="bg-[#111111] border-[#222222] p-5 hover:border-[#444444] transition-all group flex flex-col justify-between min-h-[160px] rounded-2xl"
                            >
                                {/* Верхня частина: Назва та Копіювання */}
                                <div className="space-y-3">
                                    <div className="flex items-start justify-between">
                                        <div className="bg-[#1a1a1a] p-2 rounded-lg group-hover:bg-[#222222] transition-colors">
                            <span className="font-bold text-[15px] tracking-tight text-white">
                                {link.short_key}
                            </span>
                                        </div>
                                        <button
                                            onClick={() => navigator.clipboard.writeText(`http://localhost:8000/${link.short_key}`)}
                                            className="p-2 hover:bg-[#222222] rounded-full transition-colors text-[#555555] hover:text-white"
                                        >
                                            <Copy size={14} />
                                        </button>
                                    </div>

                                    <p className="text-[11px] text-[#555555] line-clamp-2 leading-relaxed break-all italic">
                                        {link.original_url}
                                    </p>
                                </div>

                                {/* Нижня частина: Статистика та Дії */}
                                <div className="mt-6 pt-4 border-t border-white/[0.03] flex items-center justify-between">
                                    <div className="flex flex-col">
                                        <span className="text-[14px] font-black text-white">{link.clicks}</span>
                                        <span className="text-[8px] text-[#444444] uppercase tracking-widest font-bold">Clicks</span>
                                    </div>

                                    <div className="flex gap-2">
                                        <Button
                                            onClick={() => openDetails(link)}
                                            variant="outline"
                                            className="h-8 w-8 p-0 border-[#222222] hover:bg-[#1c1c1c] rounded-lg"
                                        >
                                            <BarChart2 className="h-4 w-4 text-[#777777]" />
                                        </Button>
                                        <Button
                                            variant="outline"
                                            onClick={() => handleDelete(link.short_key)}
                                            className="h-8 w-8 p-0 border-[#222222] hover:bg-red-950/20 text-red-900 hover:text-red-500 transition-colors rounded-lg"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </Card>
                        ))
                    )}
                </div>
            </div>
            <SettingsModal
                isOpen={isSettingsOpen}
                onClose={() => setIsSettingsOpen(false)}
            />
            <LinkDetailsModal
                link={selectedLink}
                isOpen={isDetailsOpen}
                onClose={() => setIsDetailsOpen(false)}
            />
        </main>
    )
}