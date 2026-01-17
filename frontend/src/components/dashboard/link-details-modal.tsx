"use client"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { X, Calendar, MousePointerClick, QrCode } from "lucide-react"

interface LinkDetailsProps {
    link: any;
    isOpen: boolean;
    onClose: () => void;
}

export function LinkDetailsModal({ link, isOpen, onClose }: LinkDetailsProps) {
    if (!link) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="w-full max-w-md"
                    >
                        <Card className="bg-[#0a0a0a] border-[#222222] shadow-2xl relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-[#444444] to-transparent" />

                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium text-[#777777]">Link Analytics</CardTitle>
                                <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 text-[#444444] hover:text-white">
                                    <X size={16} />
                                </Button>
                            </CardHeader>

                            <CardContent className="space-y-6">
                                <div className="space-y-1">
                                    <h2 className="text-xl font-bold tracking-tight text-white truncate">{link.short_key}</h2>
                                    <p className="text-xs text-[#555555] truncate">{link.full_url}</p>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-3 rounded-lg bg-[#111111] border border-[#1a1a1a] space-y-1">
                                        <div className="flex items-center gap-2 text-[#555555]">
                                            <MousePointerClick size={14} />
                                            <span className="text-[10px] uppercase font-bold tracking-wider">Total Clicks</span>
                                        </div>
                                        <p className="text-2xl font-bold text-white">{link.clicks}</p>
                                    </div>
                                    <div className="p-3 rounded-lg bg-[#111111] border border-[#1a1a1a] space-y-1">
                                        <div className="flex items-center gap-2 text-[#555555]">
                                            <Calendar size={14} />
                                            <span className="text-[10px] uppercase font-bold tracking-wider">Created</span>
                                        </div>
                                        <p className="text-sm font-bold text-white">
                                            {new Date(link.created_at).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center justify-center p-6 bg-white/[0.02] rounded-xl border border-dashed border-[#222222]">
                                    <div className="text-center space-y-3">
                                        <QrCode size={120} className="mx-auto text-white opacity-20" />
                                        <p className="text-[10px] text-[#444444] uppercase tracking-widest font-bold">QR Code Coming Soon</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    )
}