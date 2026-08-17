# Bonjuuk BETA — araştırma kaydı

Kripto vadeli işlemler araştırma sisteminin salt-okunur gözlem panosu.

Bu depo yalnızca arayüzü içerir. Sistemin kendisi ayrı ve özel bir depoda durur;
buraya hiçbir kimlik bilgisi, bakiye ya da emir bilgisi gelmez.

## Sayfa neyi gösteriyor

Ne kazanıldığını değil, **neyin elendiğini**. Sistem şimdiye kadar kârlı bir
strateji üretmedi; ürettiği şey, hangi fikirlerin işe yaramadığının kaydı.
Yeşil bir sayı göstermek, verinin desteklemediği bir hikâye anlatmak olurdu.

Sayfanın merkezindeki sayı **deneme sayacı**. Her denenen fikir, bir sonraki
sonucun inandırıcılığını düşürür — Deflated Sharpe Ratio deneme sayısını girdi
olarak alır ve anlamlılık eşiği onunla yükselir. Çoğu pano bu paydayı gizler.

## Veri nasıl geliyor

Sunucudaki bir iş periyodik olarak `public/data/snapshot.json` üretir ve bu
depoya iter. GitHub Pages onu servis eder, sayfa oradan okur.

Bu kurulumun sebebi güvenlik: sunucuda hiçbir port açılmaz, TLS sertifikası ve
alan adı gerekmez, dışarıya bakan bir servis yoktur. Bedeli, verinin push
sıklığı kadar taze olması — gözlem panosu için makul bir takas.

Canlı bir API'ye geçmek gerekirse tek değişiklik `src/lib/data.ts` içindeki
`SNAPSHOT_URL`; bileşenlerin hiçbiri veri kaynağını bilmez.

## Geliştirme

```bash
npm install
npm run dev
```

`public/data/snapshot.json` yoksa sayfa hata gösterir. Bu dosyayı sistem
deposundaki `scripts/export_snapshot.py` üretir.

## Yığın

Vite · React 19 · TypeScript · Tailwind 4 · shadcn/ui
