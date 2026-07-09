import { useState } from 'react'
import { ShoeSilhouette } from './ShoeSilhouette'

interface ShoeImageProps {
  src?: string
  alt: string
  accent: string
  className?: string
  imgClassName?: string
}

/** Product photo with silhouette fallback if the image fails to load. */
export function ShoeImage({ src, alt, accent, className, imgClassName }: ShoeImageProps) {
  const [failed, setFailed] = useState(false)
  const showPhoto = Boolean(src) && !failed

  return (
    <div className={`shoe-photo-wrap ${className ?? ''}`}>
      {showPhoto ? (
        <img
          src={src}
          alt={alt}
          className={`shoe-photo ${imgClassName ?? ''}`}
          loading="lazy"
          onError={() => setFailed(true)}
        />
      ) : (
        <ShoeSilhouette accent={accent} className={imgClassName ?? 'shoe-svg'} />
      )}
    </div>
  )
}
