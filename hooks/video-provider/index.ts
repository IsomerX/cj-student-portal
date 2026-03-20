'use client';

import { HmsVideoProvider } from './hms/HmsVideoProvider';
import { LiveKitVideoProvider } from './livekit/LiveKitVideoProvider';
import { useHmsVideoTrack } from './hms/useHmsVideo';
import { useLiveKitVideoTrack } from './livekit/useLiveKitVideo';

const providerType = process.env.NEXT_PUBLIC_VIDEO_PROVIDER || '100ms';

export const VideoProvider = providerType === 'livekit' ? LiveKitVideoProvider : HmsVideoProvider;
export const useVideoTrack = providerType === 'livekit' ? useLiveKitVideoTrack : useHmsVideoTrack;
export { useVideoRoom } from './context';
export { VideoRoomState, VideoNotificationType } from './types';
export type { VideoPeer, VideoActions, VideoRoomContext, VideoNotification, VideoMessageData, VideoTrackResult } from './types';
