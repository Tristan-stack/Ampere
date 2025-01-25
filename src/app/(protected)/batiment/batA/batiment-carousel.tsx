"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"

interface CarouselProps {
  autoScrollInterval?: number
}

function BuildingCarousel({ 
  autoScrollInterval = 3000 
}: CarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const items = [
    <div className="w-full h-full bg-background rounded-lg">A</div>,
    <div className="w-full h-full bg-background rounded-lg">B</div>,
    <div className="w-full h-full bg-background rounded-lg">C</div>,
  ]

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => 
        prevIndex === items.length - 1 ? 0 : prevIndex + 1
      )
    }, autoScrollInterval)

    return () => clearInterval(interval)
  }, [items.length, autoScrollInterval])

  return (
    <div className="relative w-full h-full overflow-hidden z-10 pointer-events-none">
      <div className="absolute inset-0 z-20 pointer-events-none rounded-md" style={{
        background: 'radial-gradient(circle at center, transparent 80%, rgba(0,0,0,0.8) 100%)'
      }} />
      {/* <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, x: 300 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -300 }}
          transition={{ 
            type: "tween",
            duration: 0.5
          }}
          className="absolute w-full h-full p-16 flex items-center justify-center z-30"
        >
          {items[currentIndex]}
        </motion.div>
      </AnimatePresence> */}
    </div>
  )
}

export default BuildingCarousel