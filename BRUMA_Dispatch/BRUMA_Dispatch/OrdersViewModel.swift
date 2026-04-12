//
//  OrdersViewModel.swift
//  BRUMA_Dispatch
//
//  Created by Iñaki Sigüenza on 11/04/26.
//

import Foundation
import SwiftUI
import Combine

@MainActor
class OrdersViewModel: ObservableObject {
    @Published var orders: [Order] = []
    @Published var previousOrderIds: Set<String> = []
    @Published var expandedOrderIds: Set<String> = []
    @Published var isLoading = false
    @Published var errorMessage: String?
    
    private var timer: Timer?
    private let soundPlayer = SoundPlayer.shared
    
    init() {
        Task {
            await startPolling()
        }
    }
    
    deinit {
        timer?.invalidate()
        timer = nil
    }
    
    // Start polling for orders every 3 seconds
    func startPolling() async {
        await fetchOrders()
        timer = Timer.scheduledTimer(withTimeInterval: 3.0, repeats: true) { [weak self] _ in
            Task { @MainActor in
                await self?.fetchOrders()
            }
        }
    }
    
    func stopPolling() {
        timer?.invalidate()
        timer = nil
    }
    
    // Fetch orders from API
    func fetchOrders() async {
        do {
            let newOrders = try await APIService.shared.fetchPreparingOrders()
            let newOrderIds = Set(newOrders.map { $0.id })
            
            // Check for new orders
            let hasNewOrder = newOrders.contains { !previousOrderIds.contains($0.id) }
            
            if hasNewOrder && !previousOrderIds.isEmpty {
                print("🔔 New order detected!")
                soundPlayer.playNotification()
            }
            
            previousOrderIds = newOrderIds
            orders = newOrders
            errorMessage = nil
            
        } catch {
            print("❌ Error fetching orders: \(error)")
            errorMessage = "Error al cargar órdenes"
        }
    }
    
    // Mark order as ready
    func markOrderAsReady(orderId: String, orderNumber: Int) async {
        do {
            try await APIService.shared.markOrderAsReady(orderId: orderId)
            print("✅ Order #\(orderNumber) marked as ready")
            await fetchOrders()
        } catch {
            print("❌ Error marking order as ready: \(error)")
            errorMessage = "Error al marcar orden como lista"
        }
    }
    
    // Toggle order expansion
    func toggleExpand(orderId: String) {
        if expandedOrderIds.contains(orderId) {
            expandedOrderIds.remove(orderId)
        } else {
            expandedOrderIds.insert(orderId)
        }
    }
    
    // Get order urgency based on elapsed time
    func getOrderUrgency(order: Order) -> OrderUrgency {
        guard let createdDate = ISO8601DateFormatter().date(from: order.createdAt) else {
            return .normal
        }
        
        let elapsed = Date().timeIntervalSince(createdDate)
        let minutes = Int(elapsed / 60)
        
        if minutes > 10 {
            return .urgent
        } else if minutes > 7 {
            return .warning
        } else if minutes > 4 {
            return .attention
        } else {
            return .normal
        }
    }
    
    // Get elapsed time string
    func getElapsedTime(order: Order) -> String {
        guard let createdDate = ISO8601DateFormatter().date(from: order.createdAt) else {
            return "0m 0s"
        }
        
        let elapsed = Int(Date().timeIntervalSince(createdDate))
        let minutes = elapsed / 60
        let seconds = elapsed % 60
        
        return "\(minutes)m \(seconds)s"
    }
    
    // Parse custom modifiers JSON
    func parseCustomModifiers(_ json: String?) -> [String: CustomModifier]? {
        guard let json = json,
              let data = json.data(using: .utf8) else {
            return nil
        }
        
        return try? JSONDecoder().decode([String: CustomModifier].self, from: data)
    }
}
