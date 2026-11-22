/* Galaxy Point shared Firebase data access. */
(function () {
  'use strict';
  const cloud = window.GPCloud;
  if (!cloud) return;
  window.GP_DATA = {
    products: async () => (await cloud.listPublic('products')).filter(p => p.is_published),
    banners: async () => ((await cloud.settings()).banners || []).filter(b => b.active),
    settings: async () => Object.entries(await cloud.settings()).map(([key, value]) => ({ key, value })),
    staffProducts: () => cloud.products(),
    orders: () => cloud.listCollection('orders'),
    customers: () => cloud.listCollection('customers'),
    orderItems: () => cloud.listCollection('order_items'),
    saveProduct: (p) => cloud.upsertProduct(p, p.id),
    saveSetting: (k, v) => cloud.saveSettings({ [k]: v }),
    login: (e, p) => cloud.signIn(e, p),
    logout: () => cloud.signOut()
  };
})();
