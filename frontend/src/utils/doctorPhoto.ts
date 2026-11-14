export const FALLBACK_DOCTOR_PHOTO =
  'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=300&auto=format&fit=crop&q=80';

export function getDoctorPhoto(doctor?: any): string {
  const pic =
    doctor?.userId?.profilePicture ||
    doctor?.profilePicture ||
    doctor?.image ||
    doctor?.avatar ||
    doctor?.userId?.avatar;

  if (pic && typeof pic === 'string' && pic.trim() !== '') {
    return pic;
  }

  // Deterministic fallback from the 35 available high-res doctor photos
  const idStr = String(doctor?._id || doctor?.userId?._id || doctor?.name || doctor?.email || '1');
  const num = (idStr.charCodeAt(idStr.length - 1) % 35) + 1;
  const pad = num < 10 ? `0${num}` : `${num}`;
  return `/doctor-photos/doctor${pad}.png`;
}
