/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Play, Pause } from 'lucide-react';
import { Tenant } from '../types';

interface BackgroundMusicPlayerProps {
  tenant: Tenant;
}

export function extractYouTubeId(url: string | undefined): string {
  if (!url) return '';
  const trimmed = url.trim();
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }
  const match = trimmed.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
  return match ? match[1] : '';
}

export default function BackgroundMusicPlayer({ tenant }: BackgroundMusicPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);

  const videoId = extractYouTubeId(tenant.bgMusicUrl);

  // If tenant has no music or music is disabled, don't render anything
  if (!tenant.bgMusicEnabled || !videoId) {
    return null;
  }

  const handleTogglePlay = () => {
    setIsPlaying(prev => !prev);
  };

  return (
    <>
      {/* Hidden YouTube Iframe Embed for Audio Playback */}
      <iframe
        id="bg-music-youtube-iframe"
        title="Background Music Player"
        src={`https://www.youtube.com/embed/${videoId}?enablejsapi=1&autoplay=${isPlaying ? 1 : 0}&mute=${isPlaying ? 0 : 1}&loop=1&playlist=${videoId}&controls=0`}
        allow="autoplay"
        className="fixed -top-96 -left-96 w-1 h-1 opacity-0 pointer-events-none"
      />

      {/* Botón Flotante Único para Reproducir y Pausar Música */}
      <div className="fixed bottom-6 left-6 z-40 animate-fadeIn">
        <button
          type="button"
          id="btn-public-music-toggle"
          onClick={handleTogglePlay}
          className={`w-12 h-12 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 cursor-pointer border backdrop-blur-md hover:scale-110 active:scale-95 ${
            isPlaying
              ? 'bg-rose-500 text-white border-rose-400 ring-4 ring-rose-500/20 shadow-rose-500/30'
              : 'bg-slate-900/90 text-slate-300 border-slate-700 hover:text-white hover:bg-slate-900'
          }`}
          title={isPlaying ? 'Pausar Música de Ambiente' : 'Reproducir Música de Ambiente'}
        >
          {isPlaying ? (
            <Pause className="w-5 h-5 fill-current" />
          ) : (
            <Play className="w-5 h-5 fill-current ml-0.5" />
          )}
        </button>
      </div>
    </>
  );
}

