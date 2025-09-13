'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { DatePicker } from '@/components/ui/date-picker'
import { Member } from '@prisma/client'

interface EditMemberDialogProps {
  member: Member
  onUpdate: (memberId: string, data: {
    name: string
    email?: string
    iban?: string
    activeFrom: Date
    activeTo?: Date
  }) => Promise<void>
  children: React.ReactNode
}

export function EditMemberDialog({ member, onUpdate, children }: EditMemberDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [name, setName] = useState(member.name)
  const [email, setEmail] = useState(member.email || '')
  const [iban, setIban] = useState(member.iban || '')
  const [activeFrom, setActiveFrom] = useState<Date>(new Date(member.activeFrom))
  const [activeTo, setActiveTo] = useState<Date | undefined>(
    member.activeTo ? new Date(member.activeTo) : undefined
  )
  const [hasEndDate, setHasEndDate] = useState(!!member.activeTo)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)

    try {
      await onUpdate(member.id, {
        name,
        email: email || undefined,
        iban: iban || undefined,
        activeFrom,
        activeTo: hasEndDate ? activeTo : undefined,
      })
      
      setOpen(false)
    } catch (error) {
      console.error('Failed to update member:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      // Reset form when closing
      setName(member.name)
      setEmail(member.email || '')
      setIban(member.iban || '')
      setActiveFrom(new Date(member.activeFrom))
      setActiveTo(member.activeTo ? new Date(member.activeTo) : undefined)
      setHasEndDate(!!member.activeTo)
    }
    setOpen(newOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Member</DialogTitle>
          <DialogDescription>
            Update member information and active period.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., John Doe"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email (optional)</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g., john@example.com"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="iban">IBAN (optional)</Label>
            <Input
              id="iban"
              value={iban}
              onChange={(e) => setIban(e.target.value)}
              placeholder="e.g., DE89 3704 0044 0532 0130 00"
            />
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="activeFrom">Active from</Label>
              <DatePicker
                value={activeFrom}
                onChange={(date) => setActiveFrom(date || new Date())}
                placeholder="Select start date"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="hasEndDate"
                  checked={hasEndDate}
                  onCheckedChange={(checked) => setHasEndDate(checked as boolean)}
                />
                <Label htmlFor="hasEndDate" className="text-sm">
                  Set end date (optional)
                </Label>
              </div>
              
              {hasEndDate && (
                <DatePicker
                  value={activeTo}
                  onChange={(date) => setActiveTo(date)}
                  placeholder="Select end date"
                />
              )}
            </div>
          </div>
          
          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Updating...' : 'Update Member'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
