'use client';

import { useCallback, useRef, useEffect } from 'react';
import { useTracks } from '@livekit/components-react';
import { Track } from 'livekit-client';
import type { VideoTrackResult } from '../types';

export function useLiveKitVideoTrack(trackId: string | undefined): VideoTrackResult {
    const trackRefs = useTracks([{ source: Track.Source.Camera, withPlaceholder: false }, { source: Track.Source.ScreenShare, withPlaceholder: false }], { onlySubscribed: false });
    const videoElementRef = useRef<HTMLVideoElement | null>(null);
    const attachedTrackRef = useRef<string | null>(null);

    // Find the track by SID
    const trackRef = trackId
        ? trackRefs.find((tr) => tr.publication?.trackSid === trackId)
        : undefined;

    const track = trackRef?.publication?.track;

    useEffect(() => {
        const el = videoElementRef.current;
        if (!el) return;

        if (track) {
            // Avoid re-attaching the same track
            if (attachedTrackRef.current === trackId) return;
            track.attach(el);
            attachedTrackRef.current = trackId ?? null;
        } else {
            // Detach if no track
            if (attachedTrackRef.current) {
                // Clear the src to detach
                el.srcObject = null;
                attachedTrackRef.current = null;
            }
        }

        return () => {
            if (track && el) {
                track.detach(el);
                attachedTrackRef.current = null;
            }
        };
    }, [track, trackId]);

    const videoRef: React.RefCallback<HTMLVideoElement> = useCallback(
        (element: HTMLVideoElement | null) => {
            // Detach from old element
            if (videoElementRef.current && videoElementRef.current !== element) {
                const oldTrack = trackRef?.publication?.track;
                if (oldTrack) {
                    oldTrack.detach(videoElementRef.current);
                }
                attachedTrackRef.current = null;
            }

            videoElementRef.current = element;

            if (element && track) {
                track.attach(element);
                attachedTrackRef.current = trackId ?? null;
            }
        },
        [track, trackId]
    );

    return { videoRef };
}
