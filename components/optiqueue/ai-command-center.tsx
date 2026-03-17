"use client"

import { useRef, useState, useEffect, useMemo } from "react"
import { useChat } from "@ai-sdk/react"
import { DefaultChatTransport, type UIMessage, type DynamicToolUIPart, type TextUIPart } from "ai"
import { useSchedule, useWeeklySchedule, useSurgeries, setScheduleGlobal, setWeeklyScheduleGlobal } from "./store"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import {
  Bot,
  Mic,
  MicOff,
  Send,
  Loader2,
  Zap,
  AlertTriangle,
  Calendar,
  BarChart2,
  ChevronDown,
  ChevronUp,
} from "lucide-react"

type RecType = typeof window extends any ? any : never

const SUGGESTED_PROMPTS = [
  "What's the delay risk today?",
  "Analyze the current schedule",
  "Insert emergency CABG, Dr. Sunita Reddy, 180 min",
  "What if S-101 runs 40 minutes over?",
  "Reschedule S-105 to Tuesday",
]

function ToolCallBadge({ name, done }: { name: string; done: boolean }) {
  const labels: Record<string, string> = {
    analyzeSchedule: "Analyzing schedule",
    insertEmergencyCase: "Inserting emergency case",
    rescheduleCase: "Rescheduling case",
    simulateRippleEffect: "Simulating ripple effect",
    getDelayRiskReport: "Scoring delay risks",
  }
  const icons: Record<string, React.ReactNode> = {
    analyzeSchedule: <BarChart2 className="w-3 h-3" />,
    insertEmergencyCase: <AlertTriangle className="w-3 h-3" />,
    rescheduleCase: <Calendar className="w-3 h-3" />,
    simulateRippleEffect: <Zap className="w-3 h-3" />,
    getDelayRiskReport: <BarChart2 className="w-3 h-3" />,
  }
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border",
        done
          ? "bg-green-50 text-green-700 border-green-200"
          : "bg-amber-50 text-amber-700 border-amber-200 animate-pulse"
      )}
    >
      {icons[name] ?? <Zap className="w-3 h-3" />}
      {labels[name] ?? name}
      {done ? " ✓" : "…"}
    </span>
  )
}

/** Extract plain text content from UIMessage parts */
function getMessageText(msg: UIMessage): string {
  return msg.parts
    .filter((p): p is TextUIPart => p.type === "text")
    .map((p) => p.text)
    .join("")
}

/** Extract dynamic tool parts from UIMessage */
function getToolParts(msg: UIMessage): DynamicToolUIPart[] {
  return msg.parts.filter((p): p is DynamicToolUIPart => p.type === "dynamic-tool")
}

