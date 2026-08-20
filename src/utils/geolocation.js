/**
 * Browser GPS helpers for location features.
 */

export function getCurrentGpsPosition({
  enableHighAccuracy = true,
  timeout = 20000,
  maximumAge = 15000,
} = {}) {
  return new Promise((resolve, reject) => {
    if (!navigator?.geolocation) {
      reject(new Error('Location unavailable.\nPlease enable GPS/location services and try again.'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          timestamp: pos.timestamp || Date.now(),
        });
      },
      (err) => {
        if (err?.code === 1) {
          reject(
            new Error(
              'Location permission is required for attendance.\nPlease enable GPS/location permission and try again.'
            )
          );
          return;
        }
        if (err?.code === 2) {
          reject(new Error('Location unavailable.\nPlease enable GPS/location services and try again.'));
          return;
        }
        if (err?.code === 3) {
          reject(new Error('Location request timed out.\nPlease move to an open area and try again.'));
          return;
        }
        reject(new Error(err?.message || 'Location unavailable. Please try again.'));
      },
      { enableHighAccuracy, timeout, maximumAge }
    );
  });
}

export function formatAttendanceScanSuccess(attendance = {}) {
  const dist =
    attendance.distanceFromAkhada != null || attendance.distanceMeters != null
      ? Math.round(attendance.distanceFromAkhada ?? attendance.distanceMeters)
      : null;
  const lines = [
    '✓ Attendance Marked',
    attendance.name || attendance.studentName || attendance.coachName || '',
    attendance.type || '',
    `Present · ${attendance.time || ''}`,
  ].filter(Boolean);
  if (dist != null) lines.push(`Distance from Academy: ${dist} meters`);
  if (attendance.locationVerified) lines.push('Location Verified ✓');
  return lines.join('\n');
}
