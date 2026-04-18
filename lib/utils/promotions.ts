import type { Promotion, CartItem } from "@/lib/types";

/**
 * Apply promotions to cart items
 * Returns updated cart items with promotion information
 */
export function applyPromotions(
  cartItems: CartItem[],
  promotions: Promotion[]
): CartItem[] {
  if (promotions.length === 0) return cartItems;

  console.log('🎯 Aplicando promociones:', promotions.length, 'promociones activas');
  console.log('🛒 Items en carrito:', cartItems.length);

  // Group items by product
  const itemsByProduct = new Map<string, CartItem[]>();
  cartItems.forEach((item, index) => {
    const key = item.productId;
    if (!itemsByProduct.has(key)) {
      itemsByProduct.set(key, []);
    }
    itemsByProduct.get(key)!.push({ ...item, _index: index } as any);
  });

  console.log('📦 Productos agrupados:', Array.from(itemsByProduct.entries()).map(([id, items]) => ({
    productId: id,
    productName: items[0]?.productName,
    totalQty: items.reduce((sum, i) => sum + i.quantity, 0)
  })));

  const updatedItems = [...cartItems];

  // Process each product group
  itemsByProduct.forEach((items, productId) => {
    // Find applicable promotions for this product
    const applicablePromos = promotions.filter((promo) => {
      // Check if promotion applies to this product
      if (promo.applyTo === "all_products") {
        console.log(`✅ Promo "${promo.name}" aplica a todos los productos`);
        return true;
      }
      
      if (promo.applyTo === "specific_products" && promo.productIds) {
        try {
          const productIds = JSON.parse(promo.productIds);
          const applies = productIds.includes(productId);
          console.log(`${applies ? '✅' : '❌'} Promo "${promo.name}" ${applies ? 'aplica' : 'NO aplica'} a producto ${productId}`);
          console.log('   ProductIds en promo:', productIds);
          return applies;
        } catch (e) {
          console.error('❌ Error parseando productIds:', e);
          return false;
        }
      }

      if (promo.applyTo === "category" && promo.categoryId) {
        // Would need to check product's categoryId
        // For now, skip category-based promos in cart
        return false;
      }

      return false;
    });

    if (applicablePromos.length === 0) {
      console.log(`⚠️ No hay promociones aplicables para producto ${productId}`);
      return;
    }

    console.log(`🎁 ${applicablePromos.length} promoción(es) aplicable(s) para ${items[0]?.productName}`);

    // Sort by priority (higher first)
    applicablePromos.sort((a, b) => (b.priority || 0) - (a.priority || 0));

    // Apply highest priority promotion
    const promo = applicablePromos[0];

    // Calculate total quantity
    const totalQty = items.reduce((sum, item) => sum + item.quantity, 0);
    console.log(`📊 Cantidad total: ${totalQty}, Promo tipo: ${promo.type}`);

    if (promo.type === "buy_x_get_y") {
      const buyQty = promo.buyQuantity || 2;
      const getQty = promo.getQuantity || 1;
      console.log(`🎯 Promo ${buyQty}x${getQty}: necesita ${buyQty}, tiene ${totalQty}`);

      if (totalQty >= buyQty) {
        console.log(`✅ Cumple requisito! Aplicando promo...`);
        // Calculate how many complete sets we have (each set = buyQty items)
        const completeSets = Math.floor(totalQty / buyQty);
        const freeItems = Math.min(completeSets * getQty, totalQty);
        
        console.log(`📐 Cálculo: ${totalQty} items / ${buyQty} = ${completeSets} sets completos, ${freeItems} items gratis`);

        if (freeItems > 0) {
          console.log(`🎉 ${freeItems} items gratis!`);
          // Apply discount to the cheapest items (make them free)
          const sortedItems = [...items].sort((a, b) => a.unitPrice - b.unitPrice);
          let remainingFree = freeItems;

          console.log('📝 Items ordenados por precio:', sortedItems.map(i => ({ name: i.productName, price: i.unitPrice, qty: i.quantity, _index: i._index })));

          sortedItems.forEach((item: any) => {
            if (remainingFree > 0) {
              const freeQty = Math.min(item.quantity, remainingFree);
              const discountPerItem = item.unitPrice;
              const totalDiscount = discountPerItem * freeQty;

              console.log(`💰 Aplicando descuento a item en índice ${item._index}:`, {
                name: item.productName,
                freeQty,
                discountPerItem,
                totalDiscount,
                promotionId: promo.id,
                promotionName: promo.name
              });

              updatedItems[item._index] = {
                ...updatedItems[item._index],
                promotionId: promo.id,
                promotionName: promo.name,
                originalPrice: item.unitPrice,
                promotionDiscount: totalDiscount,
                unitPrice: item.quantity === freeQty ? 0 : item.unitPrice,
              };

              remainingFree -= freeQty;
            }
          });
          
          console.log('✅ Items actualizados con promoción:', updatedItems.filter(i => i.promotionId).map(i => ({
            name: i.productName,
            promotionId: i.promotionId,
            promotionName: i.promotionName,
            promotionDiscount: i.promotionDiscount
          })));
        }
      }
    } else if (promo.type === "percentage_discount") {
      const discountPercent = parseFloat(promo.discountPercentage?.toString() || "0");
      
      items.forEach((item: any) => {
        const discountAmount = (item.unitPrice * discountPercent) / 100;
        const newPrice = item.unitPrice - discountAmount;

        updatedItems[item._index] = {
          ...updatedItems[item._index],
          promotionId: promo.id,
          promotionName: promo.name,
          originalPrice: item.unitPrice,
          promotionDiscount: discountAmount * item.quantity,
          unitPrice: newPrice,
        };
      });
    } else if (promo.type === "fixed_discount") {
      const discountAmount = parseFloat(promo.discountAmount?.toString() || "0");
      
      items.forEach((item: any) => {
        const newPrice = Math.max(0, item.unitPrice - discountAmount);
        const actualDiscount = item.unitPrice - newPrice;

        updatedItems[item._index] = {
          ...updatedItems[item._index],
          promotionId: promo.id,
          promotionName: promo.name,
          originalPrice: item.unitPrice,
          promotionDiscount: actualDiscount * item.quantity,
          unitPrice: newPrice,
        };
      });
    }
  });

  return updatedItems;
}

/**
 * Calculate discount amount for an order
 */
export function calculateDiscount(
  subtotal: number,
  discountType: "percentage" | "fixed_amount" | "flexible",
  discountValue: number
): number {
  if (discountType === "percentage") {
    return (subtotal * discountValue) / 100;
  } else if (discountType === "fixed_amount") {
    return Math.min(discountValue, subtotal); // Don't discount more than subtotal
  } else {
    // For flexible, discountValue will be set at application time
    return Math.min(discountValue, subtotal);
  }
}
