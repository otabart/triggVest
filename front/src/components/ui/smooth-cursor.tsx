"use client"

import { useEffect, useState } from "react"

export function SmoothCursor() {
    const [position, setPosition] = useState({ x: 0, y: 0 })
    const [isPointer, setIsPointer] = useState(false)

    useEffect(() => {
        const updatePosition = (e: MouseEvent) => {
            setPosition({ x: e.clientX, y: e.clientY })
        }

        const updateCursor = (e: MouseEvent) => {
            const target = e.target as HTMLElement
            setIsPointer(
                target.tagName === "BUTTON" ||
                target.tagName === "A" ||
                target.onclick !== null ||
                window.getComputedStyle(target).cursor === "pointer",
            )
        }

        document.addEventListener("mousemove", updatePosition)
        document.addEventListener("mouseover", updateCursor)

        return () => {
            document.removeEventListener("mousemove", updatePosition)
            document.removeEventListener("mouseover", updateCursor)
        }
    }, [])

    return (
        <>
            <div
                className="fixed top-0 left-0 w-4 h-4 bg-accent rounded-full pointer-events-none z-[9999] transition-transform duration-150 ease-out"
                style={{
                    transform: `translate(${position.x - 8}px, ${position.y - 8}px) scale(${isPointer ? 1.5 : 1})`,
                }}
            />
            <div
                className="fixed top-0 left-0 w-8 h-8 border-2 border-accent rounded-full pointer-events-none z-[9998] transition-transform duration-300 ease-out"
                style={{
                    transform: `translate(${position.x - 16}px, ${position.y - 16}px) scale(${isPointer ? 0.8 : 1})`,
                }}
            />
        </>
    )
}
