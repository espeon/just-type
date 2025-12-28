import { useState, useRef } from 'react'
import { Upload as UploadIcon, X, Loader2 } from 'lucide-react'
import { Button } from './button'
import { uploadsApi, Upload } from '@/api/uploads'

interface ImageUploadProps {
    value?: Upload | null
    onChange?: (upload: Upload | null) => void
    maxSizeMB?: number
    className?: string
}

export function ImageUpload({
    value,
    onChange,
    maxSizeMB = 10,
    className
}: ImageUploadProps) {
    const [isUploading, setIsUploading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        // Validate file type
        if (!file.type.startsWith('image/')) {
            setError('Please select an image file')
            return
        }

        // Validate file size
        const maxBytes = maxSizeMB * 1024 * 1024
        if (file.size > maxBytes) {
            setError(`File size must be less than ${maxSizeMB}MB`)
            return
        }

        setError(null)
        setIsUploading(true)

        try {
            const upload = await uploadsApi.upload(file)
            onChange?.(upload)
        } catch (err) {
            setError('Upload failed. Please try again.')
            console.error('Upload error:', err)
        } finally {
            setIsUploading(false)
        }
    }

    const handleRemove = () => {
        onChange?.(null)
        if (fileInputRef.current) {
            fileInputRef.current.value = ''
        }
    }

    return (
        <div className={className}>
            {value ? (
                <div className="relative inline-block">
                    <img
                        src={uploadsApi.getUrl(value)}
                        alt={value.filename}
                        className="h-32 w-32 rounded-lg object-cover border border-border"
                    />
                    <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                        onClick={handleRemove}
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            ) : (
                <div>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileSelect}
                        className="hidden"
                    />
                    <Button
                        type="button"
                        variant="outline"
                        className="h-32 w-32"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading}
                    >
                        {isUploading ? (
                            <Loader2 className="h-8 w-8 animate-spin" />
                        ) : (
                            <UploadIcon className="h-8 w-8" />
                        )}
                    </Button>
                </div>
            )}
            {error && <p className="text-sm text-destructive mt-2">{error}</p>}
        </div>
    )
}
