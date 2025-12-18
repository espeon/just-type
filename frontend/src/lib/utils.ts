import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

export function getInitials(name?: string): string {
    if (!name) return 'U'
    return name
        .split(' ')
        .map((part) => part[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
}

export function getAvatarColor(name?: string): string {
    const colors = [
        'bg-red-500',
        'bg-blue-500',
        'bg-green-500',
        'bg-yellow-500',
        'bg-purple-500',
        'bg-pink-500',
        'bg-indigo-500',
        'bg-cyan-500'
    ]
    if (!name) return colors[0]
    const hash = name
        .split('')
        .reduce((acc, char) => acc + char.charCodeAt(0), 0)
    return colors[hash % colors.length]
}
