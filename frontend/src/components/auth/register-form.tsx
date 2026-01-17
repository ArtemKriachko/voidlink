"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { motion, AnimatePresence } from "framer-motion"
import { Loader2 } from "lucide-react"
import Link from "next/link"

interface RegisterFormProps {
    onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
    isLoading: boolean;
}

export function RegisterForm({ onSubmit, isLoading }: RegisterFormProps) {
    return (
        <Card className="max-w-[320px] bg-[#111111] border-[#222222]">
            <CardHeader className="pt-4 pb-1 px-7">
                <CardTitle className="text-[17px] font-semibold text-center text-[#f5f5f7]">
                    Create account
                </CardTitle>
                <CardDescription className="text-[10px] text-center text-[#555555]">
                    Enter your details to join
                </CardDescription>
            </CardHeader>

            <CardContent className="px-7 pb-5 pt-2">
                <form onSubmit={onSubmit} className="grid gap-3">
                    <div className="grid gap-1">
                        <Label htmlFor="username" className="text-[11px] font-medium text-[#777777] ml-0.5">
                            Username
                        </Label>
                        <Input
                            id="username"
                            name="username"
                            type="text"
                            required
                            placeholder="johndoe"
                        />
                    </div>

                    <div className="grid gap-1">
                        <Label htmlFor="password" title="password" className="text-[11px] font-medium text-[#777777] ml-0.5">
                            Password
                        </Label>
                        <Input
                            id="password"
                            name="password"
                            type="password"
                            required
                        />
                    </div>

                    <Button type="submit" disabled={isLoading} className="mt-2 h-8 bg-[#eeeeee] text-black font-bold text-[12px]">
                        <AnimatePresence mode="wait">
                            {isLoading ? (
                                <motion.div key="loader" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                </motion.div>
                            ) : (
                                <motion.span key="text" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                    Sign Up
                                </motion.span>
                            )}
                        </AnimatePresence>
                    </Button>
                </form>

                <div className="text-center mt-4 pt-2 border-t border-[#222222]/50">
                    <p className="text-[11px] text-[#555555]">
                        Have an account?{' '}
                        <Link href="/login" className="text-white/80 hover:text-white font-semibold hover:underline">
                            Sign in
                        </Link>
                    </p>
                </div>
            </CardContent>
        </Card>
    )
}