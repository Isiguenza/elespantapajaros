//
//  APIService.swift
//  BRUMA_Dispatch
//
//  Created by Iñaki Sigüenza on 11/04/26.
//

import Foundation

class APIService {
    static let shared = APIService()
    
    // Configuración de entorno
    enum Environment {
        case development
        case production
        
        var baseURL: String {
            switch self {
            case .development:
                return "http://192.168.0.104:3000"
            case .production:
                // IMPORTANTE: Cambiar por tu dominio de producción
                return "https://drinksespantapajaros.com.mx"
            }
        }
    }
    
    // Cambiar a .production cuando estés listo para usar en producción
    private let environment: Environment = .production
    private var baseURL: String {
        environment.baseURL
    }
    
    private init() {}
    
    // Fetch orders with status "preparing"
    func fetchPreparingOrders() async throws -> [Order] {
        guard let url = URL(string: "\(baseURL)/api/orders?status=preparing") else {
            throw URLError(.badURL)
        }
        
        let (data, response) = try await URLSession.shared.data(from: url)
        
        guard let httpResponse = response as? HTTPURLResponse,
              httpResponse.statusCode == 200 else {
            throw URLError(.badServerResponse)
        }
        
        let decoder = JSONDecoder()
        let orders = try decoder.decode([Order].self, from: data)
        return orders
    }
    
    // Mark order as ready
    func markOrderAsReady(orderId: String) async throws {
        guard let url = URL(string: "\(baseURL)/api/orders/\(orderId)/status") else {
            throw URLError(.badURL)
        }
        
        var request = URLRequest(url: url)
        request.httpMethod = "PATCH"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        let body = ["status": "ready"]
        request.httpBody = try JSONSerialization.data(withJSONObject: body)
        
        let (_, response) = try await URLSession.shared.data(for: request)
        
        guard let httpResponse = response as? HTTPURLResponse,
              httpResponse.statusCode == 200 else {
            throw URLError(.badServerResponse)
        }
    }
}
