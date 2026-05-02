import SwiftUI

struct VariantSheet: View {
    let product: Product
    let onSelect: (ProductVariant) -> Void
    
    var body: some View {
        ZStack {
            Color(red: 0.08, green: 0.08, blue: 0.08).ignoresSafeArea()
            
            VStack(spacing: 16) {
                Text(product.name)
                    .font(.title3.weight(.bold))
                    .foregroundColor(.white)
                
                Text("Selecciona una variante")
                    .font(.subheadline)
                    .foregroundColor(.gray)
                
                ScrollView {
                    VStack(spacing: 8) {
                        ForEach(product.parsedVariants) { variant in
                            Button(action: { onSelect(variant) }) {
                                HStack {
                                    Text(variant.name)
                                        .font(.body.weight(.medium))
                                        .foregroundColor(.white)
                                    Spacer()
                                    Text("$\(Double(variant.price) ?? 0, specifier: "%.0f")")
                                        .font(.body.weight(.bold))
                                        .foregroundColor(.blue)
                                }
                                .padding(.horizontal, 16)
                                .padding(.vertical, 14)
                                .background(Color.white.opacity(0.06))
                                .cornerRadius(12)
                            }
                        }
                    }
                }
            }
            .padding(20)
        }
    }
}
