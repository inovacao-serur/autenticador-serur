import { useState, useEffect } from 'react'
import { Modal, ModalHeader, ModalTitle } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'

export function IOSInstallPrompt() {
  const [showPrompt, setShowPrompt] = useState(false)

  useEffect(() => {
    // Check if the device is iOS and the app is not installed
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches
    
    if (isIOS && !isStandalone) {
      // Show prompt after a short delay
      const timer = setTimeout(() => {
        setShowPrompt(true)
      }, 2000)

      return () => clearTimeout(timer)
    }
  }, [])

  return (
    <Modal isOpen={showPrompt} onClose={() => setShowPrompt(false)}>
      <ModalHeader>
        <ModalTitle>Instalar Aplicativo</ModalTitle>
      </ModalHeader>

      <div className="mt-4 space-y-4">
        <p className="text-sm text-zinc-400">
          Para instalar o Serur Authenticator na sua tela inicial:
        </p>

        <ol className="list-decimal list-inside space-y-2 text-sm text-zinc-300">
          <li>Toque no botão de compartilhar <span className="inline-block px-2 py-1 bg-zinc-800 rounded">Compartilhar</span></li>
          <li>Role para baixo e toque em <span className="inline-block px-2 py-1 bg-zinc-800 rounded">Adicionar à Tela Inicial</span></li>
          <li>Toque em <span className="inline-block px-2 py-1 bg-zinc-800 rounded">Adicionar</span></li>
        </ol>

        <Button
          onClick={() => setShowPrompt(false)}
          className="w-full bg-white text-black hover:bg-zinc-200"
        >
          Entendi
        </Button>
      </div>
    </Modal>
  )
}