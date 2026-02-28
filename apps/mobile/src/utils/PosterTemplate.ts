export const generatePosterHtml = (data: {
    imageUrl: string;
    title: string;
    type: string;
    breed: string;
    size: string;
    color: string;
    lastSeenTime: string;
    lastSeenPlace: string;
    contactMethod: string;
    contactPhone?: string;
    qrData: string;
    primaryColor: string;
}) => {
    return `
<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Assistant:wght@400;700;800&display=swap');
        
        body {
            font-family: 'Assistant', sans-serif;
            margin: 0;
            padding: 40px;
            background-color: #f8fafc;
            color: #1e293b;
        }

        .poster {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            border-radius: 40px;
            overflow: hidden;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.15);
            border: 8px solid ${data.primaryColor};
        }

        .header {
            background-color: ${data.primaryColor};
            color: white;
            padding: 40px 20px;
            text-align: center;
        }

        .header h1 {
            margin: 0;
            font-size: 64px;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 2px;
        }

        .header p {
            margin-top: 10px;
            font-size: 24px;
            opacity: 0.9;
        }

        .image-container {
            width: 100%;
            height: 500px;
            position: relative;
        }

        .image-container img {
            width: 100%;
            height: 100%;
            object-fit: cover;
        }

        .content {
            padding: 40px;
        }

        .grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-bottom: 40px;
        }

        .info-card {
            background: #f1f5f9;
            padding: 20px;
            border-radius: 20px;
        }

        .info-card label {
            display: block;
            font-size: 14px;
            color: #64748b;
            margin-bottom: 5px;
            font-weight: 700;
        }

        .info-card span {
            font-size: 22px;
            font-weight: 800;
            color: #0f172a;
        }

        .footer {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 40px;
            background: #f8fafc;
            border-top: 2px dashed #e2e8f0;
        }

        .contact-info h2 {
            margin: 0;
            font-size: 32px;
            color: ${data.primaryColor};
        }

        .contact-info p {
            margin: 5px 0 0;
            font-size: 20px;
            color: #475569;
        }

        .qr-section {
            text-align: center;
        }

        .qr-placeholder {
            width: 120px;
            height: 120px;
            background: white;
            padding: 10px;
            border-radius: 15px;
            border: 1px solid #e2e8f0;
        }

        .tagline {
            text-align: center;
            padding: 20px;
            font-size: 14px;
            color: #94a3b8;
        }
    </style>
</head>
<body>
    <div class="poster">
        <div class="header">
            <h1>נא לעזור!</h1>
            <p>${data.type === 'LOST' ? 'אבד לנו חבר יקר' : 'נמצאה חיה אבודה'}</p>
        </div>

        <div class="image-container">
            <img src="${data.imageUrl}" alt="Pet Image">
        </div>

        <div class="content">
            <div class="grid">
                <div class="info-card">
                    <label>סוג/גזע</label>
                    <span>${data.breed || 'לא ידוע'}</span>
                </div>
                <div class="info-card">
                    <label>צבע</label>
                    <span>${data.color}</span>
                </div>
                <div class="info-card">
                    <label>נראה לאחרונה ב-</label>
                    <span>${data.lastSeenPlace}</span>
                </div>
                <div class="info-card">
                    <label>מתי?</label>
                    <span>${data.lastSeenTime}</span>
                </div>
            </div>

            <div class="footer">
                <div class="contact-info">
                    <h2>צרו קשר: ${data.contactPhone || ''}</h2>
                    <p>דרך מועדפת: ${data.contactMethod}</p>
                </div>
                <div class="qr-section">
                    <img class="qr-placeholder" src="${data.qrData}" alt="QR Code">
                    <p style="font-size: 12px; margin-top: 5px; font-weight: bold;">סרקו לדיווח מהיר</p>
                </div>
            </div>
        </div>
        
        <div class="tagline">
            נוצר באמצעות PetFind - האפליקציה למציאת חיות אבודות
        </div>
    </div>
</body>
</html>
  `;
};
