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
    
    private let columns = [
        GridItem(.flexible(), spacing: 16),
        GridItem(.flexible(), spacing: 16)
    ]
    
    var body: some View {
        NavigationView {
            ZStack {
                Color.black.ignoresSafeArea()
                
                VStack(spacing: 0) {
                    // Header
                    VStack(spacing: 8) {
                        HStack {
                            VStack(alignment: .leading, spacing: 4) {
                                Text("Monitor de Cocina")
                                    .font(.system(size: 28, weight: .bold))
                                    .foregroundColor(.white)
                                
                                Text("\(viewModel.orders.count) \(viewModel.orders.count == 1 ? "orden" : "órdenes") en preparación")
                                    .font(.system(size: 14))
                                    .foregroundColor(.gray)
                            }
                            
                            Spacer()
                            
                            // Sound toggle button
                            Button(action: {
                                soundPlayer.toggleSound()
                            }) {
                                Image(systemName: soundPlayer.isEnabled ? "speaker.wave.3.fill" : "speaker.slash.fill")
                                    .font(.system(size: 24))
                                    .foregroundColor(.white)
                                    .frame(width: 50, height: 50)
                                    .background(soundPlayer.isEnabled ? Color.green : Color.gray)
                                    .clipShape(Circle())
                            }
                        }
                        .padding(.horizontal, 20)
                        .padding(.top, 20)
                        .padding(.bottom, 16)
                    }
                    .background(Color(UIColor.systemGray6))
                    
                    Divider()
                    
                    // Orders Grid
                    if viewModel.orders.isEmpty {
                        VStack(spacing: 16) {
                            Spacer()
                            Image(systemName: "checkmark.circle")
                                .font(.system(size: 60))
                                .foregroundColor(.green)
                            Text("No hay órdenes pendientes")
                                .font(.system(size: 20, weight: .medium))
                                .foregroundColor(.gray)
                            Spacer()
                        }
                        .frame(maxWidth: .infinity, maxHeight: .infinity)
                    } else {
                        ScrollView {
                            LazyVGrid(columns: columns, spacing: 16) {
                                ForEach(viewModel.orders) { order in
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
                            .padding(16)
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
