import React from "react";
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight } from "lucide-react";
import { formatRupiah } from "../../utils/formatters";
import ProductAvatar from "../common/ProductAvatar";

export default function CartDrawer({
  cartItems,
  onUpdateQty,
  onRemoveItem,
  onClearCart,
  totalAmount,
  totalItemsCount,
  onOpenPayment,
}) {
  return (
    <div className="flex flex-col h-full bg-white border border-amber-100 rounded-3xl shadow-xs overflow-hidden">
      {/* Cart Header */}
      <div className="p-4 border-b border-amber-100/80 bg-[#fdfaf7] flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-coffee-100 text-coffee-800 rounded-xl shadow-2xs">
            <ShoppingBag className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-espresso text-sm sm:text-base">Keranjang Pesanan</h3>
            <p className="text-[11px] text-gray-500 font-medium">{totalItemsCount} cup dipilih</p>
          </div>
        </div>
        {cartItems.length > 0 && (
          <button
            type="button"
            onClick={onClearCart}
            className="text-xs text-red-500 hover:text-red-700 font-semibold hover:underline flex items-center gap-1 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Reset
          </button>
        )}
      </div>

      {/* Items List */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2.5">
        {cartItems.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-gray-400">
            <div className="w-16 h-16 rounded-full bg-amber-50/80 border border-amber-100 flex items-center justify-center text-amber-300 mb-3 shadow-inner">
              <ShoppingBag className="w-7 h-7" />
            </div>
            <p className="font-bold text-sm text-gray-600">Keranjang masih kosong</p>
            <p className="text-xs text-gray-400 mt-1 max-w-[210px] leading-relaxed">
              Klik salah satu menu kopi di sebelah kiri untuk menambahkan ke pesanan.
            </p>
          </div>
        ) : (
          cartItems.map((item) => (
            <div
              key={item.product_id}
              className="p-3 rounded-2xl border border-gray-100 bg-[#fcfaf7] hover:bg-cream-light/60 transition-all space-y-2 shadow-2xs"
            >
              {/* Line 1: Item Thumbnail, Name & Trash */}
              <div className="flex items-center justify-between gap-2.5">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <ProductAvatar
                    image={item.image}
                    name={item.name}
                    size="sm"
                    rounded="rounded-lg"
                  />
                  <h5 className="font-bold text-xs sm:text-sm text-espresso line-clamp-1 flex-1">
                    {item.name}
                  </h5>
                </div>
                <button
                  type="button"
                  onClick={() => onRemoveItem(item.product_id)}
                  className="p-1 text-gray-400 hover:text-red-500 rounded-lg transition-colors shrink-0"
                  title="Hapus item"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Line 2: Price on left, Stepper & Subtotal on right */}
              <div className="flex items-center justify-between gap-2 pt-1 border-t border-gray-200/60">
                <span className="text-xs text-gray-500 font-medium">
                  {formatRupiah(item.price)}
                </span>

                <div className="flex items-center gap-2">
                  <div className="flex items-center border border-gray-300 rounded-lg bg-white shadow-2xs overflow-hidden">
                    <button
                      type="button"
                      onClick={() => onUpdateQty(item.product_id, item.qty - 1)}
                      className="w-6 h-6 flex items-center justify-center text-gray-600 hover:bg-gray-100 transition-colors"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-6 text-center font-extrabold text-xs text-espresso">
                      {item.qty}
                    </span>
                    <button
                      type="button"
                      onClick={() => onUpdateQty(item.product_id, item.qty + 1)}
                      className="w-6 h-6 flex items-center justify-center text-gray-600 hover:bg-gray-100 transition-colors"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>

                  <span className="font-extrabold text-xs sm:text-sm text-coffee-700 min-w-[70px] text-right">
                    {formatRupiah(item.subtotal)}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Cart Summary & Checkout */}
      {cartItems.length > 0 && (
        <div className="p-4 border-t border-amber-100 bg-[#fdfaf7] space-y-3">
          <div className="space-y-1.5 text-xs sm:text-sm">
            <div className="flex justify-between text-gray-500 font-medium">
              <span>Total Pesanan ({totalItemsCount} cup)</span>
              <span className="font-bold text-espresso">{formatRupiah(totalAmount)}</span>
            </div>
            <div className="flex justify-between text-sm sm:text-base font-extrabold text-espresso pt-2 border-t border-dashed border-amber-200">
              <span>Total Tagihan</span>
              <span className="text-coffee-700 text-base sm:text-lg font-black">{formatRupiah(totalAmount)}</span>
            </div>
          </div>

          <button
            type="button"
            onClick={onOpenPayment}
            className="w-full py-3 px-4 bg-coffee-600 hover:bg-coffee-700 text-white font-bold rounded-2xl shadow-md shadow-coffee-950/20 hover:shadow-lg transition-all flex items-center justify-center gap-2 group"
          >
            <span>Lanjut Pembayaran</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      )}
    </div>
  );
}
