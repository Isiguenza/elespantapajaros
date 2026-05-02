import Foundation
import Combine

@MainActor
class AuthViewModel: ObservableObject {
    @Published var authStep: AuthStep = .idle
    @Published var employeeCode: String = ""
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
        case employee
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
        authStep = .employee
    }
    
    func numberTapped(_ num: String) {
        switch authStep {
        case .employee:
            if employeeCode.count < 6 {
                employeeCode += num
            }
        case .pin:
            if pin.count < 4 {
                pin += num
            }
        default:
            break
        }
    }
    
    func backspace() {
        switch authStep {
        case .employee:
            if !employeeCode.isEmpty { employeeCode.removeLast() }
        case .pin:
            if !pin.isEmpty { pin.removeLast() }
        default:
            break
        }
    }
    
    func clear() {
        switch authStep {
        case .employee: employeeCode = ""
        case .pin: pin = ""
        default: break
        }
    }
    
    func submitEmployeeCode() {
        guard employeeCode.count == 6 else {
            errorMessage = "Ingresa un código de 6 dígitos"
            return
        }
        errorMessage = nil
        authStep = .pin
    }
    
    func submitPin() async {
        guard pin.count == 4 else {
            errorMessage = "Ingresa un PIN de 4 dígitos"
            return
        }
        
        authenticating = true
        errorMessage = nil
        
        do {
            let employee = try await APIService.shared.verifyPin(
                employeeCode: employeeCode,
                pin: pin
            )
            employeeId = employee.id
            employeeName = employee.name
            isAuthenticated = true
            authStep = .idle
            employeeCode = ""
            pin = ""
        } catch {
            errorMessage = error.localizedDescription
            pin = ""
        }
        
        authenticating = false
    }
    
    func cancel() {
        authStep = .idle
        employeeCode = ""
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
