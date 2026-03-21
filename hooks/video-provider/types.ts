export type VideoProviderType = '100ms' | 'livekit';

export interface VideoPeer {
    id: string;
    name: string;
    role: string;
    isLocal: boolean;
    videoTrack?: string;
    audioTrack?: string;
    isHandRaised?: boolean;
    metadata?: string;
    auxiliaryTracks?: string[];
    roleName?: string;
}

export enum VideoRoomState {
    Disconnected = 'disconnected',
    Connecting = 'connecting',
    Connected = 'connected',
    Reconnecting = 'reconnecting',
}

export interface VideoActions {
    join(params: { authToken: string; userName: string; metadata?: string }): Promise<void>;
    leave(): Promise<void>;
    setLocalAudioEnabled(enabled: boolean): Promise<void>;
    setLocalVideoEnabled(enabled: boolean): Promise<void>;
    raiseHand(): Promise<void>;
    lowerHand(): Promise<void>;
    sendMessage(text: string, type?: string): Promise<void>;
}

export interface VideoNotification {
    type: VideoNotificationType;
    data?: unknown;
}

export enum VideoNotificationType {
    RemovedFromRoom = 'REMOVED_FROM_ROOM',
    RoomEnded = 'ROOM_ENDED',
    RoleUpdated = 'ROLE_UPDATED',
    NewMessage = 'NEW_MESSAGE',
}

export interface VideoMessageData {
    id?: string;
    message: string;
    senderName?: string;
    type?: string;
    time?: number | Date;
}

export interface VideoRoomContext {
    peers: VideoPeer[];
    localPeer: VideoPeer | null;
    isLocalAudioEnabled: boolean;
    isLocalVideoEnabled: boolean;
    roomState: VideoRoomState;
    dominantSpeaker: VideoPeer | null;
    isPeerAudioEnabled(peerId: string): boolean;
    actions: VideoActions;
    notification: VideoNotification | null;
    autoplayError: unknown;
    unblockAudio: () => Promise<void>;
    resetAutoplayError: () => void;
}

export interface VideoTrackResult {
    videoRef: React.RefCallback<HTMLVideoElement>;
}
