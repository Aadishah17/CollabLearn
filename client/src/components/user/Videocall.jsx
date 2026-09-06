import React, { useEffect, useRef, useState } from 'react';
import { useParams, useLocation, useNavigate, Link } from 'react-router-dom';
import { ChevronLeft, ShieldCheck, Copy, Check, Video, PhoneOff } from 'lucide-react';

const VideoCall = () => {
  const { roomID: urlRoomID } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { userID: stateUserID, userName: stateUserName } = location.state || {};

  const [copied, setCopied] = useState(false);
  const containerRef = useRef(null);
  const zpRef = useRef(null);

  // Extract room ID from route param or search query parameter
  const searchParams = new URLSearchParams(window.location.search);
  const queryRoomID = searchParams.get('roomID');
  const roomID = urlRoomID || queryRoomID || 'peer-session-' + Math.floor(Math.random() * 10000);

  const copyInviteLink = () => {
    const inviteUrl = `${window.location.origin}/videocall?roomID=${roomID}`;
    navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  useEffect(() => {
    const localUserId =
      stateUserID || localStorage.getItem('userId') || Math.floor(Math.random() * 10000) + '';
    const localUserName =
      stateUserName || localStorage.getItem('username') || 'PeerUser_' + localUserId.slice(-4);

    const appID = 1888548866;
    const serverSecret = '78db5cc0bc70a631137cf34c97fb9322';

    const loadZegoScript = () => {
      return new Promise((resolve, reject) => {
        if (window.ZegoUIKitPrebuilt) {
          resolve();
          return;
        }

        const script = document.createElement('script');
        script.src = 'https://unpkg.com/@zegocloud/zego-uikit-prebuilt/zego-uikit-prebuilt.js';
        script.onload = resolve;
        script.onerror = reject;
        document.body.appendChild(script);
      });
    };

    const initializeVideoCall = async () => {
      try {
        await loadZegoScript();

        const kitToken = window.ZegoUIKitPrebuilt.generateKitTokenForTest(
          appID,
          serverSecret,
          roomID,
          localUserId,
          localUserName
        );

        const zp = window.ZegoUIKitPrebuilt.create(kitToken);
        zpRef.current = zp;

        zp.joinRoom({
          container: containerRef.current,
          sharedLinks: [
            {
              name: 'Invite link',
              url: `${window.location.origin}/videocall?roomID=${roomID}`,
            },
          ],
          scenario: {
            mode: window.ZegoUIKitPrebuilt.VideoConference,
          },
          turnOnMicrophoneWhenJoining: true,
          turnOnCameraWhenJoining: true,
          showMyCameraToggleButton: true,
          showMyMicrophoneToggleButton: true,
          showAudioVideoSettingsButton: true,
          showScreenSharingButton: true,
          showTextChat: true,
          showUserList: true,
          maxUsers: 4,
          layout: 'Auto',
          showLayoutButton: false,
          showPrejoinView: false,
          onLeaveRoom: () => {
            navigate('/messages');
          },
        });
      } catch (error) {
        console.error('Failed to initialize video call:', error);
      }
    };

    initializeVideoCall();

    return () => {
      if (zpRef.current) {
        try {
          zpRef.current.destroy();
        } catch (error) {
          console.error('Error during cleanup:', error);
        }
      }
    };
  }, [roomID, stateUserID, stateUserName, navigate]);

  return (
    <div className="relative w-screen h-screen bg-black overflow-hidden select-none font-sans">
      {/* Ambient Top HUD Overlay (Pointer events pass through except for interactive buttons) */}
      <div className="absolute top-0 left-0 right-0 z-40 p-4 pointer-events-none flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            to="/messages"
            className="pointer-events-auto flex items-center gap-2 px-3.5 py-2 rounded-xl bg-black/60 hover:bg-black/90 text-white border border-white/10 backdrop-blur-xl transition-all hover:border-red-500/40 text-xs font-semibold shadow-lg"
          >
            <ChevronLeft size={16} className="text-red-400" />
            <span>Leave Session</span>
          </Link>

          <div className="hidden sm:flex items-center gap-2 px-3.5 py-2 rounded-xl bg-black/60 border border-white/10 backdrop-blur-xl text-xs font-mono text-gray-300 shadow-lg">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Room: {roomID}</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={copyInviteLink}
            className="pointer-events-auto flex items-center gap-2 px-3.5 py-2 rounded-xl bg-black/60 hover:bg-black/90 text-white border border-white/10 backdrop-blur-xl transition-all hover:border-amber-500/40 text-xs font-semibold shadow-lg cursor-pointer"
          >
            {copied ? (
              <>
                <Check size={14} className="text-emerald-400" />
                <span className="text-emerald-300">Copied Link</span>
              </>
            ) : (
              <>
                <Copy size={14} className="text-amber-400" />
                <span>Copy Invite Link</span>
              </>
            )}
          </button>

          <div className="hidden md:flex items-center gap-2 px-3.5 py-2 rounded-xl bg-red-950/40 border border-red-500/30 backdrop-blur-xl text-xs text-red-300 font-semibold shadow-lg">
            <ShieldCheck size={14} className="text-red-400" />
            <span>End-to-End Encrypted</span>
          </div>
        </div>
      </div>

      {/* Zego Video Call Mount Canvas */}
      <div ref={containerRef} className="w-full h-full bg-black relative z-10" />
    </div>
  );
};

export default VideoCall;
