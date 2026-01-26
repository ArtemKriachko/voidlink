"use client"
import React, { useState } from 'react'
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"
import { SettingsModal } from "@/components/dashboard/settings-modal"
import { SettingsModalUsername } from "@/components/dashboard/settings-modal_username"

type OnClose = () => void;

export function SettingsModalGlobal({ isOpen, onClose }: { isOpen: boolean, onClose: OnClose }) {
    const [isUsernameOpen, setIsUsernameOpen] = useState(false)
    const [isPasswordOpen, setIsPasswordOpen] = useState(false)

    return (
        <>
            <AnimatePresence>
                {isOpen && (
                    <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="w-full max-w-sm">
                            <Card className="bg-[#0a0a0a] border-[#222222] shadow-2xl relative">
                                <CardHeader className="flex flex-row items-center justify-between">
                                    <CardTitle className="text-xs font-bold uppercase tracking-widest text-[#444444]">Settings</CardTitle>
                                    <Button variant="ghost" size="icon" onClick={onClose} className="h-6 w-6 text-[#444444] hover:text-white"><X size={14} /></Button>
                                </CardHeader>
                                <CardContent className="space-y-2">
                                    {/* 2. При натисканні закриваємо головну і відкриваємо потрібну */}
                                    <Button
                                        onClick={() => { setIsUsernameOpen(true); onClose(); }}
                                        className="w-full bg-white text-black font-bold h-10 hover:bg-[#cccccc] transition-all"
                                    >
                                        Change Username
                                    </Button>
                                    <Button
                                        onClick={() => { setIsPasswordOpen(true); onClose(); }}
                                        className="w-full bg-white text-black font-bold h-10 hover:bg-[#cccccc] transition-all"
                                    >
                                        Change Password
                                    </Button>
                                </CardContent>
                            </Card>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* 3. Рендеримо самі модалки тут */}
            <SettingsModalUsername
                isOpen={isUsernameOpen}
                onClose={() => setIsUsernameOpen(false)}
            />
            <SettingsModal
                isOpen={isPasswordOpen}
                onClose={() => setIsPasswordOpen(false)}
            />
        </>
    )
}