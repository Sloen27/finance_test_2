import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { hashPassword } from '@/lib/auth'

export async function POST(request: Request) {
  try {
    const { password, confirmPassword } = await request.json()

    if (!password || typeof password !== 'string') {
      return NextResponse.json({ error: 'Введите пароль' }, { status: 400 })
    }

    if (password.length < 4) {
      return NextResponse.json({ error: 'Пароль должен быть не менее 4 символов' }, { status: 400 })
    }

    if (password !== confirmPassword) {
      return NextResponse.json({ error: 'Пароли не совпадают' }, { status: 400 })
    }

    // Check if password is already set
    const settings = await db.settings.findFirst()

    if (settings?.passwordHash) {
      return NextResponse.json({ error: 'Пароль уже установлен. Используйте страницу входа.' }, { status: 400 })
    }

    // Hash and save password
    const passwordHash = hashPassword(password)

    if (settings) {
      await db.settings.update({
        where: { id: settings.id },
        data: { passwordHash }
      })
    } else {
      await db.settings.create({
        data: {
          passwordHash,
          rubToUsdRate: 0.011,
          theme: 'light'
        }
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Setup error:', error)
    return NextResponse.json({ error: 'Ошибка при настройке' }, { status: 500 })
  }
}
