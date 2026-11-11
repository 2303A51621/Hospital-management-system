export interface ShiftInfo {
  startTime: string;
  endTime: string;
  formattedStart: string;
  formattedEnd: string;
  shiftRange: string;
  shiftTag: string;
  shiftName: string;
  daysBadge: string;
  hoursBadge: string;
  slotDuration: number;
}

export function formatDoctorShift(doctor: any): ShiftInfo {
  let startTime = doctor?.availableSlots?.startTime || doctor?.availability?.[0]?.startTime;
  let endTime = doctor?.availableSlots?.endTime || doctor?.availability?.[0]?.endTime;
  const slotDuration = doctor?.availableSlots?.slotDuration || 30;

  if (!startTime || !endTime) {
    const hash = String(doctor?._id || doctor?.licenseNumber || 'KH01')
      .split('')
      .reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0);
    const shiftIndex = hash % 12;
    const startHour = (6 + shiftIndex * 2) % 24;
    const endHour = (startHour + 12) % 24;
    startTime = `${String(startHour).padStart(2, '0')}:00`;
    endTime = `${String(endHour).padStart(2, '0')}:00`;
  }

  const toAmPm = (timeStr: string) => {
    if (!timeStr) return '';
    const parts = timeStr.split(':');
    let h = parseInt(parts[0], 10);
    const m = parts[1] || '00';
    if (isNaN(h)) return timeStr;
    if (h === 24) h = 0;
    const period = h >= 12 && h < 24 ? 'PM' : 'AM';
    const displayHour = h % 12 === 0 ? 12 : h % 12;
    return `${String(displayHour).padStart(2, '0')}:${m} ${period}`;
  };

  const formattedStart = toAmPm(startTime);
  const formattedEnd = toAmPm(endTime);

  const startHour = parseInt(startTime.split(':')[0], 10);
  let shiftName = 'Day Shift';
  let shiftTag = '12h Shift';

  if (startHour >= 6 && startHour < 10) {
    shiftName = 'Morning Shift';
    shiftTag = 'Morning Shift (12h)';
  } else if (startHour >= 10 && startHour < 14) {
    shiftName = 'Mid-Day Shift';
    shiftTag = 'Mid-Day Shift (12h)';
  } else if (startHour >= 14 && startHour < 18) {
    shiftName = 'Evening Shift';
    shiftTag = 'Evening Shift (12h)';
  } else if (startHour >= 18 && startHour < 22) {
    shiftName = 'Night Shift';
    shiftTag = 'Night Shift (12h)';
  } else {
    shiftName = 'Overnight Shift';
    shiftTag = 'Overnight Shift (12h)';
  }

  return {
    startTime,
    endTime,
    formattedStart,
    formattedEnd,
    shiftRange: `${formattedStart} – ${formattedEnd}`,
    shiftTag,
    shiftName,
    daysBadge: 'Monday to Sunday (7 Days)',
    hoursBadge: '12 Hours Daily',
    slotDuration,
  };
}

export function generateDoctor12HourSlots(startTimeStr?: string, endTimeStr?: string, duration = 30): string[] {
  const toMinutes = (timeStr: string) => {
    if (!timeStr) return 0;
    const [h, m] = String(timeStr).split(':').map(Number);
    return (h || 0) * 60 + (m || 0);
  };

  let start = toMinutes(startTimeStr || '08:00');
  let end = toMinutes(endTimeStr || '20:00');
  if (end <= start) {
    end += 1440;
  }

  const toAmPm = (h24: number, m: number) => {
    const period = h24 >= 12 && h24 < 24 ? 'PM' : 'AM';
    const displayHour = h24 % 12 === 0 ? 12 : h24 % 12;
    return `${String(displayHour).padStart(2, '0')}:${String(m).padStart(2, '0')} ${period}`;
  };

  const slots: string[] = [];
  for (let t = start; t + duration <= end; t += duration) {
    const curStartMin = t % 1440;
    const sh = Math.floor(curStartMin / 60);
    const sm = curStartMin % 60;
    slots.push(toAmPm(sh, sm));
  }
  return slots;
}
