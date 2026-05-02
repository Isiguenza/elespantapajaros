import SwiftUI

struct ModifierFlowView: View {
    @ObservedObject var menuVM: MenuViewModel
    @ObservedObject var cartVM: CartViewModel
    @Environment(\.dismiss) var dismiss
    
    var body: some View {
        ZStack {
            Color(red: 0.08, green: 0.08, blue: 0.08).ignoresSafeArea()
            
            VStack(spacing: 16) {
                // Header
                HStack {
                    Button(action: {
                        menuVM.showModifierFlow = false
                        dismiss()
                    }) {
                        Image(systemName: "xmark")
                            .foregroundColor(.gray)
                    }
                    Spacer()
                    Text(menuVM.selectedProduct?.name ?? "")
                        .font(.headline)
                        .foregroundColor(.white)
                    Spacer()
                    // Step indicator
                    if let flow = menuVM.categoryFlow {
                        Text("\(menuVM.currentStepIndex + 1)/\(flow.steps.count)")
                            .font(.caption.weight(.medium))
                            .foregroundColor(.gray)
                    }
                }
                .padding(.horizontal, 20)
                .padding(.top, 16)
                
                if let step = menuVM.currentStep {
                    VStack(spacing: 8) {
                        Text(step.stepName)
                            .font(.title3.weight(.semibold))
                            .foregroundColor(.white)
                        
                        HStack(spacing: 8) {
                            if step.isRequired {
                                Text("Requerido")
                                    .font(.caption)
                                    .foregroundColor(.orange)
                            }
                            if step.allowMultiple {
                                Text("Selección múltiple")
                                    .font(.caption)
                                    .foregroundColor(.blue)
                            }
                        }
                    }
                    
                    ScrollView {
                        VStack(spacing: 8) {
                            if step.includeNoneOption && !step.isRequired {
                                Button(action: { menuVM.skipModifierStep() }) {
                                    HStack {
                                        Text("Sin \(step.stepName)")
                                            .font(.body)
                                            .foregroundColor(.gray)
                                        Spacer()
                                    }
                                    .padding(.horizontal, 16)
                                    .padding(.vertical, 14)
                                    .background(Color.white.opacity(0.04))
                                    .cornerRadius(12)
                                }
                            }
                            
                            if let options = step.options?.filter({ $0.active }).sorted(by: { $0.sortOrder < $1.sortOrder }) {
                                ForEach(options) { option in
                                    let isSelected = menuVM.stepSelections[step.id]?.contains(where: { $0.id == option.id }) ?? false
                                    
                                    Button(action: { menuVM.selectModifierOption(option) }) {
                                        HStack {
                                            Text(option.name)
                                                .font(.body.weight(.medium))
                                                .foregroundColor(.white)
                                            Spacer()
                                            if option.numericPrice > 0 {
                                                Text("+$\(option.numericPrice, specifier: "%.0f")")
                                                    .font(.callout)
                                                    .foregroundColor(.blue)
                                            }
                                            if isSelected {
                                                Image(systemName: "checkmark.circle.fill")
                                                    .foregroundColor(.blue)
                                            }
                                        }
                                        .padding(.horizontal, 16)
                                        .padding(.vertical, 14)
                                        .background(isSelected ? Color.blue.opacity(0.15) : Color.white.opacity(0.06))
                                        .cornerRadius(12)
                                        .overlay(
                                            RoundedRectangle(cornerRadius: 12)
                                                .stroke(isSelected ? Color.blue.opacity(0.5) : Color.clear, lineWidth: 1)
                                        )
                                    }
                                }
                            }
                        }
                        .padding(.horizontal, 20)
                    }
                    
                    // Next / Finish button
                    Button(action: {
                        menuVM.advanceModifierStep(
                            seat: cartVM.activeSeat,
                            course: cartVM.activeCourse
                        )
                    }) {
                        let hasSelection = !(menuVM.stepSelections[step.id]?.isEmpty ?? true)
                        let canAdvance = !step.isRequired || hasSelection
                        
                        Text(menuVM.currentStepIndex + 1 < (menuVM.categoryFlow?.steps.count ?? 0) ? "Siguiente" : "Agregar")
                            .font(.headline)
                            .foregroundColor(.white)
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 14)
                            .background(canAdvance ? Color.blue : Color.blue.opacity(0.3))
                            .cornerRadius(12)
                    }
                    .disabled(step.isRequired && (menuVM.stepSelections[step.id]?.isEmpty ?? true))
                    .padding(.horizontal, 20)
                    .padding(.bottom, 16)
                }
            }
        }
    }
}
