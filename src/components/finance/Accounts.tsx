'use client'

import { useState } from 'react'
import { useFinanceStore } from '@/store/finance'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Plus, Pencil, Trash2, ArrowRightLeft, Wallet, PiggyBank, Banknote, TrendingUp } from 'lucide-react'

const ACCOUNT_TYPES = [
  { value: 'main', label: 'Основной', icon: 'Wallet', color: '#4ECDC4' },
  { value: 'savings', label: 'Накопительный', icon: 'PiggyBank', color: '#96CEB4' },
  { value: 'cash', label: 'Наличные', icon: 'Banknote', color: '#FFEAA7' },
  { value: 'investment', label: 'Инвестиционный', icon: 'TrendingUp', color: '#82E0AA' }
]

const ACCOUNT_COLORS = ['#4ECDC4', '#96CEB4', '#FFEAA7', '#82E0AA', '#FF6B6B', '#45B7D1', '#DDA0DD', '#F7DC6F']

interface AccountFormData {
  name: string
  type: string
  currency: string
  balance: string
  color: string
}

interface TransferFormData {
  fromAccountId: string
  toAccountId: string
  amount: string
}

const initialFormData: AccountFormData = {
  name: '',
  type: 'savings',
  currency: 'RUB',
  balance: '0',
  color: '#96CEB4'
}

