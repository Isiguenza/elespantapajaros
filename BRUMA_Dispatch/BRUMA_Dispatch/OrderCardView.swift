//
//  OrderCardView.swift
//  BRUMA_Dispatch
//
//  Created by Iñaki Sigüenza on 11/04/26.
//

import SwiftUI
import Combine

struct OrderCardView: View {
    let order: Order
    let urgency: OrderUrgency
    let elapsedTime: String
    let isExpanded: Bool
    let onToggleExpand: () -> Void
    let onMarkAsReady: () -> Void
    @ObservedObject var viewModel: OrdersViewModel
    
    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            // Header con color según urgencia
            VStack(alignment: .leading, spacing: 8) {
                HStack {
                    // Mesa o Para Llevar en formato pill
                    HStack(spacing: 8) {
                        if let table = order.table {
                            Text("Mesa \(table.number)")
                                .font(.system(size: 14, weight: .semibold))
                                .foregroundColor(.white)
                                .padding(.horizontal, 12)
                                .padding(.vertical, 6)
                                .background(Color.white.opacity(0.2))
                                .clipShape(Capsule())
                        } else {
                            Text("Para Llevar")
                                .font(.system(size: 14, weight: .semibold))
                                .foregroundColor(.white)
                                .padding(.horizontal, 12)
                                .padding(.vertical, 6)
                                .background(Color.white.opacity(0.2))
                                .clipShape(Capsule())
                        }
                        
                        // Nombre del cliente si existe (para llevar)
                        if let customerName = order.customerName, !customerName.isEmpty {
                            HStack(spacing: 4) {
                                Image(systemName: "person.fill")
                                    .font(.system(size: 11))
                                Text(customerName)
                                    .font(.system(size: 13, weight: .medium))
                            }
                            .foregroundColor(.white)
                            .padding(.horizontal, 10)
                            .padding(.vertical, 6)
                            .background(Color.black.opacity(0.2))
                            .clipShape(Capsule())
                        }
                    }
                    
                    Spacer()
                    
                    // Tiempo transcurrido con ícono - usando TimelineView para actualización en tiempo real
                    TimelineView(.periodic(from: Date(), by: 1.0)) { context in
                        HStack(spacing: 4) {
                            Image(systemName: "clock")
                                .font(.system(size: 14))
                            Text(calculateElapsedTime(from: order.createdAt, at: context.date))
                                .font(.system(size: 14, weight: .semibold))
                        }
                        .foregroundColor(.white)
                    }
                }
                
                // Tiempo de preparación si existe
                if let prepTime = order.preparationTime {
                    Text("\(prepTime) min")
                        .font(.system(size: 13))
                        .foregroundColor(.white.opacity(0.8))
                }
            }
            .padding(16)
            .background(urgencyColor(urgency))
            
