import Foundation

struct Table: Codable, Identifiable {
    let id: String
    let number: String
    let name: String?
    let capacity: Int
    let status: String // "available", "occupied", "reserved"
    let active: Bool
    let activeOrder: ActiveOrder?
    let guestCount: Int?
    
    var isAvailable: Bool { status == "available" }
    var isOccupied: Bool { status == "occupied" }
    var isReserved: Bool { status == "reserved" }
    
    var displayName: String {
        name ?? "Mesa \(number)"
    }
    
    enum CodingKeys: String, CodingKey {
        case id, number, name, capacity, status, active
        case activeOrder = "active_order"
        case guestCount = "guest_count"
    }
}

struct ActiveOrder: Codable {
    let id: String
    let orderNumber: Int
    let status: String
    let items: [OrderItem]?
}
