"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { motion, AnimatePresence } from "framer-motion"
import { Loader2 } from "lucide-react"
import Link from "next/link"

interface LoginFormProps {
    onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
    onForgotClick: () => void;
    isLoading: boolean;
}

export function LoginForm({ onSubmit, onForgotClick, isLoading }: LoginFormProps) {
    return (
        <Card className="max-w-[320px] bg-[#111111] border-[#222222]">
            <CardHeader className="pt-4 pb-1 px-7">
                <CardTitle className="text-[17px] font-semibold text-center text-[#f5f5f7]">
                    Sign in
                </CardTitle>
                <CardDescription className="text-[10px] text-center text-[#555555]">
                    Enter your details to continue
                </CardDescription>
            </CardHeader>

            <CardContent className="px-7 pb-5 pt-2">
                <form onSubmit={onSubmit} className="grid gap-3.5">
                    <div className="grid gap-1">
                        <Label htmlFor="email" className="text-[11px] font-medium text-[#777777] ml-0.5">
                            Username
                        </Label>
                        <Input
                            id="email"
                            name="username"
                            type="text"
                            required
                            placeholder="username"
                        />
                    </div>

                    <div className="grid gap-1">
                        <div className="flex items-center justify-between ml-0.5">
                            <Label htmlFor="password" className="text-[11px] font-medium text-[#777777]">
                                Password
                            </Label>
                            <button
                                type="button"
                                onClick={onForgotClick}
                                className="text-[10px] text-white/50 hover:text-white transition-colors"
                            >
                                Forgot?
                            </button>
                        </div>
                        <Input
                            id="password"
                            name="password"
                            type="password"
                            required
                        />
                    </div>

                    <Button type="submit" disabled={isLoading} className="mt-1 h-8 bg-[#eeeeee] text-black font-bold text-[12px]">
                        <AnimatePresence mode="wait">
                            {isLoading ? (
                                <motion.div key="loader" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                </motion.div>
                            ) : (
                                <motion.span key="text" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                    Continue
                                </motion.span>
                            )}
                        </AnimatePresence>
                    </Button>
                </form>

                <div className="relative flex items-center my-4">
                    <div className="grow border-t border-[#222222]"></div>
                    <span className="shrink mx-3 text-[9px] text-[#444444] font-bold uppercase tracking-widest">or</span>
                    <div className="grow border-t border-[#222222]"></div>
                </div>

                <Button variant="outline" className="w-full h-8 border-[#2a2a2a] text-[#999999] text-[11px]">
                    Google
                </Button>

                <div className="text-center mt-4 pt-2 border-t border-[#222222]/50">
                    <p className="text-[11px] text-[#555555]">
                        No account?{' '}
                        <Link href="/register" className="text-white/80 hover:text-white font-semibold hover:underline">
                            Create one
                        </Link>
                    </p>
                </div>
            </CardContent>
        </Card>
    )
}