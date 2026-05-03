import SwiftUI

struct ActiveOrdersView: View {
    @ObservedObject var ordersVM: OrdersViewModel
    
    var body: some View {
        VStack(spacing: 0) {
            HStack {
                Text("Órdenes Activas")
                    .font(.title3.weight(.bold))
                    .foregroundColor(.white)
                Spacer()
                Button(action: { ordersVM.fetchOrders() }) {
                    Image(systemName: "arrow.clockwise")
                        .font(.body)
                        .foregroundColor(.gray)
                }
            }
            .padding(.horizontal, 20)
            .padding(.top, 16)
            .padding(.bottom, 12)
            
            if ordersVM.orders.isEmpty {
                Spacer()
                VStack(spacing: 8) {
                    Image(systemName: "tray")
                        .font(.system(size: 36))
                        .foregroundColor(.gray)
                    Text("No hay órdenes activas")
                        .font(.subheadline)
                        .foregroundColor(.gray)
                }
                Spacer()
            } else {
                ScrollView(showsIndicators: false) {
                    VStack(spacing: 10) {
                        ForEach(ordersVM.orders) { order in
                            OrderCard(order: order)
                        }
                    }
                    .padding(.horizontal, 16)
                    .padding(.bottom, 100)
                }
            }
        }
        .onAppear { ordersVM.startPolling() }
        .onDisappear { ordersVM.stopPolling() }
    }
}

// MARK: - Order Card

struct OrderCard: View {
    let order: Order
    
    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                // Order info
                VStack(alignment: .leading, spacing: 2) {
                    Text(order.displayName)
                        .font(.subheadline.weight(.semibold))
                        .foregroundColor(.white)
                    HStack(spacing: 4) {
                        Text("#\(order.orderNumber)")
                            .font(.caption)
                            .foregroundColor(.gray)
                        if let tableName = order.tableName, !tableName.isEmpty {
                            Text("•")
                                .font(.caption)
                                .foregroundColor(.gray.opacity(0.5))
                            Text(tableName)
                                .font(.caption.weight(.medium))
                                .foregroundColor(.blue)
                        }
                    }
                }
                
                Spacer()
                
                // Status badge
                Text(order.statusLabel)
                    .font(.caption.weight(.semibold))
                    .foregroundColor(statusTextColor)
                    .padding(.horizontal, 10)
                    .padding(.vertical, 4)
                    .background(statusBackgroundColor)
                    .cornerRadius(8)
            }
            
            // Items
            if let items = order.items?.filter({ !($0.voided ?? false) }) {
                Divider().background(Color.white.opacity(0.08))
                
                ForEach(items) { item in
                    HStack(spacing: 6) {
                        Text("\(item.quantity)x")
                            .font(.caption.weight(.bold))
                            .foregroundColor(.gray)
                        Text(item.productName)
                            .font(.caption)
                            .foregroundColor(.white.opacity(0.8))
                            .lineLimit(1)
                        
                        if let notes = item.notes, !notes.isEmpty {
                            Text("(\(notes))")
                                .font(.caption2)
                                .foregroundColor(.orange.opacity(0.7))
                                .lineLimit(1)
                        }
                        
                        Spacer()
                        
                        if item.deliveredToTable == true {
                            Image(systemName: "checkmark.circle.fill")
                                .font(.caption2)
                                .foregroundColor(.green)
                        }
                    }
                }
            }
            
            // Employee name and Time
            HStack {
                if let employeeName = order.employeeName, !employeeName.isEmpty {
                    HStack(spacing: 4) {
                        Image(systemName: "person.fill")
                            .font(.caption2)
                        Text(employeeName)
                            .font(.caption2.weight(.medium))
                    }
                    .foregroundColor(.gray.opacity(0.7))
                }
                
                Spacer()
                
                if let created = order.createdAt {
                    Text(formatTime(created))
                        .font(.caption2)
                        .foregroundColor(.gray)
                }
            }
        }
        .padding(14)
        .background(
            RoundedRectangle(cornerRadius: 14)
                .fill(Color.white.opacity(0.05))
                .overlay(
                    RoundedRectangle(cornerRadius: 14)
                        .stroke(statusBorderColor, lineWidth: 1)
                )
        )
    }
    
    private var statusTextColor: Color {
        switch order.status {
        case "ready": return .green
        case "preparing": return .orange
        case "delivered": return .blue
        default: return .gray
        }
    }
    
    private var statusBackgroundColor: Color {
        statusTextColor.opacity(0.15)
    }
    
    private var statusBorderColor: Color {
        statusTextColor.opacity(0.2)
    }
    
    private func formatTime(_ isoString: String) -> String {
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        guard let date = formatter.date(from: isoString) else {
            // Try without fractional seconds
            formatter.formatOptions = [.withInternetDateTime]
            guard let date = formatter.date(from: isoString) else { return "" }
            return timeString(date)
        }
        return timeString(date)
    }
    
    private func timeString(_ date: Date) -> String {
        let tf = DateFormatter()
        tf.dateFormat = "h:mm a"
        tf.locale = Locale(identifier: "es_MX")
        return tf.string(from: date)
    }
}
