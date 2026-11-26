import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { io, Socket } from 'socket.io-client';
import {
  Mic,
  MicOff,
  Video as VideoIcon,
  VideoOff,
  PhoneOff,
  Maximize2,
  Minimize2,
  MessageSquare,
  Share2,
  ShieldCheck,
  User,
  Send,
  AlertCircle,
  FileText,
  Plus,
  Trash2,
  CheckCircle2,
  Activity,
  HeartPulse,
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { onlineConsultationAPI } from '../services/api';
import toast from 'react-hot-toast';

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
  ],
};

export default function VideoConsultationPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const authUser = useAuthStore((state) => state.user);
  const token = useAuthStore((state) => state.token);

  const roomId = searchParams.get('room') || searchParams.get('roomId') || '';

  // Room & Consultation state
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [consultation, setConsultation] = useState<any>(null);

  // WebRTC state
  const [isJoined, setIsJoined] = useState(false);
  const [peerConnected, setPeerConnected] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [micMuted, setMicMuted] = useState(false);
  const [cameraOff, setCameraOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [unreadChatCount, setUnreadChatCount] = useState(0);

  // Chat state
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [messageInput, setMessageInput] = useState('');

  // Doctor Wrap-up Modal
  const [showWrapUpModal, setShowWrapUpModal] = useState(false);
  const [clinicalNotes, setClinicalNotes] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [prescriptions, setPrescriptions] = useState<any[]>([
    { medicineName: '', dosage: '1 tablet', frequency: 'Twice daily', duration: '5 days', instructions: 'After meals' },
  ]);
  const [completing, setCompleting] = useState(false);

  // DOM Refs
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const chatBottomRef = useRef<HTMLDivElement | null>(null);

  const isDoctor = authUser?.role === 'doctor';

  // 1. Check Room Authorization & Load Metadata
  useEffect(() => {
    if (!roomId) {
      setAuthError('No consultation meeting ID was provided.');
      setLoading(false);
      return;
    }

    const fetchRoom = async () => {
      try {
        setLoading(true);
        const res = await onlineConsultationAPI.getRoomDetails(roomId);
        if (res.data?.success) {
          const data = res.data.data;
          setConsultation(data);
          if (data.messages) {
            setChatMessages(data.messages);
          }
          if (data.clinicalNotes) setClinicalNotes(data.clinicalNotes);
          if (data.diagnosis) setDiagnosis(data.diagnosis);
          if (data.prescriptions && data.prescriptions.length > 0) {
            setPrescriptions(data.prescriptions);
          }
        }
      } catch (err: any) {
        setAuthError(err.response?.data?.message || 'Access Denied: You do not have permission to join this video consultation.');
      } finally {
        setLoading(false);
      }
    };

    fetchRoom();
  }, [roomId]);

  // 2. Initialize WebRTC and Socket Connection when authorized
  useEffect(() => {
    if (!roomId || loading || authError || !consultation) return;

    let socket: Socket;
    let localStream: MediaStream;

    const setupCall = async () => {
      try {
        // Request User Media
        localStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        localStreamRef.current = localStream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = localStream;
        }

        // Setup Socket
        const socketBaseUrl = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/api\/?$/, '');
        socket = io(socketBaseUrl, {
          transports: ['websocket', 'polling'],
          auth: { token },
        });
        socketRef.current = socket;

        // Create Peer Connection
        const pc = new RTCPeerConnection(ICE_SERVERS);
        peerConnectionRef.current = pc;

        // Add Local Tracks to PC
        localStream.getTracks().forEach((track) => {
          pc.addTrack(track, localStream);
        });

        // Remote Track Listener
        pc.ontrack = (event) => {
          if (event.streams && event.streams[0]) {
            remoteStreamRef.current = event.streams[0];
            if (remoteVideoRef.current) {
              remoteVideoRef.current.srcObject = event.streams[0];
            }
            setPeerConnected(true);
          }
        };

        // ICE Candidate Listener
        pc.onicecandidate = (event) => {
          if (event.candidate && socket) {
            socket.emit('ice-candidate', {
              candidate: event.candidate,
              roomId,
            });
          }
        };

        pc.onconnectionstatechange = () => {
          if (pc.connectionState === 'connected') {
            setPeerConnected(true);
          } else if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
            setPeerConnected(false);
          }
        };

        // Socket Event Listeners
        socket.on('connect', () => {
          socket.emit('join-room', {
            roomId,
            user: {
              _id: authUser?._id,
              name: authUser?.name || `${authUser?.firstName || ''} ${authUser?.lastName || ''}`.trim() || 'User',
              role: authUser?.role,
            },
          });
        });

        socket.on('room-joined', () => {
          setIsJoined(true);
        });

        socket.on('room-ready', async () => {
          try {
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            socket.emit('webrtc-offer', { sdp: offer, roomId });
          } catch (offerErr) {
            console.error('Error creating WebRTC offer:', offerErr);
          }
        });

        socket.on('participant-joined', async () => {
          toast.success('Consultation participant joined the room');
        });

        socket.on('webrtc-offer', async (data) => {
          try {
            await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            socket.emit('webrtc-answer', { sdp: answer, roomId });
          } catch (err) {
            console.error('Error handling WebRTC offer:', err);
          }
        });

        socket.on('webrtc-answer', async (data) => {
          try {
            await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
          } catch (err) {
            console.error('Error setting remote description on answer:', err);
          }
        });

        socket.on('ice-candidate', async (data) => {
          try {
            if (data.candidate) {
              await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
            }
          } catch (err) {
            console.error('Error adding received ICE candidate:', err);
          }
        });

        socket.on('chat-message', (msg) => {
          setChatMessages((prev) => [...prev, msg]);
          if (!showChat) {
            setUnreadChatCount((prev) => prev + 1);
          }
        });

        socket.on('call-ended', (data) => {
          setPeerConnected(false);
          toast('Consultation has been concluded by ' + data.endedBy);
          if (isDoctor) {
            setShowWrapUpModal(true);
          } else {
            setTimeout(() => {
              navigate('/patient/telemedicine');
            }, 1500);
          }
        });

        socket.on('participant-left', (data) => {
          toast(data.message || 'Participant has disconnected');
          setPeerConnected(false);
        });
      } catch (err: any) {
        console.error('Media / WebRTC setup error:', err);
        toast.error('Unable to access camera or microphone: ' + (err.message || 'Permission denied'));
      }
    };

    setupCall();

    return () => {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
      }
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [roomId, loading, authError, consultation]);

  // Call timer effect
  useEffect(() => {
    let interval: any;
    if (peerConnected) {
      interval = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [peerConnected]);

  // Scroll chat to bottom on new messages
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, showChat]);

  // Media Controls
  const toggleMic = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setMicMuted(!audioTrack.enabled);
        socketRef.current?.emit('media-toggle', { type: 'audio', enabled: audioTrack.enabled, roomId });
      }
    }
  };

  const toggleCamera = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setCameraOff(!videoTrack.enabled);
        socketRef.current?.emit('media-toggle', { type: 'video', enabled: videoTrack.enabled, roomId });
      }
    }
  };

  const toggleScreenShare = async () => {
    if (!isScreenSharing) {
      try {
        const displayStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        const screenTrack = displayStream.getVideoTracks()[0];

        if (peerConnectionRef.current) {
          const senders = peerConnectionRef.current.getSenders();
          const sender = senders.find((s) => s.track?.kind === 'video');
          if (sender) {
            sender.replaceTrack(screenTrack);
          }
        }

        if (localVideoRef.current) {
          localVideoRef.current.srcObject = displayStream;
        }

        screenTrack.onended = () => {
          stopScreenShare();
        };

        setIsScreenSharing(true);
        toast.success('Screen sharing active');
      } catch (err) {
        console.error('Screen sharing error:', err);
      }
    } else {
      stopScreenShare();
    }
  };

  const stopScreenShare = () => {
    if (localStreamRef.current && peerConnectionRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      const senders = peerConnectionRef.current.getSenders();
      const sender = senders.find((s) => s.track?.kind === 'video');
      if (sender && videoTrack) {
        sender.replaceTrack(videoTrack);
      }
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = localStreamRef.current;
      }
    }
    setIsScreenSharing(false);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(console.error);
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(console.error);
      setIsFullscreen(false);
    }
  };

  // Chat Submission
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim() || !socketRef.current) return;

    socketRef.current.emit('chat-message', {
      roomId,
      message: messageInput.trim(),
      senderName: authUser?.name || 'Participant',
      senderRole: authUser?.role || 'patient',
      senderId: authUser?._id,
    });

    setMessageInput('');
  };

  // End Call Handler
  const handleEndCall = () => {
    if (window.confirm('Are you sure you want to conclude this video consultation session?')) {
      socketRef.current?.emit('end-call', { roomId });
      if (isDoctor) {
        setShowWrapUpModal(true);
      } else {
        toast('Consultation ended');
        navigate('/patient/telemedicine');
      }
    }
  };

  // Doctor Wrap-up Submission
  const handleAddPrescriptionItem = () => {
    setPrescriptions((prev) => [
      ...prev,
      { medicineName: '', dosage: '1 tablet', frequency: 'Twice daily', duration: '5 days', instructions: 'After meals' },
    ]);
  };

  const handleRemovePrescriptionItem = (index: number) => {
    setPrescriptions((prev) => prev.filter((_, i) => i !== index));
  };

  const handlePrescriptionChange = (index: number, field: string, value: string) => {
    setPrescriptions((prev) => {
      const updated = [...prev];
      updated[index][field] = value;
      return updated;
    });
  };

  const handleCompleteConsultation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!consultation?._id) return;
    try {
      setCompleting(true);
      const filteredMeds = prescriptions.filter((p) => p.medicineName.trim().length > 0);
      await onlineConsultationAPI.completeConsultation(consultation._id, {
        clinicalNotes,
        diagnosis,
        prescriptions: filteredMeds,
      });
      toast.success('Consultation records and digital prescription issued successfully');
      setShowWrapUpModal(false);
      navigate('/doctor/consultations');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save clinical wrap-up');
    } finally {
      setCompleting(false);
    }
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (authError) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl p-6 shadow-2xl text-center space-y-4">
          <div className="h-16 w-16 mx-auto rounded-full bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-200">
            <AlertCircle size={32} />
          </div>
          <h2 className="text-xl font-extrabold text-slate-900">Access Restricted</h2>
          <p className="text-xs text-slate-600 leading-relaxed">{authError}</p>
          <div className="pt-2">
            <button
              onClick={() => navigate(isDoctor ? '/doctor/dashboard' : '/patient/dashboard')}
              className="w-full py-2.5 px-4 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs transition"
            >
              Return to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  const doctorName = consultation?.doctorId?.userId?.name || 'Attending Physician';
  const patientName = consultation?.patientId?.userId?.name || 'Patient';

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col font-sans select-none overflow-hidden">
      {/* Top Clinical Header Bar */}
      <header className="h-14 bg-slate-900/90 border-b border-slate-800/80 px-4 sm:px-6 flex items-center justify-between backdrop-blur-md z-30">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-xl bg-gradient-to-tr from-teal-500 to-emerald-600 flex items-center justify-center text-white shadow-md shadow-teal-500/20">
            <HeartPulse size={18} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black tracking-wide text-white">Kushal Hospitals Virtual Clinic</span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-500/20 text-teal-300 border border-teal-500/30">
                <ShieldCheck size={11} /> 256-Bit Encrypted
              </span>
            </div>
            <p className="text-[10px] text-slate-400">
              Room: <span className="font-mono text-teal-300">{roomId}</span> • {isDoctor ? `Patient: ${patientName}` : `Doctor: Dr. ${doctorName}`}
            </p>
          </div>
        </div>

        {/* Live Call Duration / Status */}
        <div className="flex items-center gap-3">
          {peerConnected ? (
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-bold animate-pulse">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              <span>{formatTimer(callDuration)}</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold">
              <span className="h-2 w-2 rounded-full bg-amber-500 animate-ping" />
              <span>{isJoined ? 'Waiting Room' : 'Connecting Room...'}</span>
            </div>
          )}

          <button
            onClick={() => setShowChat(!showChat)}
            className={`relative p-2 rounded-xl transition ${
              showChat ? 'bg-teal-600 text-white' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
            }`}
            title="Toggle In-Call Chat"
          >
            <MessageSquare size={16} />
            {unreadChatCount > 0 && !showChat && (
              <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center">
                {unreadChatCount}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* Main Video Grid & In-Call Chat Workspace */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Video Canvas Container */}
        <div className="flex-1 relative bg-slate-950 flex flex-col items-center justify-center p-3 sm:p-4">
          {/* Peer Stream Canvas */}
          {peerConnected ? (
            <div className="w-full h-full relative rounded-2xl sm:rounded-3xl overflow-hidden bg-slate-900 border border-slate-800/80 shadow-2xl flex items-center justify-center">
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover sm:object-contain"
              />
              <div className="absolute top-4 left-4 bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 text-xs font-semibold text-white flex items-center gap-2">
                <Activity size={14} className="text-teal-400" />
                <span>{isDoctor ? patientName : `Dr. ${doctorName}`}</span>
              </div>
            </div>
          ) : (
            /* Healthcare Virtual Waiting Room Display */
            <div className="w-full h-full rounded-2xl sm:rounded-3xl bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800/80 flex flex-col items-center justify-center p-6 text-center space-y-5">
              <div className="relative">
                <div className="h-24 w-24 rounded-full bg-teal-500/10 border-2 border-teal-500/30 flex items-center justify-center text-teal-400">
                  <User size={48} />
                </div>
                <span className="absolute bottom-0 right-0 h-6 w-6 rounded-full bg-amber-500 border-2 border-slate-900 flex items-center justify-center text-[11px] animate-pulse">
                  ⏳
                </span>
              </div>

              <div className="max-w-md space-y-2">
                <h3 className="text-lg sm:text-xl font-extrabold text-white">
                  {isDoctor ? 'Waiting for Patient to Connect' : 'Secure Clinical Waiting Room'}
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {isDoctor
                    ? `You are in room ${roomId}. When ${patientName} joins, video will link automatically.`
                    : `Welcome to Kushal Hospitals Virtual Clinic. Dr. ${doctorName} will admit you as soon as they are ready.`}
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 text-xs text-slate-300 max-w-sm flex items-center gap-3">
                <ShieldCheck size={18} className="text-teal-400 shrink-0" />
                <span className="text-[11px] text-left">Your camera & microphone permissions are active. Your connection is end-to-end encrypted.</span>
              </div>
            </div>
          )}

          {/* Picture-in-Picture Local Self Preview */}
          <div className="absolute bottom-6 right-6 w-32 sm:w-48 h-24 sm:h-36 rounded-2xl overflow-hidden bg-slate-900 border-2 border-teal-500/60 shadow-2xl z-20 transition-all hover:scale-105">
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover ${cameraOff ? 'hidden' : ''}`}
            />
            {cameraOff && (
              <div className="w-full h-full flex flex-col items-center justify-center bg-slate-800 text-slate-400 text-xs">
                <VideoOff size={24} className="mb-1 text-slate-500" />
                <span className="text-[10px]">Camera Off</span>
              </div>
            )}
            <div className="absolute bottom-2 left-2 px-1.5 py-0.5 rounded bg-black/60 text-[9px] font-bold text-white backdrop-blur-sm">
              You {micMuted ? '(Muted)' : ''}
            </div>
          </div>
        </div>

        {/* In-Call Real-Time Chat Drawer */}
        {showChat && (
          <aside className="w-80 sm:w-96 bg-slate-900 border-l border-slate-800 flex flex-col z-30">
            <div className="p-3.5 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquare size={16} className="text-teal-400" />
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">Consultation Chat</h3>
              </div>
              <button
                onClick={() => {
                  setShowChat(false);
                  setUnreadChatCount(0);
                }}
                className="text-slate-400 hover:text-white text-xs px-2 py-1 rounded-lg hover:bg-slate-800"
              >
                Close
              </button>
            </div>

            {/* Messages Scroll Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 text-xs">
              {chatMessages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center text-slate-500 space-y-1">
                  <MessageSquare size={28} className="opacity-40" />
                  <p className="text-xs">No in-call messages yet.</p>
                  <p className="text-[10px]">Messages are securely stored with this appointment.</p>
                </div>
              ) : (
                chatMessages.map((msg, i) => {
                  const isMe = msg.senderId === authUser?._id;
                  return (
                    <div key={i} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                      <div className="flex items-center gap-1.5 mb-1 text-[10px] text-slate-400">
                        <span className="font-bold text-slate-300">{msg.senderName}</span>
                        <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold uppercase ${
                          msg.senderRole === 'doctor' ? 'bg-teal-900/60 text-teal-300 border border-teal-700/50' : 'bg-slate-800 text-slate-300'
                        }`}>
                          {msg.senderRole}
                        </span>
                        <span>{new Date(msg.timestamp || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <div
                        className={`p-2.5 rounded-2xl max-w-[85%] leading-relaxed ${
                          isMe
                            ? 'bg-teal-600 text-white rounded-br-none'
                            : 'bg-slate-800 text-slate-200 rounded-bl-none border border-slate-700/60'
                        }`}
                      >
                        {msg.message}
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={chatBottomRef} />
            </div>

            {/* Message Input Form */}
            <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-800 flex items-center gap-2">
              <input
                type="text"
                placeholder="Type a clinical message..."
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-500"
              />
              <button
                type="submit"
                disabled={!messageInput.trim()}
                className="p-2 rounded-xl bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white transition"
              >
                <Send size={15} />
              </button>
            </form>
          </aside>
        )}
      </div>

      {/* Floating Bottom Media Bar */}
      <footer className="h-20 bg-slate-900/95 border-t border-slate-800/80 px-4 sm:px-6 flex items-center justify-between z-30">
        <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400">
          <ShieldCheck size={16} className="text-teal-400" />
          <span>Encrypted WebRTC Session</span>
        </div>

        {/* Center Control Group */}
        <div className="flex items-center gap-2 sm:gap-3 mx-auto sm:mx-0">
          {/* Mute Mic */}
          <button
            onClick={toggleMic}
            className={`p-3.5 rounded-2xl transition shadow-md ${
              micMuted ? 'bg-rose-600 hover:bg-rose-700 text-white' : 'bg-slate-800 hover:bg-slate-700 text-white'
            }`}
            title={micMuted ? 'Unmute Microphone' : 'Mute Microphone'}
          >
            {micMuted ? <MicOff size={18} /> : <Mic size={18} />}
          </button>

          {/* Toggle Video */}
          <button
            onClick={toggleCamera}
            className={`p-3.5 rounded-2xl transition shadow-md ${
              cameraOff ? 'bg-rose-600 hover:bg-rose-700 text-white' : 'bg-slate-800 hover:bg-slate-700 text-white'
            }`}
            title={cameraOff ? 'Turn Camera On' : 'Turn Camera Off'}
          >
            {cameraOff ? <VideoOff size={18} /> : <VideoIcon size={18} />}
          </button>

          {/* Screen Share */}
          <button
            onClick={toggleScreenShare}
            className={`p-3.5 rounded-2xl transition shadow-md ${
              isScreenSharing ? 'bg-teal-600 text-white' : 'bg-slate-800 hover:bg-slate-700 text-white'
            }`}
            title="Share Screen"
          >
            <Share2 size={18} />
          </button>

          {/* Fullscreen */}
          <button
            onClick={toggleFullscreen}
            className="p-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white transition shadow-md"
            title="Toggle Fullscreen"
          >
            {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
          </button>

          {/* End Call Button */}
          <button
            onClick={handleEndCall}
            className="px-5 py-3.5 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs flex items-center gap-2 shadow-lg shadow-rose-600/30 transition active:scale-95"
            title="End Video Consultation"
          >
            <PhoneOff size={18} />
            <span className="hidden sm:inline">End Consultation</span>
          </button>
        </div>

        {/* Doctor Post-Call Action Trigger */}
        {isDoctor && (
          <button
            onClick={() => setShowWrapUpModal(true)}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-teal-500/20 text-teal-300 hover:bg-teal-500/30 border border-teal-500/40 text-xs font-bold transition"
          >
            <FileText size={14} /> Notes & Prescription
          </button>
        )}
      </footer>

      {/* DOCTOR POST-CONSULTATION CLINICAL WRAP-UP MODAL */}
      {showWrapUpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-fadeIn">
          <div className="bg-white text-slate-800 rounded-3xl shadow-2xl max-w-2xl w-full border border-teal-100 overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-[#0b3d4f] via-[#0d5c75] to-[#0f766e] p-5 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-md">
                  <FileText className="h-5 w-5 text-teal-200" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold">Clinical Wrap-Up & Digital Prescription</h3>
                  <p className="text-xs text-teal-100/90">Document notes and medications for {patientName}</p>
                </div>
              </div>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleCompleteConsultation} className="p-6 overflow-y-auto space-y-4 text-xs">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Clinical Diagnosis *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Acute Pharyngitis, Seasonal Rhinitis"
                  value={diagnosis}
                  onChange={(e) => setDiagnosis(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-teal-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Doctor Consultation Notes *</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Document clinical observations, patient symptoms review, and lifestyle advice..."
                  value={clinicalNotes}
                  onChange={(e) => setClinicalNotes(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-teal-600"
                />
              </div>

              {/* Digital Prescriptions Section */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-700">Prescribed Medications</label>
                  <button
                    type="button"
                    onClick={handleAddPrescriptionItem}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-teal-700 hover:text-teal-900 bg-teal-50 px-2.5 py-1 rounded-lg border border-teal-200"
                  >
                    <Plus size={12} /> Add Medicine
                  </button>
                </div>

                <div className="space-y-2">
                  {prescriptions.map((med, index) => (
                    <div key={index} className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          placeholder="Medicine Name (e.g. Augmentin 625 Duo)"
                          value={med.medicineName}
                          onChange={(e) => handlePrescriptionChange(index, 'medicineName', e.target.value)}
                          className="flex-1 p-2 rounded-lg border border-slate-200 bg-white text-xs font-semibold focus:outline-none focus:border-teal-600"
                        />
                        {prescriptions.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemovePrescriptionItem(index)}
                            className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                        <div>
                          <span className="text-slate-400 block">Dosage</span>
                          <input
                            type="text"
                            placeholder="1 tablet"
                            value={med.dosage}
                            onChange={(e) => handlePrescriptionChange(index, 'dosage', e.target.value)}
                            className="w-full p-1.5 rounded-lg border border-slate-200 bg-white text-xs"
                          />
                        </div>
                        <div>
                          <span className="text-slate-400 block">Frequency</span>
                          <input
                            type="text"
                            placeholder="Twice daily"
                            value={med.frequency}
                            onChange={(e) => handlePrescriptionChange(index, 'frequency', e.target.value)}
                            className="w-full p-1.5 rounded-lg border border-slate-200 bg-white text-xs"
                          />
                        </div>
                        <div>
                          <span className="text-slate-400 block">Duration</span>
                          <input
                            type="text"
                            placeholder="5 days"
                            value={med.duration}
                            onChange={(e) => handlePrescriptionChange(index, 'duration', e.target.value)}
                            className="w-full p-1.5 rounded-lg border border-slate-200 bg-white text-xs"
                          />
                        </div>
                        <div>
                          <span className="text-slate-400 block">Instructions</span>
                          <input
                            type="text"
                            placeholder="After food"
                            value={med.instructions}
                            onChange={(e) => handlePrescriptionChange(index, 'instructions', e.target.value)}
                            className="w-full p-1.5 rounded-lg border border-slate-200 bg-white text-xs"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowWrapUpModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition text-xs"
                >
                  Dismiss
                </button>
                <button
                  type="submit"
                  disabled={completing}
                  className="px-5 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-extrabold text-xs shadow-md shadow-teal-700/20 flex items-center gap-1.5 transition"
                >
                  {completing ? (
                    <>
                      <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-r-transparent" />
                      <span>Saving Records...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={15} />
                      <span>Issue Digital Prescription & Complete</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
