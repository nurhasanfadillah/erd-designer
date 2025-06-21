# Panduan Deployment ke Vercel

Panduan lengkap untuk men-deploy aplikasi ERD Designer ke Vercel.

## Persiapan

Pastikan semua file berikut sudah ada di proyek Anda:
- ✅ `index.html` - File HTML utama
- ✅ `script.js` - File JavaScript
- ✅ `styles.css` - File CSS
- ✅ `vercel.json` - Konfigurasi Vercel
- ✅ `package.json` - Metadata proyek
- ✅ `README.md` - Dokumentasi
- ✅ `.gitignore` - File yang diabaikan Git

## Metode 1: Deployment via GitHub (Recommended)

### Langkah 1: Setup Repository GitHub

1. Buat repository baru di GitHub
2. Clone repository ke komputer Anda:
   ```bash
   git clone https://github.com/username/erd-designer.git
   cd erd-designer
   ```

3. Copy semua file aplikasi ke folder repository
4. Commit dan push ke GitHub:
   ```bash
   git add .
   git commit -m "Initial commit: ERD Designer application"
   git push origin main
   ```

### Langkah 2: Deploy ke Vercel

1. Kunjungi [vercel.com](https://vercel.com)
2. Sign up/Login dengan akun GitHub Anda
3. Klik "New Project"
4. Import repository `erd-designer` Anda
5. Vercel akan otomatis mendeteksi sebagai static site
6. Klik "Deploy"
7. Tunggu proses deployment selesai
8. Aplikasi Anda akan tersedia di URL seperti: `https://erd-designer-xxx.vercel.app`

## Metode 2: Deployment via Vercel CLI

### Langkah 1: Install Vercel CLI

```bash
npm install -g vercel
```

### Langkah 2: Login ke Vercel

```bash
vercel login
```

### Langkah 3: Deploy

Dari direktori proyek, jalankan:

```bash
# Deploy ke preview
vercel

# Deploy ke production
vercel --prod
```

## Metode 3: Drag & Drop Deployment

1. Kunjungi [vercel.com](https://vercel.com)
2. Login ke akun Anda
3. Klik "New Project"
4. Pilih tab "Import Git Repository" atau scroll ke bawah
5. Drag & drop folder proyek Anda ke area yang disediakan
6. Vercel akan otomatis upload dan deploy

## Konfigurasi Custom Domain (Opsional)

1. Di dashboard Vercel, pilih proyek Anda
2. Klik tab "Settings"
3. Pilih "Domains"
4. Tambahkan domain custom Anda
5. Ikuti instruksi untuk mengatur DNS

## Environment Variables (Jika Diperlukan)

Jika aplikasi memerlukan environment variables:

1. Di dashboard Vercel, pilih proyek Anda
2. Klik tab "Settings"
3. Pilih "Environment Variables"
4. Tambahkan variabel yang diperlukan

## Troubleshooting

### Build Errors

- Pastikan semua file path menggunakan relative path
- Periksa console browser untuk error JavaScript
- Pastikan semua asset (CSS, JS) dapat diakses

### 404 Errors

- Periksa konfigurasi `vercel.json`
- Pastikan routing sudah benar
- Untuk SPA, pastikan fallback ke `index.html`

### Performance Issues

- Optimize gambar dan asset
- Minify CSS dan JavaScript jika diperlukan
- Gunakan CDN untuk library eksternal

## Tips Optimasi

1. **Caching**: File `vercel.json` sudah dikonfigurasi untuk caching optimal
2. **Compression**: Vercel otomatis mengkompresi file
3. **CDN**: Vercel menggunakan global CDN
4. **HTTPS**: SSL certificate otomatis disediakan

## Monitoring

- Gunakan Vercel Analytics untuk monitoring performa
- Setup error tracking jika diperlukan
- Monitor usage dan bandwidth

## Update Aplikasi

### Via Git (Automatic)

Jika menggunakan GitHub integration:
1. Push perubahan ke repository
2. Vercel otomatis deploy ulang

### Via CLI

```bash
vercel --prod
```

## Support

Jika mengalami masalah:
1. Cek [Vercel Documentation](https://vercel.com/docs)
2. Cek [Vercel Community](https://github.com/vercel/vercel/discussions)
3. Contact support Vercel

---

**Selamat! Aplikasi ERD Designer Anda sekarang sudah live di internet! 🎉**