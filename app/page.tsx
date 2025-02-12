"use client"

import Camera from "./Camera"

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-8">
      <div className="z-10 w-full items-center justify-between font-mono text-sm lg:flex mb-8">
        <h1 className="text-4xl font-bold">Photobooth</h1>
      </div>
      <Camera />
    </main>
  )
}

