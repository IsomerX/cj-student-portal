'use client';

import { type ReactNode, useCallback, useMemo, useState, useEffect, useRef } from 'react';
import {
    LiveKitRoom,
    useParticipants,
    useLocalParticipant,
    useRoomContext,
    useTracks,
} from '@livekit/components-react';
import {
    Track,
    RoomEvent,
    type Participant,
    type RemoteParticipant,
    type LocalParticipant,
    type DataPublishOptions,
    ConnectionState,
} from 'livekit-client';
import { VideoContext } from '../context';
import {
    type VideoPeer,
    type VideoActions,
    type VideoRoomContext,
    type VideoNotification,
    VideoRoomState,
    VideoNotificationType,
} from '../types';

function mapParticipantToVideoPeer(participant: Participant): VideoPeer {
    const videoPublication = participant.getTrackPublication(Track.Source.Camera);
    const audioPublication = participant.getTrackPublication(Track.Source.Microphone);
    const screenPublication = participant.getTrackPublication(Track.Source.ScreenShare);

    let isHandRaised = false;
    let role = 'viewer';

    if (participant.metadata) {
        try {
            const meta = JSON.parse(participant.metadata);
            isHandRaised = !!meta.handRaised;
            role = meta.role || 'viewer';
        } catch {
            // ignore parse errors
        }
    }

    const auxiliaryTracks: string[] = [];
    if (screenPublication?.trackSid) {
        auxiliaryTracks.push(screenPublication.trackSid);
    }

    return {
        id: participant.identity,
        name: participant.name || participant.identity,
        role,
        isLocal: participant.isLocal,
        videoTrack: videoPublication?.trackSid,
        audioTrack: audioPublication?.trackSid,
        isHandRaised,
        metadata: participant.metadata,
        auxiliaryTracks,
        roleName: role,
    };
}

function mapConnectionState(state: ConnectionState): VideoRoomState {
    switch (state) {
        case ConnectionState.Connected:
            return VideoRoomState.Connected;
        case ConnectionState.Connecting:
            return VideoRoomState.Connecting;
        case ConnectionState.Reconnecting:
            return VideoRoomState.Reconnecting;
        case ConnectionState.Disconnected:
        default:
            return VideoRoomState.Disconnected;
    }
}

