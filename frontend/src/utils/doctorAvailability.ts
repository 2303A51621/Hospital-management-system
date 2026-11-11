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
  let startTime = doctor?.availableSlots?.startTime || doctor?.availability?.[0]?.startTime || '00:00';
  let endTime = doctor?.availableSlots?.endTime || doctor?.availability?.[0]?.endTime || '24:00';
  const slotDuration = doctor?.availableSlots?.slotDuration || 30;

  const is24Hours = (startTime === '00:00' && (endTime === '24:00' || endTime === '00:00')) ||
    (doctor?.availableDays && doctor.availableDays.length === 7);

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

  if (is24Hours) {
    return {
      startTime: '00:00',
      endTime: '24:00',
      formattedStart: '12:00 AM',
      formattedEnd: '11:59 PM',
      shiftRange: '24 Hours (Round-the-Clock)',
      shiftTag: '24/7 Available',
      shiftName: '24/7 Consultation',
      daysBadge: 'Monday to Sunday (All 7 Days)',
      hoursBadge: '24 Hours Daily',
      slotDuration,
    };
  }

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

  let start = toMinutes(startTimeStr || '00:00');
  let end = toMinutes(endTimeStr || '24:00');
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

export function generateDoctor24HourSlots(duration = 30): string[] {
  const toAmPm = (h24: number, m: number) => {
    const period = h24 >= 12 && h24 < 24 ? 'PM' : 'AM';
    const displayHour = h24 % 12 === 0 ? 12 : h24 % 12;
    return `${String(displayHour).padStart(2, '0')}:${String(m).padStart(2, '0')} ${period}`;
  };

  const slots: string[] = [];
  for (let t = 0; t + duration <= 1440; t += duration) {
    const sh = Math.floor(t / 60);
    const sm = t % 60;
    slots.push(toAmPm(sh, sm));
  }
  return slots;
}