            VStack(alignment: .leading, spacing: 12) {
                
                // Items
                let activeItems = (order.items?.filter { $0.voided != true } ?? [])
                    .sorted { $0.id < $1.id } // Ordenar por ID para estabilidad
                let visibleItems = isExpanded ? activeItems : Array(activeItems.prefix(3))
                
                VStack(alignment: .leading, spacing: 12) {
                    // Separate beverages and food - siempre mismo orden
                    let beverages = visibleItems.filter { $0.product?.category?.isBeverage == true }
                    let food = visibleItems.filter { $0.product?.category?.isBeverage != true }
                    
                    // Beverages section - siempre primero
                    if !beverages.isEmpty {
                        VStack(alignment: .leading, spacing: 8) {
                            HStack(spacing: 6) {
                                Image(systemName: "wineglass")
                                    .font(.system(size: 12, weight: .bold))
                                Text("Bebidas")
                                    .font(.system(size: 12, weight: .bold))
                            }
                            .foregroundColor(.cyan)
                            .padding(.horizontal, 12)
                            .padding(.vertical, 6)
                            .background(Color.cyan.opacity(0.1))
                            .cornerRadius(8)
                            
                            ForEach(beverages, id: \.id) { item in
                                OrderItemView(item: item, viewModel: viewModel)
                            }
                        }
                    }
                    
                    // Food items grouped by course - siempre después
                    if !food.isEmpty {
                        let courseGroups = Dictionary(grouping: food) { $0.course ?? 1 }
                        let sortedCourses = courseGroups.keys.sorted()
                        
                        ForEach(sortedCourses, id: \.self) { course in
                            if sortedCourses.count > 1 {
                                HStack(spacing: 6) {
                                    Image(systemName: "clock")
                                        .font(.system(size: 12, weight: .bold))
                                    Text("Tiempo \(course)")
                                        .font(.system(size: 12, weight: .bold))
                                }
                                .foregroundColor(.green)
                                .padding(.horizontal, 12)
                                .padding(.vertical, 6)
                                .background(Color.green.opacity(0.1))
                                .cornerRadius(8)
                            }
                            
                            ForEach((courseGroups[course] ?? []).sorted { $0.id < $1.id }, id: \.id) { item in
                                OrderItemView(item: item, viewModel: viewModel)
                            }
                        }
                    }
                }
                
                // Show more button
                if activeItems.count > 3 {
                    Button(action: onToggleExpand) {
                        HStack(spacing: 4) {
                            Image(systemName: isExpanded ? "chevron.up" : "chevron.down")
                                .font(.system(size: 12))
                            Text(isExpanded ? "Ocultar" : "\(activeItems.count - 3) producto\(activeItems.count - 3 > 1 ? "s" : "") más")
                                .font(.system(size: 12))
                        }
                        .foregroundColor(.blue)
                    }
                }
                
                // Slide to confirm
                VStack(spacing: 8) {
                    Text("Desliza para marcar como entregado")
                        .font(.system(size: 11))
                        .foregroundColor(.gray)
                        .frame(maxWidth: .infinity)
                    
                    SlideToConfirmView(onConfirm: onMarkAsReady)
                }
                .padding(.top, 16)
            }
            .padding(16)
        }
        .background(Color(red: 0.15, green: 0.15, blue: 0.15))
        .cornerRadius(12)
    }
    
    private func calculateElapsedTime(from createdAtString: String, at currentDate: Date) -> String {
        guard let createdDate = parseDate(createdAtString) else {
            print("⚠️ Could not parse date: '\(createdAtString)'")
            return "0m 0s"
        }
        
        let elapsed = max(0, Int(currentDate.timeIntervalSince(createdDate)))
        let minutes = elapsed / 60
        let seconds = elapsed % 60
        
        return "\(minutes)m \(seconds)s"
    }
    
    private func parseDate(_ dateString: String) -> Date? {
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
        
        // Último intento con ISO8601DateFormatter
        let iso = ISO8601DateFormatter()
        iso.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        if let date = iso.date(from: dateString) {
            return date
        }
        
        iso.formatOptions = [.withInternetDateTime]
        return iso.date(from: dateString)
    }
    
    private func urgencyColor(_ urgency: OrderUrgency) -> Color {
        switch urgency {
        case .normal:
            return Color(red: 0.2, green: 0.7, blue: 0.4) // Verde: 0-10 min
        case .warning:
            return Color(red: 1.0, green: 0.8, blue: 0.2) // Amarillo: 10-15 min
        case .urgent:
            return Color(red: 0.8, green: 0.3, blue: 0.3) // Rojo: >15 min
        case .attention:
            return Color.gray // No usado
        }
    }
}

// MARK: - Order Item View
struct OrderItemView: View {
    let item: OrderItem
    @ObservedObject var viewModel: OrdersViewModel
    
