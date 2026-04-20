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
    @Published var previousItemCounts: [String: Int] = [:] // orderId -> item count
    @Published var expandedOrderIds: Set<String> = []
    @Published var isLoading = false
    @Published var errorMessage: String?
    @Published var currentTime = Date() // Para forzar actualización del timer
    
    private var timer: Timer?
    private var uiTimer: Timer?
    private let soundPlayer = SoundPlayer.shared
    
    init() {
        Task {
            await startPolling()
        }
    }
    
    deinit {
        timer?.invalidate()
        timer = nil
        uiTimer?.invalidate()
        uiTimer = nil
    }
    
    // Start polling for orders every 3 seconds
    func startPolling() async {
        await fetchOrders()
        
        // Timer para actualizar órdenes cada 3 segundos
        timer = Timer.scheduledTimer(withTimeInterval: 3.0, repeats: true) { [weak self] _ in
            Task { @MainActor in
                await self?.fetchOrders()
            }
        }
        RunLoop.main.add(timer!, forMode: .common)
        
        // Timer para actualizar UI cada segundo (para el reloj)
        uiTimer = Timer.scheduledTimer(withTimeInterval: 1.0, repeats: true) { [weak self] _ in
            Task { @MainActor in
                self?.currentTime = Date()
            }
        }
        RunLoop.main.add(uiTimer!, forMode: .common)
    }
    
    func stopPolling() {
        timer?.invalidate()
        timer = nil
        uiTimer?.invalidate()
        uiTimer = nil
    }
    
    // Fetch orders from API
    func fetchOrders() async {
        do {
            let newOrders = try await APIService.shared.fetchPreparingOrders()
            let newOrderIds = Set(newOrders.map { $0.id })
            
            // Check for new orders
            let hasNewOrder = newOrders.contains { !previousOrderIds.contains($0.id) }
            
            // Check for existing orders with new items added
            var ordersWithNewItems: [String] = []
            for order in newOrders {
                let currentCount = order.items?.filter { $0.voided != true }.count ?? 0
                let previousCount = previousItemCounts[order.id] ?? 0
                if previousOrderIds.contains(order.id) && currentCount > previousCount {
                    ordersWithNewItems.append(order.id)
                    print("🆕 Order #\(order.orderNumber) has \(currentCount - previousCount) new items!")
                }
            }
            
            // Play sound for new orders OR new items added
            if hasNewOrder || !ordersWithNewItems.isEmpty {
                print("🔔 Notification: new order=\(hasNewOrder), orders with new items=\(ordersWithNewItems.count)")
                soundPlayer.playNotification()
                
                // Auto-expand orders that received new items
                for orderId in ordersWithNewItems {
                    expandedOrderIds.insert(orderId)
                }
            }
            
            // Update tracking
            previousOrderIds = newOrderIds
            previousItemCounts = Dictionary(uniqueKeysWithValues: newOrders.map { 
                ($0.id, $0.items?.filter { $0.voided != true }.count ?? 0)
            })
            
            // Ordenar por fecha de creación (más recientes primero) para evitar saltos
            orders = newOrders.sorted { order1, order2 in
                guard let date1 = ISO8601DateFormatter().date(from: order1.createdAt),
                      let date2 = ISO8601DateFormatter().date(from: order2.createdAt) else {
                    return false
                }
                return date1 > date2
            }
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
        guard let createdDate = parseDate(order.createdAt) else {
            return .normal
        }
        
        let elapsed = Date().timeIntervalSince(createdDate)
        let minutes = Int(elapsed / 60)
        
        if minutes > 15 {
            return .urgent      // Rojo: >15 min
        } else if minutes > 10 {
            return .warning     // Amarillo: 10-15 min
        } else {
            return .normal      // Verde: 0-10 min
        }
    }
    
    // Get elapsed time string
    func getElapsedTime(order: Order) -> String {
        guard let createdDate = parseDate(order.createdAt) else {
            return "0m 0s"
        }
        
        let elapsed = Int(currentTime.timeIntervalSince(createdDate))
        let minutes = elapsed / 60
        let seconds = elapsed % 60
        
        return "\(minutes)m \(seconds)s"
    }
    
    // Robust date parser for multiple formats
    func parseDate(_ dateString: String) -> Date? {
        let formats = [
            "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'",
            "yyyy-MM-dd'T'HH:mm:ss.SSSZ",
            "yyyy-MM-dd'T'HH:mm:ss.SSSSSS'Z'",
            "yyyy-MM-dd'T'HH:mm:ss.SSSSSSZ",
            "yyyy-MM-dd'T'HH:mm:ss'Z'",
            "yyyy-MM-dd'T'HH:mm:ssZ",
            "yyyy-MM-dd'T'HH:mm:ss",
            "yyyy-MM-dd HH:mm:ss.SSS",
            "yyyy-MM-dd HH:mm:ss",
        ]
        
        let df = DateFormatter()
        df.locale = Locale(identifier: "en_US_POSIX")
        df.timeZone = TimeZone(identifier: "UTC")
        
        for format in formats {
            df.dateFormat = format
            if let date = df.date(from: dateString) {
                return date
            }
        }
        
        let iso = ISO8601DateFormatter()
        iso.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        if let date = iso.date(from: dateString) {
            return date
        }
        
        iso.formatOptions = [.withInternetDateTime]
        return iso.date(from: dateString)
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
