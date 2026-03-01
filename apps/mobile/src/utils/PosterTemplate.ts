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
    labels: {
        titleText: string;
        breedLabel: string;
        colorLabel: string;
        lastSeenLabel: string;
        whenLabel: string;
        contactTitle: string;
        preferredMethod: string;
        scanLabel: string;
        tagline: string;
        isRTL: boolean;
    };
}) => {
    const { labels } = data;

    return `
<!DOCTYPE html>
<html lang="${labels.isRTL ? 'he' : 'en'}" dir="${labels.isRTL ? 'rtl' : 'ltr'}">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Assistant:wght@400;700;800&display=swap');
        
        @page {
            size: A4 portrait;
            margin: 0;
        }

        * {
            box-sizing: border-box;
        }

        body {
            font-family: 'Assistant', sans-serif;
            margin: 0;
            padding: 0;
            background-color: white;
            color: #1e293b;
            width: 210mm;
            min-height: 297mm;
            display: flex;
            justify-content: center;
        }

        .poster {
            width: 100%;
            height: 100%;
            background: white;
            display: flex;
            flex-direction: column;
            border: 10px solid ${data.primaryColor};
        }

        .header {
            background-color: ${data.primaryColor};
            color: white;
            padding: 30px 20px;
            text-align: center;
        }

        .header h1 {
            margin: 0;
            font-size: 80px;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 2px;
            line-height: 1;
        }

        .header p {
            margin-top: 10px;
            font-size: 32px;
            font-weight: 700;
            opacity: 0.95;
        }

        .image-container {
            width: 100%;
            flex: 1;
            min-height: 400px;
            max-height: 600px;
            position: relative;
            background: #f1f5f9;
        }

        .image-container img {
            width: 100%;
            height: 100%;
            object-fit: contain;
        }

        .content {
            padding: 40px;
            flex-shrink: 0;
        }

        .grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-bottom: 30px;
        }

        .info-card {
            background: #f1f5f9;
            padding: 20px;
            border-radius: 16px;
        }

        .info-card label {
            display: block;
            font-size: 16px;
            color: #64748b;
            margin-bottom: 5px;
            font-weight: 700;
        }

        .info-card span {
            font-size: 24px;
            font-weight: 800;
            color: #0f172a;
        }

        .footer {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 30px 40px;
            background: #f8fafc;
            border-top: 3px dashed #e2e8f0;
            margin-top: auto;
        }

        .contact-info {
            flex: 1;
        }

        .contact-info h2 {
            margin: 0;
            font-size: 40px;
            color: ${data.primaryColor};
            font-weight: 800;
        }

        .contact-info p {
            margin: 10px 0 0;
            font-size: 24px;
            color: #475569;
            font-weight: 700;
        }

        .qr-section {
            text-align: center;
            margin-${labels.isRTL ? 'right' : 'left'}: 20px;
        }

        .qr-placeholder {
            width: 150px;
            height: 150px;
            background: white;
            padding: 10px;
            border-radius: 16px;
            border: 2px solid #e2e8f0;
        }

        .tagline {
            text-align: center;
            padding: 15px;
            font-size: 16px;
            color: #94a3b8;
            font-weight: bold;
            background: white;
        }
    </style>
</head>
<body>
    <div class="poster">
        <div class="header">
            <h1 dir="auto">${labels.titleText}</h1>
            <p dir="auto">${data.title}</p>
        </div>

        <div class="image-container">
            <img src="${data.imageUrl}" alt="Pet Image">
        </div>

        <div class="content">
            <div class="grid">
                <div class="info-card">
                    <label>${labels.breedLabel}</label>
                    <span dir="auto">${data.breed}</span>
                </div>
                <div class="info-card">
                    <label>${labels.colorLabel}</label>
                    <span dir="auto">${data.color}</span>
                </div>
                <div class="info-card">
                    <label>${labels.lastSeenLabel}</label>
                    <span dir="auto">${data.lastSeenPlace}</span>
                </div>
                <div class="info-card">
                    <label>${labels.whenLabel}</label>
                    <span dir="auto">${data.lastSeenTime}</span>
                </div>
            </div>
        </div>

        <div class="footer">
            <div class="contact-info">
                <h2 dir="auto">${labels.contactTitle}: <span dir="ltr">${data.contactPhone || ''}</span></h2>
                <p dir="auto">${labels.preferredMethod}: ${data.contactMethod}</p>
            </div>
            <div class="qr-section">
                <img class="qr-placeholder" src="${data.qrData}" alt="QR Code">
                <p style="font-size: 14px; margin-top: 8px; font-weight: 800; color: #475569;">${labels.scanLabel}</p>
            </div>
        </div>
        
        <div class="tagline" dir="auto">
            ${labels.tagline}
        </div>
    </div>
</body>
</html>
  `;
};
