import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { CheckCircle, XCircle, Clock, AlertTriangle } from "lucide-react"

const mockLogs = [
    {
        id: 1,
        timestamp: "2024-01-20 14:30:25",
        type: "trigger",
        status: "success",
        message: "@elonmusk tweeted: 'DOGE to the moon! 🚀'",
        action: "Bought $500 DOGE",
        txHash: "0x1234...5678",
    },
    {
        id: 2,
        timestamp: "2024-01-20 09:15:42",
        type: "trigger",
        status: "failed",
        message: "@elonmusk tweeted: 'Dogecoin is interesting'",
        action: "Failed to execute buy order",
        error: "Insufficient balance",
    },
    {
        id: 3,
        timestamp: "2024-01-19 16:22:18",
        type: "trigger",
        status: "success",
        message: "@elonmusk tweeted: 'Much wow, such crypto'",
        action: "Bought $500 DOGE",
        txHash: "0xabcd...efgh",
    },
    {
        id: 4,
        timestamp: "2024-01-19 11:45:33",
        type: "system",
        status: "info",
        message: "Strategy activated",
        action: "Monitoring started",
    },
]

interface StrategyLogsProps {
    strategyId: string
}

export function StrategyLogs({ strategyId }: StrategyLogsProps) {
    const getStatusIcon = (status: string) => {
        switch (status) {
            case "success":
                return <CheckCircle className="w-5 h-5 text-green-600" />
            case "failed":
                return <XCircle className="w-5 h-5 text-red-600" />
            case "info":
                return <Clock className="w-5 h-5 text-blue-600" />
            default:
                return <AlertTriangle className="w-5 h-5 text-yellow-600" />
        }
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case "success":
                return "border-green-200 bg-green-50"
            case "failed":
                return "border-red-200 bg-red-50"
            case "info":
                return "border-blue-200 bg-blue-50"
            default:
                return "border-yellow-200 bg-yellow-50"
        }
    }

    return (
        <Card className="rounded-none border-4 border-black">
            <CardHeader>
                <h3 className="text-2xl font-bold font-sans text-foreground">Activity Logs</h3>
                <p className="text-muted-foreground">Recent triggers and system events for this strategy</p>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {mockLogs.map((log) => (
                        <div
                            key={log.id}
                            className={`p-4 border-2 rounded-none ${getStatusColor(log.status)} transition-all duration-200 hover:translate-x-1`}
                        >
                            <div className="flex items-start gap-4">
                                <div className="mt-1">{getStatusIcon(log.status)}</div>
                                <div className="flex-1">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="text-sm font-bold text-muted-foreground">{log.timestamp}</div>
                                        <div
                                            className={`px-2 py-1 text-xs font-bold rounded-none border border-black ${log.type === "trigger" ? "bg-accent/20 text-accent" : "bg-secondary text-foreground"
                                                }`}
                                        >
                                            {log.type.toUpperCase()}
                                        </div>
                                    </div>
                                    <div className="text-foreground font-bold mb-1">{log.message}</div>
                                    <div className="text-sm text-muted-foreground mb-2">{log.action}</div>
                                    {log.txHash && <div className="text-xs text-blue-600 font-mono">Tx: {log.txHash}</div>}
                                    {log.error && <div className="text-xs text-red-600 font-bold">Error: {log.error}</div>}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    )
}
