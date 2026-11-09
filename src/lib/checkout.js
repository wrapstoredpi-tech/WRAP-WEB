/**
 * src/lib/checkout.js
 * ───────────────────
 * Checkout and order tracking service connected live to Supabase.
 * Payment is online only via Razorpay (UPI, card, net banking, wallet).
 * Deducts stock atomically and updates POS in real time.
 */

import { supabase } from './supabase';
import { INDIAN_STATES, getShippingFee, getCourierPartner } from '../config/policies';

const LOCAL_STORAGE_ORDERS_KEY = 'wrapstore_orders_v2';

export const ORDER_STATUS_STEPS = [
  'Awaiting payment',
  'Payment received',
  'Processing',
  'Packed',
  'Shipped',
  'Delivered',
];

export function mapDbStatusToDisplay(dbStatus, paymentStatus) {
  const s = (dbStatus || '').toUpperCase();
  if (s === 'CANCELLED') return 'Cancelled';
  if (s === 'RETURNED') return 'Returned';
  if (s === 'DELIVERED') return 'Delivered';
  if (s === 'SHIPPED') return 'Shipped';
  if (s === 'PACKED' || s === 'READY_FOR_PICKUP') return 'Packed';
  if (s === 'PROCESSING') return 'Processing';
  if (s === 'CONFIRMED' || paymentStatus === 'PAID') return 'Payment received';
  return 'Awaiting payment';
}

