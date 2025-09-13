'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AddExpenseDialog } from '@/components/add-expense-dialog'
import { Plus, DollarSign, Calendar, User, Trash2, Repeat } from 'lucide-react'
import { Group, Member, Expense, ExpenseMember } from '@prisma/client'
import { removeExpense } from '@/lib/actions'

interface ExpensesSectionProps {
  group: Group & {
    members: Member[]
    expenses: Array<Expense & {
      paidBy: Member
      expenseMembers: Array<ExpenseMember & {
        member: Member
      }>
    }>
  }
  expenses?: Array<Expense & {
    paidBy: Member
    expenseMembers: Array<ExpenseMember & {
      member: Member
    }>
    effectiveMembers?: Array<{
      id: string
      name: string
      amount: number
    }>
  }>
}

export function ExpensesSection({ group, expenses }: ExpensesSectionProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null)
  
  // Use provided expenses or fall back to group expenses
  const displayExpenses = expenses || group.expenses

  const handleDeleteExpense = async (expenseId: string) => {
    setDeletingId(expenseId)
    try {
      await removeExpense(expenseId)
    } catch (error) {
      console.error('Failed to remove expense:', error)
    } finally {
      setDeletingId(null)
    }
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(new Date(date))
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Expenses
          </CardTitle>
          <AddExpenseDialog group={group}>
            <Button size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Add Expense
            </Button>
          </AddExpenseDialog>
        </div>
      </CardHeader>
      <CardContent>
        {displayExpenses.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <DollarSign className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No expenses yet</p>
            <p className="text-sm">Add expenses to start tracking shared costs</p>
          </div>
        ) : (
          <div className="space-y-4">
            {displayExpenses.map((expense) => (
              <div
                key={expense.id}
                className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-lg">{expense.title}</h3>
                      {expense.isRecurring && (
                        <Badge variant="outline" className="text-xs bg-green-50 text-green-700 dark:bg-green-900 dark:text-green-300">
                          <Repeat className="w-3 h-3 mr-1" />
                          {expense.recurringType}
                        </Badge>
                      )}
                    </div>
                    {expense.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                        {expense.description}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-sm">
                      ${Number(expense.amount).toFixed(2)}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteExpense(expense.id)}
                      disabled={deletingId === expense.id}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/20"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                
                <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-300 mb-3">
                  <div className="flex items-center gap-1">
                    <User className="w-4 h-4" />
                    <span>Paid by {expense.paidBy.name}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    <span>{formatDate(expense.date)}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-200">
                    Split between:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {expense.splitAll ? (
                      <>
                        {expense.effectiveMembers && expense.effectiveMembers.length > 0 ? (
                          expense.effectiveMembers.map((member) => (
                            <Badge key={member.id} variant="outline" className="text-xs bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300">
                              {member.name}: ${member.amount.toFixed(2)}
                            </Badge>
                          ))
                        ) : (
                          <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                            All Active Members: ${(Number(expense.amount) / group.members.length).toFixed(2)} each
                          </Badge>
                        )}
                      </>
                    ) : (
                      expense.expenseMembers.map((expenseMember) => (
                        <Badge key={expenseMember.id} variant="outline" className="text-xs">
                          {expenseMember.member.name}: ${Number(expenseMember.amount).toFixed(2)}
                        </Badge>
                      ))
                    )}
                  </div>
                  {expense.splitAll && (
                    <p className="text-xs text-blue-600 dark:text-blue-400">
                      Includes all {expense.effectiveMembers?.length || group.members.length} active members on {new Date(expense.date).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
