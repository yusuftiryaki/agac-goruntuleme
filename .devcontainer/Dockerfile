# See https://hub.docker.com/_/node for available versions
FROM node:20-bullseye

# 1. SİSTEM GEREKSİNİMLERİ (Root kullanıcısı iken yapılır)
RUN apt-get update && apt-get install -y \
    git \
    sudo \
    && rm -rf /var/lib/apt/lists/*

# Node kullanıcısına sudo yetkisi ver
RUN echo "node ALL=(ALL) NOPASSWD:ALL" > /etc/sudoers.d/node && \
    adduser node sudo

# 2. ÇALIŞMA DİZİNİ HAZIRLIĞI
# ÖNEMLİ: WORKDIR komutu klasörü yoksa 'root' olarak oluşturur.
# Bunu engellemek için önce klasörü oluşturup sahibini 'node' yapıyoruz.
RUN mkdir -p /workspace && chown node:node /workspace
WORKDIR /workspace

# 3. KULLANICI DEĞİŞİMİ
# Artık root yetkisine ihtiyacımız kalmadı, 'node' kullanıcısına geçiyoruz.
USER node

# 4. BAĞIMLILIKLARIN KURULUMU
# Sadece package dosyalarını, sahibini 'node' yaparak kopyalıyoruz.
COPY --chown=node:node package*.json ./

# npm install komutu artık 'node' kullanıcısı tarafından çalıştırılıyor.
# Bu sayede 'node_modules' içindeki her şey baştan 'node' kullanıcısına ait oluyor.
RUN npm install --legacy-peer-deps

# 5. PROJE DOSYALARINI KOPYALAMA
# Geri kalan tüm dosyaları anında 'node' yetkisiyle içeri alıyoruz.
COPY --chown=node:node . .

# ARTIK "RUN chown -R node:node /workspace" KOMUTUNA İHTİYAÇ YOK!