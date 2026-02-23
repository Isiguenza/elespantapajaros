// Helper function to play notification sound
export function playNotificationSound() {
  try {
    // Check if notifications are muted
    const isMuted = localStorage.getItem("notifications_muted") === "true";
    if (isMuted) return;

    // Try to play audio file if it exists
    const audio = new Audio("/notification.mp3");
    audio.volume = 0.5;
    audio.play().catch(() => {
      // If audio file fails, use Web Audio API to generate beep
      generateBeep();
    });
  } catch (error) {
    // Fallback to beep if audio fails
    generateBeep();
  }
}

function generateBeep() {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = 800; // Frequency in Hz
    oscillator.type = "sine";

    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.3);
  } catch (error) {
    console.error("Error generating beep:", error);
  }
}

export function toggleNotificationSound(muted: boolean) {
  localStorage.setItem("notifications_muted", String(muted));
}

export function isNotificationMuted(): boolean {
  return localStorage.getItem("notifications_muted") === "true";
}
