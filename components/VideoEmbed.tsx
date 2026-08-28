'use client'

import React, { useState } from 'react'

type VideoEmbedProps = {
  id: string
  title?: string
  label?: string
  className?: string
}

const PlayIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="h-7 w-7 translate-x-[2px]">
    <path d="M8 5v14l11-7z" />
  </svg>
)

/**
 * YouTube embed with a click-to-load facade — the thumbnail is a plain image
 * until someone actually wants to watch, so no YouTube scripts or cookies load
 * on page view.
 */
const VideoEmbed = ({ id, title = 'Video', label, className = '' }: VideoEmbedProps) => {
  const [isActive, setIsActive] = useState(false)

  return (
    <figure className={className}>
      {label && (
        <figcaption className="mb-3 font-mono text-[9px] uppercase tracking-[0.22em] text-[#e0b25a]">
          {label}
        </figcaption>
      )}
      <div className="relative aspect-video w-full overflow-hidden rounded-lg border border-[#e4dfd5]/12 bg-[#1b1917]">
        {isActive ? (
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0&modestbranding=1`}
            title={title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            className="absolute inset-0 h-full w-full"
          />
        ) : (
          <button
            type="button"
            onClick={() => setIsActive(true)}
            className="group absolute inset-0 h-full w-full"
            aria-label={`Play: ${title}`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`https://i.ytimg.com/vi/${id}/maxresdefault.jpg`}
              alt=""
              className="absolute inset-0 h-full w-full object-cover opacity-70 transition duration-500 group-hover:opacity-90"
              loading="lazy"
            />
            <span className="absolute inset-0 bg-gradient-to-t from-[#1b1917]/85 via-[#1b1917]/20 to-transparent" />
            <span className="absolute inset-0 flex items-center justify-center">
              <span className="flex h-16 w-16 items-center justify-center rounded-full border border-[#e0b25a]/60 bg-[#232120]/80 text-[#e0b25a] backdrop-blur transition group-hover:border-[#e0b25a] group-hover:bg-[#e0b25a] group-hover:text-[#232120]">
                <PlayIcon />
              </span>
            </span>
            <span className="absolute bottom-0 left-0 right-0 px-5 py-4 text-left">
              <span className="block font-mono text-[9px] uppercase tracking-[0.18em] text-[#e4dfd5]/50">
                Watch
              </span>
              <span className="mt-1 block font-serif text-lg leading-tight text-[#e4dfd5]">{title}</span>
            </span>
          </button>
        )}
      </div>
    </figure>
  )
}

export default VideoEmbed
