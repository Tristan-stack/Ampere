'use client'

import { useState, useRef, useEffect } from 'react'
import { Send } from 'lucide-react'
import { useData } from '@/app/(protected)/context/DataContext'
import { ScrollArea } from '@/components/ui/scroll-area'
import ShinyText from '@/components/shiny'
import { motion, AnimatePresence } from 'framer-motion'

interface Message {
    role: 'user' | 'assistant'
    content: string
}

const loadingMessages = [
    "Ampy fait circuler les watts ⚡",
    "Ça s'éclaircit... 💡",
    "Ne quitte pas le circuit ! 🔌",
    "Chargement des neurones... 🤖",
    "Les électrons s'alignent ⚙️",
    "Patience, ça va briller ! 🌟",
    "Ampy est sous tension... ⚡",
    "Branchement en cours... 🔋",
    "Bientôt sous haute tension ! 🔥",
    "Ampy turbine à fond 🌪️"
]

export function ChatInterface() {
    const [messages, setMessages] = useState<Message[]>([])
    const [input, setInput] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [currentLoadingMessage, setCurrentLoadingMessage] = useState(loadingMessages[0])
    const [lastLoadingMessage, setLastLoadingMessage] = useState(loadingMessages[0])
    const scrollRef = useRef<HTMLDivElement>(null)
    const { filteredData, aggregatedData } = useData()
    const [chatId, setChatId] = useState<string | null>(null)
    const messagesEndRef = useRef<HTMLDivElement>(null)

    const getRandomLoadingMessage = (): string => {
        const availableMessages = loadingMessages.filter(msg => msg !== lastLoadingMessage)
        if (availableMessages.length === 0) return loadingMessages[0]
        const randomIndex = Math.floor(Math.random() * availableMessages.length)
        const message = availableMessages[randomIndex] ?? loadingMessages[0]
        setLastLoadingMessage(message)
        return message
    }

    useEffect(() => {
        if (isLoading) {
            setCurrentLoadingMessage(getRandomLoadingMessage())
        }
    }, [isLoading])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!input.trim()) return

        const newMessage: Message = { role: 'user', content: input }
        setMessages(prev => [...prev, newMessage])
        setInput('')
        setIsLoading(true)

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: input,
                    context: {
                        filteredData,
                        aggregatedData
                    },
                    chatId
                })
            })

            const data = await response.json()
            if (!chatId) setChatId(data.chatId)

            // Attendre que l'animation de loading soit terminée
            setIsLoading(false)
            // Petit délai avant d'ajouter la réponse
            setTimeout(() => {
                setMessages(prev => [...prev, { role: 'assistant', content: data.response }])
            }, 200)
        } catch (error) {
            console.error('Erreur lors de l\'envoi du message:', error)
            setIsLoading(false)
        }
    }

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight
        }
    }, [messages])

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }

    useEffect(() => {
        scrollToBottom()
    }, [messages, isLoading])

    return (
        <div className="flex flex-col h-full bg-zinc-900 rounded-xl shadow-xl">
            <div className="p-4 border-b border-zinc-800">
                <h2 className="text-lg font-semibold text-zinc-200">Ampy</h2>
            </div>

            <div className="flex-1 min-h-0">
                <ScrollArea className="h-full">
                    <div className="p-4 space-y-6">
                        <AnimatePresence mode="popLayout">
                            {messages.map((message, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                    transition={{ duration: 0.3 }}
                                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} px-4`}
                                >
                                    <div className={`max-w-[80%] rounded-2xl p-4 ${message.role === 'user' ? 'bg-blue-600 text-white' : 'bg-zinc-800 text-zinc-200'
                                        }`}>
                                        {message.content}
                                    </div>
                                </motion.div>
                            ))}

                            <AnimatePresence>
                                {isLoading && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0 }}
                                        transition={{ duration: 0.2 }}
                                        className="flex justify-start px-4"
                                    >
                                        <div className="max-w-[80%] rounded-2xl p-4 bg-zinc-800">
                                            <ShinyText
                                                text={currentLoadingMessage}
                                                disabled={false}
                                                speed={1}
                                            />
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </AnimatePresence>
                        <div ref={messagesEndRef} />
                    </div>
                </ScrollArea>
            </div>

            <form onSubmit={handleSubmit} className="p-4 border-t border-zinc-800">
                <div className="relative">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Discuter avec Ampy"
                        className="w-full px-3 py-2.5 bg-zinc-800 text-zinc-200 placeholder-zinc-400 focus:outline-none text-sm rounded-xl pr-10"
                    />
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-zinc-400 hover:text-zinc-200 rounded-lg transition-colors disabled:opacity-50"
                    >
                        <Send className="w-4 h-4" />
                    </button>
                </div>
            </form>
        </div>
    )
} 