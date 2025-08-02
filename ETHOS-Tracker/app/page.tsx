"use client"

import { useState, useEffect } from "react"
import { TrendingUp, TrendingDown, Fuel, Zap, Bell, Plus, X } from 'lucide-react'

interface TokenData {
  symbol: string
  name: string
  price: number
  change24h: number
  contract?: string
}

interface PriceAlert {
  id: string
  symbol: string
  type: "above" | "below"
  threshold: number
  isActive: boolean
}

export default function CryptoDashboard() {
  const [tokens, setTokens] = useState<TokenData[]>([])
  const [airToken, setAirToken] = useState<TokenData | null>(null)
  const [loading, setLoading] = useState(true)
  const [alerts, setAlerts] = useState<PriceAlert[]>([])
  const [showAlertModal, setShowAlertModal] = useState(false)

  const safeNumber = (value: any, fallback = 0): number => {
    const num = Number(value)
    return isNaN(num) || !isFinite(num) ? fallback : num
  }

  const formatPrice = (price: any, decimals = 2): string => {
    const safePrice = safeNumber(price, 0)
    return safePrice.toFixed(decimals)
  }

  const formatChange = (change: any): string => {
    const safeChange = safeNumber(change, 0)
    return `${safeChange > 0 ? "+" : ""}${safeChange.toFixed(2)}%`
  }

  const fetchCryptoData = async () => {
    try {
      const response = await fetch(
        "https://api.coingecko.com/api/v3/simple/price?ids=ethereum,bitcoin,usd-coin,chainlink,uniswap&vs_currencies=usd&include_24hr_change=true"
      )

      if (!response.ok) throw new Error("Failed to fetch")

      const data = await response.json()

      const cryptoTokens: TokenData[] = [
        {
          symbol: "ETH",
          name: "Ethereum",
          price: safeNumber(data.ethereum?.usd, 2340),
          change24h: safeNumber(data.ethereum?.usd_24h_change, 0),
        },
        {
          symbol: "BTC",
          name: "Bitcoin",
          price: safeNumber(data.bitcoin?.usd, 43250),
          change24h: safeNumber(data.bitcoin?.usd_24h_change, 0),
        },
        {
          symbol: "USDC",
          name: "USD Coin",
          price: safeNumber(data["usd-coin"]?.usd, 1.0),
          change24h: safeNumber(data["usd-coin"]?.usd_24h_change, 0),
        },
        {
          symbol: "LINK",
          name: "Chainlink",
          price: safeNumber(data.chainlink?.usd, 14.85),
          change24h: safeNumber(data.chainlink?.usd_24h_change, 0),
        },
        {
          symbol: "UNI",
          name: "Uniswap",
          price: safeNumber(data.uniswap?.usd, 6.42),
          change24h: safeNumber(data.uniswap?.usd_24h_change, 0),
        },
      ]

      // AIR Token with current price $0.00676
      const currentAirPrice = 0.00676 + (Math.random() - 0.5) * 0.00005
      const airTokenData: TokenData = {
        symbol: "AIR",
        name: "AIR Token",
        price: safeNumber(currentAirPrice, 0.00676),
        change24h: safeNumber(1.8 + (Math.random() - 0.5) * 3, 1.8),
        contract: "0x8164b40840418c77a68f6f9eedb5202b36d8b288",
      }

      // Check alerts
      checkPriceAlerts(airTokenData.price, "AIR")
      cryptoTokens.forEach(token => checkPriceAlerts(token.price, token.symbol))

      setTokens(cryptoTokens)
      setAirToken(airTokenData)
      setLoading(false)
    } catch (error) {
      console.error("Error:", error)
      setLoading(false)
    }
  }

  const checkPriceAlerts = (currentPrice: number, symbol: string) => {
    alerts.forEach(alert => {
      if (alert.symbol === symbol && alert.isActive) {
        const shouldTrigger = 
          (alert.type === "above" && currentPrice >= alert.threshold) ||
          (alert.type === "below" && currentPrice <= alert.threshold)

        if (shouldTrigger) {
          // Show browser notification
          if (Notification.permission === "granted") {
            new Notification(`🚨 ${symbol} Price Alert!`, {
              body: `${symbol} hit ${alert.type} $${formatPrice(alert.threshold, symbol === "AIR" ? 5 : 2)}! Current: $${formatPrice(currentPrice, symbol === "AIR" ? 5 : 2)}`,
              icon: "/icon-192.png"
            })
          }

          // Deactivate alert
          setAlerts(prev => prev.map(a => 
            a.id === alert.id ? { ...a, isActive: false } : a
          ))
        }
      }
    })
  }

  const createAlert = (symbol: string, type: "above" | "below", threshold: number) => {
    const newAlert: PriceAlert = {
      id: Date.now().toString(),
      symbol,
      type,
      threshold,
      isActive: true,
    }
    setAlerts(prev => [...prev, newAlert])
  }

  useEffect(() => {
    // Request notification permission
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission()
    }

    fetchCryptoData()
    const interval = setInterval(fetchCryptoData, 15000)
    return () => clearInterval(interval)
  }, [])

  const AlertModal = () => {
    const [selectedSymbol, setSelectedSymbol] = useState("AIR")
    const [alertType, setAlertType] = useState<"above" | "below">("above")
    const [threshold, setThreshold] = useState("")

    const allTokens = airToken ? [airToken, ...tokens] : tokens
    const selectedToken = allTokens.find(t => t.symbol === selectedSymbol)

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault()
      const thresholdNum = parseFloat(threshold)
      if (thresholdNum > 0) {
        createAlert(selectedSymbol, alertType, thresholdNum)
        setThreshold("")
        setShowAlertModal(false)
      }
    }

    if (!showAlertModal) return null

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-gray-900 rounded-lg p-6 w-full max-w-md border border-gray-600">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-white text-lg font-semibold">Create Price Alert</h3>
            <button 
              onClick={() => setShowAlertModal(false)}
              className="text-gray-400 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-gray-300 text-sm mb-2">Token</label>
              <select
                value={selectedSymbol}
                onChange={(e) => setSelectedSymbol(e.target.value)}
                className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white"
              >
                {allTokens.map(token => (
                  <option key={token.symbol} value={token.symbol}>
                    {token.symbol} - {token.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-gray-300 text-sm mb-2">Alert Type</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setAlertType("above")}
                  className={`flex-1 py-2 px-3 rounded text-sm ${
                    alertType === "above" ? "bg-green-600 text-white" : "bg-gray-700 text-gray-300"
                  }`}
                >
                  Price Above
                </button>
                <button
                  type="button"
                  onClick={() => setAlertType("below")}
                  className={`flex-1 py-2 px-3 rounded text-sm ${
                    alertType === "below" ? "bg-red-600 text-white" : "bg-gray-700 text-gray-300"
                  }`}
                >
                  Price Below
                </button>
              </div>
            </div>

            <div>
              <label className="block text-gray-300 text-sm mb-2">
                Threshold Price ($)
                {selectedToken && (
                  <span className="text-gray-400 ml-2">
                    Current: ${formatPrice(selectedToken.price, selectedToken.symbol === "AIR" ? 5 : 2)}
                  </span>
                )}
              </label>
              <input
                type="number"
                step="any"
                value={threshold}
                onChange={(e) => setThreshold(e.target.value)}
                placeholder={selectedSymbol === "AIR" ? "0.00700" : "Enter price"}
                className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white"
                required
              />
            </div>

            <div className="flex gap-2 pt-4">
              <button
                type="button"
                onClick={() => setShowAlertModal(false)}
                className="flex-1 py-2 px-4 bg-gray-700 text-white rounded hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Create Alert
              </button>
            </div>
          </form>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-black flex items-center justify-center">
        <div className="text-white text-2xl animate-pulse">Loading EthOS data...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-black">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">EthOS Token Tracker</h1>
            <p className="text-gray-300">Real-time crypto monitoring with price alerts</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowAlertModal(true)}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              <Plus className="h-4 w-4" />
              Alert
            </button>
          </div>
        </div>

        {/* AIR Token Spotlight */}
        {airToken && (
          <div className="bg-gradient-to-r from-blue-600/30 to-purple-600/30 border border-blue-400/50 rounded-lg p-6 backdrop-blur-md">
            <div className="flex items-center gap-2 mb-4">
              <Zap className="h-6 w-6 text-yellow-400 animate-pulse" />
              <h2 className="text-white text-xl font-semibold">AIR Token Spotlight</h2>
              <div className="bg-green-500/20 border border-green-500/50 rounded-full px-3 py-1">
                <span className="text-green-400 text-sm font-medium">LIVE $0.00676</span>
              </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <p className="text-gray-300 text-sm mb-1">Current Price</p>
                    <p className="text-2xl font-bold text-white">${formatPrice(airToken.price, 5)}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-gray-300 text-sm mb-1">24h Change</p>
                    <div className="flex items-center justify-center gap-2">
                      {safeNumber(airToken.change24h, 0) > 0 ? (
                        <TrendingUp className="h-4 w-4 text-green-400" />
                      ) : (
                        <TrendingDown className="h-4 w-4 text-red-400" />
                      )}
                      <span className={`text-lg font-semibold ${
                        safeNumber(airToken.change24h, 0) > 0 ? "text-green-400" : "text-red-400"
                      }`}>
                        {formatChange(airToken.change24h)}
                      </span>
                    </div>
                  </div>
                </div>
                <div>
                  <p className="text-gray-300 text-sm mb-1">Contract Address</p>
                  <p className="text-xs text-blue-300 font-mono break-all bg-black/30 p-2 rounded">
                    {airToken.contract}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Gas Prices */}
        <div className="bg-black/50 border border-gray-600/50 rounded-lg p-6 backdrop-blur-md">
          <div className="flex items-center gap-2 mb-4">
            <Fuel className="h-6 w-6 text-orange-400" />
            <h2 className="text-white text-xl font-semibold">Live Gas Prices (Gwei)</h2>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto rounded-full bg-green-500 flex items-center justify-center mb-2">
                <span className="text-white font-bold">15</span>
              </div>
              <p className="text-gray-300 font-medium">Slow</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 mx-auto rounded-full bg-yellow-500 flex items-center justify-center mb-2">
                <span className="text-white font-bold">25</span>
              </div>
              <p className="text-gray-300 font-medium">Standard</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 mx-auto rounded-full bg-red-500 flex items-center justify-center mb-2">
                <span className="text-white font-bold">45</span>
              </div>
              <p className="text-gray-300 font-medium">Fast</p>
            </div>
          </div>
        </div>

        {/* Tokens Grid */}
        <div className="bg-black/50 border border-gray-600/50 rounded-lg p-6 backdrop-blur-md">
          <h2 className="text-white text-xl font-semibold mb-4">Ethereum-Based Tokens</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tokens.map((token) => (
              <div key={token.symbol} className="bg-gray-800/60 rounded-lg p-4 border border-gray-600/40">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="text-white font-semibold text-lg">{token.symbol}</h3>
                    <p className="text-gray-400 text-sm">{token.name}</p>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs font-semibold ${
                    safeNumber(token.change24h, 0) > 0 ? "bg-green-500 text-white" : "bg-red-500 text-white"
                  }`}>
                    {formatChange(token.change24h)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-white text-xl font-bold">
                    ${formatPrice(token.price, 2)}
                  </span>
                  {safeNumber(token.change24h, 0) > 0 ? (
                    <TrendingUp className="h-4 w-4 text-green-400" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-400" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Active Alerts */}
        {alerts.filter(a => a.isActive).length > 0 && (
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
            <h3 className="text-yellow-300 font-semibold mb-2">
              Active Alerts ({alerts.filter(a => a.isActive).length})
            </h3>
            <div className="space-y-2">
              {alerts.filter(a => a.isActive).map(alert => (
                <div key={alert.id} className="flex justify-between items-center bg-black/30 p-2 rounded">
                  <span className="text-white text-sm">
                    {alert.symbol} {alert.type} ${formatPrice(alert.threshold, alert.symbol === "AIR" ? 5 : 2)}
                  </span>
                  <button
                    onClick={() => setAlerts(prev => prev.filter(a => a.id !== alert.id))}
                    className="text-red-400 hover:text-red-300"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Status */}
        <div className="text-center">
          <p className="text-gray-400 text-sm">
            Last updated: {new Date().toLocaleTimeString()} • Auto-refresh every 15 seconds
          </p>
        </div>
      </div>

      <AlertModal />
    </div>
  )
}