function LiveKitVideoContextProvider({ children }: { children: ReactNode }) {
    const room = useRoomContext();
    const participants = useParticipants();
    const { localParticipant } = useLocalParticipant();
    const trackRefs = useTracks(
        [
            { source: Track.Source.Camera, withPlaceholder: true },
            { source: Track.Source.Microphone, withPlaceholder: true },
            { source: Track.Source.ScreenShare, withPlaceholder: true },
        ],
        { onlySubscribed: false }
    );

    const [notification, setNotification] = useState<VideoNotification | null>(null);
    const [dominantSpeakerId, setDominantSpeakerId] = useState<string | null>(null);

    // Track audio/video enabled state from local participant
    const isLocalAudioEnabled = localParticipant?.isMicrophoneEnabled ?? false;
    const isLocalVideoEnabled = localParticipant?.isCameraEnabled ?? false;

    const roomState = mapConnectionState(room.state);

    // Listen for room events
    useEffect(() => {
        const handleDisconnected = (reason?: unknown) => {
            const reasonStr = typeof reason === 'string' ? reason : '';
            if (reasonStr.includes('removed') || reasonStr.includes('banned')) {
                setNotification({
                    type: VideoNotificationType.RemovedFromRoom,
                    data: { reason: reasonStr },
                });
            } else {
                setNotification({
                    type: VideoNotificationType.RoomEnded,
                    data: { reason: reasonStr },
                });
            }
        };

        const handleActiveSpeakersChanged = (speakers: Participant[]) => {
            if (speakers.length > 0) {
                setDominantSpeakerId(speakers[0].identity);
            } else {
                setDominantSpeakerId(null);
            }
        };

        const handleDataReceived = (
            payload: Uint8Array,
            participant?: RemoteParticipant,
            _kind?: unknown,
            topic?: string
        ) => {
            const text = new TextDecoder().decode(payload);
            const senderName = participant?.name || participant?.identity || 'Unknown';

            setNotification({
                type: VideoNotificationType.NewMessage,
                data: {
                    id: `${Date.now()}-${Math.random()}`,
                    message: text,
                    senderName,
                    type: topic || 'chat',
                    time: Date.now(),
                },
            });
        };

        const handleParticipantMetadataChanged = (
            _prevMetadata: string | undefined,
            participant: Participant
        ) => {
            if (participant.isLocal) {
                setNotification({
                    type: VideoNotificationType.RoleUpdated,
                    data: mapParticipantToVideoPeer(participant),
                });
            }
        };

        const handleParticipantPermissionsChanged = (
            _prevPermissions: unknown,
            participant: Participant
        ) => {
            // When the server updates publish permissions, emit a RoleUpdated notification
            // so the UI reacts (e.g., enabling/disabling mic & camera buttons)
            if (participant.isLocal) {
                setNotification({
                    type: VideoNotificationType.RoleUpdated,
                    data: mapParticipantToVideoPeer(participant),
                });
            }
        };

        room.on(RoomEvent.Disconnected, handleDisconnected);
        room.on(RoomEvent.ActiveSpeakersChanged, handleActiveSpeakersChanged);
        room.on(RoomEvent.DataReceived, handleDataReceived);
        room.on(RoomEvent.ParticipantMetadataChanged, handleParticipantMetadataChanged);
        room.on(RoomEvent.ParticipantPermissionsChanged, handleParticipantPermissionsChanged);

        return () => {
            room.off(RoomEvent.Disconnected, handleDisconnected);
            room.off(RoomEvent.ActiveSpeakersChanged, handleActiveSpeakersChanged);
            room.off(RoomEvent.DataReceived, handleDataReceived);
            room.off(RoomEvent.ParticipantMetadataChanged, handleParticipantMetadataChanged);
            room.off(RoomEvent.ParticipantPermissionsChanged, handleParticipantPermissionsChanged);
        };
    }, [room]);

    const peers = useMemo(
        () => participants.map(mapParticipantToVideoPeer),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [participants, trackRefs]
    );

    const localPeer = useMemo(
        () => (localParticipant ? mapParticipantToVideoPeer(localParticipant) : null),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [localParticipant, trackRefs]
    );

    const dominantSpeaker = useMemo(
        () => peers.find((p) => p.id === dominantSpeakerId) ?? null,
        [peers, dominantSpeakerId]
    );

    const isPeerAudioEnabled = useCallback(
        (peerId: string) => {
            const participant = participants.find((p) => p.identity === peerId);
            if (!participant) return false;
            return participant.isMicrophoneEnabled;
        },
        [participants]
    );

    const actions: VideoActions = useMemo(() => ({
        join: async (params) => {
            const serverUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL;
            if (!serverUrl) {
                throw new Error('NEXT_PUBLIC_LIVEKIT_URL is not configured');
            }
            await room.connect(serverUrl, params.authToken, {
                autoSubscribe: true,
            });
            if (params.userName && room.localParticipant) {
                await room.localParticipant.setName(params.userName);
            }
        },
        leave: async () => {
            await room.disconnect();
        },
        setLocalAudioEnabled: async (enabled) => {
            await localParticipant?.setMicrophoneEnabled(enabled);
        },
        setLocalVideoEnabled: async (enabled) => {
            await localParticipant?.setCameraEnabled(enabled);
        },
        raiseHand: async () => {
            if (!localParticipant) return;
            const currentMeta = localParticipant.metadata
                ? (() => { try { return JSON.parse(localParticipant.metadata!); } catch { return {}; } })()
                : {};
            await localParticipant.setMetadata(JSON.stringify({ ...currentMeta, handRaised: true }));
        },
        lowerHand: async () => {
            if (!localParticipant) return;
            const currentMeta = localParticipant.metadata
                ? (() => { try { return JSON.parse(localParticipant.metadata!); } catch { return {}; } })()
                : {};
            await localParticipant.setMetadata(JSON.stringify({ ...currentMeta, handRaised: false }));
        },
        sendMessage: async (text, type) => {
            if (!localParticipant) return;
            const data = new TextEncoder().encode(text);
            const options: DataPublishOptions = {};
            if (type) {
                options.topic = type;
            } else {
                options.topic = 'chat';
            }
            await localParticipant.publishData(data, options);
        },
    }), [room, localParticipant]);

    const unblockAudio = useCallback(async () => {
        await room.startAudio();
    }, [room]);

    const resetAutoplayError = useCallback(() => {
        // No-op for LiveKit — autoplay handling is built in
    }, []);

    const ctx: VideoRoomContext = useMemo(() => ({
        peers,
        localPeer,
        isLocalAudioEnabled,
        isLocalVideoEnabled,
        roomState,
        dominantSpeaker,
        isPeerAudioEnabled,
        actions,
        notification,
        autoplayError: null,
        unblockAudio,
        resetAutoplayError,
    }), [
        peers,
        localPeer,
        isLocalAudioEnabled,
        isLocalVideoEnabled,
        roomState,
        dominantSpeaker,
        isPeerAudioEnabled,
        actions,
        notification,
        unblockAudio,
        resetAutoplayError,
    ]);

    return (
        <VideoContext.Provider value={ctx}>
            {children}
        </VideoContext.Provider>
    );
}

export function LiveKitVideoProvider({ children }: { children: ReactNode }) {
    const serverUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL || '';

    return (
        <LiveKitRoom
            serverUrl={serverUrl}
            token=""
            connect={false}
            audio={false}
            video={false}
        >
            <LiveKitVideoContextProvider>{children}</LiveKitVideoContextProvider>
        </LiveKitRoom>
    );
}
