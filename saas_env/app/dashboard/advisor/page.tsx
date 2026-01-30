"use client";

import { useState, useRef, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Bot, User, Loader2, Send, Sparkles, Car, Gauge, Wrench } from "lucide-react";
import ReactMarkdown from 'react-markdown';
import { motion, AnimatePresence } from "framer-motion";

interface Message {
    role: "user" | "bot";
    content: string;
    suggestions?: string[];
    video_link?: string;
    video_label?: string;
}

const messageVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.95 },
    visible: {
        opacity: 1,
        y: 0,
        scale: 1,
        transition: { type: "spring", stiffness: 200, damping: 20 }
    },
    exit: { opacity: 0, scale: 0.95, transition: { duration: 0.2 } }
};

const suggestionVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: (i: number) => ({
        opacity: 1,
        y: 0,
        transition: { delay: i * 0.1, type: "spring", stiffness: 200 }
    })
};

export default function AdvisorPage() {
    // Vehicle State
    const [make, setMake] = useState("");
    const [model, setModel] = useState("");
    const [year, setYear] = useState("");
    const [mileage, setMileage] = useState("");

    // Chat State
    const [query, setQuery] = useState("");
    const [messages, setMessages] = useState<Message[]>([
        { role: "bot", content: "👋 Hey there! I'm **Sparky**, your AI Maintenance Advisor.\n\nEnter your vehicle details on the left, then describe any issues you're experiencing. I can help you:\n\n- 🔧 Diagnose strange sounds and symptoms\n- 💰 Estimate repair costs\n- 📹 Find DIY repair videos\n- 🛠️ Get maintenance recommendations" }
    ]);
    const [isLoading, setIsLoading] = useState(false);

    // Auto-scroll
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };
    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSubmit = async (e: React.FormEvent, overrideQuery?: string) => {
        e.preventDefault();
        const userMsg = overrideQuery || query;
        if (!userMsg.trim() || !make || !model) return;

        setMessages(prev => [...prev, { role: "user", content: userMsg }]);
        setQuery("");
        setIsLoading(true);

        // Prepare history for backend
        const history = messages.slice(-50).map(m => ({
            role: m.role,
            content: m.content
        }));

        try {
            const res = await fetch("/api/advisor", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    query: userMsg,
                    make,
                    model,
                    year: parseInt(year) || 2020,
                    mileage: parseInt(mileage) || 50000,
                    history: history
                })
            });

            if (!res.ok) throw new Error("Failed to get response");

            const data = await res.json();
            setMessages(prev => [...prev, {
                role: "bot",
                content: data.response,
                suggestions: data.suggestions,
                video_link: data.video_link,
                video_label: data.video_label
            }]);
        } catch {
            setMessages(prev => [...prev, { role: "bot", content: "⚠️ Sorry, I couldn't connect to the AI brain. Please make sure the backend is running." }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <motion.div
            className="space-y-6 h-[calc(100vh-120px)] flex flex-col"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
        >
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
            >
                <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">
                    <span className="gradient-text-animated">Sparky</span>
                    <motion.span
                        className="inline-block ml-2"
                        animate={{
                            rotate: [0, 10, -10, 0],
                            scale: [1, 1.2, 1]
                        }}
                        transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 3 }}
                    >
                        ⚡
                    </motion.span>
                </h1>
                <p className="text-xl text-muted-foreground mt-2">Your AI Mechanic Buddy. Powered by RAG.</p>
            </motion.div>

            <div className="grid gap-6 md:grid-cols-[380px_1fr] flex-1 min-h-0">
                {/* Vehicle Details Panel */}
                <motion.div
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3, type: "spring", stiffness: 100 }}
                >
                    <Card className="border-2 border-primary/30 bg-card h-fit sticky top-24 shadow-xl shadow-black/30">
                        {/* Top accent line */}
                        <div className="absolute top-0 left-4 right-4 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent" />

                        <CardHeader className="pb-4">
                            <div className="flex items-center gap-3">
                                <motion.div
                                    className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/30"
                                    whileHover={{ rotate: 10, scale: 1.1 }}
                                >
                                    <Car className="h-6 w-6 text-white" />
                                </motion.div>
                                <div>
                                    <CardTitle className="text-2xl font-bold text-foreground">Vehicle Specs</CardTitle>
                                    <CardDescription className="text-sm">Target Vehicle for Diagnosis</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-5">
                            <motion.div
                                className="space-y-2"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.4 }}
                            >
                                <Label className="text-sm font-medium flex items-center gap-2 text-foreground">
                                    <Wrench className="h-4 w-4 text-primary" />
                                    Make
                                </Label>
                                <Input
                                    className="h-12 bg-muted/50 border-border/50 focus:border-primary"
                                    placeholder="e.g. Ford"
                                    value={make}
                                    onChange={e => setMake(e.target.value)}
                                />
                            </motion.div>
                            <motion.div
                                className="space-y-2"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.5 }}
                            >
                                <Label className="text-sm font-medium flex items-center gap-2 text-foreground">
                                    <Car className="h-4 w-4 text-primary" />
                                    Model
                                </Label>
                                <Input
                                    className="h-12 bg-muted/50 border-border/50 focus:border-primary"
                                    placeholder="e.g. Fiesta"
                                    value={model}
                                    onChange={e => setModel(e.target.value)}
                                />
                            </motion.div>
                            <div className="grid grid-cols-2 gap-4">
                                <motion.div
                                    className="space-y-2"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.6 }}
                                >
                                    <Label className="text-sm font-medium text-foreground">Year</Label>
                                    <Input
                                        className="h-12 bg-muted/50 border-border/50 focus:border-primary"
                                        type="number"
                                        placeholder="2018"
                                        value={year}
                                        onChange={e => setYear(e.target.value)}
                                    />
                                </motion.div>
                                <motion.div
                                    className="space-y-2"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.7 }}
                                >
                                    <Label className="text-sm font-medium flex items-center gap-1 text-foreground">
                                        <Gauge className="h-4 w-4 text-primary" />
                                        Miles
                                    </Label>
                                    <Input
                                        className="h-12 bg-muted/50 border-border/50 focus:border-primary"
                                        type="number"
                                        placeholder="45000"
                                        value={mileage}
                                        onChange={e => setMileage(e.target.value)}
                                    />
                                </motion.div>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Chat Interface */}
                <motion.div
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4, type: "spring", stiffness: 100 }}
                    className="flex flex-col min-h-0"
                >
                    <Card className="flex flex-col flex-1 min-h-0 border-2 border-primary/30 overflow-hidden bg-card shadow-xl shadow-black/30">
                        {/* Top accent line */}
                        <div className="absolute top-0 left-4 right-4 h-0.5 bg-gradient-to-r from-transparent via-accent to-transparent" />

                        <CardHeader className="py-4 border-b border-border/50 bg-muted/30">
                            <CardTitle className="text-lg font-medium flex items-center gap-3">
                                <motion.div
                                    className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/40"
                                    animate={{
                                        scale: [1, 1.05, 1],
                                        boxShadow: [
                                            "0 10px 20px rgba(59, 130, 246, 0.4)",
                                            "0 10px 30px rgba(59, 130, 246, 0.6)",
                                            "0 10px 20px rgba(59, 130, 246, 0.4)"
                                        ]
                                    }}
                                    transition={{ duration: 2, repeat: Infinity }}
                                >
                                    <Bot className="h-5 w-5 text-white" />
                                </motion.div>
                                <div>
                                    <span className="font-bold text-foreground">Live Diagnostics</span>
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                        <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse shadow-lg shadow-green-500/50" />
                                        AI Online
                                    </div>
                                </div>
                            </CardTitle>
                        </CardHeader>

                        <CardContent className="flex-1 overflow-y-auto p-6 space-y-4 bg-muted/10">
                            <AnimatePresence mode="popLayout">
                                {messages.map((msg, i) => (
                                    <motion.div
                                        key={i}
                                        variants={messageVariants}
                                        initial="hidden"
                                        animate="visible"
                                        exit="exit"
                                        layout
                                        className={`flex flex-col gap-2 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
                                    >
                                        <div className={`flex gap-3 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                                            <motion.div
                                                className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 shadow-lg ${msg.role === 'bot'
                                                        ? 'bg-gradient-to-br from-primary to-accent text-white shadow-primary/30'
                                                        : 'bg-secondary text-secondary-foreground border border-border'
                                                    }`}
                                                whileHover={{ scale: 1.1 }}
                                            >
                                                {msg.role === 'bot' ? <Bot className="h-5 w-5" /> : <User className="h-5 w-5" />}
                                            </motion.div>

                                            <motion.div
                                                className={`rounded-2xl p-4 text-sm shadow-lg ${msg.role === 'user'
                                                        ? 'bg-gradient-to-r from-primary to-primary/80 text-primary-foreground rounded-tr-sm shadow-primary/30'
                                                        : 'bg-card border border-primary/20 rounded-tl-sm prose prose-sm dark:prose-invert max-w-none shadow-black/20'
                                                    }`}
                                                whileHover={{ scale: 1.01 }}
                                            >
                                                {msg.role === 'bot' ? (
                                                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                                                ) : (
                                                    msg.content
                                                )}
                                            </motion.div>
                                        </div>

                                        {/* Video Link Button */}
                                        {msg.video_link && (
                                            <motion.div
                                                className="ml-14"
                                                initial={{ opacity: 0, scale: 0.8 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                transition={{ delay: 0.3 }}
                                            >
                                                <a
                                                    href={msg.video_link}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-red-600 to-red-500 text-white rounded-full hover:from-red-700 hover:to-red-600 transition-all hover:scale-105 shadow-lg shadow-red-500/40 text-sm font-semibold"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="23 7 16 12 23 17 23 7" /><rect x="1" y="5" width="15" height="14" rx="2" ry="2" /></svg>
                                                    {msg.video_label || "Watch Repair Video"}
                                                </a>
                                            </motion.div>
                                        )}

                                        {/* Suggestions Chips */}
                                        {msg.suggestions && msg.suggestions.length > 0 && (
                                            <div className="flex flex-wrap gap-2 ml-14 mt-1">
                                                {msg.suggestions.map((suggestion, idx) => (
                                                    <motion.button
                                                        key={idx}
                                                        custom={idx}
                                                        variants={suggestionVariants}
                                                        initial="hidden"
                                                        animate="visible"
                                                        onClick={(e) => handleSubmit(e, suggestion)}
                                                        className="flex items-center gap-2 text-xs bg-card border border-primary/30 hover:border-primary hover:bg-primary/10 hover:text-primary px-4 py-2 rounded-full transition-all hover:-translate-y-0.5 shadow-md"
                                                        whileHover={{ scale: 1.05 }}
                                                        whileTap={{ scale: 0.95 }}
                                                    >
                                                        <Sparkles className="h-3 w-3" />
                                                        {suggestion}
                                                    </motion.button>
                                                ))}
                                            </div>
                                        )}
                                    </motion.div>
                                ))}
                            </AnimatePresence>

                            {isLoading && (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="flex gap-3"
                                >
                                    <motion.div
                                        className="h-10 w-10 rounded-full bg-gradient-to-br from-primary/40 to-accent/40 flex items-center justify-center shrink-0 border border-primary/30"
                                        animate={{ scale: [1, 1.1, 1] }}
                                        transition={{ duration: 1, repeat: Infinity }}
                                    >
                                        <Bot className="h-5 w-5 text-primary" />
                                    </motion.div>
                                    <div className="bg-card border border-primary/20 rounded-2xl p-4 rounded-tl-sm shadow-lg">
                                        <div className="flex items-center gap-3">
                                            <motion.div
                                                animate={{ rotate: 360 }}
                                                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                            >
                                                <Loader2 className="h-4 w-4 text-primary" />
                                            </motion.div>
                                            <span className="text-sm text-muted-foreground">Analyzing diagnostics...</span>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                            <div ref={messagesEndRef} />
                        </CardContent>

                        <CardFooter className="p-4 border-t border-border/50 bg-muted/20">
                            <form onSubmit={(e) => handleSubmit(e)} className="flex w-full gap-3 relative">
                                <Textarea
                                    placeholder="Describe the issue (e.g., 'Clunking noise from rear wheel')..."
                                    value={query}
                                    onChange={e => setQuery(e.target.value)}
                                    className="min-h-[56px] max-h-[120px] resize-none text-sm pr-16 bg-muted/50 border-border/50 focus:border-primary"
                                    onKeyDown={e => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault();
                                            handleSubmit(e);
                                        }
                                    }}
                                />
                                <motion.div
                                    className="absolute right-2 top-1/2 -translate-y-1/2"
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    <Button
                                        type="submit"
                                        size="icon"
                                        className="h-12 w-12 rounded-xl shadow-lg shadow-primary/40 bg-gradient-to-br from-primary to-accent hover:from-primary/90 hover:to-accent/90"
                                        disabled={isLoading || !query.trim()}
                                    >
                                        <Send className="h-5 w-5" />
                                    </Button>
                                </motion.div>
                            </form>
                        </CardFooter>
                    </Card>
                </motion.div>
            </div>
        </motion.div>
    );
}
