const MAX_WIDTH = 1600
const MAX_BYTES = 4 * 1024 * 1024 // 4 MB

export interface CompressResult {
  blob: Blob
  beforeSize: number
  afterSize: number
}

export function useImageCompressor() {
  async function compress(file: File): Promise<CompressResult> {
    const beforeSize = file.size

    let bitmap: ImageBitmap
    try {
      bitmap = await createImageBitmap(file)
    } catch {
      throw new Error('HEIC_UNSUPPORTED')
    }

    let w = bitmap.width
    let h = bitmap.height
    if (w > MAX_WIDTH) {
      h = Math.round((h * MAX_WIDTH) / w)
      w = MAX_WIDTH
    }

    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')!
    ctx.drawImage(bitmap, 0, 0, w, h)
    bitmap.close()

    for (const quality of [0.82, 0.65, 0.5]) {
      const blob = await toBlob(canvas, quality)
      if (blob.size <= MAX_BYTES) {
        console.debug(`[compressor] ${(beforeSize / 1024).toFixed(0)} KB → ${(blob.size / 1024).toFixed(0)} KB (q=${quality})`)
        return { blob, beforeSize, afterSize: blob.size }
      }
    }

    const blob = await toBlob(canvas, 0.5)
    return { blob, beforeSize, afterSize: blob.size }
  }

  return { compress }
}

function toBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error('toBlob failed'))),
      'image/jpeg',
      quality,
    )
  })
}
