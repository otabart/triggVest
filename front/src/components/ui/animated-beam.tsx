"use client"

import { useEffect, useRef } from "react"
import { cn } from "@/lib/utils"

interface AnimatedBeamProps {
    className?: string
    duration?: number
    delay?: number
}

export function AnimatedBeam({ className, duration = 2000, delay = 0 }: AnimatedBeamProps) {
    const beamRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const beam = beamRef.current
        if (!beam) return

        const animate = () => {
            beam.style.transform = "translateX(-100%)"
            beam.style.opacity = "0"

            setTimeout(() => {
                beam.style.transition = "none"
                beam.style.transform = "translateX(100%)"
                beam.style.opacity = "1"

                setTimeout(() => {
                    beam.style.transition = `transform ${duration}ms ease-in-out, opacity ${duration}ms ease-in-out`
                    beam.style.transform = "translateX(-100%)"
                    beam.style.opacity = "0"
                }, 50)
            }, duration)
        }

        const interval = setInterval(animate, duration + 1000)
        setTimeout(animate, delay)

        return () => clearInterval(interval)
    }, [duration, delay])

    return (
        <div className={cn("relative overflow-hidden", className)}>
            <div
                ref={beamRef}
                className="absolute inset-0 bg-gradient-to-r from-transparent via-accent to-transparent opacity-0"
                style={{ transform: "translateX(100%)" }}
            />
        </div>
    )
}
