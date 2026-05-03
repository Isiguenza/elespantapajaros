import SwiftUI

struct TransferTableDialog: View {
    @ObservedObject var vm: POSViewModel
    @Environment(\.dismiss) private var dismiss
    
    var availableTables: [Table] {
        vm.tables.filter { $0.id != vm.selectedTable?.id }
    }
    
    var body: some View {
        ZStack {
            Color.black.ignoresSafeArea()
            
            VStack(spacing: 0) {
                // Header
                HStack {
                    Text("Transferir a otra mesa")
                        .font(.title3.weight(.bold))
                        .foregroundColor(.white)
                    
                    Spacer()
                    
                    Button {
                        dismiss()
                    } label: {
                        Image(systemName: "xmark")
                            .font(.headline)
                            .foregroundColor(.gray)
                            .frame(width: 32, height: 32)
                            .background(Color.white.opacity(0.1))
                            .clipShape(Circle())
                    }
                }
                .padding(20)
                
                if let currentTable = vm.selectedTable {
                    HStack(spacing: 8) {
                        Image(systemName: "arrow.right")
                            .foregroundColor(.blue)
                        Text("Desde Mesa \(currentTable.number)")
                            .font(.subheadline)
                            .foregroundColor(.gray)
                    }
                    .padding(.horizontal, 20)
                    .padding(.bottom, 16)
                }
                
                Rectangle()
                    .fill(Color.white.opacity(0.1))
                    .frame(height: 1)
                
                // Tables Grid
                ScrollView {
                    LazyVGrid(columns: [
                        GridItem(.flexible(), spacing: 12),
                        GridItem(.flexible(), spacing: 12),
                        GridItem(.flexible(), spacing: 12)
                    ], spacing: 12) {
                        ForEach(availableTables) { table in
                            TransferTableCard(table: table) {
                                Task {
                                    await vm.transferToTable(table)
                                }
                            }
                        }
                    }
                    .padding(20)
                }
            }
        }
        .preferredColorScheme(.dark)
    }
}

struct TransferTableCard: View {
    let table: Table
    let onSelect: () -> Void
    
    var isOccupied: Bool {
        table.status == "occupied"
    }
    
    var body: some View {
        Button(action: {
            if !isOccupied {
                onSelect()
            }
        }) {
            VStack(spacing: 12) {
                Image(systemName: "cup.and.saucer.fill")
                    .font(.system(size: 32))
                    .foregroundColor(isOccupied ? .gray : .blue)
                
                Text(table.displayName)
                    .font(.headline)
                    .foregroundColor(isOccupied ? .gray : .white)
                
                if isOccupied {
                    Text("Ocupada")
                        .font(.caption)
                        .foregroundColor(.red)
                        .padding(.horizontal, 8)
                        .padding(.vertical, 4)
                        .background(Color.red.opacity(0.2))
                        .cornerRadius(4)
                } else {
                    Text("Disponible")
                        .font(.caption)
                        .foregroundColor(.green)
                        .padding(.horizontal, 8)
                        .padding(.vertical, 4)
                        .background(Color.green.opacity(0.2))
                        .cornerRadius(4)
                }
            }
            .frame(maxWidth: .infinity)
            .frame(height: 140)
            .background(isOccupied ? Color.white.opacity(0.03) : Color.blue.opacity(0.08))
            .cornerRadius(12)
            .overlay(
                RoundedRectangle(cornerRadius: 12)
                    .stroke(isOccupied ? Color.gray.opacity(0.2) : Color.blue.opacity(0.3), lineWidth: 1)
            )
            .opacity(isOccupied ? 0.5 : 1)
        }
        .disabled(isOccupied)
    }
}
