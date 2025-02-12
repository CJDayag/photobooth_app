"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Slider } from "@/components/ui/slider"
import { Toast } from "@/components/ui/toast"
import { CameraIcon, FlipHorizontalIcon, DownloadIcon, GridIcon, TrashIcon } from "lucide-react"

const filters = [
  { name: "Normal", class: "" },
  { name: "Grayscale", class: "grayscale(100%)" },
  { name: "Sepia", class: "sepia(100%)" },
  { name: "Invert", class: "invert(100%)" },
  { name: "Blur", class: "blur(4px)" },
  { name: "Saturate", class: "saturate(200%)" },
  { name: "Hue Rotate", class: "hue-rotate(90deg)" },
  { name: "Vintage", class: "sepia(50%) contrast(150%)" },
]

export default function Camera() {
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [capturedImages, setCapturedImages] = useState<string[]>([])
  const [isCountingDown, setIsCountingDown] = useState(false)
  const [countdown, setCountdown] = useState(3)
  const [selectedFilter, setSelectedFilter] = useState(filters[0])
  const [contrastValue, setContrastValue] = useState(100)
  const [brightnessValue, setBrightnessValue] = useState(100)
  const [isFrontCamera, setIsFrontCamera] = useState(true)
  const [showToast, setShowToast] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isCollageMode, setIsCollageMode] = useState(false)
  const [selectedGalleryImage, setSelectedGalleryImage] = useState<string | null>(null)
  const [isMirrored, setIsMirrored] = useState(false)
  const [selectedCollageImages, setSelectedCollageImages] = useState<string[]>([])

  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    startCamera()
    return () => {
      stopCamera()
    }
  }, [])

  const startCamera = async () => {
    try {
      const constraints = {
        video: { facingMode: isFrontCamera ? "user" : "environment" },
      }
      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints)
      setStream(mediaStream)
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
      }
      setErrorMessage(null)
    } catch (error) {
      console.error("Error accessing the camera:", error)
      setErrorMessage("Error accessing the camera. Please check your permissions.")
    }
  }

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop())
      setStream(null)
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
  }

  const capturePhoto = () => {
    setIsCountingDown(true)
    setCountdown(3)
    const countdownInterval = setInterval(() => {
      setCountdown((prevCount) => {
        if (prevCount === 1) {
          clearInterval(countdownInterval)
          setIsCountingDown(false)
          takePhoto()
        }
        return prevCount - 1
      })
    }, 1000)
  }

  const takePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext("2d")
      if (context) {
        canvasRef.current.width = videoRef.current.videoWidth
        canvasRef.current.height = videoRef.current.videoHeight
        context.filter = `contrast(${contrastValue}%) brightness(${brightnessValue}%) ${selectedFilter.class}`
        if (isMirrored) {
          context.translate(canvasRef.current.width, 0)
          context.scale(-1, 1)
        }
        context.drawImage(videoRef.current, 0, 0)
        const imageDataUrl = canvasRef.current.toDataURL("image/png")
        setCapturedImages((prev) => [...prev, imageDataUrl])
      }
    }
  }

  const toggleMirrorCamera = () => {
    setIsMirrored(!isMirrored)
  }

  const downloadImage = (imageUrl: string) => {
    const link = document.createElement("a")
    link.href = imageUrl
    link.download = "photobooth_image.png"
    link.click()
  }

  const deleteImage = (imageToDelete: string) => {
    setCapturedImages(capturedImages.filter((img) => img !== imageToDelete))
    setSelectedGalleryImage(null)
  }

  const toggleCollageImageSelection = (imageUrl: string) => {
    setSelectedCollageImages((prev) =>
      prev.includes(imageUrl) ? prev.filter((img) => img !== imageUrl) : [...prev, imageUrl],
    )
  }

  const createCollage = () => {
    if (selectedCollageImages.length < 2) {
      setErrorMessage("You need to select at least 2 images to create a collage.")
      return
    }

    const canvas = document.createElement("canvas")
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const aspectRatio = 16 / 9
    const padding = 10
    const cols = Math.ceil(Math.sqrt(selectedCollageImages.length))
    const rows = Math.ceil(selectedCollageImages.length / cols)

    const totalWidth = 1280 // Fixed width
    const totalHeight = totalWidth / aspectRatio

    const imgWidth = (totalWidth - (cols + 1) * padding) / cols
    const imgHeight = (totalHeight - (rows + 1) * padding) / rows

    canvas.width = totalWidth
    canvas.height = totalHeight

    // Fill the background
    ctx.fillStyle = "#f0f0f0"
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    let loadedImages = 0
    selectedCollageImages.forEach((src, index) => {
      const img = new Image()
      img.onload = () => {
        const col = index % cols
        const row = Math.floor(index / cols)
        const x = padding + col * (imgWidth + padding)
        const y = padding + row * (imgHeight + padding)

        // Calculate scaling to maintain aspect ratio
        const scale = Math.min(imgWidth / img.width, imgHeight / img.height)
        const scaledWidth = img.width * scale
        const scaledHeight = img.height * scale

        // Center the image in its cell
        const xOffset = (imgWidth - scaledWidth) / 2
        const yOffset = (imgHeight - scaledHeight) / 2

        ctx.drawImage(img, x + xOffset, y + yOffset, scaledWidth, scaledHeight)

        loadedImages++
        if (loadedImages === selectedCollageImages.length) {
          const collageDataUrl = canvas.toDataURL("image/png")
          setCapturedImages((prev) => [...prev, collageDataUrl])
          setSelectedCollageImages([])
          setIsCollageMode(false)
        }
      }
      img.src = src
    })
  }

  return (
    <div className="flex flex-row items-start space-x-4">
      <div className="flex flex-col items-center space-y-4">
        <div className="relative">
          {errorMessage && <div className="text-red-500 mb-2">{errorMessage}</div>}
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className={`w-full max-w-lg rounded-lg`}
            style={{
              filter: `contrast(${contrastValue}%) brightness(${brightnessValue}%) ${selectedFilter.class}`,
              transform: isMirrored ? "scaleX(-1)" : "scaleX(1)",
            }}
          />
          {isCountingDown && (
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 text-white text-6xl font-bold">
              {countdown}
            </div>
          )}
        </div>
        <div className="flex space-x-2">
          <Button onClick={capturePhoto}>
            <CameraIcon className="mr-2 h-4 w-4" /> Capture
          </Button>
          <Button onClick={toggleMirrorCamera}>
            <FlipHorizontalIcon className="mr-2 h-4 w-4" /> Mirror Camera
          </Button>
          <Button onClick={() => setIsCollageMode(!isCollageMode)}>
            <GridIcon className="mr-2 h-4 w-4" /> {isCollageMode ? "Cancel Collage" : "Create Collage"}
          </Button>
        </div>
        <div className="grid grid-cols-2 gap-2 w-full">
          {filters.map((filter) => (
            <Button
              key={filter.name}
              variant={selectedFilter.name === filter.name ? "default" : "outline"}
              onClick={() => setSelectedFilter(filter)}
              className="w-full"
            >
              {filter.name}
            </Button>
          ))}
        </div>
        <div className="w-full space-y-2">
          <label>Contrast</label>
          <Slider
            min={0}
            max={200}
            step={1}
            value={[contrastValue]}
            onValueChange={(value) => setContrastValue(value[0])}
          />
        </div>
        <div className="w-full space-y-2">
          <label>Brightness</label>
          <Slider
            min={0}
            max={200}
            step={1}
            value={[brightnessValue]}
            onValueChange={(value) => setBrightnessValue(value[0])}
          />
        </div>
      </div>
      <div className="w-64 h-[600px] overflow-y-auto border border-gray-200 rounded-lg p-4">
        <h2 className="text-lg font-semibold mb-4">Gallery</h2>
        <div className="grid grid-cols-2 gap-2">
          {capturedImages.map((img, index) => (
            <img
              key={index}
              src={img || "/placeholder.svg"}
              alt={`Captured ${index + 1}`}
              className="w-full h-auto rounded-lg cursor-pointer"
              onClick={() => setSelectedGalleryImage(img)}
            />
          ))}
        </div>
      </div>
      <canvas ref={canvasRef} style={{ display: "none" }} />
      {showToast && <Toast>Photo saved successfully!</Toast>}
      {isCollageMode && (
        <Dialog open={isCollageMode} onOpenChange={() => setIsCollageMode(false)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Collage</DialogTitle>
            </DialogHeader>
            <p>Select images for your collage:</p>
            <div className="grid grid-cols-3 gap-2 max-h-[400px] overflow-y-auto">
              {capturedImages.map((img, index) => (
                <div key={index} className="relative">
                  <img
                    src={img || "/placeholder.svg"}
                    alt={`Captured ${index + 1}`}
                    className={`w-full h-auto rounded-lg cursor-pointer ${
                      selectedCollageImages.includes(img) ? "ring-2 ring-primary ring-offset-2" : ""
                    }`}
                    onClick={() => toggleCollageImageSelection(img)}
                  />
                  <div
                    className={`absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center ${
                      selectedCollageImages.includes(img) ? "bg-primary text-primary-foreground" : "bg-secondary"
                    }`}
                  >
                    {selectedCollageImages.includes(img) && (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        className="w-4 h-4"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <DialogFooter>
              <Button onClick={createCollage} disabled={selectedCollageImages.length < 2}>
                Create Collage
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
      <Dialog open={!!selectedGalleryImage} onOpenChange={() => setSelectedGalleryImage(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Gallery Image</DialogTitle>
          </DialogHeader>
          {selectedGalleryImage && (
            <img src={selectedGalleryImage || "/placeholder.svg"} alt="Selected" className="w-full rounded-lg" />
          )}
          <DialogFooter>
            <Button onClick={() => selectedGalleryImage && downloadImage(selectedGalleryImage)}>
              <DownloadIcon className="mr-2 h-4 w-4" /> Download
            </Button>
            <Button variant="destructive" onClick={() => selectedGalleryImage && deleteImage(selectedGalleryImage)}>
              <TrashIcon className="mr-2 h-4 w-4" /> Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