    var body: some View {
        HStack(alignment: .top, spacing: 12) {
            // Quantity badge
            Text("\(item.quantity)x")
                .font(.system(size: 13, weight: .bold))
                .foregroundColor(.black)
                .frame(width: 32, height: 32)
                .background(Color.white)
                .clipShape(Circle())
            
            VStack(alignment: .leading, spacing: 4) {
                // Product name
                Text(item.productName)
                    .font(.system(size: 16, weight: .semibold))
                    .foregroundColor(.white)
                
                // Frosting
                if let frosting = item.frostingName {
                    HStack(spacing: 4) {
                        Text("↳")
                            .foregroundColor(.blue.opacity(0.5))
                        Text(frosting)
                            .foregroundColor(.blue)
                    }
                    .font(.system(size: 14))
                }
                
                // Dry topping
                if let topping = item.dryToppingName {
                    HStack(spacing: 4) {
                        Text("↳")
                            .foregroundColor(.purple.opacity(0.5))
                        Text(topping)
                            .foregroundColor(.purple)
                    }
                    .font(.system(size: 14))
                }
                
                // Extra
                if let extra = item.extraName {
                    HStack(spacing: 4) {
                        Text("↳")
                            .foregroundColor(.green.opacity(0.5))
                        Text(extra)
                            .foregroundColor(.green)
                    }
                    .font(.system(size: 14))
                }
                
                // Custom modifiers
                if let customMods = viewModel.parseCustomModifiers(item.customModifiers) {
                    ForEach(Array(customMods.keys), id: \.self) { key in
                        if let modifier = customMods[key] {
                            HStack(spacing: 4) {
                                Text("↳")
                                    .foregroundColor(.orange.opacity(0.5))
                                Text("\(modifier.stepName): \(modifier.options.map { $0.name }.joined(separator: ", "))")
                                    .foregroundColor(.orange)
                            }
                            .font(.system(size: 14))
                        }
                    }
                }
                
                // Notes
                if let notes = item.notes, !notes.isEmpty {
                    HStack(spacing: 4) {
                        Text("↳")
                            .foregroundColor(.yellow.opacity(0.5))
                        Text(notes)
                            .foregroundColor(.yellow)
                            .italic()
                    }
                    .font(.system(size: 14, weight: .medium))
                }
            }
        }
    }
}

// MARK: - Slide to Confirm View
struct SlideToConfirmView: View {
    let onConfirm: () -> Void
    @State private var offset: CGFloat = 0
    @State private var isConfirmed = false
    
    private let buttonWidth: CGFloat = 60
    private let trackHeight: CGFloat = 60
    
    var body: some View {
        GeometryReader { geometry in
            let maxOffset = geometry.size.width - buttonWidth - 8
            
            ZStack(alignment: .leading) {
                // Track background
                RoundedRectangle(cornerRadius: 30)
                    .fill(Color.green.opacity(0.2))
                    .frame(height: trackHeight)
                
                // Progress indicator
                RoundedRectangle(cornerRadius: 30)
                    .fill(Color.green.opacity(0.3))
                    .frame(width: offset + buttonWidth, height: trackHeight)
                
                // Checkmark icon
                HStack {
                    Spacer()
                    Image(systemName: "checkmark")
                        .font(.system(size: 20, weight: .bold))
                        .foregroundColor(.green.opacity(0.3))
                        .padding(.trailing, 20)
                }
                .frame(height: trackHeight)
                
                // Draggable button
                Circle()
                    .fill(Color.green)
                    .frame(width: buttonWidth, height: buttonWidth)
                    .overlay(
                        Image(systemName: "chevron.right.2")
                            .font(.system(size: 16, weight: .bold))
                            .foregroundColor(.white)
                    )
                    .offset(x: offset + 4)
                    .gesture(
                        DragGesture()
                            .onChanged { value in
                                let newOffset = max(0, min(value.translation.width, maxOffset))
                                offset = newOffset
                            }
                            .onEnded { value in
                                if offset > maxOffset * 0.8 {
                                    // Confirmed
                                    withAnimation(.spring()) {
                                        offset = maxOffset
                                        isConfirmed = true
                                    }
                                    
                                    DispatchQueue.main.asyncAfter(deadline: .now() + 0.3) {
                                        onConfirm()
                                    }
                                } else {
                                    // Reset
                                    withAnimation(.spring()) {
                                        offset = 0
                                    }
                                }
                            }
                    )
            }
            .frame(height: trackHeight)
        }
        .frame(height: trackHeight)
    }
}
