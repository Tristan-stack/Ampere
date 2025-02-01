'use client'

import { useState, useRef, useEffect } from 'react'
import { Send } from 'lucide-react'
import { useData } from '@/app/(protected)/context/DataContext'
import { ScrollArea } from '@/components/ui/scroll-area'
import ShinyText from '@/components/shiny'
import { motion, AnimatePresence } from 'framer-motion'
import { TypewriterText } from '@/components/ui/typewriter-text'
import { SparklesCore } from '@/components/ui/sparkles'
import { useSidebar } from '@/components/ui/sidebar'

interface Message {
    role: 'user' | 'assistant'
    content: string
    timestamp: number
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

// Ajout des suggestions de questions
const SUGGESTED_QUESTIONS = [
    "Comment puis-je réduire ma consommation d'énergie ?",
    "Explique-moi comment fonctionne un panneau solaire",
    "Quels sont les appareils qui consomment le plus ?",
]

// Ajout d'un message d'erreur personnalisé pour le quota dépassé
const QUOTA_ERROR_MESSAGE = `Désolé, j'ai atteint ma limite de requêtes pour aujourd'hui 😅

Je ne peux plus accéder à mon cerveau pour le moment, mais je serai de retour demain avec de nouvelles réponses ! En attendant, vous pouvez :
- Consulter les données directement dans le tableau de bord
- Revenir me voir demain pour plus d'analyses
- Noter vos questions pour notre prochaine discussion

À très vite ! 🔌✨`

// Ajout du composant pour l'icône de chat
const ChatIcon = () => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        fill="currentColor"
        className="size-4 stroke-[2.25px]"
        viewBox="0 0 16 16"
    >
        <path d="M14 1a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H4.414A2 2 0 0 0 3 11.586l-2 2V2a1 1 0 0 1 1-1zM2 0a2 2 0 0 0-2 2v12.793a.5.5 0 0 0 .854.353l2.853-2.853A1 1 0 0 1 4.414 12H14a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2z" />
        <path d="M5 6a1 1 0 1 1-2 0 1 1 0 0 1 2 0m4 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0m4 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0" />
    </svg>
)

