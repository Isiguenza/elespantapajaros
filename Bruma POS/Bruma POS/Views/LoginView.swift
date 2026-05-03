import SwiftUI

struct LoginView: View {
    @ObservedObject var vm: POSViewModel
    
    var body: some View {
        ZStack {
            Color.black.ignoresSafeArea()
            
            VStack(spacing: 24) {
                // Logo
                VStack(spacing: 12) {
                    Image(systemName: "fish.fill")
                        .font(.system(size: 48))
                        .foregroundStyle(.blue)
                    
                    Text("BRUMA")
                        .font(.system(size: 36, weight: .bold))
                        .foregroundColor(.white)
                    
                    Text("Marisquería")
                        .font(.subheadline)
                        .foregroundColor(.gray)
                    
                    RoundedRectangle(cornerRadius: 2)
                        .fill(Color.blue)
                        .frame(width: 60, height: 4)
                }
                
                if vm.authStep == .idle {
                    idleView
                } else if vm.authStep == .pin {
                    pinView
                }
            }
            .frame(maxWidth: 400)
            .padding(40)
            .background(
                RoundedRectangle(cornerRadius: 16)
                    .fill(Color(white: 0.1))
                    .shadow(color: .black.opacity(0.5), radius: 20)
            )
        }
    }
    
    // MARK: - Idle
    
    private var idleView: some View {
        VStack(spacing: 16) {
            Text("Comandera")
                .font(.title2.bold())
                .foregroundColor(.white)
            
            Text("Sistema POS")
                .font(.subheadline)
                .foregroundColor(.gray)
            
            if !vm.cashRegisterOpen && !vm.checkingRegister {
                HStack(spacing: 8) {
                    Image(systemName: "exclamationmark.triangle.fill")
                        .foregroundColor(.red)
                    Text("Caja cerrada")
                        .font(.subheadline.bold())
                        .foregroundColor(.red)
                }
                .padding(12)
                .background(
                    RoundedRectangle(cornerRadius: 10)
                        .fill(Color.red.opacity(0.15))
                        .overlay(RoundedRectangle(cornerRadius: 10).stroke(Color.red.opacity(0.3)))
                )
            }
            
            Button(action: vm.handleOpenComanda) {
                HStack {
                    if vm.checkingRegister {
                        ProgressView()
                            .tint(.white)
                    }
                    Text("Iniciar Sesión")
                        .font(.headline)
                }
                .frame(maxWidth: .infinity)
                .frame(height: 56)
                .background(Color.blue)
                .foregroundColor(.white)
                .cornerRadius(12)
            }
            .disabled(vm.checkingRegister)
        }
    }
    
    // MARK: - PIN
    
    private var pinView: some View {
        VStack(spacing: 16) {
            Text("PIN de Seguridad")
                .font(.title2.bold())
                .foregroundColor(.white)
            
            Text("4 dígitos")
                .font(.subheadline)
                .foregroundColor(.gray)
            
            // Display
            HStack(spacing: 20) {
                ForEach(0..<4, id: \.self) { i in
                    Circle()
                        .fill(i < vm.pin.count ? Color.white : Color(white: 0.3))
                        .frame(width: 20, height: 20)
                }
            }
            .frame(height: 60)
            .frame(maxWidth: .infinity)
            .background(
                RoundedRectangle(cornerRadius: 10)
                    .fill(Color(white: 0.05))
                    .overlay(RoundedRectangle(cornerRadius: 10).stroke(Color(white: 0.2)))
            )
            
            NumpadView(
                onNumber: vm.handleNumberClick,
                onClear: vm.handleClear,
                onBackspace: vm.handleBackspace
            )
            
            Button(action: vm.handlePinSubmit) {
                HStack {
                    if vm.authenticating {
                        ProgressView().tint(.white)
                    }
                    Text(vm.authenticating ? "Verificando..." : "Ingresar")
                        .font(.headline)
                }
                .frame(maxWidth: .infinity)
                .frame(height: 50)
                .background(vm.pin.count == 4 ? Color.blue : Color.gray.opacity(0.3))
                .foregroundColor(.white)
                .cornerRadius(12)
            }
            .disabled(vm.pin.count != 4 || vm.authenticating)
            
            Button("Cancelar", action: vm.handleCancel)
                .foregroundColor(.gray)
        }
    }
}

// MARK: - Numpad

struct NumpadView: View {
    let onNumber: (String) -> Void
    let onClear: () -> Void
    let onBackspace: () -> Void
    
    private let keys = [
        ["1", "2", "3"],
        ["4", "5", "6"],
        ["7", "8", "9"],
        ["C", "0", "←"]
    ]
    
    var body: some View {
        VStack(spacing: 10) {
            ForEach(keys, id: \.self) { row in
                HStack(spacing: 10) {
                    ForEach(row, id: \.self) { key in
                        Button(action: {
                            if key == "C" { onClear() }
                            else if key == "←" { onBackspace() }
                            else { onNumber(key) }
                        }) {
                            Text(key)
                                .font(.title2.bold())
                                .frame(maxWidth: .infinity)
                                .frame(height: 60)
                                .background(Color(white: 0.15))
                                .foregroundColor(.white)
                                .cornerRadius(10)
                                .overlay(
                                    RoundedRectangle(cornerRadius: 10)
                                        .stroke(Color(white: 0.25), lineWidth: 1)
                                )
                        }
                    }
                }
            }
        }
    }
}
