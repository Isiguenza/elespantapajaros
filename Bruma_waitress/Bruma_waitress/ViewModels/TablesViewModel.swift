import Foundation
import Combine

@MainActor
class TablesViewModel: ObservableObject {
    @Published var tables: [Table] = []
    @Published var loading: Bool = false
    @Published var selectedTable: Table?
    @Published var showCustomerNameDialog: Bool = false
    @Published var customerName: String = ""
    @Published var isParaLlevar: Bool = false
    
    // Guest count for the table
    @Published var guestCount: Int = 2
    @Published var showGuestCountDialog: Bool = false
    
    func fetchTables() async {
        loading = true
        do {
            tables = try await APIService.shared.fetchTables()
                .filter { $0.active }
                .sorted { ($0.number.localizedStandardCompare($1.number)) == .orderedAscending }
        } catch {
            print("Error fetching tables:", error)
        }
        loading = false
    }
    
    func selectTable(_ table: Table) {
        selectedTable = table
        isParaLlevar = false
        customerName = ""
        guestCount = 2
        showGuestCountDialog = true
    }
    
    func selectParaLlevar() {
        selectedTable = nil
        isParaLlevar = true
        showCustomerNameDialog = true
    }
    
    func confirmParaLlevar() {
        showCustomerNameDialog = false
    }
    
    func confirmGuestCount() {
        showGuestCountDialog = false
    }
    
    func reset() {
        selectedTable = nil
        isParaLlevar = false
        customerName = ""
        guestCount = 2
    }
}
