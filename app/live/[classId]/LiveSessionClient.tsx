"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useSearchParams, useRouter, useParams } from "next/navigation";
import {
    useHMSActions,
    useHMSStore,
    useHMSNotifications,
    useAutoplayError,
    useVideo,
    selectPeers,
    selectLocalPeer,
    selectIsLocalAudioEnabled,
    selectIsLocalVideoEnabled,
    selectRoomState,
    selectIsPeerAudioEnabled,
    selectDominantSpeaker,
    HMSNotificationTypes,
} from "@100mslive/react-sdk";
import { HMSRoomState } from "@100mslive/react-sdk";
import type { HMSPeer } from "@100mslive/react-sdk";
import {
    ArrowLeft,
    Clock,
    AlertCircle,
    Mic,
    MicOff,
    Hand,
    MessageCircle,
    PhoneOff,
    SmilePlus,
    MonitorUp,
    X,
    Send,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { joinLiveClass, LiveClassesApiError } from "@/lib/api/live-classes";
import { useLiveClassTokenQuery } from "@/hooks/use-live-classes";
import { liveClassQueryKeys } from "@/lib/query-keys";

// ─── Types ───────────────────────────────────────────────────────────────────

type ConnectionState = "loading" | "waiting" | "joining" | "fetching-token" | "connecting" | "connected" | "disconnected" | "removed" | "error";

interface ChatMessage {
    id: string;
    sender: string;
    text: string;
    timestamp: Date;
    isLocal?: boolean;
}

interface FloatingEmoji {
    id: number;
    emoji: string;
    sender: string;
    left: number;
}

const EMOJI_FLOAT_ANIMATION = "emoji-float 4.8s ease-out forwards";
const EMOJI_LIFETIME_MS = 5200;

// ─── Sub-components ──────────────────────────────────────────────────────────

function VideoTile({
    peer,
    isLocal,
    noRound,
    isActiveSpeaker,
    videoFit = "cover",
}: {
    peer: HMSPeer;
    isLocal?: boolean;
    noRound?: boolean;
    isActiveSpeaker?: boolean;
    videoFit?: "cover" | "contain";
}) {
    const { videoRef } = useVideo({ trackId: peer.videoTrack });
    const isAudioEnabled = useHMSStore(selectIsPeerAudioEnabled(peer.id));
    const hasVideo = !!peer.videoTrack;
    const initials = (peer.name || "?").charAt(0).toUpperCase();

    return (
        <div className={`relative w-full h-full bg-gray-900 overflow-hidden transition-shadow duration-300 ${noRound ? "" : "rounded-2xl"} ${isActiveSpeaker ? "ring-[3px] ring-green-400 shadow-[0_0_16px_rgba(74,222,128,0.4)]" : isLocal ? "ring-2 ring-[#414141]" : ""}`}>
            <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                className={`pointer-events-none h-full w-full ${videoFit === "contain" ? "object-contain" : "object-cover"} ${!hasVideo ? "hidden" : ""}`}
            />
            {!hasVideo && (
                <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
                    <div className="w-16 h-16 rounded-full bg-[#414141]/30 border-2 border-[#414141]/50 flex items-center justify-center">
                        <span className="text-xl font-semibold text-white/90">{initials}</span>
                    </div>
                </div>
            )}
            <div className="absolute bottom-2 left-2">
                <span className="px-2 py-1 text-xs font-medium text-white bg-black/60 backdrop-blur-sm rounded-lg truncate max-w-[140px] block">
                    {peer.name || "Participant"}{isLocal ? " (You)" : ""}
                </span>
            </div>
            {!isAudioEnabled && (
                <div className="absolute bottom-2 right-2">
                    <div className="w-6 h-6 rounded-full bg-red-500/90 flex items-center justify-center">
                        <MicOff className="w-3 h-3 text-white" />
                    </div>
                </div>
            )}
        </div>
    );
}

function ScreenShareView({ trackId, peerName, noRound }: { trackId: string; peerName?: string; noRound?: boolean }) {
    const { videoRef } = useVideo({ trackId });
    return (
        <div className={`relative w-full h-full bg-black overflow-hidden ${noRound ? "" : "rounded-2xl"}`}>
            <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                className="pointer-events-none h-full w-full object-contain"
            />
            <div className="absolute bottom-2 left-2">
                <span className="inline-flex items-center gap-1.5 px-2 py-1 text-xs font-medium text-white bg-black/60 backdrop-blur-sm rounded-lg">
                    <MonitorUp className="w-3 h-3" />
                    {peerName ? `${peerName}'s screen` : "Screen share"}
                </span>
            </div>
        </div>
    );
}

function EmojiOverlay({ emojis }: { emojis: FloatingEmoji[] }) {
    return (
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-50">
            {emojis.map((e) => (
                <div
                    key={e.id}
                    className="absolute flex flex-col items-center"
                    style={{
                        bottom: -60,
                        left: `${e.left}%`,
                        animation: EMOJI_FLOAT_ANIMATION,
                    }}
                >
                    <span className="text-3xl sm:text-4xl">{e.emoji}</span>
                    <span className="mt-1 max-w-[140px] truncate rounded-full bg-black/70 px-2.5 py-1 text-xs font-semibold text-white shadow-lg backdrop-blur-sm sm:max-w-[180px]">
                        {e.sender}
                    </span>
                </div>
            ))}
        </div>
    );
}

function ChatPanel({
    messages,
    onSend,
    onClose,
}: {
    messages: ChatMessage[];
    onSend: (text: string) => void;
    onClose: () => void;
}) {
    const [text, setText] = useState("");
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    }, [messages.length]);

    const handleSend = () => {
        const trimmed = text.trim();
        if (!trimmed) return;
        onSend(trimmed);
        setText("");
    };

    return (
        <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-t-2xl border border-[#e5e5e5] bg-white sm:rounded-2xl">
            <div className="flex shrink-0 items-center justify-between border-b border-[#e5e5e5] px-4 py-3">
                <span className="font-bold text-[#414141]">Chat</span>
                <button onClick={onClose} className="p-1 rounded-lg hover:bg-[#f5f5f5] transition-colors">
                    <X className="w-5 h-5 text-[#737373]" />
                </button>
            </div>
            <div
                ref={scrollRef}
                className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-contain px-4 py-3 space-y-3 scrollbar-thin"
            >
                {messages.length === 0 && (
                    <p className="text-sm text-[#737373] text-center py-8">No messages yet</p>
                )}
                {messages.map((msg) => (
                    <div key={msg.id} className="min-w-0 overflow-hidden">
                        <span className="block truncate text-xs font-semibold text-[#c4a57b]">{msg.sender}</span>
                        <p className="break-words whitespace-pre-wrap text-sm leading-relaxed text-[#414141]">
                            {msg.text}
                        </p>
                    </div>
                ))}
            </div>
            <div className="flex shrink-0 items-center gap-2 border-t border-[#e5e5e5] px-3 py-3">
                <input
                    type="text"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSend()}
                    placeholder="Type a message..."
                    className="min-w-0 flex-1 rounded-xl bg-[#f5f5f5] px-3 py-2.5 text-sm text-[#414141] outline-none placeholder:text-[#a8a8a8] focus:ring-1 focus:ring-[#414141]/20"
                />
                <button
                    onClick={handleSend}
                    disabled={!text.trim()}
                    className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors ${
                        text.trim() ? "bg-[#c4a57b] text-white" : "bg-[#e7e7e7] text-[#a8a8a8]"
                    }`}
                >
                    <Send className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}

// ─── Reaction emojis ─────────────────────────────────────────────────────────

const REACTION_EMOJIS = ["👍", "❤️", "😂", "😮", "👏", "🎉"];

// ─── Main Component ──────────────────────────────────────────────────────────

export default function LiveSessionClient() {
    const router = useRouter();
    const params = useParams() as { classId: string };
    const searchParams = useSearchParams();
    const title = searchParams?.get("title") || "Live Class";

    // Query client for cache invalidation
    const queryClient = useQueryClient();

    // HMS hooks
    const hmsActions = useHMSActions();
    const peers = useHMSStore(selectPeers);
    const localPeer = useHMSStore(selectLocalPeer);
    const isAudioEnabled = useHMSStore(selectIsLocalAudioEnabled);
    const isVideoEnabled = useHMSStore(selectIsLocalVideoEnabled);
    const roomState = useHMSStore(selectRoomState);
    const dominantSpeaker = useHMSStore(selectDominantSpeaker);
    const notification = useHMSNotifications();
    const { error: autoplayError, unblockAudio, resetError: resetAutoplayError } = useAutoplayError();

    // State
    const [connectionState, setConnectionState] = useState<ConnectionState>("loading");
    const [errorMessage, setErrorMessage] = useState("");
    const [showChat, setShowChat] = useState(false);
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isHandRaised, setIsHandRaised] = useState(false);
    const [floatingEmojis, setFloatingEmojis] = useState<FloatingEmoji[]>([]);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [showMicPermissionDialog, setShowMicPermissionDialog] = useState(false);
    const [micPermissionMessage, setMicPermissionMessage] = useState(
        "Allow microphone access to speak when your teacher brings you on stage."
    );
    const [micPermissionNeedsSettings, setMicPermissionNeedsSettings] = useState(false);
    const [isRetryingMicPermission, setIsRetryingMicPermission] = useState(false);

    // Landscape / fullscreen controls
    const [isLandscape, setIsLandscape] = useState(false);
    const [showControls, setShowControls] = useState(false);
    const [viewportHeight, setViewportHeight] = useState<number | null>(null);
    const controlsTimerRef = useRef<NodeJS.Timeout | null>(null);
    const viewportSyncFrameRef = useRef<number | null>(null);
    const viewportSyncTimeoutsRef = useRef<number[]>([]);

    const hasJoinedRef = useRef(false);
    const reactionCooldownUntilRef = useRef(0);

    // Token polling — disabled once connected, removed, disconnected, or errored
    const shouldPollToken = !!params?.classId &&
        connectionState !== "connected" &&
        connectionState !== "connecting" &&
        connectionState !== "removed" &&
        connectionState !== "disconnected" &&
        connectionState !== "error";

    const { data: tokenData, error, isError, isFetching, refetch: refetchToken } = useLiveClassTokenQuery(
        params?.classId,
        shouldPollToken
    );

    // Determine current role
    const currentRole = localPeer?.roleName || "viewer";
    const canPublishAudio = currentRole === "viewer-on-stage" || currentRole === "co-broadcaster" || currentRole === "broadcaster";

    // Find broadcaster/teacher peer
    const broadcasterPeer =
        peers.find((p) => !p.isLocal && p.roleName === "broadcaster") ||
        peers.find((p) => !p.isLocal && p.roleName === "co-broadcaster") ||
        peers.find((p) => !p.isLocal && p.roleName === "viewer-on-stage") ||
        peers.find((p) => !p.isLocal && p.videoTrack) ||
        peers.find((p) => !p.isLocal);

    // Screen share detection
    const screenSharePeer = peers.find((p) => p.auxiliaryTracks?.length);
    const screenShareTrackId = screenSharePeer?.auxiliaryTracks?.[0];
    const hasScreenShare = !!screenShareTrackId;

    // Teacher camera track during screen share
    const teacherCameraTrackId = hasScreenShare ? broadcasterPeer?.videoTrack : null;

    // Other participants (not broadcaster, not local)
    const participantPeers = peers.filter((p) => p !== broadcasterPeer && !p.isLocal);

    // ─── Token polling → join flow ──────────────────────────────────────────

    useEffect(() => {
        if (
            isFetching ||
            hasJoinedRef.current ||
            connectionState === "joining" ||
            connectionState === "connecting" ||
            connectionState === "connected" ||
            connectionState === "removed" ||
            connectionState === "disconnected" ||
            connectionState === "error"
        ) {
            return;
        }

        if (tokenData?.token) {
            hasJoinedRef.current = true;
            setConnectionState("joining");
            void (async () => {
                try {
                    setConnectionState("connecting");
                    const userStr = typeof window !== "undefined" ? localStorage.getItem("user") : null;
                    const user = userStr ? JSON.parse(userStr) : { name: "Student" };

                    await hmsActions.join({
                        authToken: tokenData.token,
                        userName: user.name || "Student",
                    });

                    try {
                        await joinLiveClass(params.classId);
                    } catch (attendanceErr) {
                        console.warn("Failed to record attendance:", attendanceErr);
                    }
                } catch (err) {
                    console.error("Failed to join room:", err);
                    hasJoinedRef.current = false;
                    setErrorMessage(err instanceof Error ? err.message : "Failed to join the session");
                    setConnectionState("error");
                }
            })();
        } else if (isError) {
            const liveClassError = error instanceof LiveClassesApiError ? error : null;
            const errMessage = liveClassError?.message || "";
            const errLower = errMessage.toLowerCase();
            const is403 = liveClassError?.status === 403 || errLower.includes("403");
            const isEnded =
                liveClassError?.status === 410 ||
                errLower.includes("class has ended") ||
                errLower.includes("session has ended") ||
                errLower.includes("was cancelled");
            hasJoinedRef.current = false;

            if (isEnded) {
                setErrorMessage(errMessage || "The live session has ended.");
                setConnectionState("removed");
            // Banned or suspended — show error, don't poll
            } else if (errLower.includes("banned") || errLower.includes("suspended")) {
                setErrorMessage(errMessage);
                setConnectionState("error");
            // Waiting room — keep polling
            } else if (is403 && (errLower.includes("not admitted") || errLower.includes("not invited"))) {
                setConnectionState("waiting");
            // Other 403 — show error
            } else if (is403) {
                setErrorMessage(errMessage || "You don't have access to this class");
                setConnectionState("error");
            } else {
                setErrorMessage(errMessage || "Failed to join class");
                setConnectionState("error");
            }
        } else if (!tokenData) {
            hasJoinedRef.current = false;
            setConnectionState("loading");
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tokenData, error, isError, isFetching, hmsActions, params.classId]);

    // Waiting room polling
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (connectionState === "waiting") {
            interval = setInterval(() => {
                void refetchToken();
            }, 3000);
        }
        return () => clearInterval(interval);
    }, [connectionState, refetchToken]);

    // Sync room state
    useEffect(() => {
        if (roomState === HMSRoomState.Connected) {
            setConnectionState("connected");
        } else if (roomState === HMSRoomState.Disconnected && connectionState === "connected") {
            setConnectionState("disconnected");
        }
    }, [roomState, connectionState]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            hmsActions.leave().catch(() => {
                // Ignore teardown errors during navigation/reload
            });
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        const root = document.documentElement;
        const body = document.body;
        const previousRootOverflow = root.style.overflow;
        const previousBodyOverflow = body.style.overflow;
        const previousBodyOverscroll = body.style.overscrollBehavior;
        const previousBodyTouchAction = body.style.touchAction;

        root.style.overflow = "hidden";
        body.style.overflow = "hidden";
        body.style.overscrollBehavior = "none";
        body.style.touchAction = "manipulation";

        const getStableViewportHeight = () => {
            const fallbackHeight = Math.round(
                Math.max(window.innerHeight, document.documentElement.clientHeight)
            );
            const visualViewport = window.visualViewport;

            if (!visualViewport) {
                return fallbackHeight;
            }

            const visualViewportScale = visualViewport.scale ?? 1;

            // Ignore transient scaled viewport readings during iOS rotation.
            if (Math.abs(visualViewportScale - 1) > 0.02) {
                return fallbackHeight;
            }

            return Math.round(Math.max(fallbackHeight, visualViewport.height));
        };

        const syncViewportHeight = () => {
            if (viewportSyncFrameRef.current !== null) {
                window.cancelAnimationFrame(viewportSyncFrameRef.current);
            }

            viewportSyncFrameRef.current = window.requestAnimationFrame(() => {
                const nextHeight = getStableViewportHeight();
                setViewportHeight((prev) => (prev === nextHeight ? prev : nextHeight));
            });
        };

        const scheduleViewportSettling = () => {
            syncViewportHeight();
            viewportSyncTimeoutsRef.current.forEach((timeoutId) => window.clearTimeout(timeoutId));
            viewportSyncTimeoutsRef.current = [
                window.setTimeout(syncViewportHeight, 120),
                window.setTimeout(syncViewportHeight, 320),
                window.setTimeout(syncViewportHeight, 650),
            ];
        };

        scheduleViewportSettling();

        window.addEventListener("resize", syncViewportHeight);
        window.addEventListener("orientationchange", scheduleViewportSettling);
        window.visualViewport?.addEventListener("resize", scheduleViewportSettling);

        return () => {
            window.removeEventListener("resize", syncViewportHeight);
            window.removeEventListener("orientationchange", scheduleViewportSettling);
            window.visualViewport?.removeEventListener("resize", scheduleViewportSettling);

            if (viewportSyncFrameRef.current !== null) {
                window.cancelAnimationFrame(viewportSyncFrameRef.current);
            }

            viewportSyncTimeoutsRef.current.forEach((timeoutId) => window.clearTimeout(timeoutId));
            viewportSyncTimeoutsRef.current = [];

            root.style.overflow = previousRootOverflow;
            body.style.overflow = previousBodyOverflow;
            body.style.overscrollBehavior = previousBodyOverscroll;
            body.style.touchAction = previousBodyTouchAction;
        };
    }, []);

    // ─── Landscape detection ──────────────────────────────────────────────

    useEffect(() => {
        const mql = window.matchMedia("(orientation: landscape)");
        const check = () => {
            // Only count as landscape on mobile-sized screens (not desktop)
            setIsLandscape(mql.matches && window.innerWidth < 1024);
        };
        check();
        mql.addEventListener("change", check);
        return () => {
            mql.removeEventListener("change", check);
        };
    }, []);

    const resetControlsTimer = useCallback(() => {
        setShowControls(true);
        if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current);
        controlsTimerRef.current = setTimeout(() => {
            setShowControls(false);
            setShowEmojiPicker(false);
        }, 4000);
    }, []);

    const handleStageTap = useCallback(() => {
        if (!isLandscape) return;
        if (showControls) {
            // Tap while visible → hide immediately
            if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current);
            setShowControls(false);
            setShowEmojiPicker(false);
        } else {
            resetControlsTimer();
        }
    }, [isLandscape, showControls, resetControlsTimer]);

    useEffect(() => {
        if (!isLandscape || connectionState !== "connected") {
            return;
        }

        resetControlsTimer();
    }, [connectionState, isLandscape, resetControlsTimer]);

    // Clear timer on unmount
    useEffect(() => {
        return () => {
            if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current);
        };
    }, []);

    const triggerEmoji = useCallback((emoji: string, sender: string) => {
        const entry: FloatingEmoji = {
            id: Date.now() + Math.random(),
            emoji,
            sender,
            left: 10 + Math.random() * 75,
        };
        setFloatingEmojis((prev) => [...prev, entry]);
        setTimeout(() => {
            setFloatingEmojis((prev) => prev.filter((e) => e.id !== entry.id));
        }, EMOJI_LIFETIME_MS);
    }, []);

    // ─── Handle removal / room end ─────────────────────────────────────────

    useEffect(() => {
        if (!notification) return;

        if (notification.type === HMSNotificationTypes.REMOVED_FROM_ROOM) {
            // Immediately nuke the cached token so re-navigation can't reuse it
            queryClient.removeQueries({ queryKey: liveClassQueryKeys.token(params.classId) });

            const reason = (notification.data as { reason?: string } | undefined)?.reason || "";
            const isBan = reason.toLowerCase().includes("ban");
            setErrorMessage(
                isBan
                    ? "You have been removed from this class."
                    : "The live session has ended."
            );
            setConnectionState("removed");
            return;
        }

        if (notification.type === HMSNotificationTypes.ROOM_ENDED) {
            queryClient.removeQueries({ queryKey: liveClassQueryKeys.token(params.classId) });
            setErrorMessage("The live session has ended.");
            setConnectionState("removed");
            return;
        }
    }, [notification, params.classId, queryClient]);

    // ─── Notifications (chat, emoji, hand raise) ────────────────────────────

    useEffect(() => {
        if (!notification) return;

        if (notification.type === HMSNotificationTypes.ROLE_UPDATED) {
            const peer = notification.data as HMSPeer | undefined;
            if (!peer?.isLocal || !peer.roleName) {
                return;
            }

            if (peer.roleName === "viewer-on-stage") {
                toast.success("You've been brought on stage");
            } else if (peer.roleName === "viewer") {
                toast.info("You've been moved off stage");
            }

            return;
        }

        if (notification.type === HMSNotificationTypes.NEW_MESSAGE) {
            const msg = notification.data;
            if (!msg) return;

            if (msg.type === "message_deleted") {
                try {
                    const parsed = JSON.parse(msg.message);
                    if (parsed.messageId) {
                        setChatMessages((prev) => prev.filter((m) => m.id !== parsed.messageId));
                    }
                } catch { /* ignore */ }
                return;
            }

            if (msg.type === "emoji_reaction") {
                try {
                    const parsed = JSON.parse(msg.message);
                    if (parsed.emoji) {
                        triggerEmoji(parsed.emoji, msg.senderName || "Someone");
                    }
                } catch { /* ignore */ }
                return;
            }

            // Camera request from teacher — handled in a separate effect
            if (msg.type === "request_video") return;

            const newMsg: ChatMessage = {
                id: msg.id || Date.now().toString(),
                sender: msg.senderName || "Unknown",
                text: msg.message || "",
                timestamp: new Date(msg.time || Date.now()),
                isLocal: false,
            };
            setChatMessages((prev) => [...prev, newMsg]);
            if (!showChat) setUnreadCount((c) => c + 1);
        }
    }, [notification, showChat, triggerEmoji]);

    // ─── Actions ─────────────────────────────────────────────────────────────

    const requestMicrophonePermission = useCallback(async () => {
        if (!navigator.mediaDevices?.getUserMedia) {
            throw new Error("This browser does not support microphone access.");
        }

        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach((track) => track.stop());
    }, []);

    const showMicrophonePermissionError = useCallback((err: unknown) => {
        const errorName = err instanceof DOMException ? err.name : err instanceof Error ? err.name : "";
        const needsSettings = errorName === "NotAllowedError" || errorName === "SecurityError";

        setMicPermissionNeedsSettings(needsSettings);
        setMicPermissionMessage(
            needsSettings
                ? "Microphone access is blocked. Allow mic access in your browser settings, then try again."
                : "Microphone access is required before you can speak on stage. Please allow access and try again."
        );
        setShowMicPermissionDialog(true);
    }, []);

    const enableMicrophone = useCallback(async () => {
        try {
            await requestMicrophonePermission();
            await hmsActions.setLocalAudioEnabled(true);
            setShowMicPermissionDialog(false);
            setMicPermissionNeedsSettings(false);
        } catch (err) {
            console.error("Failed to enable microphone:", err);
            showMicrophonePermissionError(err);
        }
    }, [hmsActions, requestMicrophonePermission, showMicrophonePermissionError]);

    const requestCameraPermission = useCallback(async () => {
        if (!navigator.mediaDevices?.getUserMedia) {
            throw new Error("This browser does not support camera access.");
        }
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        stream.getTracks().forEach((track) => track.stop());
    }, []);

    const enableCamera = useCallback(async () => {
        try {
            await requestCameraPermission();
            await hmsActions.setLocalVideoEnabled(true);
        } catch (err) {
            console.error("Failed to enable camera:", err);
            toast.error("Could not turn on camera. Please allow camera access in your browser settings.");
        }
    }, [hmsActions, requestCameraPermission]);

    // Auto-enable mic + camera when brought on stage
    useEffect(() => {
        if (!notification) {
            return;
        }

        if (notification.type !== HMSNotificationTypes.ROLE_UPDATED) {
            return;
        }

        const peer = notification.data as HMSPeer | undefined;
        if (peer?.isLocal && peer.roleName === "viewer-on-stage") {
            if (!isAudioEnabled) void enableMicrophone();
            if (!isVideoEnabled) void enableCamera();
        }
    }, [notification, isAudioEnabled, isVideoEnabled, enableMicrophone, enableCamera]);

    // Handle teacher's camera request
    useEffect(() => {
        if (!notification) return;
        if (notification.type !== HMSNotificationTypes.NEW_MESSAGE) return;
        const msg = notification.data;
        if (!msg || msg.type !== "request_video") return;
        toast.info("Your teacher requested you to turn on your camera");
        void enableCamera();
    }, [notification, enableCamera]);

    const handleToggleMute = useCallback(async () => {
        try {
            if (isAudioEnabled) {
                await hmsActions.setLocalAudioEnabled(false);
                return;
            }

            await enableMicrophone();
        } catch (err) {
            console.error("Failed to toggle audio:", err);
        }
    }, [hmsActions, isAudioEnabled, enableMicrophone]);

    const handleToggleHand = useCallback(async () => {
        try {
            if (isHandRaised) {
                await hmsActions.lowerLocalPeerHand();
            } else {
                await hmsActions.raiseLocalPeerHand();
            }
            setIsHandRaised(!isHandRaised);
        } catch (err) {
            console.error("Failed to toggle hand raise:", err);
        }
    }, [hmsActions, isHandRaised]);

    const handleSendChat = useCallback((text: string) => {
        const newMsg: ChatMessage = {
            id: Date.now().toString(),
            sender: localPeer?.name || "You",
            text,
            timestamp: new Date(),
            isLocal: true,
        };
        setChatMessages((prev) => [...prev, newMsg]);
        hmsActions.sendBroadcastMessage(text);
    }, [hmsActions, localPeer?.name]);

    const handleSendReaction = useCallback((emoji: string) => {
        const now = Date.now();
        if (reactionCooldownUntilRef.current > now) {
            toast.error("Slow down a bit before sending another reaction.");
            return;
        }

        reactionCooldownUntilRef.current = now + 1200;
        hmsActions.sendBroadcastMessage(JSON.stringify({ emoji }), "emoji_reaction");
        triggerEmoji(emoji, localPeer?.name || "You");
        setShowEmojiPicker(false);
    }, [hmsActions, localPeer?.name, triggerEmoji]);

    const handleLeave = useCallback(async () => {
        queryClient.removeQueries({ queryKey: liveClassQueryKeys.token(params.classId) });
        try {
            await hmsActions.leave();
        } catch (err) {
            console.warn("Failed to leave room:", err);
        }
        router.push("/live");
    }, [hmsActions, router, queryClient, params.classId]);

    const handleToggleChat = useCallback(() => {
        setShowChat((prev) => {
            if (!prev) setUnreadCount(0);
            return !prev;
        });
    }, []);

    const handleRestoreAudio = useCallback(async () => {
        try {
            await unblockAudio();
            resetAutoplayError();
            toast.success("Audio restored");
        } catch (err) {
            console.error("Failed to restore blocked audio:", err);
            toast.error("Safari is still blocking audio. Tap once more.");
        }
    }, [unblockAudio, resetAutoplayError]);

    const handleRetryMicrophonePermission = useCallback(async () => {
        setIsRetryingMicPermission(true);
        try {
            await enableMicrophone();
        } finally {
            setIsRetryingMicPermission(false);
        }
    }, [enableMicrophone]);

    const liveSessionViewportStyle = viewportHeight
        ? { height: `${viewportHeight}px` }
        : undefined;

    // ─── Pre-connection states ───────────────────────────────────────────────

    if (connectionState !== "connected") {
        return (
            <main
                className="flex min-h-screen w-full max-w-full flex-col items-center justify-center overflow-hidden bg-[#fffbe7] p-5"
                style={liveSessionViewportStyle}
            >
                <div
                    className="absolute left-0 right-0 top-0 flex items-center gap-4 px-4 pb-4 sm:px-6 sm:pb-6"
                    style={{ paddingTop: "max(1rem, calc(env(safe-area-inset-top) + 0.5rem))" }}
                >
                    <button
                        onClick={() => router.push("/live")}
                        className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-[#414141] shadow-sm ring-1 ring-[#e5e7eb] transition-colors hover:bg-[#f9fafb]"
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </button>
                    <span className="min-w-0 truncate font-bold text-[#414141]">{title}</span>
                </div>

                <div className="flex flex-col items-center max-w-sm text-center">
                    {(connectionState === "loading" || connectionState === "fetching-token") && (
                        <div className="flex flex-col items-center animate-pulse">
                            <div className="h-16 w-16 rounded-full border-4 border-[#e5e5e5] border-t-[#414141] animate-spin mb-6" />
                            <p className="text-lg font-bold text-[#414141]">Connecting...</p>
                        </div>
                    )}

                    {connectionState === "waiting" && (
                        <div className="flex flex-col items-center">
                            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white shadow-sm ring-2 ring-[#ece5c8] mb-6">
                                <Clock className="h-8 w-8 text-[#414141]" />
                            </div>
                            <h2 className="text-2xl font-bold text-[#212121] mb-2">Waiting Room</h2>
                            <p className="text-base text-[#737373] px-4">
                                Your teacher will admit you shortly. Do not close this page.
                            </p>
                            <div className="mt-8 flex items-center gap-2 text-sm font-medium text-[#737373]">
                                <span className="flex h-2 w-2 rounded-full bg-current animate-pulse" />
                                Polling for access
                            </div>
                        </div>
                    )}

                    {(connectionState === "joining" || connectionState === "connecting") && (
                        <div className="flex flex-col items-center animate-pulse">
                            <div className="h-16 w-16 rounded-full border-4 border-[#e5e5e5] border-t-[#283618] animate-spin mb-6" />
                            <p className="text-lg font-bold text-[#212121]">Joining class...</p>
                        </div>
                    )}

                    {(connectionState === "removed" || connectionState === "disconnected") && (
                        <div className="flex flex-col items-center">
                            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#f5f0dc] text-[#414141] ring-2 ring-[#ece5c8] mb-6">
                                <PhoneOff className="h-8 w-8" />
                            </div>
                            <h2 className="text-xl font-bold text-[#212121] mb-2">Session Ended</h2>
                            <p className="text-[#737373] font-medium mb-8 px-4">
                                {errorMessage || "You have been disconnected from the session."}
                            </p>
                            <button
                                onClick={() => router.push("/live")}
                                className="rounded-[12px] bg-[#414141] px-8 py-3 font-bold text-white transition-colors hover:bg-[#212121]"
                            >
                                Back to Classes
                            </button>
                        </div>
                    )}

                    {connectionState === "error" && (
                        <div className="flex flex-col items-center">
                            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#fef2f2] text-[#dc2626] ring-1 ring-[#fecaca] mb-6">
                                <AlertCircle className="h-8 w-8" />
                            </div>
                            <p className="text-[#dc2626] font-medium mb-8 px-4">{errorMessage}</p>
                            <button
                                onClick={() => window.location.reload()}
                                className="rounded-[12px] bg-[#414141] px-8 py-3 font-bold text-white transition-colors hover:bg-[#212121]"
                            >
                                Retry
                            </button>
                        </div>
                    )}
                </div>
            </main>
        );
    }

    // ─── Connected — Live Session UI ─────────────────────────────────────────

    // Shared video stage content
    const renderVideoStage = (noRound?: boolean) => (
        <>
            {hasScreenShare && screenShareTrackId ? (
                <div className="relative w-full h-full">
                    <ScreenShareView
                        trackId={screenShareTrackId}
                        peerName={screenSharePeer?.name}
                        noRound={noRound}
                    />
                    {teacherCameraTrackId && broadcasterPeer && (
                        <div className="absolute top-3 right-3 w-24 h-32 sm:w-28 sm:h-36 rounded-xl overflow-hidden shadow-lg border border-white/20">
                            <TeacherPiP peer={broadcasterPeer} />
                        </div>
                    )}
                </div>
            ) : broadcasterPeer ? (
                <div className={`w-full h-full overflow-hidden ${noRound ? "bg-black" : "rounded-2xl bg-[#f5f0dc]"}`}>
                    <VideoTile
                        peer={broadcasterPeer}
                        noRound={noRound}
                        isActiveSpeaker={dominantSpeaker?.id === broadcasterPeer.id}
                        videoFit={noRound ? "contain" : "cover"}
                    />
                </div>
            ) : (
                <div className={`w-full h-full bg-[#f5f0dc] flex items-center justify-center ${noRound ? "" : "rounded-2xl"}`}>
                    <p className="text-[#737373] text-sm">Waiting for teacher to start video...</p>
                </div>
            )}
        </>
    );

    // ─── Landscape fullscreen layout ──────────────────────────────────────

    if (isLandscape && connectionState === "connected") {
        return (
            <div
                className="relative z-[100] w-full max-w-full overflow-hidden bg-black"
                style={liveSessionViewportStyle}
            >
                {/* Fullscreen stage + split chat */}
                <div className="absolute inset-0 flex">
                    <div
                        className={`${showChat ? "w-1/2" : "w-full"} relative min-w-0 h-full`}
                        onPointerUp={handleStageTap}
                    >
                        <div className="h-full w-full">
                            {renderVideoStage(true)}
                        </div>
                        <EmojiOverlay emojis={floatingEmojis} />
                    </div>

                    {showChat && (
                        <div
                            className="h-full w-1/2 min-w-0 border-l border-white/10 bg-black/30 pointer-events-auto"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="h-full min-h-0 overflow-hidden">
                                <ChatPanel
                                    messages={chatMessages}
                                    onSend={(text) => { handleSendChat(text); resetControlsTimer(); }}
                                    onClose={() => setShowChat(false)}
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* Overlay controls — shown on tap, auto-hide after 4s */}
                <div
                    className={`absolute inset-0 pointer-events-none z-10 transition-opacity duration-300 ${
                        showControls ? "opacity-100" : "opacity-0"
                    }`}
                >
                    {/* Top bar */}
                    <div
                        className={`absolute top-0 left-0 flex items-center gap-3 px-4 py-3 bg-black/50 backdrop-blur-sm ${
                            showChat ? "right-1/2" : "right-0"
                        } ${
                            showControls ? "pointer-events-auto" : ""
                        }`}
                        style={{ paddingTop: "max(0.75rem, env(safe-area-inset-top))" }}
                    >
                        <button
                            onClick={(e) => { e.stopPropagation(); handleLeave(); }}
                            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30 transition-colors"
                        >
                            <ArrowLeft className="h-4 w-4" />
                        </button>
                        <span className="font-bold text-white truncate flex-1 text-sm">{title}</span>
                        <div className="flex items-center gap-1.5 bg-[#dc2626] px-2.5 py-1 rounded-full">
                            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                            <span className="text-[11px] font-bold text-white tracking-wide">LIVE</span>
                        </div>
                    </div>

                    {/* On-stage banner in landscape */}
                    {currentRole === "viewer-on-stage" && (
                        <div className={`absolute top-14 flex items-center gap-2 px-3 py-1.5 bg-[#f59e0b]/90 rounded-full pointer-events-auto ${
                            showChat ? "left-1/4 -translate-x-1/2" : "left-1/2 -translate-x-1/2"
                        }`}>
                            <Mic className="w-3.5 h-3.5 text-white" />
                            <span className="text-xs font-semibold text-white">
                                {isAudioEnabled ? "On stage" : "On stage - turn on mic"}
                            </span>
                        </div>
                    )}

                    {/* Bottom controls */}
                    <div
                        className={`absolute bottom-0 left-0 bg-black/50 backdrop-blur-sm ${
                            showChat ? "right-1/2" : "right-0"
                        } ${
                            showControls ? "pointer-events-auto" : ""
                        }`}
                        style={{ paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))" }}
                    >
                        {/* Emoji bar */}
                        <div className="flex items-center justify-center gap-1.5 px-3 py-1.5">
                            {REACTION_EMOJIS.map((emoji) => (
                                <button
                                    key={emoji}
                                    onClick={(e) => { e.stopPropagation(); handleSendReaction(emoji); resetControlsTimer(); }}
                                    className="p-1 rounded-lg hover:bg-white/20 active:scale-90 transition-all"
                                >
                                    <span className="text-lg">{emoji}</span>
                                </button>
                            ))}
                            <button
                                onClick={(e) => { e.stopPropagation(); setShowEmojiPicker(!showEmojiPicker); resetControlsTimer(); }}
                                className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors"
                            >
                                <SmilePlus className="w-3.5 h-3.5 text-white" />
                            </button>
                        </div>

                        {/* Extended emoji picker in landscape */}
                        {showEmojiPicker && (
                            <div className="px-3 pb-1.5">
                                <div className="bg-black/60 rounded-xl p-2 grid grid-cols-8 gap-0.5 max-w-md mx-auto">
                                    {["🙌", "🔥", "💪", "✨", "🌟", "💯", "🏆", "🎯", "🙏", "💐", "🌈", "📚", "✅", "💡", "🤝", "👋"].map((emoji) => (
                                        <button
                                            key={emoji}
                                            onClick={(e) => { e.stopPropagation(); handleSendReaction(emoji); resetControlsTimer(); }}
                                            className="p-1.5 rounded-lg hover:bg-white/20 active:scale-90 transition-all text-center"
                                        >
                                            <span className="text-lg">{emoji}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Action buttons */}
                        <div className="flex items-center justify-center gap-4 px-4 py-2">
                            {canPublishAudio && (
                                <button
                                    onClick={(e) => { e.stopPropagation(); handleToggleMute(); resetControlsTimer(); }}
                                    className={`w-11 h-11 rounded-full flex items-center justify-center transition-colors ${
                                        isAudioEnabled ? "bg-[#c4a57b] text-white" : "bg-white/20 text-white"
                                    }`}
                                >
                                    {isAudioEnabled ? <Mic className="w-4.5 h-4.5" /> : <MicOff className="w-4.5 h-4.5" />}
                                </button>
                            )}

                            {!canPublishAudio && (
                                <button
                                    onClick={(e) => { e.stopPropagation(); handleToggleHand(); resetControlsTimer(); }}
                                    className={`w-11 h-11 rounded-full flex items-center justify-center transition-colors ${
                                        isHandRaised ? "bg-[#f59e0b] text-white" : "bg-white/20 text-white"
                                    }`}
                                >
                                    <Hand className="w-4.5 h-4.5" />
                                </button>
                            )}

                            <button
                                onClick={(e) => { e.stopPropagation(); handleToggleChat(); resetControlsTimer(); }}
                                className={`relative w-11 h-11 rounded-full flex items-center justify-center transition-colors ${
                                    showChat ? "bg-[#c4a57b] text-white" : "bg-white/20 text-white"
                                }`}
                            >
                                <MessageCircle className="w-4.5 h-4.5" />
                                {unreadCount > 0 && !showChat && (
                                    <span className="absolute -top-1 -right-1 min-w-[16px] h-[16px] bg-[#dc2626] text-white text-[9px] font-bold rounded-full flex items-center justify-center px-0.5">
                                        {unreadCount > 9 ? "9+" : unreadCount}
                                    </span>
                                )}
                            </button>

                            <button
                                onClick={(e) => { e.stopPropagation(); handleLeave(); }}
                                className="w-11 h-11 rounded-full bg-[#dc2626] text-white flex items-center justify-center transition-colors hover:bg-[#b91c1c]"
                            >
                                <PhoneOff className="w-4.5 h-4.5" />
                            </button>
                        </div>
                    </div>
                </div>

                {canPublishAudio && !showControls && (
                    <div className={`absolute bottom-4 z-20 flex items-center gap-3 pointer-events-auto ${
                        showChat ? "left-1/4 -translate-x-1/2" : "left-1/2 -translate-x-1/2"
                    }`}>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                void handleToggleMute();
                            }}
                            className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
                                isAudioEnabled ? "bg-[#c4a57b] text-white" : "bg-white/20 text-white backdrop-blur-sm"
                            }`}
                        >
                            {isAudioEnabled ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
                        </button>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                void handleLeave();
                            }}
                            className="w-12 h-12 rounded-full bg-[#dc2626] text-white flex items-center justify-center transition-colors hover:bg-[#b91c1c]"
                        >
                            <PhoneOff className="w-5 h-5" />
                        </button>
                    </div>
                )}
            </div>
        );
    }

    // ─── Portrait layout (unchanged) ──────────────────────────────────────

    return (
        <div
            className="flex h-full min-h-screen w-full max-w-full flex-col overflow-hidden bg-[#fffbe7]"
            style={liveSessionViewportStyle}
        >
            {/* Header */}
            <div
                className="flex shrink-0 items-center gap-3 px-4 pb-3"
                style={{ paddingTop: "max(0.75rem, env(safe-area-inset-top))" }}
            >
                <button
                    onClick={handleLeave}
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-[#414141] shadow-sm ring-1 ring-[#e5e7eb] hover:bg-[#f9fafb] transition-colors"
                >
                    <ArrowLeft className="h-4 w-4" />
                </button>
                <span className="font-bold text-[#414141] truncate flex-1">{title}</span>
                <div className="flex items-center gap-1.5 bg-[#dc2626] px-2.5 py-1 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                    <span className="text-[11px] font-bold text-white tracking-wide">LIVE</span>
                </div>
            </div>

            {/* On-stage banner */}
            {currentRole === "viewer-on-stage" && (
                <div className="flex items-center gap-2 px-4 py-2 bg-[#f59e0b] shrink-0">
                    <Mic className="w-4 h-4 text-white" />
                    <span className="text-sm font-semibold text-white">
                        {isAudioEnabled ? "You're on stage — Mic active" : "You're on stage — turn on your mic to speak"}
                    </span>
                </div>
            )}

            {/* Main video stage */}
            <div className="flex-1 min-h-0 mx-3 mb-2 relative">
                <EmojiOverlay emojis={floatingEmojis} />
                {renderVideoStage()}

                {/* Chat overlay on mobile / sidebar on larger screens */}
                {showChat && (
                    <div className="absolute inset-0 z-40 min-h-0 overflow-hidden sm:inset-auto sm:bottom-0 sm:right-0 sm:top-0 sm:w-80">
                        <ChatPanel
                            messages={chatMessages}
                            onSend={handleSendChat}
                            onClose={() => setShowChat(false)}
                        />
                    </div>
                )}
            </div>

            {/* Participant strip — active speaker first */}
            {participantPeers.length > 0 && (
                <div className="shrink-0 px-3 pb-2">
                    <div className="flex gap-2 overflow-x-auto scrollbar-none py-1">
                        {[...participantPeers].sort((a, b) => {
                            if (dominantSpeaker) {
                                if (a.id === dominantSpeaker.id && b.id !== dominantSpeaker.id) return -1;
                                if (b.id === dominantSpeaker.id && a.id !== dominantSpeaker.id) return 1;
                            }
                            return 0;
                        }).map((peer) => (
                            <div key={peer.id} className="w-20 h-20 shrink-0">
                                <VideoTile peer={peer} isActiveSpeaker={dominantSpeaker?.id === peer.id} />
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Emoji reaction bar */}
            <div className="flex items-center justify-center gap-2 px-3 py-1 shrink-0">
                {REACTION_EMOJIS.map((emoji) => (
                    <button
                        key={emoji}
                        onClick={() => handleSendReaction(emoji)}
                        className="p-1.5 rounded-lg hover:bg-[#ece5c8] active:scale-90 transition-all"
                    >
                        <span className="text-xl sm:text-2xl">{emoji}</span>
                    </button>
                ))}
                <button
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    className="w-8 h-8 rounded-full bg-[#e7e7e7] flex items-center justify-center hover:bg-[#d4d4d4] transition-colors"
                >
                    <SmilePlus className="w-4 h-4 text-[#737373]" />
                </button>
            </div>

            {/* Extended emoji picker */}
            {showEmojiPicker && (
                <div className="shrink-0 px-3 pb-2">
                    <div className="bg-white rounded-xl border border-[#e5e5e5] p-3 grid grid-cols-8 gap-1">
                        {["🙌", "🔥", "💪", "✨", "🌟", "💯", "🏆", "🎯", "🙏", "💐", "🌈", "📚", "✅", "💡", "🤝", "👋"].map((emoji) => (
                            <button
                                key={emoji}
                                onClick={() => handleSendReaction(emoji)}
                                className="p-2 rounded-lg hover:bg-[#f5f5f5] active:scale-90 transition-all text-center"
                            >
                                <span className="text-xl">{emoji}</span>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Control bar */}
            <div className="flex items-center justify-center gap-5 px-6 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shrink-0">
                {canPublishAudio && (
                    <button
                        onClick={handleToggleMute}
                        className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
                            isAudioEnabled ? "bg-[#c4a57b] text-white" : "bg-[#e7e7e7] text-[#767676]"
                        }`}
                    >
                        {isAudioEnabled ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
                    </button>
                )}

                {!canPublishAudio && (
                    <button
                        onClick={handleToggleHand}
                        className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
                            isHandRaised ? "bg-[#f59e0b] text-white" : "bg-[#e7e7e7] text-[#767676]"
                        }`}
                    >
                        <Hand className="w-5 h-5" />
                    </button>
                )}

                <button
                    onClick={handleToggleChat}
                    className={`relative w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
                        showChat ? "bg-[#c4a57b] text-white" : "bg-[#e7e7e7] text-[#767676]"
                    }`}
                >
                    <MessageCircle className="w-5 h-5" />
                    {unreadCount > 0 && !showChat && (
                        <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-[#dc2626] text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
                            {unreadCount > 9 ? "9+" : unreadCount}
                        </span>
                    )}
                </button>

                <button
                    onClick={handleLeave}
                    className="w-12 h-12 rounded-full bg-[#dc2626] text-white flex items-center justify-center transition-colors hover:bg-[#b91c1c]"
                >
                    <PhoneOff className="w-5 h-5" />
                </button>
            </div>

            <Dialog open={Boolean(autoplayError)}>
                <DialogContent className="max-w-md rounded-3xl border-[#ece5c8]">
                    <DialogHeader>
                        <DialogTitle>Restore class audio</DialogTitle>
                        <DialogDescription>
                            iPhone and iPad browsers sometimes block newly joined audio tracks until you confirm playback.
                            Tap restore to hear students who come on stage.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <button
                            onClick={handleRestoreAudio}
                            className="rounded-[12px] bg-[#414141] px-4 py-2.5 font-semibold text-white transition-colors hover:bg-[#212121]"
                        >
                            Restore audio
                        </button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={showMicPermissionDialog} onOpenChange={setShowMicPermissionDialog}>
                <DialogContent className="max-w-md rounded-3xl border-[#ece5c8]">
                    <DialogHeader>
                        <DialogTitle>Allow microphone access</DialogTitle>
                        <DialogDescription>
                            {micPermissionMessage}
                            {micPermissionNeedsSettings
                                ? " If you already denied access, reopen browser or site settings and allow the microphone."
                                : ""}
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <button
                            onClick={() => setShowMicPermissionDialog(false)}
                            className="rounded-[12px] border border-[#d6d3c8] px-4 py-2.5 font-semibold text-[#414141] transition-colors hover:bg-[#f8f6ef]"
                        >
                            Not now
                        </button>
                        <button
                            onClick={handleRetryMicrophonePermission}
                            disabled={isRetryingMicPermission}
                            className="rounded-[12px] bg-[#414141] px-4 py-2.5 font-semibold text-white transition-colors hover:bg-[#212121] disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {isRetryingMicPermission ? "Checking..." : "Try again"}
                        </button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

// Small PiP component for teacher camera during screen share
function TeacherPiP({ peer }: { peer: HMSPeer }) {
    const { videoRef } = useVideo({ trackId: peer.videoTrack });
    const hasVideo = !!peer.videoTrack;

    return (
        <div className="w-full h-full bg-gray-900">
            <video ref={videoRef} autoPlay muted playsInline className={`w-full h-full object-cover ${!hasVideo ? "hidden" : ""}`} />
            {!hasVideo && (
                <div className="w-full h-full flex items-center justify-center">
                    <span className="text-lg font-semibold text-white/80">{(peer.name || "T").charAt(0).toUpperCase()}</span>
                </div>
            )}
        </div>
    );
}
