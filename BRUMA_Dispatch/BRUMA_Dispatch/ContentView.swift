//
//  ContentView.swift
//  BRUMA_Dispatch
//
//  Created by Iñaki Sigüenza on 11/04/26.
//

import SwiftUI

struct ContentView: View {
    @StateObject private var viewModel = OrdersViewModel()
    @StateObject private var soundPlayer = SoundPlayer.shared
    
    var body: some View {
        NavigationView {
            ZStack {
                Color.black.ignoresSafeArea()
                
                VStack(spacing: 0) {
                    // Header - Dark Mode
                    HStack(spacing: 16) {
                        Text("Comandera")
                            .font(.system(size: 32, weight: .bold))
                            .foregroundColor(.white)
                        
                        Text("Cocina")
                            .font(.system(size: 16, weight: .semibold))
                            .foregroundColor(.white)
                            .padding(.horizontal, 16)
                            .padding(.vertical, 8)
                            .background(Color(red: 1.0, green: 0.3, blue: 0.2))
                            .cornerRadius(8)
                        
                        Spacer()
                    }
                    .padding(.horizontal, 24)
                    .padding(.vertical, 20)
                    .background(Color(red: 0.1, green: 0.1, blue: 0.1))
                    
                    // Orders horizontal scroll
                    if viewModel.orders.isEmpty {
                        VStack(spacing: 16) {
                            Spacer()
                            Image(systemName: "checkmark.circle")
                                .font(.system(size: 60))
                                .foregroundColor(.green)
                            Text("No hay órdenes pendientes")
                                .font(.system(size: 20, weight: .medium))
                                .foregroundColor(.white.opacity(0.6))
                            Spacer()
                        }
                        .frame(maxWidth: .infinity, maxHeight: .infinity)
                    } else {
                        ScrollView(.vertical, showsIndicators: true) {
                            BentoGridLayout(spacing: 16) {
                                ForEach(viewModel.orders, id: \.id) { order in
                                    OrderCardView(
                                        order: order,
                                        urgency: viewModel.getOrderUrgency(order: order),
                                        elapsedTime: viewModel.getElapsedTime(order: order),
                                        isExpanded: viewModel.expandedOrderIds.contains(order.id),
                                        onToggleExpand: {
                                            viewModel.toggleExpand(orderId: order.id)
                                        },
                                        onMarkAsReady: {
                                            Task {
                                                await viewModel.markOrderAsReady(
                                                    orderId: order.id,
                                                    orderNumber: order.orderNumber
                                                )
                                            }
                                        },
                                        viewModel: viewModel
                                    )
                                }
                            }
                            .padding(20)
                        }
                    }
                }
            }
            .navigationBarHidden(true)
        }
        .navigationViewStyle(StackNavigationViewStyle())
    }
}

#Preview {
    ContentView()
}
