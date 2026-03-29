// src/components/ui/AvatarCropModal.tsx

import { useState, useCallback } from 'react'
import Cropper from 'react-easy-crop'
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    Button, Slider, Box, Typography, CircularProgress
} from '@mui/material'

// ─── Вспомогательная функция — вырезает нужный кусок из картинки ──────────────
// Принимает исходный файл и координаты обрезки, возвращает Blob
async function getCroppedImage(imageSrc: string, croppedAreaPixels: Area): Promise<Blob> {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image()
        img.onload = () => resolve(img)
        img.onerror = reject
        img.src = imageSrc
    })

    const canvas = document.createElement('canvas')
    canvas.width = croppedAreaPixels.width
    canvas.height = croppedAreaPixels.height

    const ctx = canvas.getContext('2d')!
    ctx.drawImage(
        image,
        croppedAreaPixels.x,
        croppedAreaPixels.y,
        croppedAreaPixels.width,
        croppedAreaPixels.height,
        0,
        0,
        croppedAreaPixels.width,
        croppedAreaPixels.height,
    )

    return new Promise((resolve, reject) => {
        canvas.toBlob(blob => {
            if (blob) resolve(blob)
            else reject(new Error('Canvas is empty'))
        }, 'image/jpeg', 0.95)
    })
}

// Тип из react-easy-crop
interface Area {
    x: number
    y: number
    width: number
    height: number
}

interface Props {
    open: boolean
    imageSrc: string        // base64 или object URL выбранного файла
    onClose: () => void
    onCropDone: (blob: Blob) => void   // отдаём готовый обрезанный Blob наверх
    isUploading?: boolean
}

export default function AvatarCropModal({ open, imageSrc, onClose, onCropDone, isUploading }: Props) {
    const [crop, setCrop] = useState({ x: 0, y: 0 })
    const [zoom, setZoom] = useState(1)
    // croppedAreaPixels — точные пиксели выделенной области, обновляются при движении
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null)

    const onCropComplete = useCallback((_: Area, croppedPixels: Area) => {
        setCroppedAreaPixels(croppedPixels)
    }, [])

    const handleConfirm = async () => {
        if (!croppedAreaPixels) return
        const blob = await getCroppedImage(imageSrc, croppedAreaPixels)
        onCropDone(blob)
    }

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle fontWeight={700}>Выберите область фото</DialogTitle>

            <DialogContent sx={{ p: 0 }}>
                {/* Область кропа — фиксированная высота */}
                <Box sx={{ position: 'relative', height: 380, bgcolor: '#1a1a1a' }}>
                    <Cropper
                        image={imageSrc}
                        crop={crop}
                        zoom={zoom}
                        aspect={1}              // квадрат — идеально для аватара
                        cropShape="round"       // круглая маска как в соцсетях
                        showGrid={false}
                        onCropChange={setCrop}
                        onZoomChange={setZoom}
                        onCropComplete={onCropComplete}
                    />
                </Box>

                {/* Слайдер зума */}
                <Box sx={{ px: 3, py: 2 }}>
                    <Typography variant="caption" color="text.secondary" fontWeight={600}>
                        МАСШТАБ
                    </Typography>
                    <Slider
                        value={zoom}
                        min={1}
                        max={3}
                        step={0.05}
                        onChange={(_, value) => setZoom(value as number)}
                        sx={{ mt: 1 }}
                    />
                </Box>
            </DialogContent>

            <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
                <Button variant="outlined" color="inherit" onClick={onClose} disabled={isUploading}>
                    Отмена
                </Button>
                <Button
                    variant="contained"
                    onClick={handleConfirm}
                    disabled={isUploading}
                    startIcon={isUploading ? <CircularProgress size={16} color="inherit" /> : null}
                >
                    {isUploading ? 'Загружаем...' : 'Сохранить'}
                </Button>
            </DialogActions>
        </Dialog>
    )
}