export function Accounts() {
  const { accounts, addAccount, updateAccount, removeAccount } = useFinanceStore()

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isTransferOpen, setIsTransferOpen] = useState(false)
  const [editingAccount, setEditingAccount] = useState<string | null>(null)
  const [formData, setFormData] = useState<AccountFormData>(initialFormData)
  const [transferData, setTransferData] = useState<TransferFormData>({
    fromAccountId: '',
    toAccountId: '',
    amount: ''
  })

  const safeAccounts = Array.isArray(accounts) ? accounts : []

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name) return

    try {
      if (editingAccount) {
        const response = await fetch(`/api/accounts/${editingAccount}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...formData,
            balance: parseFloat(formData.balance) || 0
          })
        })
        const data = await response.json()
        updateAccount(editingAccount, data)
      } else {
        const response = await fetch('/api/accounts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...formData,
            balance: parseFloat(formData.balance) || 0
          })
        })
        const data = await response.json()
        addAccount(data)
      }

      setIsDialogOpen(false)
      setEditingAccount(null)
      setFormData(initialFormData)
    } catch (error) {
      console.error('Error saving account:', error)
    }
  }

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!transferData.fromAccountId || !transferData.toAccountId || !transferData.amount) return

    try {
      const response = await fetch('/api/accounts/transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...transferData,
          amount: parseFloat(transferData.amount) || 0
        })
      })
      const data = await response.json()

      if (data.success) {
        updateAccount(data.fromAccount.id, data.fromAccount)
        updateAccount(data.toAccount.id, data.toAccount)
      }

      setIsTransferOpen(false)
      setTransferData({ fromAccountId: '', toAccountId: '', amount: '' })
    } catch (error) {
      console.error('Error transferring:', error)
    }
  }

  const handleEdit = (account: typeof safeAccounts[0]) => {
    setEditingAccount(account.id)
    setFormData({
      name: account.name,
      type: account.type,
      currency: account.currency || 'RUB',
      balance: String(account.balance || 0),
      color: account.color || '#96CEB4'
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Удалить этот счет?')) return
    try {
      await fetch(`/api/accounts/${id}`, { method: 'DELETE' })
      removeAccount(id)
    } catch (error) {
      console.error('Error deleting account:', error)
    }
  }

  const formatMoney = (amount: number, currency: string = 'RUB') => {
    const safeAmount = typeof amount === 'number' && !isNaN(amount) ? amount : 0
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: currency || 'RUB',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(safeAmount)
  }

  const getAccountIcon = (type: string) => {
    switch (type) {
      case 'main': return <Wallet className="h-5 w-5" />
      case 'savings': return <PiggyBank className="h-5 w-5" />
      case 'cash': return <Banknote className="h-5 w-5" />
      case 'investment': return <TrendingUp className="h-5 w-5" />
      default: return <Wallet className="h-5 w-5" />
    }
  }

  const totalBalance = safeAccounts.reduce((sum, a) => {
    const balance = typeof a.balance === 'number' && !isNaN(a.balance) ? a.balance : 0
    return sum + balance
  }, 0)

  const accountsByType = {
    main: safeAccounts.filter(a => a.type === 'main'),
    savings: safeAccounts.filter(a => a.type === 'savings'),
    cash: safeAccounts.filter(a => a.type === 'cash'),
    investment: safeAccounts.filter(a => a.type === 'investment')
  }

  return (
    <div className="space-y-6">
      {/* Total Balance */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Общий баланс</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{formatMoney(totalBalance)}</div>
          <p className="text-sm text-muted-foreground">{safeAccounts.length} счетов</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Счета</CardTitle>
              <CardDescription>Управление вашими финансовыми счетами</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setIsTransferOpen(true)}>
                <ArrowRightLeft className="h-4 w-4 mr-2" />
                Перевод
              </Button>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={() => {
                    setEditingAccount(null)
                    setFormData(initialFormData)
                  }}>
                    <Plus className="h-4 w-4 mr-2" />
                    Добавить счет
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{editingAccount ? 'Редактировать счет' : 'Новый счет'}</DialogTitle>
                    <DialogDescription>
                      {editingAccount ? 'Измените параметры счета' : 'Создайте новый финансовый счет'}
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label>Название</Label>
                      <Input
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Название счета"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Тип счета</Label>
                        <Select value={formData.type} onValueChange={(v) => setFormData({ ...formData, type: v })}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {ACCOUNT_TYPES.map(type => (
                              <SelectItem key={type.value} value={type.value}>
                                {type.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Валюта</Label>
                        <Select value={formData.currency} onValueChange={(v) => setFormData({ ...formData, currency: v })}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="RUB">₽ RUB</SelectItem>
                            <SelectItem value="USD">$ USD</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Начальный баланс</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={formData.balance}
                        onChange={(e) => setFormData({ ...formData, balance: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Цвет</Label>
                      <div className="flex flex-wrap gap-2">
                        {ACCOUNT_COLORS.map(color => (
                          <button
                            key={color}
                            type="button"
                            onClick={() => setFormData({ ...formData, color })}
                            className={`w-8 h-8 rounded-full border-2 transition-all ${
                              formData.color === color ? 'border-foreground scale-110' : 'border-transparent'
                            }`}
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                    </div>

                    <DialogFooter>
                      <Button type="submit">{editingAccount ? 'Сохранить' : 'Добавить'}</Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all">
            <TabsList className="mb-4">
              <TabsTrigger value="all">Все ({safeAccounts.length})</TabsTrigger>
              <TabsTrigger value="main">Основные ({accountsByType.main.length})</TabsTrigger>
              <TabsTrigger value="savings">Накопления ({accountsByType.savings.length})</TabsTrigger>
              <TabsTrigger value="investment">Инвестиции ({accountsByType.investment.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="all">
              <ScrollArea className="h-[400px] pr-2">
                <div className="grid gap-3">
                  {safeAccounts.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">Нет счетов. Добавьте первый счет.</p>
                  ) : (
                    safeAccounts.map(account => (
                      <div key={account.id} className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg" style={{ backgroundColor: `${account.color || '#888'}20` }}>
                            <div style={{ color: account.color || '#888' }}>{getAccountIcon(account.type)}</div>
                          </div>
                          <div>
                            <p className="font-medium">{account.name}</p>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">
                                {ACCOUNT_TYPES.find(t => t.value === account.type)?.label || account.type}
                              </Badge>
                              <span className="text-xs text-muted-foreground">{account.currency || 'RUB'}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className={`text-lg font-semibold ${typeof account.balance === 'number' && account.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {formatMoney(account.balance, account.currency)}
                          </span>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon" onClick={() => handleEdit(account)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDelete(account.id)} className="text-destructive">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </TabsContent>

            {(['main', 'savings', 'investment'] as const).map(type => (
              <TabsContent key={type} value={type}>
                <div className="grid gap-3">
                  {accountsByType[type].length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">Нет счетов этого типа</p>
                  ) : (
                    accountsByType[type].map(account => (
                      <div key={account.id} className="flex items-center justify-between p-4 rounded-lg border bg-card">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg" style={{ backgroundColor: `${account.color || '#888'}20` }}>
                            <div style={{ color: account.color || '#888' }}>{getAccountIcon(account.type)}</div>
                          </div>
                          <div>
                            <p className="font-medium">{account.name}</p>
                            <Badge variant="outline" className="text-xs">{account.currency || 'RUB'}</Badge>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-lg font-semibold">{formatMoney(account.balance, account.currency)}</span>
                          <Button variant="ghost" size="icon" onClick={() => handleEdit(account)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>

      {/* Transfer Dialog */}
      <Dialog open={isTransferOpen} onOpenChange={setIsTransferOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Перевод между счетами</DialogTitle>
            <DialogDescription>Переведите средства с одного счета на другой</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleTransfer} className="space-y-4">
            <div className="space-y-2">
              <Label>Со счета</Label>
              <Select value={transferData.fromAccountId} onValueChange={(v) => setTransferData({ ...transferData, fromAccountId: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Выберите счет" />
                </SelectTrigger>
                <SelectContent>
                  {safeAccounts.map(account => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.name} ({formatMoney(account.balance, account.currency)})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>На счет</Label>
              <Select value={transferData.toAccountId} onValueChange={(v) => setTransferData({ ...transferData, toAccountId: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Выберите счет" />
                </SelectTrigger>
                <SelectContent>
                  {safeAccounts.filter(a => a.id !== transferData.fromAccountId).map(account => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.name} ({formatMoney(account.balance, account.currency)})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Сумма</Label>
              <Input
                type="number"
                step="0.01"
                value={transferData.amount}
                onChange={(e) => setTransferData({ ...transferData, amount: e.target.value })}
                placeholder="0.00"
                required
              />
            </div>

            <DialogFooter>
              <Button type="submit">Перевести</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
