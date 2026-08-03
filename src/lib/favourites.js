import AsyncStorage from "@react-native-async-storage/async-storage";
const KEY = "girard_favs_v1";
export async function loadFavs() {
  try { const r = await AsyncStorage.getItem(KEY); return r ? JSON.parse(r) : []; } catch (e) { return []; }
}
export async function toggleFav(id) {
  const f = await loadFavs();
  const next = f.includes(id) ? f.filter(x => x !== id) : [...f, id];
  try { await AsyncStorage.setItem(KEY, JSON.stringify(next)); } catch (e) {}
  return next;
}
