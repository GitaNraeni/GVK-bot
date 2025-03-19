# GVK Bot - Discord Media & Text Manager

![Node.js](https://img.shields.io/badge/Node.js-18.x-brightgreen)
![Discord.js](https://img.shields.io/badge/discord.js-v14-blue)
![License](https://img.shields.io/badge/license-MIT-yellow)

**GVK Bot** adalah bot Discord sederhana untuk mengatur channel media dan teks secara otomatis, dilengkapi fitur auto-thread dan custom status bot.

---

## ✨ Fitur Utama
- **Auto Thread:**  
  Otomatis membuat thread dari pesan yang masuk di channel yang diatur.
  
- **Media Only Channel:**  
  Hanya menerima gambar/video, pesan teks akan dihapus otomatis.

- **Text Only Channel:**  
  Hanya menerima teks, pesan media akan dihapus otomatis.

- **Auto Reaction:**  
  Memberi reaksi otomatis sesuai mode channel.

- **Set Bot Status:**  
  Ubah status bot secara live lewat slash command.

---

## 📜 Command List
| Command            | Deskripsi                                      |
|--------------------|-----------------------------------------------|
| `/mediachannel on/off` | Mengaktifkan atau menonaktifkan mode media di channel. |
| `/textchannel on/off`  | Mengaktifkan atau menonaktifkan mode teks di channel. |
| `/setstatus`          | Mengatur status bot (playing, watching, listening, streaming, competing). |

---

## 🔧 Cara Install & Run
### 1. Clone Repository
```bash
git clone https://github.com/username/GVK-bot.git
cd GVK-bot