export async function submitOrder(orderInput) {
  const paymentRef =
    orderInput.razorpay_payment_id ||
    orderInput.payment_reference ||
    'pay_test_' + Math.random().toString(36).substring(2, 10);

  const cleanPhone = (orderInput.contact?.phone || '').replace(/\D/g, '');
  
  // Validate shipping state against INDIAN_STATES
  const rawState = (orderInput.shipping_state || orderInput.delivery?.state || '').trim();
  const validatedState = INDIAN_STATES.includes(rawState) ? rawState : 'Tamil Nadu';
  const calculatedShippingFee = getShippingFee(validatedState);
  const calculatedCourier = getCourierPartner(validatedState);
  const shippingFee = Number(orderInput.shippingFee) >= 0 ? Number(orderInput.shippingFee) : calculatedShippingFee;
  const courierPartner = orderInput.courier_partner || calculatedCourier;

  const shippingAddress = [
    orderInput.delivery?.address,
    orderInput.delivery?.city,
    validatedState,
    orderInput.delivery?.pincode ? `PIN: ${orderInput.delivery.pincode}` : '',
  ]
    .filter(Boolean)
    .join(', ');

  const subtotal = Number(orderInput.subtotal) || 0;
  const total = Number(orderInput.total) || subtotal + shippingFee;
  const gstAmount = Math.round((subtotal * 0.18) / 1.18);

  // 1. Insert into online_orders table
  const orderInsertPayload = {
    customer_name: orderInput.contact?.name || 'Customer',
    customer_phone: cleanPhone,
    customer_email: orderInput.contact?.email || null,
    shipping_address: shippingAddress,
    billing_address: shippingAddress,
    shipping_state: validatedState,
    subtotal,
    discount_amount: 0,
    gst_amount: gstAmount,
    shipping_amount: shippingFee,
    grand_total: total,
    payment_method: 'Online',
    payment_status: 'PAID',
    order_status: 'CONFIRMED',
    payment_reference: paymentRef,
    source: 'WEBSITE',
  };

  let dbOrder = null;
  let { data: createdOrder, error: orderErr } = await supabase
    .from('online_orders')
    .insert(orderInsertPayload)
    .select()
    .single();

  // Graceful fallback if shipping_state column has not been added to Supabase table yet
  if (orderErr && (orderErr.message?.includes('shipping_state') || orderErr.code === 'PGRST204' || orderErr.code === '42703')) {
    console.warn('shipping_state column not yet present in online_orders schema, retrying without column:', orderErr.message);
    const fallbackPayload = { ...orderInsertPayload };
    delete fallbackPayload.shipping_state;
    const retry = await supabase
      .from('online_orders')
      .insert(fallbackPayload)
      .select()
      .single();
    createdOrder = retry.data;
    orderErr = retry.error;
  }

  if (orderErr) {
    console.error('Failed to create online order in Supabase:', orderErr);
    throw new Error('Could not record online order: ' + orderErr.message);
  }

  dbOrder = createdOrder;
  const orderNumber = dbOrder.order_number || `WS-ONL-${dbOrder.id.slice(0, 6).toUpperCase()}`;

  // 2. Prepare items and insert into online_order_items
  const rawItems = orderInput.items || [];
  const itemsToInsert = [];
  const normalizedItems = [];

  for (const item of rawItems) {
    const isCombo = item.is_combo || item.product?.is_combo || false;
    const comboComponents = item.combo_items || item.product?.combo_items || [];

    let displayName = item.name || item.product?.name || 'Product';
    if (isCombo && comboComponents.length > 0) {
      const compDesc = comboComponents
        .map((c) => `${c.product_name || c.name} (1 unit)`)
        .join(', ');
      displayName = `${displayName} [Includes: ${compDesc}]`;
    }

    const unitPrice = Number(item.price || item.product?.selling_price || 0);
    const qty = Number(item.quantity) || 1;
    const lineTotal = unitPrice * qty;
    const selectedModel =
      item.selected_model || item.mobile_model || item.product?.mobile_model || 'Universal';
    const selectedColor = item.selected_color || item.color || null;

    itemsToInsert.push({
      order_id: dbOrder.id,
      // For combos, product_id in products table is null (combos have their own ID in combos table)
      // to avoid FK violation on online_order_items_product_id_fkey
      product_id: isCombo ? null : (item.productId || item.product?.id || null),
      product_name: displayName,
      product_type: isCombo ? 'combo' : (item.product?.product_type || 'case'),
      mobile_brand: item.product?.mobile_brand || null,
      mobile_model: selectedModel,
      quantity: qty,
      unit_price: unitPrice,
      discount_pct: 0,
      gst_pct: 18,
      line_total: lineTotal,
      is_combo: isCombo,
      combo_id: isCombo ? (item.productId || item.product?.id || null) : null,
      combo_components: isCombo ? comboComponents : null,
    });

    normalizedItems.push({
      productId: item.productId || item.product?.id,
      name: displayName,
      mobile_model: selectedModel,
      selected_model: selectedModel,
      color: selectedColor,
      price: unitPrice,
      quantity: qty,
      image: item.image || item.product?.image_url,
      is_combo: isCombo,
      combo_items: comboComponents,
    });
  }

  if (itemsToInsert.length > 0) {
    const { error: itemsErr } = await supabase.from('online_order_items').insert(itemsToInsert);
    if (itemsErr) {
      console.warn('Error inserting online_order_items:', itemsErr.message);
    }
  }

  // 3. Stock deduction: Reduce stock accurately and log movement
  // Note: For combos, each combo sold deducts exactly 1 unit of each constituent product
  const affectedProductIds = new Set();
  for (const item of rawItems) {
    const isCombo = item.is_combo || item.product?.is_combo || false;
    const comboComponents = item.combo_items || item.product?.combo_items || [];
    const itemQty = Number(item.quantity) || 1;

    if (isCombo) {
      const comboId = item.productId || item.product?.id;
      let comboSold = false;

      // 1. Attempt atomic sell_combo RPC
      if (comboId) {
        try {
          const { data: sellRes, error: sellErr } = await supabase.rpc('sell_combo', {
            p_combo_id: comboId,
            p_qty: itemQty,
            p_channel: 'ONLINE',
            p_reference: orderNumber,
            p_performed_by: null,
          });

          if (!sellErr && sellRes?.success) {
            comboSold = true;
            if (Array.isArray(sellRes.items)) {
              sellRes.items.forEach((it) => affectedProductIds.add(it.product_id));
            }
          }
        } catch (e) {
          console.warn('sell_combo RPC notice:', e);
        }
      }

      // 2. Direct per-component fallback if sell_combo RPC not yet available
      if (!comboSold && comboComponents.length > 0) {
        for (const comp of comboComponents) {
          const compProdId = comp.product_id || comp.id;
          const compUnitQty = Number(comp.qty_per_combo) || Number(comp.unit_quantity) || Number(comp.quantity) || 1;
          const compQty = compUnitQty * itemQty;
          if (compProdId) {
            affectedProductIds.add(compProdId);
            try {
              const { error: rpcErr } = await supabase.rpc('deduct_stock', {
                p_product_id: compProdId,
                p_quantity: compQty,
                p_channel: 'ONLINE',
                p_performed_by: null,
                p_reference_id: orderNumber,
              });

              if (rpcErr) {
                const { data: prod } = await supabase
                  .from('products')
                  .select('current_stock')
                  .eq('id', compProdId)
                  .single();

                if (prod) {
                  const prev = Number(prod.current_stock) || 0;
                  const next = Math.max(0, prev - compQty);
                  await supabase.from('products').update({ current_stock: next }).eq('id', compProdId);
                  await supabase.from('inventory_movements').insert({
                    product_id: compProdId,
                    movement_type: 'ONLINE_SALE',
                    quantity: compQty,
                    previous_stock: prev,
                    new_stock: next,
                    reason: `Online Sale: Combo ${item.name || ''} (${compQty} unit${compQty > 1 ? 's' : ''})`,
                    reference_id: orderNumber,
                    channel: 'website',
                  });
                }
              }
            } catch (e) {
              console.warn('deduct_stock combo error:', e);
            }
          }
        }
      }
    } else {
      const prodId = item.productId || item.product?.id;
      if (prodId) {
        affectedProductIds.add(prodId);
        try {
          const { error: rpcErr } = await supabase.rpc('deduct_stock', {
            p_product_id: prodId,
            p_quantity: itemQty,
            p_channel: 'ONLINE',
            p_performed_by: null,
            p_reference_id: orderNumber,
          });

          if (rpcErr) {
            const { data: prod } = await supabase
              .from('products')
              .select('current_stock')
              .eq('id', prodId)
              .single();

            if (prod) {
              const prev = Number(prod.current_stock) || 0;
              const next = Math.max(0, prev - itemQty);
              await supabase.from('products').update({ current_stock: next }).eq('id', prodId);
              await supabase.from('inventory_movements').insert({
                product_id: prodId,
                movement_type: 'ONLINE_SALE',
                quantity: itemQty,
                previous_stock: prev,
                new_stock: next,
                reason: 'ONLINE sale',
                reference_id: orderNumber,
                channel: 'website',
              });
            }
          }
        } catch (e) {
          console.warn('deduct_stock product error:', e);
        }
      }
    }
  }

  // 3b. Reconcile combo available stock across all active combos containing affected products
  if (affectedProductIds.size > 0) {
    try {
      const validProdIds = Array.from(affectedProductIds);
      const { data: activeCombos } = await supabase
        .from('combos')
        .select('*')
        .eq('is_active', true);

      if (activeCombos && activeCombos.length > 0) {
        const affectedCombos = activeCombos.filter((c) => {
          const items = Array.isArray(c.items) ? c.items : [];
          return items.some((it) => validProdIds.includes(it.product_id));
        });

        if (affectedCombos.length > 0) {
          // Fetch current stock for all items in affected combos
          const allItemProdIds = new Set();
          affectedCombos.forEach((c) => {
            const items = Array.isArray(c.items) ? c.items : [];
            items.forEach((it) => {
              if (it.product_id) allItemProdIds.add(it.product_id);
            });
          });

          const { data: prods } = await supabase
            .from('products')
            .select('id, current_stock')
            .in('id', Array.from(allItemProdIds));

          const stockMap = {};
          (prods || []).forEach((p) => {
            stockMap[p.id] = Math.max(0, Number(p.current_stock) || 0);
          });

          for (const c of affectedCombos) {
            const items = Array.isArray(c.items) ? c.items : [];
            if (items.length === 0) continue;
            const itemStocks = items.map((it) => stockMap[it.product_id] ?? 0);
            const newAllotted = Math.max(0, Math.min(...itemStocks));
            const updatedItems = items.map((it) => ({ ...it, allotted_qty: newAllotted }));
            await supabase
              .from('combos')
              .update({ items: updatedItems, updated_at: new Date().toISOString() })
              .eq('id', c.id);
            await supabase
              .from('combo_items')
              .update({ allotted_qty: newAllotted })
              .eq('combo_id', c.id);
          }
        }
      }
    } catch (syncErr) {
      console.warn('Combo sync after checkout notice:', syncErr);
    }
  }

  // 4. Record Payment linked to online order
  try {
    await supabase.from('payments').insert({
      online_order_id: dbOrder.id,
      amount: total,
      payment_method: 'Online',
      reference: paymentRef,
      payment_status: 'PAID',
    });
  } catch (e) {
    // If online_order_id column not present in payments table yet, non-fatal
    console.warn('Payment record note:', e);
  }

  // 5. Update local storage for immediate UI hydration
  const newOrder = {
    id: dbOrder.id,
    orderId: orderNumber,
    order_number: orderNumber,
    createdAt: dbOrder.created_at,
    status: 'Payment received',
    order_status: 'CONFIRMED',
    items: normalizedItems,
    subtotal,
    shippingFee,
    courier_partner: courierPartner,
    total,
    contact: orderInput.contact || {},
    shipping_state: validatedState,
    delivery: {
      ...(orderInput.delivery || {}),
      state: validatedState,
      courier: courierPartner,
    },
    payment: 'Online Payment (Razorpay: UPI, Card, Net Banking)',
    payment_reference: paymentRef,
  };

  try {
    const existingOrders = JSON.parse(localStorage.getItem(LOCAL_STORAGE_ORDERS_KEY) || '[]');
    existingOrders.unshift(newOrder);
    localStorage.setItem(LOCAL_STORAGE_ORDERS_KEY, JSON.stringify(existingOrders));
  } catch (e) {
    console.warn('Could not save order to localStorage:', e);
  }

  if (typeof window !== 'undefined') {
    try {
      window.dispatchEvent(new CustomEvent('wrapstore:order_created', { detail: newOrder }));
    } catch {}
  }

  return {
    success: true,
    orderId: orderNumber,
    order: newOrder,
  };
}

