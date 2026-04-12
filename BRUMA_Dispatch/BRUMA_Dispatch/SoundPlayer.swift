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
    @Published var isEnabled: Bool = true
    
    private init() {
        setupAudioSession()
        loadSound()
    }
    
    private func setupAudioSession() {
        do {
            try AVAudioSession.sharedInstance().setCategory(.playback, mode: .default)
            try AVAudioSession.sharedInstance().setActive(true)
        } catch {
            print("❌ Error setting up audio session: \(error)")
        }
    }
    
    private func loadSound() {
        guard let soundURL = Bundle.main.url(forResource: "notification_sound", withExtension: "wav") else {
            print("❌ Sound file not found")
            return
        }
        
        do {
            audioPlayer = try AVAudioPlayer(contentsOf: soundURL)
            audioPlayer?.prepareToPlay()
            print("✅ Sound loaded successfully")
        } catch {
            print("❌ Error loading sound: \(error)")
        }
    }
    
    func playNotification() {
        guard isEnabled else {
            print("🔇 Sound is disabled")
            return
        }
        
        guard let player = audioPlayer else {
            print("❌ Audio player not initialized")
            return
        }
        
        // Vibrate device
        UIImpactFeedbackGenerator(style: .heavy).impactOccurred()
        
        // Play sound
        player.currentTime = 0
        player.play()
        print("🔔 Playing notification sound")
    }
    
    func toggleSound() {
        isEnabled.toggle()
        print(isEnabled ? "🔊 Sound enabled" : "🔇 Sound disabled")
    }
}
