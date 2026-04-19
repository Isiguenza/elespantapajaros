//
//  Models.swift
//  BRUMA_Dispatch
//
//  Created by Iñaki Sigüenza on 11/04/26.
//

import Foundation

// MARK: - Order
struct Order: Codable, Identifiable {
    let id: String
    let orderNumber: Int
    let status: String
    let total: String
    let paymentStatus: String
    let paymentMethod: String?
    let customerName: String?
    let notes: String?
    let tableId: String?
    let createdAt: String
    let updatedAt: String
    let items: [OrderItem]?
    let table: Table?
    let preparationTime: Int? // Tiempo de preparación en minutos
}

// MARK: - OrderItem
struct OrderItem: Codable, Identifiable {
    let id: String
    let orderId: String
    let productId: String
    let productName: String
    let quantity: Int
    let unitPrice: String
    let subtotal: String
    let notes: String?
    let voided: Bool?
    let course: Int?
    let seat: String?
    let frostingName: String?
    let dryToppingName: String?
    let extraName: String?
    let customModifiers: String?
    let product: Product?
}

// MARK: - Product
struct Product: Codable {
    let id: String
    let categoryId: String?
    let category: Category?
}

// MARK: - Category
struct Category: Codable {
    let id: String
    let name: String
    let isBeverage: Bool?
}

// MARK: - Table
struct Table: Codable {
    let id: String
    let number: String
    let status: String
}

// MARK: - Custom Modifiers
struct CustomModifier: Codable {
    let stepName: String
    let options: [ModifierOption]
}

struct ModifierOption: Codable {
    let name: String
}

// MARK: - Order Urgency
enum OrderUrgency {
    case normal   // < 4 min
    case attention // 4-7 min
    case warning  // 7-10 min
    case urgent   // > 10 min
    
    var color: String {
        switch self {
        case .normal: return "gray"
        case .attention: return "yellow"
        case .warning: return "orange"
        case .urgent: return "red"
        }
    }
}
