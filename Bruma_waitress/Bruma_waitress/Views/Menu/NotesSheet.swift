import SwiftUI

struct NotesSheet: View {
    let productName: String
    @Binding var notes: String
    let onConfirm: () -> Void
    let onSkip: () -> Void
    
    var body: some View {
        ZStack {
            Color(red: 0.08, green: 0.08, blue: 0.08).ignoresSafeArea()
            
            VStack(spacing: 16) {
                Text(productName)
                    .font(.headline)
                    .foregroundColor(.white)
                
                Text("¿Algún comentario?")
                    .font(.subheadline)
                    .foregroundColor(.gray)
                
                TextField("Ej: sin cebolla, extra salsa...", text: $notes)
                    .foregroundColor(.white)
                    .padding(.horizontal, 14)
                    .padding(.vertical, 12)
                    .background(Color.white.opacity(0.08))
                    .cornerRadius(10)
                
                HStack(spacing: 12) {
                    Button(action: onSkip) {
                        Text("Sin comentario")
                            .font(.subheadline.weight(.medium))
                            .foregroundColor(.gray)
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 14)
                            .background(Color.white.opacity(0.06))
                            .cornerRadius(12)
                    }
                    
                    Button(action: onConfirm) {
                        Text("Agregar")
                            .font(.subheadline.weight(.semibold))
                            .foregroundColor(.white)
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 14)
                            .background(Color.blue)
                            .cornerRadius(12)
                    }
                }
            }
            .padding(20)
        }
    }
}
