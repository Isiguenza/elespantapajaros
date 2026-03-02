// Helper function to play notification sound
export function playNotificationSound() {
  try {
    // Check if notifications are muted
    const isMuted = localStorage.getItem("notifications_muted") === "true";
    console.log("🔊 playNotificationSound llamado - Muted:", isMuted);
    if (isMuted) {
      console.log("🔇 Sonido silenciado por usuario");
      return;
    }

    // Try to play audio file if it exists (try .wav first, then .mp3)
    const tryPlayAudio = async () => {
      try {
        console.log("🎵 Intentando reproducir /notification.wav");
        const audio = new Audio("/notification.wav");
        audio.volume = 0.5;
        await audio.play();
        console.log("✅ notification.wav reproducido exitosamente");
      } catch (error) {
        console.log("❌ Error con .wav:", error);
        try {
          console.log("🎵 Intentando reproducir /notification.mp3");
          const audio = new Audio("/notification.mp3");
          audio.volume = 0.5;
          await audio.play();
          console.log("✅ notification.mp3 reproducido exitosamente");
        } catch (error2) {
          console.log("❌ Error con .mp3:", error2);
          console.log("🔔 Usando beep generado como fallback");
          generateBeep();
        }
      }
    };
    tryPlayAudio();
  } catch (error) {
    console.error("❌ Error general en playNotificationSound:", error);
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
