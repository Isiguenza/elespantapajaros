import Foundation
import Combine

@MainActor
class AuthViewModel: ObservableObject {
    @Published var authStep: AuthStep = .idle
    @Published var pin: String = ""
    @Published var isAuthenticated: Bool = false
    @Published var authenticating: Bool = false
    @Published var cashRegisterOpen: Bool = false
    @Published var checkingRegister: Bool = true
    @Published var errorMessage: String?
    
    @Published var employeeId: String?
    @Published var employeeName: String = ""
    
    enum AuthStep {
        case idle
        case pin
    }
    
    func checkCashRegister() async {
        checkingRegister = true
        do {
            cashRegisterOpen = try await APIService.shared.checkCashRegister()
        } catch {
            cashRegisterOpen = false
        }
        checkingRegister = false
    }
    
    func startAuth() {
        guard cashRegisterOpen else {
            errorMessage = "La caja está cerrada. Abre la caja registradora primero."
            return
        }
        errorMessage = nil
        authStep = .pin
    }
    
    func numberTapped(_ num: String) {
        if authStep == .pin && pin.count < 4 {
            pin += num
        }
    }
    
    func backspace() {
        if authStep == .pin && !pin.isEmpty {
            pin.removeLast()
        }
    }
    
    func clear() {
        if authStep == .pin {
            pin = ""
        }
    }
    
    func submitPin() async {
        guard pin.count == 4 else {
            errorMessage = "Ingresa un PIN de 4 dígitos"
            return
        }
        
        authenticating = true
        errorMessage = nil
        
        do {
            let employee = try await APIService.shared.verifyPin(pin: pin)
            employeeId = employee.id
            employeeName = employee.name
            isAuthenticated = true
            authStep = .idle
            pin = ""
        } catch {
            errorMessage = error.localizedDescription
            pin = ""
        }
        
        authenticating = false
    }
    
    func cancel() {
        authStep = .idle
        pin = ""
        errorMessage = nil
    }
    
    func logout() {
        isAuthenticated = false
        employeeId = nil
        employeeName = ""
        authStep = .idle
    }
}
