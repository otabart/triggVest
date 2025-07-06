"use client"

import { useEffect, useRef } from "react"

interface MiniChartProps {
    data: number[]
    positive: boolean
}

export function MiniChart({ data, positive }: MiniChartProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null)

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return

        const ctx = canvas.getContext("2d")
        if (!ctx) return

        const width = canvas.width
        const height = canvas.height

        // Clear canvas
        ctx.clearRect(0, 0, width, height)

        // Calculate points
        const max = Math.max(...data)
        const min = Math.min(...data)
        const range = max - min || 1

        const points = data.map((value, index) => ({
            x: (index / (data.length - 1)) * width,
            y: height - ((value - min) / range) * height,
        }))

        // Draw line
        ctx.beginPath()
        ctx.strokeStyle = positive ? "#16a34a" : "#dc2626"
        ctx.lineWidth = 2
        ctx.moveTo(points[0].x, points[0].y)

        for (let i = 1; i < points.length; i++) {
            ctx.lineTo(points[i].x, points[i].y)
        }

        ctx.stroke()

        // Draw area under curve
        ctx.beginPath()
        ctx.moveTo(points[0].x, height)
        for (let i = 0; i < points.length; i++) {
            ctx.lineTo(points[i].x, points[i].y)
        }
        ctx.lineTo(points[points.length - 1].x, height)
        ctx.closePath()

        const gradient = ctx.createLinearGradient(0, 0, 0, height)
        gradient.addColorStop(0, positive ? "rgba(22, 163, 74, 0.2)" : "rgba(220, 38, 38, 0.2)")
        gradient.addColorStop(1, positive ? "rgba(22, 163, 74, 0.05)" : "rgba(220, 38, 38, 0.05)")

        ctx.fillStyle = gradient
        ctx.fill()
    }, [data, positive])

    return <canvas ref={canvasRef} width={200} height={40} className="w-full h-full" />
}
