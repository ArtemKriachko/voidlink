"use client"

import React from 'react'
import { Send } from "lucide-react"

export function Telegram_Button() {
    return (
        <a
            href="https://t.me/Voidlnk_bot" // Заміни на свого бота
            target="_blank"
            rel="noopener noreferrer"
            className="group relative flex items-center gap-2 px-4 py-2 bg-[#0a0a0a] border border-[#1a1a1a] hover:border-[#222] rounded-full transition-all duration-300 active:scale-95"
        >
            {/* М'яке блакитне сяйво при наведенні */}
            <div className="absolute inset-0 rounded-full bg-blue-500/0 group-hover:bg-blue-500/5 blur-md transition-all duration-500" />

            <div className="relative flex items-center gap-2">
                <div className="flex items-center justify-center w-5 h-5 rounded-full bg-blue-500/10 group-hover:bg-blue-500/20 transition-colors">
                    <Send size={12} className="text-blue-400 group-hover:text-blue-300 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </div>
                <span className="text-[11px] font-bold text-[#666] group-hover:text-[#eee] transition-colors uppercase tracking-widest">
          Bot
        </span>
            </div>
        </a>
    )
}