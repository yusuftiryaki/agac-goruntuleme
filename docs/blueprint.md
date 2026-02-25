# **App Name**: PistachioTwin

## Core Features:

- Firebase Entegrasyonu ve PWA Kurulumu: Firebase Cloud Storage ve Firestore için SDK'yı başlatın ve PWA kurulabilirliğini sağlamak için `manifest.json`'ı yapılandırın.
- Ağaç Paneli: 'trees' Firestore koleksiyonundan getirilen, her bir liste öğesi Ağaç ID/Adı, Kayıt Tarihi ve İşlem Durumu ('Bekliyor', 'İşleniyor', 'Tamamlandı') içeren taranmış ağaçların bir listesini gösteren Ana Ekran. Arayüz tamamen Türkçedir.
- Video Yakalama: HTML5 MediaRecorder API'sini kullanarak standart mobil cihaz kamerasıyla .mp4 video kaydedebilmek için bir kamera görüntüsü ve Türkçe butonlar ('Kaydı Başlat', 'Kaydı Durdur').
- Video Yükleme ve Veritabanı Kaydı: Kayıt tamamlandığında, .mp4 dosyasını otomatik olarak Firebase Cloud Storage'a ('videos' klasörüne) yükleyin. Yüklemenin ardından 'video_url', 'status: 'Bekliyor' ve 'timestamp' içeren 'trees' Firestore koleksiyonunda yeni bir belge oluşturun.
- 3D Model Görüntüleyici: Seçilen bir ağacın detay görünümü. Eğer Firestore belge durumu 'Tamamlandı' ise ve 'model_url' mevcutsa, standart Google <model-viewer> web bileşenini kullanarak depodan getirilen 3D .glb modelini görüntüleyin. Durum 'Bekliyor' ise, 'Model bulutta oluşturuluyor...' yükleme mesajı gösterin.
- AI Destekli Video Metaveri Analizi: Video yüklemesinin bir parçası olarak, bir AI aracı, yakalanan video içeriğinden anahtar tanımlayıcı etiketleri (örn. 'Sağlıklı', 'Hastalık Belirtisi', 'Gür Yapraklı') otomatik olarak analiz eder ve bunları ağaç belgesiyle birlikte Firestore'a kaydeder. Bu, 3D modelleme sürecini geliştiren bir araç görevi görür.

## Style Guidelines:

- Primary color: `#4D8A4D` (A earthy pistachio green, balanced for visibility in outdoor field conditions, representing nature and agriculture).
- Background color: `#EEF3EE` (A very light, desaturated green providing a clean, natural canvas suitable for bright daylight conditions).
- Accent color: `#C5F280` (A bright, lively yellow-green, creating clear contrast for interactive elements and highlights).
- Font family: 'Inter', a clean and highly legible sans-serif font suitable for both headlines and body text on mobile devices in Turkish.
- Utilize simple, clear, and recognizable icons that convey functionality effectively, ensuring easy interpretation during field use (e.g., camera, tree, upload, 3D model).
- Mobile-first, responsive design implemented with Tailwind CSS for optimal viewing and interaction on various mobile devices. Content is organized for easy access and readability, especially during outdoor operation.
- Subtle and functional animations for transitions between screens, loading indicators (especially for model generation), and button presses, enhancing user experience without distraction.