export function AICommandCenter() {
  const { schedule } = useSchedule()
  const { weeklySchedule } = useWeeklySchedule()
  const { surgeries } = useSurgeries()
  const [isOpen, setIsOpen] = useState(false)
  const [input, setInput] = useState("")
  const [listening, setListening] = useState(false)
  const [serviceStatus, setServiceStatus] = useState<"active" | "error">("active")
  const recRef = useRef<RecType | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Use refs so prepareSendMessagesRequest always gets current values
  const scheduleRef = useRef(schedule)
  scheduleRef.current = schedule
  const weeklyScheduleRef = useRef(weeklySchedule)
  weeklyScheduleRef.current = weeklySchedule
  const surgeriesRef = useRef(surgeries)
  surgeriesRef.current = surgeries

  // Stable transport — refs ensure current schedule is always sent
  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/assistant",
        prepareSendMessagesRequest: ({ messages }) => ({
          body: {
            messages,
            schedule: scheduleRef.current,
            weeklySchedule: weeklyScheduleRef.current,
            surgeries: surgeriesRef.current,
            nowMinute: minutesSince0700(),
          },
        }),
      }),
    [] // eslint-disable-line react-hooks/exhaustive-deps
  )

  const { messages, sendMessage, status, error } = useChat({
    transport,
    onFinish: ({ message }) => {
      // Apply any schedule mutations returned by tool calls
      for (const part of message.parts) {
        if (part.type === "dynamic-tool" && (part as DynamicToolUIPart).state === "output-available") {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const result = (part as any).output
          if (result?.updatedSchedule) {
            const updated = result.updatedSchedule
            if (updated.optimized) {
              setScheduleGlobal(updated)
            } else if (updated.cases) {
              setWeeklyScheduleGlobal(updated)
            }
          }
        }
      }
      // Text-to-speech for the response
      const text = getMessageText(message)
      if (text) speak(text)
    },
    onError: () => setServiceStatus("error"),
  })

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const isLoading = status === "streaming" || status === "submitted"

  const speak = (text: string) => {
    if (typeof window === "undefined" || !text) return
    const u = new SpeechSynthesisUtterance(text.slice(0, 300))
    u.rate = 1.1
    window.speechSynthesis.speak(u)
  }

  const startVoice = () => {
    if (typeof window === "undefined") return
    const SR: any = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition
    if (!SR) return
    const rec = new SR()
    rec.lang = "en-US"
    rec.interimResults = false
    rec.onresult = (e: any) => {
      const said = e.results[0][0].transcript
      setInput(said)
      setListening(false)
    }
    rec.onend = () => setListening(false)
    rec.onerror = () => setListening(false)
    recRef.current = rec
    setListening(true)
    rec.start()
  }

  const stopVoice = () => {
    recRef.current?.stop?.()
    setListening(false)
  }

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!input.trim() || isLoading) return
    sendMessage({ text: input })
    setInput("")
  }

  const sendSuggested = (prompt: string) => {
    sendMessage({ text: prompt })
  }

  return (
    <div className="flex flex-col items-end gap-2">
      {/* Expanded chat panel — shown above the trigger button */}
      {isOpen && (
        <div className="w-80 sm:w-96 rounded-xl border bg-card shadow-2xl overflow-hidden">
          {/* Panel header */}
          <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-primary/10 to-primary/5 border-b">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
                <Bot className="w-3.5 h-3.5 text-primary-foreground" />
              </div>
              <div>
                <span className="font-semibold text-sm">AI Command Center</span>
                <div className="flex items-center gap-1 mt-0.5">
                  <span className={cn("w-1.5 h-1.5 rounded-full", serviceStatus === "active" ? "bg-green-500" : "bg-red-500")} />
                  <span className="text-[10px] text-muted-foreground">
                    {serviceStatus === "active" ? "Groq · Llama 3.3 70B" : "Connection error"}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-[10px] py-0">
                {messages.filter((m) => m.role === "assistant").length} responses
              </Badge>
              <button onClick={() => setIsOpen(false)} className="text-muted-foreground hover:text-foreground transition-colors">
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="h-72 overflow-y-auto p-3 space-y-3 bg-background/50">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full gap-2 text-center">
                <Bot className="w-8 h-8 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">
                  Ask me anything about the schedule, or give me a command.
                </p>
                <div className="flex flex-wrap gap-1 justify-center mt-1">
                  {SUGGESTED_PROMPTS.slice(0, 3).map((p) => (
                    <button
                      key={p}
                      onClick={() => sendSuggested(p)}
                      className="text-[11px] px-2 py-1 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((m) => {
              const text = getMessageText(m)
              const toolParts = m.role === "assistant" ? getToolParts(m) : []
              return (
                <div key={m.id} className={cn("flex gap-2", m.role === "user" ? "justify-end" : "justify-start")}>
                  {m.role === "assistant" && (
                    <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center shrink-0 mt-0.5">
                      <Bot className="w-3 h-3 text-primary-foreground" />
                    </div>
                  )}
                  <div className="max-w-[85%] space-y-1">
                    {toolParts.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {toolParts.map((part, i) => (
                          <ToolCallBadge key={i} name={part.toolName} done={part.state === "output-available"} />
                        ))}
                      </div>
                    )}
                    {text && (
                      <div className={cn(
                        "px-3 py-2 rounded-xl text-sm leading-relaxed whitespace-pre-wrap",
                        m.role === "user"
                          ? "bg-primary text-primary-foreground rounded-tr-sm"
                          : "bg-muted text-foreground rounded-tl-sm"
                      )}>
                        {text}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}

            {isLoading && (
              <div className="flex gap-2 justify-start">
                <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center shrink-0">
                  <Bot className="w-3 h-3 text-primary-foreground" />
                </div>
                <div className="bg-muted px-3 py-2 rounded-xl rounded-tl-sm">
                  <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                </div>
              </div>
            )}

            {error && (
              <div className="text-xs text-destructive text-center">
                Connection error — check your GROQ_API_KEY in .env.local
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Suggested prompts */}
          {messages.length > 0 && (
            <div className="px-3 py-1.5 border-t flex gap-1 overflow-x-auto bg-muted/30">
              {SUGGESTED_PROMPTS.map((p) => (
                <button
                  key={p}
                  onClick={() => sendSuggested(p)}
                  className="text-[10px] px-2 py-0.5 rounded-full border bg-background whitespace-nowrap hover:bg-primary/10 transition-colors shrink-0"
                >
                  {p}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <form onSubmit={handleSubmit} className="flex items-center gap-2 p-3 border-t bg-background">
            <Button
              type="button"
              size="icon"
              variant={listening ? "destructive" : "outline"}
              className="shrink-0 h-8 w-8"
              onClick={listening ? stopVoice : startVoice}
              title={listening ? "Stop listening" : "Voice input"}
            >
              {listening ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
            </Button>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={listening ? "Listening…" : "Ask or command…"}
              className="flex-1 text-sm bg-muted/50 rounded-lg px-3 py-1.5 outline-none focus:ring-1 focus:ring-primary border border-transparent focus:border-primary/30"
              disabled={isLoading}
            />
            <Button type="submit" size="icon" className="shrink-0 h-8 w-8" disabled={isLoading || !input.trim()}>
              {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
            </Button>
          </form>
        </div>
      )}

      {/* Floating trigger button */}
      <button
        onClick={() => setIsOpen((o) => !o)}
        className={cn(
          "relative w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95",
          "bg-primary text-primary-foreground",
          isOpen && "ring-4 ring-primary/30"
        )}
        title="AI Command Center"
      >
        {isLoading ? (
          <Loader2 className="w-6 h-6 animate-spin" />
        ) : (
          <Bot className="w-6 h-6" />
        )}
        {/* Unread dot */}
        {!isOpen && messages.filter((m) => m.role === "assistant").length > 0 && (
          <span className="absolute top-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
        )}
      </button>
    </div>
  )
}

function minutesSince0700() {
  const now = new Date()
  return Math.max(0, now.getHours() * 60 + now.getMinutes() - 420)
}