export function ChatInterface() {
    const [messages, setMessages] = useState<Message[]>([])
    const [input, setInput] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [currentLoadingMessage, setCurrentLoadingMessage] = useState(loadingMessages[0])
    const [lastLoadingMessage, setLastLoadingMessage] = useState(loadingMessages[0])
    const scrollRef = useRef<HTMLDivElement>(null)
    const { chartData, filteredData, aggregatedData, selectedBuildings } = useData()
    const [chatId, setChatId] = useState<string | null>(null)
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const scrollAreaRef = useRef<HTMLDivElement>(null)
    const [isTyping, setIsTyping] = useState(false)
    const { isCollapsed } = useSidebar()

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

    const handleTypingComplete = () => {
        console.log('Typing complete')
        setIsTyping(false)
        scrollToBottom()
    }

    const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && (isLoading || isTyping)) {
            e.preventDefault()
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!input.trim() || isLoading || isTyping) return

        const newMessage: Message = {
            role: 'user',
            content: input,
            timestamp: Date.now()
        }
        setMessages(prev => [...prev, newMessage])
        setInput('')
        setIsLoading(true)

        try {
            // Forcer la mise à jour des données pour chaque nouvelle question
            const buildingTotals = filteredData.reduce((acc, item) => {
                const building = item.building
                if (!acc[building]) {
                    acc[building] = {
                        building,
                        consumption: 0,
                        emissions: 0
                    }
                }
                acc[building].consumption += item.totalConsumption
                acc[building].emissions += item.emissions
                return acc
            }, {} as Record<string, any>)

            const contextData = {
                buildings: {
                    aggregatedData,
                    selectedBuildings,
                    currentConsumption: Object.values(buildingTotals),
                    floors: filteredData.reduce((acc, item) => {
                        const key = `${item.building}-${item.floor}`
                        acc[key] = {
                            building: item.building,
                            floor: item.floor,
                            consumption: item.totalConsumption,
                            emissions: item.emissions,
                            lastUpdate: item.date
                        }
                        return acc
                    }, {} as Record<string, any>)
                }
            }

            // Forcer un nouveau chat pour chaque question sur les bâtiments
            if (input.toLowerCase().includes('batiment') ||
                input.toLowerCase().includes('bâtiment') ||
                input.toLowerCase().includes('consommation')) {
                setChatId(null)
            }

            const response = await fetch('./api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: input,
                    context: contextData,
                    chatId
                })
            })

            const data = await response.json()
            console.log('📊 Réponse de l\'IA avec contexte:', {
                question: input,
                réponse: data.response,
                contextUtilisé: contextData.buildings.currentConsumption
            })

            if (!response.ok) {
                console.error('Erreur détaillée:', data)
                if (response.status === 429) {
                    setMessages(prev => [...prev, {
                        role: 'assistant',
                        content: QUOTA_ERROR_MESSAGE,
                        timestamp: Date.now()
                    }])
                    setIsLoading(false)
                    setIsTyping(true)
                    return
                }
                throw new Error(data.error || 'Une erreur est survenue')
            }

            if (!chatId) setChatId(data.chatId)

            setIsLoading(false)
            setTimeout(() => {
                setMessages(prev => [...prev, {
                    role: 'assistant',
                    content: data.response,
                    timestamp: Date.now()
                }])
                setIsTyping(true)
            }, 200)
        } catch (error: any) {
            console.error('Erreur lors de l\'envoi du message:', error)
            setIsLoading(false)
            setIsTyping(false)
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: error.message,
                timestamp: Date.now()
            }])
        }
    }

    // Fonction pour gérer le clic sur une suggestion
    const handleSuggestionClick = (question: string) => {
        if (isLoading || isTyping) return

        const newMessage: Message = {
            role: 'user',
            content: question,
            timestamp: Date.now()
        }
        setMessages(prev => [...prev, newMessage])
        setIsLoading(true)

        fetch('./api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message: question,
                context: {
                    filteredData,
                    aggregatedData
                },
                chatId
            })
        })
            .then(async response => {
                const data = await response.json()

                if (!response.ok) {
                    if (response.status === 429) {
                        setMessages(prev => [...prev, {
                            role: 'assistant',
                            content: QUOTA_ERROR_MESSAGE,
                            timestamp: Date.now()
                        }])
                        setIsLoading(false)
                        setIsTyping(true)
                        return
                    }
                    throw new Error(data.error || 'Une erreur est survenue')
                }

                if (!chatId) setChatId(data.chatId)
                setIsLoading(false)
                setTimeout(() => {
                    setMessages(prev => [...prev, {
                        role: 'assistant',
                        content: data.response,
                        timestamp: Date.now()
                    }])
                    setIsTyping(true)
                }, 200)
            })
            .catch(error => {
                console.error('Erreur lors de l\'envoi du message:', error)
                setIsLoading(false)
                setIsTyping(false)
                setMessages(prev => [...prev, {
                    role: 'assistant',
                    content: "Désolé, une erreur est survenue lors de l'envoi du message.",
                    timestamp: Date.now()
                }])
            })
    }

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight
        }
    }, [messages])

    const scrollToBottom = () => {
        if (scrollAreaRef.current) {
            const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]')
            if (scrollContainer) {
                scrollContainer.scrollTop = scrollContainer.scrollHeight
            }
        }
    }

    useEffect(() => {
        scrollToBottom()
    }, [messages, isLoading, isTyping])

    // Si la sidebar est repliée, afficher uniquement l'icône
    if (isCollapsed) {
        return (
            <button className="flex items-center justify-center w-full h-10 hover:bg-zinc-400/10 rounded-md text-zinc-200">
                <ChatIcon />
            </button>
        )
    }

    return (
        <div className="flex flex-col justify-around h-full bg-zinc-900 rounded-xl overflow-hidden shadow-xl">
            <div className="p-2 border-b border-zinc-800 relative">
                {/* Sparkles en dessous du titre et de la bordure */}
                <div className="absolute inset-0 w-full h-16">
                    <SparklesCore
                        background="transparent"
                        minSize={0.2}
                        maxSize={0.8}
                        particleDensity={600}
                        className="w-full h-full"
                        particleColor="#FFFFFF"
                    />

                    {/* Masque radial pour adoucir les bords */}
                    <div className="absolute inset-0 w-full h-full bg-zinc-900 [mask-image:radial-gradient(180px_100px_at_top,transparent_20%,white)]"></div>
                </div>

                <h2 className="text-lg font-semibold text-zinc-200 relative z-20">Ampy</h2>

                {/* Gradients pour la bordure lumineuse */}
                <div className="absolute inset-x-4 bottom-0 bg-gradient-to-r from-transparent via-blue-500 to-transparent h-[2px] w-[calc(100%-2rem)] blur-sm z-30" />
                <div className="absolute inset-x-4 bottom-0 bg-gradient-to-r from-transparent via-blue-500 to-transparent h-px w-[calc(100%-2rem)] z-30" />
                <div className="absolute inset-x-20 bottom-0 bg-gradient-to-r from-transparent via-indigo-500 to-transparent h-[5px] w-1/4 blur-sm z-30" />
                <div className="absolute inset-x-20 bottom-0 bg-gradient-to-r from-transparent via-indigo-500 to-transparent h-px w-1/4 z-30" />
            </div>

            <div className="flex-1 min-h-0">
                <ScrollArea ref={scrollAreaRef} className="h-full">
                    <div className="p-4 space-y-6">
                        <AnimatePresence mode="popLayout">
                            {messages.length === 0 && (
                                <motion.div
                                    key="suggestions"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                    className="space-y-4"
                                >
                                    <p className="text-zinc-400 text-sm text-center">
                                        Voici quelques suggestions pour commencer :
                                    </p>
                                    <div className="flex flex-col gap-2">
                                        {SUGGESTED_QUESTIONS.map((question, index) => (
                                            <motion.button
                                                key={`suggestion-${index}`}
                                                className="p-3 text-sm text-left text-zinc-200 bg-zinc-800/50 hover:bg-zinc-800 rounded-lg transition-colors"
                                                onClick={() => handleSuggestionClick(question)}
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{
                                                    opacity: 1,
                                                    x: 0,
                                                    transition: { delay: index * 0.1 }
                                                }}
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                                disabled={isLoading || isTyping}
                                            >
                                                {question}
                                            </motion.button>
                                        ))}
                                    </div>
                                </motion.div>
                            )}

                            {messages.map((message) => (
                                <motion.div
                                    key={`message-${message.timestamp}`}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                    transition={{ duration: 0.3 }}
                                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} px-4`}
                                >
                                    <div className={`max-w-[100%] rounded-2xl p-3 ${message.role === 'user' ? 'bg-zinc-800 text-zinc-200' : 'bg-transparent text-zinc-200'
                                        }`}>
                                        {message.role === 'assistant' ? (
                                            <TypewriterText
                                                text={message.content}
                                                onComplete={handleTypingComplete}
                                            />
                                        ) : (
                                            message.content
                                        )}
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
                                        <div className="max-w-[80%] rounded-2xl p-4 bg-transparent">
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

            <form onSubmit={handleSubmit} className="p-2 ">
                <div className="relative">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyPress}
                        placeholder="Discuter avec Ampy"
                        disabled={isLoading || isTyping}
                        className="w-full px-3 py-2.5 bg-zinc-800 text-zinc-200 placeholder-zinc-400 focus:outline-none text-sm rounded-xl pr-10 disabled:opacity-50"
                    />
                    <button
                        type="submit"
                        disabled={isLoading || isTyping}
                        className="absolute  right-2 top-1/2 -translate-y-1/2 p-1.5 text-black bg-white rounded-full transition-colors disabled:opacity-50"
                    >
                        <Send className="w-4 h-4 font-bold" />
                    </button>
                </div>
            </form>
        </div>
    )
} 