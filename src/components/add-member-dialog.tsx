'use client'

import { useState } from 'react'
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
import { addMember } from '@/lib/actions'

interface AddMemberDialogProps {
  groupId: string
  children: React.ReactNode
}

export function AddMemberDialog({ groupId, children }: AddMemberDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [activeFrom, setActiveFrom] = useState<Date>(new Date())
  const [activeTo, setActiveTo] = useState<Date>()
  const [hasEndDate, setHasEndDate] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const name = formData.get('name') as string
    const email = formData.get('email') as string
    const iban = formData.get('iban') as string

    try {
      await addMember({
        name,
        email: email || undefined,
        iban: iban || undefined,
        groupId,
        activeFrom,
        activeTo: hasEndDate ? activeTo : undefined,
      })
      
      setOpen(false)
      setActiveFrom(new Date())
      setActiveTo(undefined)
      setHasEndDate(false)
      // Reset form
      // e.currentTarget.reset()
    } catch (error) {
      console.error('Failed to add member:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Member</DialogTitle>
          <DialogDescription>
            Add a new member to your expense sharing group.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              name="name"
              placeholder="e.g., John Doe"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email (optional)</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="e.g., john@example.com"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="iban">IBAN (optional)</Label>
            <Input
              id="iban"
              name="iban"
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
              {loading ? 'Adding...' : 'Add Member'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