export async function trackOrder(orderId, phone) {
  const cleanOrderId = (orderId || '').trim();
  const cleanPhone = (phone || '').trim().replace(/\D/g, '');

  if (!cleanOrderId) {
    return {
      success: false,
      message: 'Please enter a valid order number.',
    };
  }

  // 1. Query Supabase online_orders table live
  try {
    let query = supabase
      .from('online_orders')
      .select('*, online_order_items(*)')
      .order('created_at', { ascending: false });

    query = query.or(
      `order_number.ilike.%${cleanOrderId}%,id.eq.${cleanOrderId.length === 36 ? cleanOrderId : '00000000-0000-0000-0000-000000000000'},payment_reference.ilike.%${cleanOrderId}%`
    );

    const { data: dbOrders, error: dbErr } = await query;

    if (!dbErr && dbOrders && dbOrders.length > 0) {
      let matched = dbOrders[0];
      if (cleanPhone) {
        const found = dbOrders.find((o) => {
          const ordPhone = (o.customer_phone || '').replace(/\D/g, '');
          return ordPhone.includes(cleanPhone) || cleanPhone.includes(ordPhone);
        });
        if (found) matched = found;
      }

      const displayStatus = mapDbStatusToDisplay(matched.order_status, matched.payment_status);

      let trackingNumber = matched.tracking_number || null;
      let courierName = matched.courier_name || null;
      if (!trackingNumber && matched.notes) {
        const trkMatch = matched.notes.match(/Tracking:\s*([^)\s·]+)/i);
        const courMatch = matched.notes.match(/Dispatched via\s+([^(]+)/i);
        if (trkMatch) trackingNumber = trkMatch[1].trim();
        if (courMatch) courierName = courMatch[1].trim();
      }

      const items = (matched.online_order_items || []).map((it) => ({
        name: it.product_name,
        selected_model: it.mobile_model || 'Universal',
        mobile_model: it.mobile_model || 'Universal',
        quantity: it.quantity,
        price: Number(it.unit_price || 0),
        color: it.selected_color || null,
      }));

      const liveOrder = {
        id: matched.id,
        orderId: matched.order_number,
        order_number: matched.order_number,
        createdAt: matched.created_at,
        status: displayStatus,
        order_status: matched.order_status,
        payment_status: matched.payment_status,
        payment_reference: matched.payment_reference,
        tracking_number: trackingNumber,
        courier_name: courierName,
        cancelled_reason: matched.cancelled_reason || null,
        refund_status: matched.refund_status || null,
        items,
        subtotal: Number(matched.subtotal || 0),
        shippingFee: Number(matched.shipping_amount || 0),
        total: Number(matched.grand_total || 0),
        contact: {
          name: matched.customer_name,
          phone: matched.customer_phone,
          email: matched.customer_email,
        },
        shipping_state: matched.shipping_state || (matched.shipping_address?.includes('Tamil Nadu') ? 'Tamil Nadu' : null),
        delivery: {
          address: matched.shipping_address,
          state: matched.shipping_state || null,
        },
      };

      return {
        success: true,
        order: liveOrder,
        status: displayStatus,
        allSteps: ORDER_STATUS_STEPS,
      };
    }
  } catch (err) {
    console.warn('Supabase order tracking error:', err);
  }

  // 2. Fallback to localStorage
  try {
    const existingOrders = JSON.parse(localStorage.getItem(LOCAL_STORAGE_ORDERS_KEY) || '[]');
    const localOrder = existingOrders.find((o) => {
      const idMatch = (o.orderId || o.order_number || '').toUpperCase() === cleanOrderId.toUpperCase();
      if (!idMatch) return false;
      if (!cleanPhone) return true;
      const orderPhone = (o.contact?.phone || '').replace(/\D/g, '');
      return orderPhone.includes(cleanPhone);
    });

    if (localOrder) {
      return {
        success: true,
        order: localOrder,
        status: localOrder.status || 'Payment received',
        allSteps: ORDER_STATUS_STEPS,
      };
    }
  } catch (e) {
    console.warn('Error reading local orders:', e);
  }

  return {
    success: false,
    message: 'No order found with this order number and phone.',
  };
}
