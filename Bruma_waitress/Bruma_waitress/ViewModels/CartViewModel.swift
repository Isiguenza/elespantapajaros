import Foundation
import Combine

@MainActor
class CartViewModel: ObservableObject {
    @Published var items: [CartItem] = []
    @Published var activeSeat: String = "C"
    @Published var activeCourse: Int = 1
    @Published var guestCount: Int = 2
    @Published var sending: Bool = false
    @Published var currentOrderId: String?
    
    // Table / Para Llevar context
    var selectedTable: Table?
    var customerName: String?
    
    var pendingItems: [CartItem] {
        items.filter { !$0.sentToKitchen }
    }
    
    var sentItems: [CartItem] {
        items.filter { $0.sentToKitchen }
    }
    
    var hasPendingItems: Bool {
        !pendingItems.isEmpty
    }
    
    var totalPending: Double {
        pendingItems.reduce(0) { $0 + $1.total }
    }
    
    var totalAll: Double {
        items.reduce(0) { $0 + $1.total }
    }
    
    var seatLabels: [String] {
        var seats = (1...guestCount).map { "A\($0)" }
        seats.append("C")
        return seats
    }
    
    func addItem(_ item: CartItem) {
        var newItem = item
        newItem.seat = activeSeat
        newItem.course = activeCourse
        items.append(newItem)
    }
    
    func removeItem(at index: Int) {
        guard index < items.count, !items[index].sentToKitchen else { return }
        items.remove(at: index)
    }
    
    func incrementItem(at index: Int) {
        guard index < items.count, !items[index].sentToKitchen else { return }
        items[index].quantity += 1
    }
    
    func decrementItem(at index: Int) {
        guard index < items.count, !items[index].sentToKitchen else { return }
        if items[index].quantity > 1 {
            items[index].quantity -= 1
        }
    }
    
    func sendToKitchen() async {
        let pending = pendingItems
        guard !pending.isEmpty else { return }
        
        sending = true
        
        do {
            let itemsData: [[String: Any]] = pending.map { item in
                var dict: [String: Any] = [
                    "productId": item.productId,
                    "productName": item.productName,
                    "quantity": item.quantity,
                    "unitPrice": item.unitPrice,
                    "notes": item.notes,
                    "seat": item.seat,
                    "course": item.course,
                ]
                if let f = item.frostingId { dict["frostingId"] = f }
                if let f = item.frostingName { dict["frostingName"] = f }
                if let t = item.dryToppingId { dict["dryToppingId"] = t }
                if let t = item.dryToppingName { dict["dryToppingName"] = t }
                if let e = item.extraId { dict["extraId"] = e }
                if let e = item.extraName { dict["extraName"] = e }
                if let cm = item.customModifiers { dict["customModifiers"] = cm }
                return dict
            }
            
            if let orderId = currentOrderId {
                // Add to existing order
                try await APIService.shared.addItemsToOrder(orderId: orderId, items: itemsData)
            } else {
                // Create new order
                let order = try await APIService.shared.createOrder(
                    tableId: selectedTable?.id,
                    items: itemsData,
                    customerName: customerName
                )
                currentOrderId = order.id
            }
            
            // Mark table as occupied
            if let table = selectedTable {
                try? await APIService.shared.updateTableStatus(
                    tableId: table.id,
                    table: table,
                    status: "occupied"
                )
            }
            
            // Mark items as sent
            for i in items.indices {
                if !items[i].sentToKitchen {
                    items[i].sentToKitchen = true
                    items[i].orderId = currentOrderId
                }
            }
            
            // Print comanda (fire and forget)
            let printItems: [[String: Any]] = pending.map {
                var dict: [String: Any] = [
                    "name": $0.productName,
                    "qty": $0.quantity,
                ]
                if !$0.notes.isEmpty { dict["notes"] = $0.notes }
                return dict
            }
            await APIService.shared.printComanda(
                tableNumber: selectedTable?.number,
                orderNumber: currentOrderId?.prefix(8).description ?? "",
                customerName: selectedTable == nil ? customerName : nil,
                items: printItems
            )
            
        } catch {
            print("Error sending to kitchen:", error)
        }
        
        sending = false
    }
    
    func reset() {
        items = []
        activeSeat = "C"
        activeCourse = 1
        currentOrderId = nil
        selectedTable = nil
        customerName = nil
    }
    
    func setupForTable(_ table: Table?, customerName: String?, guestCount: Int) {
        self.selectedTable = table
        self.customerName = customerName
        self.guestCount = guestCount
        
        // If table has existing order, load its items
        if let order = table?.activeOrder {
            currentOrderId = order.id
            if let orderItems = order.items {
                items = orderItems.filter { !($0.voided ?? false) }.map { oi in
                    CartItem(
                        productId: oi.productId,
                        productName: oi.productName,
                        unitPrice: Double(oi.unitPrice) ?? 0,
                        quantity: oi.quantity,
                        notes: oi.notes ?? "",
                        frostingId: oi.frostingId,
                        frostingName: oi.frostingName,
                        dryToppingId: oi.dryToppingId,
                        dryToppingName: oi.dryToppingName,
                        extraId: oi.extraId,
                        extraName: oi.extraName,
                        customModifiers: oi.customModifiers,
                        seat: oi.seat ?? "C",
                        course: oi.course ?? 1,
                        sentToKitchen: true,
                        orderId: oi.orderId,
                        itemId: oi.id
                    )
                }
            }
        }
    }
}
