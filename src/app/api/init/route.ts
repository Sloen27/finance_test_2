import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Default categories with Russian names and expense types
const DEFAULT_CATEGORIES = [
  // Income categories
  { name: 'Зарплата', icon: 'Briefcase', color: '#22c55e', type: 'income', expenseType: 'variable' },
  { name: 'Подработка', icon: 'Briefcase', color: '#16a34a', type: 'income', expenseType: 'variable' },
  { name: 'Инвестиционный доход', icon: 'TrendingUp', color: '#15803d', type: 'income', expenseType: 'variable' },
  { name: 'Подарки', icon: 'Gift', color: '#4ade80', type: 'income', expenseType: 'variable' },
  { name: 'Прочие доходы', icon: 'MoreHorizontal', color: '#86efac', type: 'income', expenseType: 'variable' },

  // Expense - Mandatory (Обязательные)
  { name: 'Жилье', icon: 'Home', color: '#45B7D1', type: 'expense', expenseType: 'mandatory' },
  { name: 'Коммунальные', icon: 'Home', color: '#5DADE2', type: 'expense', expenseType: 'mandatory' },
  { name: 'Подписки', icon: 'CreditCard', color: '#96CEB4', type: 'expense', expenseType: 'mandatory' },
  { name: 'Кредиты', icon: 'CreditCard', color: '#3498DB', type: 'expense', expenseType: 'mandatory' },
  { name: 'Страховка', icon: 'Shield', color: '#5499C7', type: 'expense', expenseType: 'mandatory' },

  // Expense - Variable (Переменные)
  { name: 'Еда', icon: 'Utensils', color: '#FF6B6B', type: 'expense', expenseType: 'variable' },
  { name: 'Транспорт', icon: 'Car', color: '#4ECDC4', type: 'expense', expenseType: 'variable' },
  { name: 'Покупки', icon: 'ShoppingBag', color: '#FFEAA7', type: 'expense', expenseType: 'variable' },
  { name: 'Здоровье', icon: 'Heart', color: '#98D8C8', type: 'expense', expenseType: 'variable' },
  { name: 'Образование', icon: 'Book', color: '#82E0AA', type: 'expense', expenseType: 'variable' },

  // Expense - Discretionary (Необязательные)
  { name: 'Развлечения', icon: 'Gamepad2', color: '#DDA0DD', type: 'expense', expenseType: 'discretionary' },
  { name: 'Путешествия', icon: 'Plane', color: '#F7DC6F', type: 'expense', expenseType: 'discretionary' },
  { name: 'Хобби', icon: 'Sparkles', color: '#F8B500', type: 'expense', expenseType: 'discretionary' },
  { name: 'Подарки', icon: 'Gift', color: '#FF6F61', type: 'expense', expenseType: 'discretionary' },
  { name: 'Прочее', icon: 'MoreHorizontal', color: '#B2BABB', type: 'expense', expenseType: 'variable' }
]

// Default accounts
const DEFAULT_ACCOUNTS = [
  { name: 'Основной счет', type: 'main', currency: 'RUB', balance: 0, icon: 'Wallet', color: '#4ECDC4' },
  { name: 'Накопления', type: 'savings', currency: 'RUB', balance: 0, icon: 'PiggyBank', color: '#96CEB4' },
  { name: 'Наличные', type: 'cash', currency: 'RUB', balance: 0, icon: 'Banknote', color: '#FFEAA7' }
]

// POST - Initialize default data
export async function POST() {
  try {
    // Check if categories already exist
    const existingCategories = await db.category.count()

    if (existingCategories > 0) {
      return NextResponse.json({
        message: 'Categories already initialized',
        count: existingCategories
      })
    }

    // Create default categories
    await db.category.createMany({
      data: DEFAULT_CATEGORIES.map(cat => ({
        ...cat,
        isDefault: true
      }))
    })

    // Create default accounts
    await db.account.createMany({
      data: DEFAULT_ACCOUNTS.map(acc => ({
        ...acc,
        isActive: true
      }))
    })

    // Create default settings
    await db.settings.create({
      data: {
        rubToUsdRate: 0.011,
        theme: 'light',
        mandatoryPercent: 50,
        variablePercent: 30,
        savingsPercent: 10,
        investmentsPercent: 10
      }
    })

    return NextResponse.json({
      message: 'Default data created successfully',
      categoriesCount: DEFAULT_CATEGORIES.length,
      accountsCount: DEFAULT_ACCOUNTS.length
    })
  } catch (error) {
    console.error('Error initializing data:', error)
    return NextResponse.json({ error: 'Failed to initialize data' }, { status: 500 })
  }
}

// GET - Check initialization status
export async function GET() {
  try {
    const categoriesCount = await db.category.count()
    const transactionsCount = await db.transaction.count()
    const budgetsCount = await db.budget.count()
    const regularPaymentsCount = await db.regularPayment.count()
    const settings = await db.settings.findFirst()
    const accountsCount = await db.account.count()
    const goalsCount = await db.financialGoal.count()

    return NextResponse.json({
      initialized: categoriesCount > 0,
      categoriesCount,
      transactionsCount,
      budgetsCount,
      regularPaymentsCount,
      hasSettings: !!settings,
      accountsCount,
      goalsCount
    })
  } catch (error) {
    console.error('Error checking initialization:', error)
    return NextResponse.json({ error: 'Failed to check initialization' }, { status: 500 })
  }
}
