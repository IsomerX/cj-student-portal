'use client';

import { type ReactNode, useCallback, useMemo, useEffect, useState } from 'react';
import {
    HMSRoomProvider,
    useHMSActions,
    useHMSStore,
    useHMSNotifications,
    useAutoplayError,
    selectPeers,
    selectLocalPeer,
    selectIsLocalAudioEnabled,
    selectIsLocalVideoEnabled,
    selectRoomState,
    selectIsPeerAudioEnabled,
    selectDominantSpeaker,
    HMSNotificationTypes,
} from '@100mslive/react-sdk';
import { HMSRoomState } from '@100mslive/react-sdk';
import type { HMSPeer } from '@100mslive/react-sdk';
import { VideoContext } from '../context';
import {
    type VideoPeer,
    type VideoActions,
    type VideoRoomContext,
    type VideoNotification,
    VideoRoomState,
    VideoNotificationType,
} from '../types';

function mapHmsPeerToVideoPeer(peer: HMSPeer): VideoPeer {
    return {
        id: peer.id,
        name: peer.name || '',
        role: peer.roleName || '',
        isLocal: peer.isLocal,
        videoTrack: peer.videoTrack,
        audioTrack: peer.audioTrack,
        isHandRaised: (peer as HMSPeer & { isHandRaised?: boolean }).isHandRaised,
        metadata: peer.metadata,
        auxiliaryTracks: peer.auxiliaryTracks,
        roleName: peer.roleName,
    };
}

function mapHmsRoomState(state: HMSRoomState): VideoRoomState {
    switch (state) {
        case HMSRoomState.Connected:
            return VideoRoomState.Connected;
        case HMSRoomState.Connecting:
            return VideoRoomState.Connecting;
        case HMSRoomState.Reconnecting:
            return VideoRoomState.Reconnecting;
        case HMSRoomState.Disconnected:
        case HMSRoomState.Disconnecting:
        default:
            return VideoRoomState.Disconnected;
    }
}

function HmsVideoContextProvider({ children }: { children: ReactNode }) {
    const hmsActions = useHMSActions();
    const hmsPeers = useHMSStore(selectPeers);
    const hmsLocalPeer = useHMSStore(selectLocalPeer);
    const isLocalAudioEnabled = useHMSStore(selectIsLocalAudioEnabled);
    const isLocalVideoEnabled = useHMSStore(selectIsLocalVideoEnabled);
    const hmsRoomState = useHMSStore(selectRoomState);
    const hmsDominantSpeaker = useHMSStore(selectDominantSpeaker);
    const hmsNotification = useHMSNotifications();
    const { error: autoplayError, unblockAudio, resetError: resetAutoplayError } = useAutoplayError();

    // Build a peer audio state map using a single store subscription.
    // Calling useHMSStore (a hook) inside a callback violates Rules of Hooks,
    // so we compute the full map here at the component level instead.
    const peerAudioMap = useHMSStore((store) => {
        const peers = selectPeers(store);
        const result: Record<string, boolean> = {};
        for (const peer of peers) {
            result[peer.id] = selectIsPeerAudioEnabled(peer.id)(store);
        }
        return result;
    });

    const isPeerAudioEnabled = useCallback((peerId: string) => {
        return peerAudioMap[peerId] ?? false;
    }, [peerAudioMap]);

    const peers = useMemo(() => hmsPeers.map(mapHmsPeerToVideoPeer), [hmsPeers]);
    const localPeer = useMemo(() => hmsLocalPeer ? mapHmsPeerToVideoPeer(hmsLocalPeer) : null, [hmsLocalPeer]);
    const dominantSpeaker = useMemo(() => hmsDominantSpeaker ? mapHmsPeerToVideoPeer(hmsDominantSpeaker) : null, [hmsDominantSpeaker]);
    const roomState = mapHmsRoomState(hmsRoomState);

    // Map notifications
    const [notification, setNotification] = useState<VideoNotification | null>(null);

    useEffect(() => {
        if (!hmsNotification) {
            return;
        }

        let mappedType: VideoNotificationType | null = null;

        switch (hmsNotification.type) {
            case HMSNotificationTypes.REMOVED_FROM_ROOM:
                mappedType = VideoNotificationType.RemovedFromRoom;
                break;
            case HMSNotificationTypes.ROOM_ENDED:
                mappedType = VideoNotificationType.RoomEnded;
                break;
            case HMSNotificationTypes.ROLE_UPDATED:
                mappedType = VideoNotificationType.RoleUpdated;
                break;
            case HMSNotificationTypes.NEW_MESSAGE:
                mappedType = VideoNotificationType.NewMessage;
                break;
        }

        if (mappedType) {
            setNotification({ type: mappedType, data: hmsNotification.data });
        }
    }, [hmsNotification]);

    const actions: VideoActions = useMemo(() => ({
        join: async (params) => {
            await hmsActions.join({
                authToken: params.authToken,
                userName: params.userName,
            });
        },
        leave: async () => {
            await hmsActions.leave();
        },
        setLocalAudioEnabled: async (enabled) => {
            await hmsActions.setLocalAudioEnabled(enabled);
        },
        setLocalVideoEnabled: async (enabled) => {
            await hmsActions.setLocalVideoEnabled(enabled);
        },
        raiseHand: async () => {
            await hmsActions.raiseLocalPeerHand();
        },
        lowerHand: async () => {
            await hmsActions.lowerLocalPeerHand();
        },
        sendMessage: async (text, type) => {
            await hmsActions.sendBroadcastMessage(text, type);
        },
    }), [hmsActions]);

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
        autoplayError,
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
        autoplayError,
        unblockAudio,
        resetAutoplayError,
    ]);

    return (
        <VideoContext.Provider value={ctx}>
            {children}
        </VideoContext.Provider>
    );
}

export function HmsVideoProvider({ children }: { children: ReactNode }) {
    return (
        <HMSRoomProvider>
            <HmsVideoContextProvider>{children}</HmsVideoContextProvider>
        </HMSRoomProvider>
    );
}
