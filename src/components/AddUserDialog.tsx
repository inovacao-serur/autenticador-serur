import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { UserPlus } from 'lucide-react'
import { ModalContent } from './ModalContent'


export function AddUserDialog() {
 
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="rounded-full bg-zinc-800 hover:bg-zinc-700"
        onClick={() => setIsOpen(true)}
      >
        <UserPlus className="h-5 w-5" />
      </Button>

      <ModalContent
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
      />
    </>
  )
}