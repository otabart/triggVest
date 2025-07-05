import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { ArrowUpRight, ArrowDownLeft, ExternalLink } from "lucide-react"

const transactionsData = [
    {
        id: "1",
        type: "buy",
        token: "DOGE",
        amount: "$500",
        price: "$0.08234",
        strategy: "Elon's DOGE Pump",
        timestamp: "2024-01-20 14:30:25",
        txHash: "0x1234...5678",
        status: "confirmed",
    },
    {
        id: "2",
        type: "sell",
        token: "ETH",
        amount: "$1,200",
        price: "$2,456.78",
        strategy: "Fed Rate Hedge",
        timestamp: "2024-01-20 09:15:42",
        txHash: "0xabcd...efgh",
        status: "confirmed",
    },
    {
        id: "3",
        type: "buy",
        token: "BTC",
        amount: "$1,000",
        price: "$42,156.89",
        strategy: "Whale Alert Follower",
        timestamp: "2024-01-19 16:22:18",
        txHash: "0x9876...5432",
        status: "confirmed",
    },
    {
        id: "4",
        type: "buy",
        token: "BTC",
        amount: "$750",
        price: "$41,892.34",
        strategy: "Trump Crypto Boost",
        timestamp: "2024-01-19 11:45:33",
        txHash: "0xfedc...ba98",
        status: "pending",
    },
    {
        id: "5",
        type: "buy",
        token: "ETH",
        amount: "$600",
        price: "$2,398.45",
        strategy: "Vitalik's ETH Vision",
        timestamp: "2024-01-18 20:12:07",
        txHash: "0x1111...2222",
        status: "confirmed",
    },
]

export function TransactionsSection() {
    return (
        <Card className="rounded-none border-4 border-black">
            <CardHeader>
                <h3 className="text-2xl font-bold font-sans text-foreground">Recent Transactions</h3>
                <p className="text-muted-foreground">Latest automated trades across all strategies.</p>
            </CardHeader>
            <CardContent>
                <div className="space-y-3">
                    {transactionsData.map((tx) => (
                        <div
                            key={tx.id}
                            className="p-4 bg-secondary border-2 border-black transition-all duration-200 hover:translate-x-1"
                        >
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-3">
                                    <div
                                        className={`p-2 rounded-none border-2 border-black ${tx.type === "buy" ? "bg-green-100" : "bg-red-100"
                                            }`}
                                    >
                                        {tx.type === "buy" ? (
                                            <ArrowDownLeft className="w-4 h-4 text-green-600" />
                                        ) : (
                                            <ArrowUpRight className="w-4 h-4 text-red-600" />
                                        )}
                                    </div>
                                    <div>
                                        <div className="font-bold text-foreground">
                                            {tx.type.toUpperCase()} {tx.token}
                                        </div>
                                        <div className="text-sm text-muted-foreground">{tx.strategy}</div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="font-bold text-foreground">{tx.amount}</div>
                                    <div className="text-sm text-muted-foreground">@ {tx.price}</div>
                                </div>
                            </div>

                            <div className="flex items-center justify-between text-xs">
                                <div className="text-muted-foreground">{tx.timestamp}</div>
                                <div className="flex items-center gap-2">
                                    <div
                                        className={`px-2 py-1 rounded-none border border-black font-bold ${tx.status === "confirmed"
                                            ? "bg-green-100 text-green-800"
                                            : tx.status === "pending"
                                                ? "bg-yellow-100 text-yellow-800"
                                                : "bg-red-100 text-red-800"
                                            }`}
                                    >
                                        {tx.status.toUpperCase()}
                                    </div>
                                    <button className="text-blue-600 hover:text-blue-800">
                                        <ExternalLink className="w-3 h-3" />
                                    </button>
                                </div>
                            </div>

                            <div className="mt-2 text-xs font-mono text-muted-foreground">Tx: {tx.txHash}</div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    )
}
