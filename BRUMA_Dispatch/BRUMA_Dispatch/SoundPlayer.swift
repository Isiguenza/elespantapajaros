//
//  SoundPlayer.swift
//  BRUMA_Dispatch
//
//  Created by Iñaki Sigüenza on 11/04/26.
//

import AVFoundation
import UIKit
import Combine

class SoundPlayer: ObservableObject {
    static let shared = SoundPlayer()
    
    private var audioPlayer: AVAudioPlayer?
    @Published var isEnabled: Bool = true // Always enabled
    
    private init() {
        setupAudioSession()
        loadSound()
    }
    
    private func setupAudioSession() {
        do {
            // Configurar para reproducción con volumen máximo
            try AVAudioSession.sharedInstance().setCategory(.playback, mode: .default, options: [])
            try AVAudioSession.sharedInstance().setActive(true)
            
            // Forzar volumen del sistema al máximo (si es posible)
            try AVAudioSession.sharedInstance().overrideOutputAudioPort(.speaker)
        } catch {
            print("❌ Error setting up audio session: \(error)")
        }
    }
    
    private func loadSound() {
        guard let soundURL = Bundle.main.url(forResource: "chime_alert", withExtension: "wav") else {
            print("❌ Sound file not found")
            return
        }
        
        do {
            audioPlayer = try AVAudioPlayer(contentsOf: soundURL)
            audioPlayer?.volume = 1.0 // Volumen al máximo
            audioPlayer?.prepareToPlay()
            print("✅ Sound loaded successfully (chime_alert.wav)")
        } catch {
            print("❌ Error loading sound: \(error)")
        }
    }
    
    func playNotification() {
        // Always play sound, no check for isEnabled
        guard let player = audioPlayer else {
            print("❌ Audio player not initialized")
            return
        }
        
        // Vibrate device
        UIImpactFeedbackGenerator(style: .heavy).impactOccurred()
        
        // Forzar volumen al máximo antes de reproducir
        player.volume = 1.0
        player.currentTime = 0
        player.play()
        print("🔔 Playing chime_alert.wav at MAX VOLUME (forced)")
    }
    
    func toggleSound() {
        isEnabled.toggle()
        print(isEnabled ? "🔊 Sound enabled" : "🔇 Sound disabled")
    }
}
