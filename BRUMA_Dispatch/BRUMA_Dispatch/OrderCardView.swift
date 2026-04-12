//
//  OrderCardView.swift
//  BRUMA_Dispatch
//
//  Created by Iñaki Sigüenza on 11/04/26.
//

import SwiftUI

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
            // Header with urgency color
            HStack {
                Text("#\(order.orderNumber)")
                    .font(.system(size: 20, weight: .bold))
                    .foregroundColor(.white)
                
                Spacer()
                
                Text(elapsedTime)
                    .font(.system(size: 14))
                    .foregroundColor(.white)
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 12)
            .background(urgencyColor(urgency))
            
            VStack(alignment: .leading, spacing: 12) {
                // Table or Takeout
                HStack(spacing: 4) {
                    if let table = order.table {
                        Text("Mesa \(table.number)")
                            .font(.system(size: 12, weight: .semibold))
                            .foregroundColor(.yellow)
                    } else {
                        Text("Para Llevar")
                            .font(.system(size: 12, weight: .semibold))
                            .foregroundColor(.green)
                    }
                    
                    if let customerName = order.customerName {
                        Text("• \(customerName)")
                            .font(.system(size: 12))
                            .foregroundColor(.gray)
                    }
                }
                
                // Items
                let activeItems = order.items?.filter { $0.voided != true } ?? []
                let visibleItems = isExpanded ? activeItems : Array(activeItems.prefix(3))
                
                VStack(alignment: .leading, spacing: 12) {
                    // Separate beverages and food
                    let beverages = visibleItems.filter { $0.product?.category?.isBeverage == true }
                    let food = visibleItems.filter { $0.product?.category?.isBeverage != true }
                    
                    // Beverages section
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
                            
                            ForEach(beverages) { item in
                                OrderItemView(item: item, viewModel: viewModel)
                            }
                        }
                    }
                    
                    // Food items grouped by course
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
                            
                            ForEach(courseGroups[course] ?? []) { item in
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
            }
            .padding(16)
        }
        .background(Color(UIColor.systemGray6))
        .cornerRadius(12)
        .overlay(
            RoundedRectangle(cornerRadius: 12)
                .stroke(Color.gray.opacity(0.3), lineWidth: 1)
        )
    }
    
    private func urgencyColor(_ urgency: OrderUrgency) -> Color {
        switch urgency {
        case .normal:
            return Color.gray
        case .attention:
            return Color.yellow
        case .warning:
            return Color.orange
        case .urgent:
            return Color.red
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
            Text("\(item.quantity)")
                .font(.system(size: 14, weight: .bold))
                .foregroundColor(.white)
                .frame(width: 28, height: 28)
                .background(Color.blue)
                .clipShape(Circle())
            
            VStack(alignment: .leading, spacing: 4) {
                // Product name
                Text(item.productName)
                    .font(.system(size: 16, weight: .semibold))
                    .foregroundColor(.primary)
                
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
    private let trackHeight: CGFloat = 50
    
    var body: some View {
        GeometryReader { geometry in
            let maxOffset = geometry.size.width - buttonWidth - 8
            
            ZStack(alignment: .leading) {
                // Track background
                RoundedRectangle(cornerRadius: 25)
                    .fill(Color.green.opacity(0.2))
                    .frame(height: trackHeight)
                
                // Progress indicator
                RoundedRectangle(cornerRadius: 25)
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
