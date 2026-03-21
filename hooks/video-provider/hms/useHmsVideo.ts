'use client';

import { useVideo } from '@100mslive/react-sdk';
import type { VideoTrackResult } from '../types';

export function useHmsVideoTrack(trackId: string | undefined): VideoTrackResult {
    const { videoRef } = useVideo({ trackId: trackId ?? '' });
    return { videoRef };
}
