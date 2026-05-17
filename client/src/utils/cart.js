export function getItemUnitPrice(item) {
  if (item?.priceNumber != null && !Number.isNaN(Number(item.priceNumber))) {
    return Number(item.priceNumber);
  }
  const parsed = parseFloat(String(item?.price ?? '0'));
  return Number.isNaN(parsed) ? 0 : parsed;
}

export function formatPrice(value) {
  const num = typeof value === 'number' ? value : parseFloat(String(value ?? '0'));
  return (Number.isNaN(num) ? 0 : num).toFixed(2);
}

export function getItemImage(item) {
  if (Array.isArray(item?.images) && item.images.length > 0) {
    return item.images[0];
  }
  if (item?.imageUrl) return item.imageUrl;
  return null;
}

export function toServerCartItem(item) {
  const productId = item.productId || item._id;
  const images = Array.isArray(item.images) && item.images.length > 0
    ? item.images
    : item.imageUrl
      ? [item.imageUrl]
      : [];
  return {
    productId,
    title: item.title,
    price: typeof item.price === 'string' ? item.price : getItemUnitPrice(item).toFixed(2),
    priceNumber: getItemUnitPrice(item),
    quantity: item.quantity || 1,
    sellerEmail: item.sellerEmail,
    images,
    category: item.category,
  };
}

export function normalizeCartItem(item) {
  if (!item) return item;
  const unitPrice = getItemUnitPrice(item);
  const productId = item.productId || item._id;
  const images = Array.isArray(item.images) && item.images.length > 0
    ? item.images
    : item.imageUrl
      ? [item.imageUrl]
      : [];
  return {
    ...item,
    _id: String(productId),
    productId,
    images,
    priceNumber: unitPrice,
    price: typeof item.price === 'string' ? item.price : unitPrice.toFixed(2),
    quantity: item.quantity || 1,
  };
}
