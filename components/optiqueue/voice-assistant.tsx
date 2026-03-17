"use client"

import { useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { useSchedule, useSurgeries } from "./store"

type RecType = typeof window extends any ? any : never

export function VoiceAssistant() {
  const { schedule } = useSchedule()
  const { surgeries } = useSurgeries()
  const [listening, setListening] = useState(false)
  const [transcript, setTranscript] = useState("")
  const [response, setResponse] = useState("")
  const recRef = useRef<RecType | null>(null)

  const start = async () => {
    if (typeof window === "undefined") return
    const SR: any = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition
    if (!SR) {
      setResponse("Speech recognition not supported in this browser.")
      return
    }
    const rec = new SR()
    rec.lang = "en-US"
    rec.interimResults = false
    rec.maxAlternatives = 1
    rec.onresult = (e: any) => {
      const said = e.results[0][0].transcript
      setTranscript(said)
      askAssistant(said)
    }
    rec.onend = () => setListening(false)
    rec.onerror = () => setListening(false)
    recRef.current = rec
    setListening(true)
    rec.start()
  }

  const stop = () => {
    recRef.current?.stop?.()
    setListening(false)
  }

  const speak = (text: string) => {
    if (typeof window === "undefined") return
    const u = new SpeechSynthesisUtterance(text)
    window.speechSynthesis.speak(u)
  }

  const askAssistant = async (question: string) => {
    setResponse("Thinking...")
    try {
      const res = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question,
          schedule,
          surgeries,
          nowMinute: minutesSince0700(),
        }),
      })
      const data = await res.json()
      setResponse(data.text || "No answer.")
      speak(data.text || "No answer.")
    } catch (e) {
      setResponse("Error contacting assistant.")
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Button onClick={listening ? stop : start} variant={listening ? "destructive" : "default"}>
        {listening ? "Stop Voice" : "Voice Assistant"}
      </Button>
      {transcript && <span className="text-xs text-muted-foreground">Heard: "{transcript}"</span>}
      {response && <span className="text-xs">{response}</span>}
    </div>
  )
}

function minutesSince0700() {
  const now = new Date()
  const minutes = now.getHours() * 60 + now.getMinutes()
  const since = minutes - 7 * 60
  return Math.max(0, since)
}
