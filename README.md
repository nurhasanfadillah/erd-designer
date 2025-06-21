# ERD Designer by Redone

Sebuah aplikasi web untuk mendesain Entity Relationship Diagram (ERD) yang intuitif dan mudah digunakan.

## Fitur

- ✨ **Interface Modern**: Desain yang bersih dan user-friendly
- 🎯 **Drag & Drop**: Mudah mengatur posisi tabel
- 🔗 **Relasi Visual**: Membuat dan mengelola relasi antar tabel
- 💾 **Save/Load Project**: Simpan dan muat proyek ERD
- 📤 **Export**: Export diagram ke berbagai format
- 🔍 **Zoom Controls**: Kontrol zoom untuk melihat detail
- 📱 **Responsive**: Bekerja di berbagai ukuran layar

## Teknologi

- HTML5
- CSS3 (dengan Flexbox dan Grid)
- Vanilla JavaScript (ES6+)
- SVG untuk rendering relasi

## Cara Menggunakan

1. **Tambah Tabel**: Klik tombol "Tambah Tabel" untuk membuat tabel baru
2. **Edit Tabel**: Klik pada tabel untuk mengedit kolom dan properti
3. **Buat Relasi**: Pilih dua tabel dan buat relasi di antara mereka
4. **Simpan Proyek**: Gunakan tombol "Save" untuk menyimpan pekerjaan Anda
5. **Export**: Export diagram Anda ke format yang diinginkan

## Development

### Menjalankan Lokal

```bash
# Clone repository
git clone <repository-url>
cd erd-designer

# Jalankan server lokal
python -m http.server 8000
# atau
npm run dev

# Buka browser ke http://localhost:8000
```

## Deployment ke Vercel

### Otomatis via Git

1. Push kode ke repository Git (GitHub, GitLab, atau Bitbucket)
2. Kunjungi [vercel.com](https://vercel.com)
3. Import repository Anda
4. Vercel akan otomatis mendeteksi sebagai static site
5. Deploy!

### Manual via Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login ke Vercel
vercel login

# Deploy dari direktori proyek
vercel

# Untuk production deployment
vercel --prod
```

### Konfigurasi Vercel

Proyek ini sudah dilengkapi dengan `vercel.json` yang mengkonfigurasi:
- Static file serving
- Proper caching headers
- SPA routing fallback

## Struktur Proyek

```
erd-designer/
├── index.html          # File HTML utama
├── script.js           # Logika aplikasi JavaScript
├── styles.css          # Styling CSS
├── vercel.json         # Konfigurasi Vercel
├── package.json        # Metadata proyek
└── README.md           # Dokumentasi
```

## Browser Support

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## Kontribusi

1. Fork repository
2. Buat feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit perubahan (`git commit -m 'Add some AmazingFeature'`)
4. Push ke branch (`git push origin feature/AmazingFeature`)
5. Buat Pull Request

## Lisensi

MIT License - lihat file LICENSE untuk detail.

## Author

Dibuat dengan ❤️ oleh **Redone**

---

**Live Demo**: [https://erd-designer.vercel.app](https://erd-designer.vercel.app)