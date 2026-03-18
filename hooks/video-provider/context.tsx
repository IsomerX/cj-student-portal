'use client';

import { createContext, useContext } from 'react';
import type { VideoRoomContext } from './types';

const VideoContext = createContext<VideoRoomContext | null>(null);

export function useVideoRoom(): VideoRoomContext {
    const ctx = useContext(VideoContext);
    if (!ctx) throw new Error('useVideoRoom must be used within a VideoProvider');
    return ctx;
}

export { VideoContext };
