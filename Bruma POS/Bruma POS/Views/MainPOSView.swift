import SwiftUI

struct MainPOSView: View {
    @ObservedObject var vm: POSViewModel
    
    var body: some View {
        ZStack {
            Color.black.ignoresSafeArea()
            
            VStack(spacing: 0) {
                // Header
                HStack {
                    Spacer()
                    
                    HStack(spacing: 12) {
                        Image(systemName: "person.circle.fill")
                            .font(.system(size: 20))
                            .foregroundColor(.white.opacity(0.7))
                        
                        Text(vm.employeeName ?? "Usuario")
                            .font(.subheadline.weight(.medium))
                            .foregroundColor(.white)
                        
                        Button(action: {
                            vm.clearSession()
                        }) {
                            Image(systemName: "rectangle.portrait.and.arrow.right")
                                .font(.system(size: 18))
                                .foregroundColor(.red.opacity(0.8))
                                .padding(8)
                                .background(Color.red.opacity(0.1))
                                .cornerRadius(8)
                        }
                    }
                    .padding(.horizontal, 16)
                    .padding(.vertical, 12)
                }
                .background(Color(white: 0.08))
                
                Rectangle()
                    .fill(Color(white: 0.12))
                    .frame(height: 1)
                
                HStack(spacing: 0) {
                // Left side: Cart sidebar (w-80 = 320pt like /bar)
                CartView(vm: vm)
                    .frame(width: 320)
                
                Rectangle()
                    .fill(Color(white: 0.12))
                    .frame(width: 1)
                
                // Right side: Payment OR Categories+Products
                if vm.showingPayment {
                    PaymentView(vm: vm)
                        .frame(maxWidth: .infinity)
                } else {
                    HStack(spacing: 0) {
                        // Category sidebar
                        CategorySidebarView(vm: vm)
                            .frame(width: 220)
                        
                        Rectangle()
                            .fill(Color(white: 0.12))
                            .frame(width: 1)
                        
                        // Product area
                        ProductGridView(vm: vm)
                            .frame(maxWidth: .infinity)
                    }
                }
            }
            }
            
            // MARK: - Dialog Overlays
            
            if vm.showVariantDialog {
                dialogOverlay { VariantDialog(vm: vm) }
            }
            
            if vm.showNotesDialog {
                dialogOverlay { NotesDialog(vm: vm) }
            }
            
            if vm.showGuestCountDialog {
                dialogOverlay { GuestCountDialog(vm: vm, isInitial: false) }
            }
            
            if vm.showInitialGuestDialog {
                dialogOverlay { GuestCountDialog(vm: vm, isInitial: true) }
            }
            
            if vm.showVoidDialog {
                dialogOverlay { VoidDialog(vm: vm) }
            }
            
            if vm.showCustomerNameDialog {
                dialogOverlay { CustomerNameDialog(vm: vm) }
            }
            
            if vm.qrDialogOpen {
                dialogOverlay { LoyaltyDialog(vm: vm) }
            }
            
            if vm.manualStampDialogOpen {
                dialogOverlay { ManualStampDialog(vm: vm) }
            }
            
            if vm.showFlexibleDiscountDialog {
                dialogOverlay { FlexibleDiscountDialog(vm: vm) }
            }
            
            if vm.showAdminMenu {
                dialogOverlay { AdminMenuDialog(vm: vm) }
            }
            
            if vm.showGuestItemsDialog {
                dialogOverlay { GuestItemsDialog(vm: vm) }
            }
            
            // MARK: - Toast
            
            if let toast = vm.toastMessage {
                VStack {
                    Spacer()
                    HStack(spacing: 10) {
                        Image(systemName: vm.toastIsError ? "exclamationmark.triangle.fill" : "checkmark.circle.fill")
                            .foregroundColor(vm.toastIsError ? .red : .green)
                        Text(toast)
                            .font(.subheadline.bold())
                            .foregroundColor(.white)
                    }
                    .padding(.horizontal, 20)
                    .padding(.vertical, 14)
                    .background(
                        Capsule()
                            .fill(Color(white: 0.15))
                            .shadow(color: .black.opacity(0.4), radius: 10)
                    )
                    .padding(.bottom, 30)
                }
                .transition(.move(edge: .bottom).combined(with: .opacity))
                .animation(.spring(), value: vm.toastMessage)
            }
        }
    }
    
    @ViewBuilder
    private func dialogOverlay<Content: View>(@ViewBuilder content: () -> Content) -> some View {
        ZStack {
            Color.black.opacity(0.6)
                .ignoresSafeArea()
                .onTapGesture { /* dismiss if needed */ }
            
            content()
        }
    }
}
