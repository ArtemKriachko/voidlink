"use client"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface ForgotPasswordModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function ForgotPasswordModal({ isOpen, onClose }: ForgotPasswordModalProps) {
    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                        className="w-full max-w-[300px]"
                    >
                        <Card className="bg-[#141414] border-[#2a2a2a] shadow-2xl">
                            <CardHeader className="pt-5 pb-2 px-6">
                                <CardTitle className="text-sm font-bold text-white text-center">Reset Password</CardTitle>
                            </CardHeader>
                            <CardContent className="px-6 pb-6 space-y-4">
                                <p className="text-[11px] text-[#777777] text-center">Enter your email to receive a reset link</p>
                                <Input placeholder="Email" className="h-8 bg-[#1c1c1c] border-[#333333] text-xs px-3" />
                                <div className="flex gap-2">
                                    <Button variant="outline" onClick={onClose} className="flex-1 h-8 text-[11px] border-[#333333] hover:bg-[#1c1c1c]">
                                        Cancel
                                    </Button>
                                    <Button className="flex-1 h-8 text-[11px] bg-[#eeeeee] text-black font-bold">
                                        Send
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    )
}