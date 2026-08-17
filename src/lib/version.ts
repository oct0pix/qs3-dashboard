/**
 * Dört haneli sürüm: <canlı>.<faz>.<pano kuşağı>.<yapı>
 *
 *   canlı       0 = gerçek emir yolu yok. Bu hane 1 olana kadar sistem
 *               para riske etmiyor demektir ve öyle okunmalı.
 *   faz         Tamamlanmış araştırma fazı (1 altyapı … 4 CPCV+DSR).
 *   pano kuşağı Panonun kaçıncı baştan kurgusu.
 *   yapı        O kuşak içindeki değişiklik sayacı.
 *
 * Haneler pazarlama değil durum bildirir. İlk hanenin 0 kalması bir eksiklik
 * değil, şu an doğru olan şey.
 */
export const VERSION = "0.4.2.2"
export const NAME = "Bonjuuk"
export const STAGE = "BETA"
