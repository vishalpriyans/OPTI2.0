"use client"

import { useEffect, useRef, useState } from "react"
import { cn } from "@/lib/utils"

interface LoginVideoLoaderProps {
  className?: string
  message?: string
  videoSrc?: string
  onVideoEnd?: () => void
  autoPlay?: boolean
  muted?: boolean
  showProgress?: boolean
}

export function LoginVideoLoader({
  className,
  message = "Logging you in...",
  videoSrc = "/OptiQueque_Logo_Animation_Creation.mp4", // OptiQueue logo animation
  onVideoEnd,
  autoPlay = true,
  muted = true,
  showProgress = true,
}: LoginVideoLoaderProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [progress, setProgress] = useState(0)
  const [isVideoLoaded, setIsVideoLoaded] = useState(false)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const handleLoadedData = () => {
      setIsVideoLoaded(true)
      if (autoPlay) {
        const playPromise = video.play()
        if (playPromise !== undefined) {
          playPromise.catch(() => {
            console.log("Video autoplay was prevented")
          })
        }
      }
    }

    const handleTimeUpdate = () => {
      if (video.duration) {
        const progressPercent = (video.currentTime / video.duration) * 100
        setProgress(progressPercent)
      }
    }

    const handleEnded = () => {
      setProgress(100)
      if (onVideoEnd) {
        // Small delay before calling onVideoEnd to ensure smooth transition
        setTimeout(onVideoEnd, 300)
      }
    }

    const handleError = () => {
      console.error("Video failed to load")
      // If video fails, proceed after a short delay
      setTimeout(() => {
        if (onVideoEnd) onVideoEnd()
      }, 2000)
    }

    video.addEventListener('loadeddata', handleLoadedData)
    video.addEventListener('timeupdate', handleTimeUpdate)
    video.addEventListener('ended', handleEnded)
    video.addEventListener('error', handleError)

    return () => {
      video.removeEventListener('loadeddata', handleLoadedData)
      video.removeEventListener('timeupdate', handleTimeUpdate)
      video.removeEventListener('ended', handleEnded)
      video.removeEventListener('error', handleError)
    }
  }, [autoPlay, onVideoEnd])

  return (
    <div className={cn(
      "fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-br from-background via-background to-muted/30",
      className
    )}>
      {/* Background overlay */}
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" />
      
      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center space-y-8">
        {/* Video Container */}
        <div className="relative">
          {/* Video element */}
          <div className="relative w-80 h-80 rounded-3xl overflow-hidden shadow-2xl border-4 border-primary/30 bg-gradient-to-br from-primary/10 to-primary/20">
            <video
              ref={videoRef}
              className={cn(
                "w-full h-full object-cover transition-opacity duration-500",
                isVideoLoaded ? "opacity-100" : "opacity-0"
              )}
              autoPlay={autoPlay}
              muted={muted}
              playsInline
              preload="auto"
            >
              <source src={videoSrc} type="video/mp4" />
              {/* Fallback for unsupported video */}
            </video>
            
            {/* Fallback animation when video is loading or fails */}
            {!isVideoLoaded && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative">
                  {/* Animated rings */}
                  <div className="w-32 h-32 border-4 border-primary/30 rounded-full animate-spin border-t-primary"></div>
                  <div className="absolute inset-4 w-24 h-24 border-4 border-primary/20 rounded-full animate-spin animate-reverse border-t-primary/60"></div>
                  <div className="absolute inset-8 w-16 h-16 border-4 border-primary/10 rounded-full animate-spin border-t-primary/40"></div>
                  
                  {/* Center icon */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-8 h-8 bg-primary rounded-full animate-pulse"></div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Decorative elements around video */}
          <div className="absolute -top-4 -left-4 w-8 h-8 bg-primary/20 rounded-full animate-bounce" style={{ animationDelay: "0s" }}></div>
          <div className="absolute -top-2 -right-6 w-6 h-6 bg-primary/30 rounded-full animate-bounce" style={{ animationDelay: "0.5s" }}></div>
          <div className="absolute -bottom-4 -right-4 w-10 h-10 bg-primary/15 rounded-full animate-bounce" style={{ animationDelay: "1s" }}></div>
          <div className="absolute -bottom-2 -left-6 w-4 h-4 bg-primary/25 rounded-full animate-bounce" style={{ animationDelay: "1.5s" }}></div>
        </div>

        {/* Loading Message */}
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold text-foreground animate-pulse">
            {message}
          </h2>
          
          {/* Animated dots */}
          <div className="flex items-center justify-center space-x-2">
            <div className="w-3 h-3 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></div>
            <div className="w-3 h-3 bg-primary rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></div>
            <div className="w-3 h-3 bg-primary rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></div>
          </div>
        </div>

        {/* Progress Bar */}
        {showProgress && (
          <div className="w-80 space-y-2">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Loading...</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-primary to-primary/80 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Additional background effects */}
      <div className="absolute top-10 left-10 w-20 h-20 bg-primary/5 rounded-full animate-pulse"></div>
      <div className="absolute bottom-20 right-20 w-16 h-16 bg-primary/10 rounded-full animate-pulse" style={{ animationDelay: "1s" }}></div>
      <div className="absolute top-1/3 right-10 w-12 h-12 bg-primary/8 rounded-full animate-pulse" style={{ animationDelay: "2s" }}></div>
    </div>
  )
}

// Compact version for smaller screens or different use cases
export function CompactLoginVideoLoader({
  className,
  message = "Logging in...",
  videoSrc = "/login-animation.mp4",
  onVideoEnd,
}: Omit<LoginVideoLoaderProps, 'autoPlay' | 'muted' | 'showProgress'>) {
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const handleEnded = () => {
      if (onVideoEnd) {
        setTimeout(onVideoEnd, 200)
      }
    }

    const handleError = () => {
      setTimeout(() => {
        if (onVideoEnd) onVideoEnd()
      }, 1500)
    }

    video.addEventListener('ended', handleEnded)
    video.addEventListener('error', handleError)

    // Auto play
    const playPromise = video.play()
    if (playPromise !== undefined) {
      playPromise.catch(() => {
        console.log("Video autoplay was prevented")
      })
    }

    return () => {
      video.removeEventListener('ended', handleEnded)
      video.removeEventListener('error', handleError)
    }
  }, [onVideoEnd])

  return (
    <div className={cn("flex items-center justify-center p-8 bg-background/95", className)}>
      <div className="flex flex-col items-center space-y-4">
        <div className="relative w-24 h-24 rounded-xl overflow-hidden shadow-lg border-2 border-primary/20">
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            autoPlay
            muted
            playsInline
          >
            <source src={videoSrc} type="video/mp4" />
            <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/30 animate-spin" />
          </video>
        </div>
        <div className="text-center">
          <p className="text-sm font-medium text-muted-foreground animate-pulse">{message}</p>
        </div>
      </div>
    </div>
  )
}
