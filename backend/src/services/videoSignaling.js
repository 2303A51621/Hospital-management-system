const OnlineConsultation = require('../models/OnlineConsultation');
const ConsultationMessage = require('../models/ConsultationMessage');

function initVideoSignaling(io) {
  const activeRooms = new Map(); // roomId -> Set of socket IDs

  io.on('connection', (socket) => {
    socket.on('join-room', async (payload) => {
      try {
        const { roomId, user } = payload || {};
        if (!roomId || !user) {
          return socket.emit('room-error', { message: 'Invalid room or user payload' });
        }

        socket.roomId = roomId;
        socket.userData = user;
        socket.join(roomId);

        if (!activeRooms.has(roomId)) {
          activeRooms.set(roomId, new Set());
        }
        activeRooms.get(roomId).add(socket.id);

        // Fetch or update OnlineConsultation status in DB
        const consultation = await OnlineConsultation.findOne({ meetingRoomId: roomId })
          .populate('doctorId', 'userId specialization consultationFee')
          .populate('patientId', 'userId');

        if (consultation) {
          if (user.role === 'doctor') {
            consultation.doctorJoined = true;
            consultation.doctorJoinedAt = new Date();
          } else if (user.role === 'patient') {
            consultation.patientJoined = true;
            consultation.patientJoinedAt = new Date();
          }

          if (consultation.doctorJoined && consultation.patientJoined) {
            consultation.status = 'in-progress';
            if (!consultation.callStartedAt) {
              consultation.callStartedAt = new Date();
            }
          } else if (consultation.status === 'confirmed' || consultation.status === 'pending') {
            consultation.status = 'waiting';
          }

          await consultation.save();
        }

        const roomSockets = Array.from(activeRooms.get(roomId) || []);
        const participantCount = roomSockets.length;

        // Notify other participants in the room
        socket.to(roomId).emit('participant-joined', {
          socketId: socket.id,
          user: socket.userData,
          participantCount,
        });

        // Inform the joining socket about existing room state
        socket.emit('room-joined', {
          roomId,
          participantCount,
          isInitiator: participantCount > 1, // Second joiner can initiate WebRTC handshake
          consultation,
        });

        // If there are now 2 or more participants, signal both to initiate WebRTC offer/answer
        if (participantCount >= 2) {
          io.to(roomId).emit('room-ready', {
            participantCount,
            message: 'Both participants have connected. Establishing encrypted peer-to-peer connection.',
          });
        }
      } catch (err) {
        console.error('Error in join-room socket handler:', err);
        socket.emit('room-error', { message: 'Failed to join video consultation room' });
      }
    });

    // Relay WebRTC Offer
    socket.on('webrtc-offer', (data) => {
      if (!socket.roomId) return;
      socket.to(socket.roomId).emit('webrtc-offer', {
        sdp: data.sdp,
        fromSocketId: socket.id,
        user: socket.userData,
      });
    });

    // Relay WebRTC Answer
    socket.on('webrtc-answer', (data) => {
      if (!socket.roomId) return;
      socket.to(socket.roomId).emit('webrtc-answer', {
        sdp: data.sdp,
        fromSocketId: socket.id,
        user: socket.userData,
      });
    });

    // Relay ICE Candidate
    socket.on('ice-candidate', (data) => {
      if (!socket.roomId) return;
      socket.to(socket.roomId).emit('ice-candidate', {
        candidate: data.candidate,
        fromSocketId: socket.id,
        user: socket.userData,
      });
    });

    // Relay Media Toggle (Microphone Mute / Camera Off)
    socket.on('media-toggle', (data) => {
      if (!socket.roomId) return;
      socket.to(socket.roomId).emit('media-toggle', {
        type: data.type, // 'audio' | 'video' | 'screen'
        enabled: data.enabled,
        user: socket.userData,
      });
    });

    // Real-Time In-Call Chat Message
    socket.on('chat-message', async (data) => {
      try {
        const roomId = socket.roomId || data.roomId;
        if (!roomId || !data.message?.trim()) return;

        const senderName = data.senderName || socket.userData?.name || 'Participant';
        const senderRole = data.senderRole || socket.userData?.role || 'patient';
        const senderId = data.senderId || socket.userData?._id;

        // Persist message in database
        const savedMsg = await ConsultationMessage.create({
          roomId,
          senderId,
          senderName,
          senderRole,
          message: data.message.trim(),
          timestamp: new Date(),
        });

        // Broadcast to all participants in this room including sender
        io.to(roomId).emit('chat-message', {
          _id: savedMsg._id,
          roomId,
          senderName,
          senderRole,
          senderId,
          message: savedMsg.message,
          timestamp: savedMsg.timestamp,
        });
      } catch (err) {
        console.error('Error saving chat message:', err);
      }
    });

    // End Video Consultation Call
    socket.on('end-call', async (data) => {
      try {
        const roomId = socket.roomId || data.roomId;
        if (!roomId) return;

        const consultation = await OnlineConsultation.findOne({ meetingRoomId: roomId });
        if (consultation) {
          consultation.status = 'completed';
          consultation.callEndedAt = new Date();
          if (consultation.callStartedAt) {
            consultation.callDurationSeconds = Math.round(
              (consultation.callEndedAt.getTime() - consultation.callStartedAt.getTime()) / 1000
            );
          }
          await consultation.save();
        }

        io.to(roomId).emit('call-ended', {
          roomId,
          endedBy: socket.userData?.name || 'Participant',
          role: socket.userData?.role,
          callDurationSeconds: consultation?.callDurationSeconds || 0,
        });
      } catch (err) {
        console.error('Error in end-call handler:', err);
      }
    });

    // Handle Socket Disconnection
    socket.on('disconnect', async () => {
      const roomId = socket.roomId;
      if (roomId && activeRooms.has(roomId)) {
        const roomSet = activeRooms.get(roomId);
        roomSet.delete(socket.id);
        if (roomSet.size === 0) {
          activeRooms.delete(roomId);
        }

        socket.to(roomId).emit('participant-left', {
          socketId: socket.id,
          user: socket.userData,
          participantCount: roomSet.size,
          message: `${socket.userData?.name || 'Participant'} has disconnected.`,
        });

        // Update consultation presence
        try {
          const consultation = await OnlineConsultation.findOne({ meetingRoomId: roomId });
          if (consultation && consultation.status === 'in-progress') {
            if (socket.userData?.role === 'doctor') {
              consultation.doctorJoined = false;
            } else if (socket.userData?.role === 'patient') {
              consultation.patientJoined = false;
            }
            await consultation.save();
          }
        } catch (dbErr) {
          console.error('Error updating presence on disconnect:', dbErr);
        }
      }
    });
  });
}

module.exports = { initVideoSignaling };
