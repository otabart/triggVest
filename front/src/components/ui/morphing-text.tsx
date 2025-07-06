"use client"

import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"

interface MorphingTextProps {
    texts: string[]
    className?: string
    duration?: number
}

export function MorphingText({ texts, className, duration = 2000 }: MorphingTextProps) {
    const [currentIndex, setCurrentIndex] = useState(0)
    const [isAnimating, setIsAnimating] = useState(false)

    useEffect(() => {
        const interval = setInterval(() => {
            setIsAnimating(true)
            setTimeout(() => {
                setCurrentIndex((prev) => (prev + 1) % texts.length)
                setIsAnimating(false)
            }, 300)
        }, duration)

        return () => clearInterval(interval)
    }, [texts.length, duration])

    return (
        <span className={cn("inline-block transition-all duration-300", isAnimating && "scale-110 opacity-70", className)}>
            {texts[currentIndex]}
        </span>
    )
}
